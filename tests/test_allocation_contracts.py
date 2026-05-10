from datetime import date, datetime
from decimal import Decimal

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from finance.allocation.cadence import (
    monthly_equivalent_for_allocation,
    monthly_equivalent_for_plan_income,
    normalize_period_month,
)
from finance.allocation.enums import AllocationCadence, PaymentMethod, PlanIncomeCadence
from finance.allocation.item_sync import refresh_item_monthly_amount
from finance.allocation.schemas import (
    AllocationItemCreate,
    AllocationPlanCreate,
    default_plan_name,
)
from finance.allocation.summary import (
    AllocationSummary,
    AllocationSummaryItemInput,
    build_allocation_summary,
    item_slice_from_orm,
)
from finance.db.models import AllocationItem, AllocationPlan, Base


def _make_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    return factory()


@pytest.mark.unit
@pytest.mark.parametrize(
    ("cadence", "amount", "expected"),
    [
        (AllocationCadence.WEEKLY, Decimal("10"), Decimal("40.00")),
        (AllocationCadence.BIWEEKLY, Decimal("100"), Decimal("200.00")),
        (AllocationCadence.TWICE_MONTHLY, Decimal("50"), Decimal("100.00")),
        (AllocationCadence.MONTHLY, Decimal("75"), Decimal("75.00")),
        (AllocationCadence.QUARTERLY, Decimal("99"), Decimal("33.00")),
        (AllocationCadence.YEARLY, Decimal("1200"), Decimal("100.00")),
    ],
)
def test_allocation_cadence_monthly_equivalent(
    cadence: AllocationCadence, amount: Decimal, expected: Decimal
) -> None:
    assert monthly_equivalent_for_allocation(amount, cadence) == expected


@pytest.mark.unit
@pytest.mark.parametrize(
    ("cadence", "amount", "expected"),
    [
        (PlanIncomeCadence.WEEKLY, Decimal("500"), Decimal("2000.00")),
        (PlanIncomeCadence.BIWEEKLY, Decimal("2000"), Decimal("4000.00")),
        (PlanIncomeCadence.TWICE_MONTHLY, Decimal("1500"), Decimal("3000.00")),
        (PlanIncomeCadence.MONTHLY, Decimal("3200"), Decimal("3200.00")),
        (PlanIncomeCadence.YEARLY, Decimal("60000"), Decimal("5000.00")),
    ],
)
def test_plan_income_monthly_equivalent(
    cadence: PlanIncomeCadence, amount: Decimal, expected: Decimal
) -> None:
    assert monthly_equivalent_for_plan_income(amount, cadence) == expected


@pytest.mark.unit
def test_normalize_period_month() -> None:
    assert normalize_period_month(date(2026, 5, 15)) == date(2026, 5, 1)


@pytest.mark.unit
def test_default_plan_name_uses_calendar_month() -> None:
    assert default_plan_name(date(2026, 3, 31)) == "March 2026"


@pytest.mark.unit
def test_allocation_plan_create_normalizes_month_and_validates_income_pairing() -> None:
    plan = AllocationPlanCreate(period_month=date(2026, 4, 18))
    assert plan.period_month == date(2026, 4, 1)

    with pytest.raises(ValidationError):
        AllocationPlanCreate(period_month=date(2026, 4, 1), income_amount=Decimal("100"))

    with pytest.raises(ValidationError):
        AllocationPlanCreate(
            period_month=date(2026, 4, 1), income_cadence=PlanIncomeCadence.MONTHLY
        )

    with pytest.raises(ValidationError):
        AllocationPlanCreate(
            period_month=date(2026, 4, 1),
            income_amount=Decimal("0"),
            income_cadence=PlanIncomeCadence.MONTHLY,
        )


