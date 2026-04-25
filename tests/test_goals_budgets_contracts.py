from datetime import date, datetime
from decimal import Decimal

import pytest
from pydantic import ValidationError

from api.schemas import (
    BudgetCreate,
    BudgetListResponse,
    BudgetOut,
    GoalCreate,
    GoalListResponse,
    GoalOut,
    TransactionOut,
)
from finance.db.models import Budget, Goal, Transaction


@pytest.mark.unit
def test_budget_create_requires_category_period_and_amount() -> None:
    with pytest.raises(ValidationError):
        BudgetCreate(period_month=date(2026, 4, 1), amount_limit=400.0)

    with pytest.raises(ValidationError):
        BudgetCreate(category="Dining", amount_limit=400.0)

    with pytest.raises(ValidationError):
        BudgetCreate(category="Dining", period_month=date(2026, 4, 1))


@pytest.mark.unit
def test_goal_create_requires_name_type_target_and_period() -> None:
    with pytest.raises(ValidationError):
        GoalCreate(goal_type="savings", target_amount=1500.0, period_month=date(2026, 4, 1))

    with pytest.raises(ValidationError):
        GoalCreate(name="Build emergency fund", target_amount=1500.0, period_month=date(2026, 4, 1))

    with pytest.raises(ValidationError):
        GoalCreate(name="Build emergency fund", goal_type="savings", period_month=date(2026, 4, 1))

    with pytest.raises(ValidationError):
        GoalCreate(name="Build emergency fund", goal_type="savings", target_amount=1500.0)


@pytest.mark.unit
def test_budget_and_goal_create_list_contract_examples() -> None:
    budget_item = BudgetOut(
        id=1,
        category="Dining",
        period_month=date(2026, 4, 1),
        amount_limit=400.0,
        currency="USD",
        created_at=datetime(2026, 4, 25, 0, 0, 0),
    )
    goal_item = GoalOut(
        id=1,
        name="Build emergency fund",
        goal_type="savings",
        target_amount=1500.0,
        period_month=date(2026, 4, 1),
        currency="USD",
        created_at=datetime(2026, 4, 25, 0, 0, 0),
    )

    budget_list = BudgetListResponse(items=[budget_item])
    goal_list = GoalListResponse(items=[goal_item])

    assert budget_list.model_dump()["items"][0]["category"] == "Dining"
    assert goal_list.model_dump()["items"][0]["goal_type"] == "savings"


@pytest.mark.unit
def test_phase1_transaction_contract_remains_compatible() -> None:
    transaction = Transaction(
        id=10,
        transaction_date=date(2026, 4, 1),
        description_raw="Coffee shop",
        description_normalized="Coffee shop",
        amount=Decimal("8.50"),
        currency="USD",
        category="Dining",
        category_raw="Dining",
        merchant="Coffee Shop",
        source_file="seed.csv",
        source_type="csv",
        is_credit=False,
        is_flagged_business=False,
        notes="",
    )

    as_dict = transaction.to_dict()
    shaped = TransactionOut(
        id=as_dict["id"],
        date=as_dict["date"],
        description=as_dict["description"],
        amount=as_dict["amount"],
        category=as_dict["category"],
        merchant=as_dict["merchant"],
        merchant_display=as_dict["merchant"],
        is_credit=as_dict["is_credit"],
        source_type=as_dict["source_type"],
    )

    assert shaped.category == "Dining"
    assert shaped.amount == 8.5


@pytest.mark.unit
def test_budget_and_goal_models_define_expected_tablenames() -> None:
    assert Budget.__tablename__ == "budgets"
    assert Goal.__tablename__ == "goals"
