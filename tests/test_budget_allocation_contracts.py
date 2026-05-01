"""Tests for budget allocation cadence, validation, ORM, and derived summaries (T-FR-0002-01)."""

from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from api.schemas import (
    BudgetAllocationItemCreate,
    BudgetAllocationPlanCreate,
    BudgetAllocationPlanSummaryOut,
    build_budget_allocation_plan_summary,
)
from finance.budget_allocation import (
    AllocationCadence,
    AllocationItemSummaryInput,
    PaymentMethod,
    build_allocation_summary,
    float_monthly_equivalent_planned,
    monthly_equivalent,
)
from finance.db.models import Base, BudgetAllocationItem, BudgetAllocationPlan


@pytest.mark.parametrize(
    ("amount", "cadence", "expected"),
    [
        (Decimal("100"), AllocationCadence.WEEKLY, Decimal("400.00")),
        (Decimal("100"), AllocationCadence.BIWEEKLY, Decimal("200.00")),
        (Decimal("100"), AllocationCadence.TWICE_MONTHLY, Decimal("200.00")),
        (Decimal("100"), AllocationCadence.MONTHLY, Decimal("100.00")),
        (Decimal("99"), AllocationCadence.QUARTERLY, Decimal("33.00")),
        (Decimal("1200"), AllocationCadence.YEARLY, Decimal("100.00")),
    ],
)
@pytest.mark.unit
def test_monthly_equivalent_design_table(
    amount: Decimal, cadence: AllocationCadence, expected: Decimal
) -> None:
    assert monthly_equivalent(amount, cadence) == expected


@pytest.mark.unit
def test_float_monthly_matches_decimal_equivalent() -> None:
    assert float_monthly_equivalent_planned(50.0, AllocationCadence.BIWEEKLY) == 100.0


@pytest.mark.unit
def test_plan_create_normalizes_period_month() -> None:
    plan = BudgetAllocationPlanCreate(name="April", period_month=date(2026, 4, 18))
    assert plan.period_month == date(2026, 4, 1)


@pytest.mark.unit
def test_plan_create_requires_income_amount_and_cadence_together() -> None:
    with pytest.raises(ValidationError):
        BudgetAllocationPlanCreate(
            period_month=date(2026, 4, 1),
            income_amount=4000.0,
        )
    with pytest.raises(ValidationError):
        BudgetAllocationPlanCreate(
            period_month=date(2026, 4, 1),
            income_cadence="monthly",
        )


@pytest.mark.unit
def test_item_create_rejects_invalid_due_day() -> None:
    with pytest.raises(ValidationError):
        BudgetAllocationItemCreate(
            item_name="Rent",
            category="Housing",
            planned_amount=100.0,
            cadence=AllocationCadence.MONTHLY,
            payment_method=PaymentMethod.CASH,
            due_day=32,
        )


@pytest.mark.unit
def test_derived_summary_totals_and_remaining_income() -> None:
    plan = BudgetAllocationPlanCreate(
        period_month=date(2026, 4, 15),
        income_amount=5000.0,
        income_cadence="monthly",
    )
    items = [
        BudgetAllocationItemCreate(
            item_name="Groceries",
            category="Food",
            planned_amount=100.0,
            cadence=AllocationCadence.WEEKLY,
            payment_method=PaymentMethod.CASH,
            due_day=5,
        ),
        BudgetAllocationItemCreate(
            item_name="Streaming",
            category="Subscriptions",
            planned_amount=15.0,
            cadence=AllocationCadence.MONTHLY,
            payment_method=PaymentMethod.CREDIT,
            due_day=None,
        ),
    ]
    summary = build_budget_allocation_plan_summary(
        items,
        monthly_income_equivalent=plan.monthly_income_equivalent(),
    )
    assert summary.total_monthly_allocated == 415.0
    assert summary.cash_allocated == 400.0
    assert summary.credit_allocated == 15.0
    assert summary.remaining_income == 4585.0
    assert summary.category_totals == {"Food": 400.0, "Subscriptions": 15.0}
    assert summary.cadence_totals == {"monthly": 15.0, "weekly": 400.0}


@pytest.mark.unit
def test_timing_sensitive_cash_uses_due_day_cutoff() -> None:
    items = [
        AllocationItemSummaryInput(
            category="A",
            cadence="monthly",
            monthly_amount=100.0,
            payment_method=PaymentMethod.CASH.value,
            due_day=10,
        ),
        AllocationItemSummaryInput(
            category="B",
            cadence="monthly",
            monthly_amount=50.0,
            payment_method=PaymentMethod.CASH.value,
            due_day=20,
        ),
    ]
    s = build_allocation_summary(items, monthly_income_assumption=None, due_day_cutoff=17)
    assert s.timing_sensitive_cash == 100.0


@pytest.mark.integration
def test_allocation_orm_round_trip_and_summary() -> None:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session: Session = factory()
    try:
        plan = BudgetAllocationPlan(
            name="2026-04",
            period_month=date(2026, 4, 1),
            currency="USD",
            income_amount=Decimal("3000.00"),
            income_cadence="monthly",
        )
        session.add(plan)
        session.flush()
        monthly = float(monthly_equivalent(Decimal("200.00"), AllocationCadence.QUARTERLY))
        session.add(
            BudgetAllocationItem(
                plan_id=plan.id,
                item_name="Insurance",
                category="Risk",
                planned_amount=Decimal("200.00"),
                cadence=AllocationCadence.QUARTERLY.value,
                monthly_amount=Decimal(str(monthly)),
                payment_method=PaymentMethod.CASH.value,
                due_day=3,
            )
        )
        session.commit()

        loaded = session.query(BudgetAllocationPlan).one()
        assert loaded.items[0].monthly_amount == Decimal("66.67")
        dto = BudgetAllocationPlanSummaryOut.from_totals(
            build_allocation_summary(
                [
                    AllocationItemSummaryInput(
                        category=it.category,
                        cadence=it.cadence,
                        monthly_amount=float(it.monthly_amount),
                        payment_method=it.payment_method,
                        due_day=it.due_day,
                    )
                    for it in loaded.items
                ],
                monthly_income_assumption=(
                    float(loaded.income_amount) if loaded.income_amount else None
                ),
            )
        )
        assert dto.total_monthly_allocated == 66.67
        assert dto.remaining_income == 2933.33
    finally:
        session.close()
