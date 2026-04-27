from datetime import date
from decimal import Decimal

import pytest

from finance.db.models import Budget, Goal, Transaction
from finance.goals.service import GoalsActualsService


def _txn(
    txn_date: date,
    amount: str,
    category: str,
    *,
    is_credit: bool = False,
) -> Transaction:
    return Transaction(
        id=1,
        transaction_date=txn_date,
        description_raw="txn",
        description_normalized="txn",
        amount=Decimal(amount),
        currency="USD",
        category=category,
        category_raw=category,
        merchant="merchant",
        source_file="seed.csv",
        source_type="csv",
        is_credit=is_credit,
        is_flagged_business=False,
        notes="",
    )


@pytest.mark.unit
def test_budget_variance_supports_positive_and_negative_outcomes() -> None:
    budget = Budget(category="Dining", period_month=date(2026, 4, 1), amount_limit=Decimal("100.00"))
    svc = GoalsActualsService()

    over = svc.compute_budget_actual(
        budget,
        [_txn(date(2026, 4, 4), "120.00", "Dining")],
        as_of=date(2026, 4, 30),
    )
    under = svc.compute_budget_actual(
        budget,
        [_txn(date(2026, 4, 4), "75.00", "Dining")],
        as_of=date(2026, 4, 30),
    )

    assert over.variance == 20.0
    assert over.is_over_budget is True
    assert under.variance == -25.0
    assert under.is_over_budget is False


@pytest.mark.unit
def test_budget_actuals_respect_monthly_boundaries() -> None:
    budget = Budget(category="Dining", period_month=date(2026, 4, 1), amount_limit=Decimal("100.00"))
    svc = GoalsActualsService()
    result = svc.compute_budget_actual(
        budget,
        [
            _txn(date(2026, 3, 31), "40.00", "Dining"),
            _txn(date(2026, 4, 2), "40.00", "Dining"),
            _txn(date(2026, 4, 8), "35.00", "Groceries"),
            _txn(date(2026, 5, 1), "30.00", "Dining"),
        ],
        as_of=date(2026, 4, 30),
    )
    assert result.actual == 40.0
    assert result.variance == -60.0


@pytest.mark.unit
def test_incomplete_month_sets_trend_flag_when_projection_exceeds_budget() -> None:
    budget = Budget(category="Dining", period_month=date(2026, 4, 1), amount_limit=Decimal("100.00"))
    svc = GoalsActualsService()
    result = svc.compute_budget_actual(
        budget,
        [_txn(date(2026, 4, 1), "60.00", "Dining"), _txn(date(2026, 4, 3), "60.00", "Dining")],
        as_of=date(2026, 4, 10),
    )
    assert result.is_incomplete_month is True
    assert result.trending_over_budget is True


@pytest.mark.unit
def test_budget_actuals_treat_refunds_credits_once_only() -> None:
    budget = Budget(category="Dining", period_month=date(2026, 4, 1), amount_limit=Decimal("80.00"))
    svc = GoalsActualsService()
    result = svc.compute_budget_actual(
        budget,
        [
            _txn(date(2026, 4, 4), "100.00", "Dining"),
            _txn(date(2026, 4, 5), "-20.00", "Dining", is_credit=True),
            _txn(date(2026, 4, 6), "10.00", "Dining", is_credit=True),
        ],
        as_of=date(2026, 4, 30),
    )
    assert result.actual == 70.0
    assert result.variance == -10.0


@pytest.mark.unit
def test_goal_progress_for_savings_is_deterministic() -> None:
    goal = Goal(
        name="Monthly savings",
        goal_type="savings",
        target_amount=Decimal("500.00"),
        period_month=date(2026, 4, 1),
        currency="USD",
    )
    txns = [
        _txn(date(2026, 4, 3), "-1200.00", "Income", is_credit=True),
        _txn(date(2026, 4, 5), "400.00", "Housing"),
        _txn(date(2026, 4, 10), "200.00", "Dining"),
    ]
    svc = GoalsActualsService()
    first = svc.compute_goal_progress(goal, txns)
    second = svc.compute_goal_progress(goal, txns)
    assert first.actual == 600.0
    assert first.progress_ratio == 1.2
    assert first == second


@pytest.mark.integration
def test_service_reconciles_seeded_month_totals() -> None:
    """Validate budget and savings calculations against a seeded month fixture."""
    period = date(2026, 4, 1)
    seeded_month = [
        _txn(date(2026, 4, 2), "125.00", "Dining"),
        _txn(date(2026, 4, 3), "-25.00", "Dining", is_credit=True),
        _txn(date(2026, 4, 5), "80.00", "Groceries"),
        _txn(date(2026, 4, 10), "-900.00", "Income", is_credit=True),
    ]
    budget = Budget(category="Dining", period_month=period, amount_limit=Decimal("150.00"))
    goal = Goal(
        name="Savings",
        goal_type="savings",
        target_amount=Decimal("500.00"),
        period_month=period,
        currency="USD",
    )

    svc = GoalsActualsService()
    budget_actual = svc.compute_budget_actual(budget, seeded_month, as_of=date(2026, 4, 30))
    goal_progress = svc.compute_goal_progress(goal, seeded_month)

    expected_budget_actual = 100.0  # 125 - 25 refund
    expected_savings = 720.0  # 900 inflow - (125 - 25 + 80) outflow

    assert budget_actual.actual == expected_budget_actual
    assert budget_actual.variance == -50.0
    assert goal_progress.actual == expected_savings