@pytest.mark.unit
def test_allocation_item_create_computed_monthly_matches_cadence_table() -> None:
    item = AllocationItemCreate(
        item_name="Rent",
        category="Housing",
        planned_amount=Decimal("2000"),
        cadence=AllocationCadence.MONTHLY,
        payment_method=PaymentMethod.CASH,
    )
    assert item.computed_monthly_amount() == Decimal("2000.00")

    with pytest.raises(ValidationError):
        AllocationItemCreate(
            item_name="X",
            category="Y",
            planned_amount=Decimal("10"),
            cadence=AllocationCadence.MONTHLY,
            payment_method=PaymentMethod.CASH,
            due_day=32,
        )


@pytest.mark.unit
def test_build_allocation_summary_totals() -> None:
    rows = [
        AllocationSummaryItemInput(
            category="Food",
            cadence=AllocationCadence.WEEKLY.value,
            monthly_amount=Decimal("40.00"),
            payment_method=PaymentMethod.CASH.value,
            due_day=5,
        ),
        AllocationSummaryItemInput(
            category="Food",
            cadence=AllocationCadence.MONTHLY.value,
            monthly_amount=Decimal("60.00"),
            payment_method=PaymentMethod.CREDIT.value,
            due_day=None,
        ),
        AllocationSummaryItemInput(
            category="Transit",
            cadence=AllocationCadence.MONTHLY.value,
            monthly_amount=Decimal("100.00"),
            payment_method=PaymentMethod.CASH.value,
            due_day=20,
        ),
    ]
    summary = build_allocation_summary(
        rows,
        income_amount=Decimal("5000"),
        income_cadence=PlanIncomeCadence.MONTHLY,
    )
    assert summary.total_monthly_allocated == Decimal("200.00")
    assert summary.cash_allocated == Decimal("140.00")
    assert summary.credit_allocated == Decimal("60.00")
    assert summary.remaining_income == Decimal("4800.00")
    assert summary.category_totals == {
        "Food": Decimal("100.00"),
        "Transit": Decimal("100.00"),
    }
    assert summary.cadence_totals == {
        AllocationCadence.WEEKLY.value: Decimal("40.00"),
        AllocationCadence.MONTHLY.value: Decimal("160.00"),
    }


@pytest.mark.unit
def test_build_allocation_summary_without_income() -> None:
    summary = build_allocation_summary(
        [
            AllocationSummaryItemInput(
                category="A",
                cadence=AllocationCadence.MONTHLY.value,
                monthly_amount=Decimal("10"),
                payment_method=PaymentMethod.CASH.value,
                due_day=None,
            )
        ],
        income_amount=None,
        income_cadence=None,
    )
    assert summary.remaining_income is None


@pytest.mark.integration
def test_allocation_orm_roundtrip_and_item_sync() -> None:
    session = _make_session()
    try:
        plan = AllocationPlan(
            name="April 2026",
            period_month=date(2026, 4, 1),
            currency="USD",
            income_amount=Decimal("4000.00"),
            income_cadence=PlanIncomeCadence.MONTHLY.value,
            created_at=datetime(2026, 4, 1, 12, 0, 0),
            updated_at=datetime(2026, 4, 1, 12, 0, 0),
        )
        item = AllocationItem(
            plan=plan,
            item_name="Groceries",
            category="Food",
            planned_amount=Decimal("100.00"),
            cadence=AllocationCadence.WEEKLY.value,
            monthly_amount=Decimal("0.00"),
            payment_method=PaymentMethod.CASH.value,
            due_day=10,
            notes="",
            sort_order=0,
        )
        session.add(plan)
        session.flush()
        refresh_item_monthly_amount(item)
        session.commit()

        loaded = session.scalars(select(AllocationItem)).one()
        assert loaded.monthly_amount == Decimal("400.00")

        summary = build_allocation_summary(
            [item_slice_from_orm(loaded)],
            income_amount=plan.income_amount,
            income_cadence=PlanIncomeCadence(plan.income_cadence) if plan.income_cadence else None,
        )
        assert isinstance(summary, AllocationSummary)
        assert summary.remaining_income == Decimal("3600.00")
    finally:
        session.close()
