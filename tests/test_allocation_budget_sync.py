"""Tests for allocation → Budget sync and unified summary (T-FR-0002-03)."""

from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from finance.allocation.budget_sync import (
    aggregate_allocation_totals_by_category,
    sync_allocation_to_budgets,
)
from finance.allocation.enums import AllocationCadence, PaymentMethod, PlanIncomeCadence
from finance.allocation.schemas import AllocationItemCreate, AllocationPlanCreate
from finance.allocation.service import (
    create_allocation_item,
    create_allocation_plan,
    delete_allocation_item,
)
from finance.db.models import Base, Budget, Transaction
from finance.unified import build_unified_monthly_summary


def _session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autocommit=False, autoflush=False)()


@pytest.mark.integration
def test_sync_idempotent_and_aggregates_categories() -> None:
    s = _session()
    try:
        p1 = create_allocation_plan(
            s,
            AllocationPlanCreate(period_month=date(2026, 9, 1)),
        )
        create_allocation_item(
            s,
            p1.id,
            AllocationItemCreate(
                item_name="a",
                category="Food",
                planned_amount=Decimal("50"),
                cadence=AllocationCadence.WEEKLY,
                payment_method=PaymentMethod.CASH,
            ),
        )
        create_allocation_item(
            s,
            p1.id,
            AllocationItemCreate(
                item_name="b",
                category="Food",
                planned_amount=Decimal("25"),
                cadence=AllocationCadence.WEEKLY,
                payment_method=PaymentMethod.CREDIT,
            ),
        )
        s.commit()

        rows = s.scalars(select(Budget).where(Budget.period_month == date(2026, 9, 1))).all()
        assert len(rows) == 1
        assert rows[0].category == "Food"
        assert rows[0].allocation_derived is True
        assert rows[0].amount_limit == Decimal("300.00")

        sync_allocation_to_budgets(s, date(2026, 9, 15))
        s.commit()
        rows2 = s.scalars(select(Budget).where(Budget.period_month == date(2026, 9, 1))).all()
        assert len(rows2) == 1
        assert rows2[0].amount_limit == Decimal("300.00")
    finally:
        s.close()


@pytest.mark.integration
def test_sync_deletes_managed_row_when_category_removed() -> None:
    s = _session()
    try:
        p = create_allocation_plan(s, AllocationPlanCreate(period_month=date(2026, 10, 1)))
        it = create_allocation_item(
            s,
            p.id,
            AllocationItemCreate(
                item_name="x",
                category="Transit",
                planned_amount=Decimal("100"),
                cadence=AllocationCadence.MONTHLY,
                payment_method=PaymentMethod.CASH,
            ),
        )
        s.commit()
        assert s.scalar(select(Budget).where(Budget.category == "Transit")) is not None

        delete_allocation_item(s, p.id, it.id)
        s.commit()
        assert s.scalar(select(Budget).where(Budget.category == "Transit")) is None
    finally:
        s.close()


@pytest.mark.integration
def test_manual_budget_untouched_when_no_allocation_for_category() -> None:
    s = _session()
    try:
        s.add(
            Budget(
                category="Dining",
                period_month=date(2026, 11, 1),
                amount_limit=Decimal("400.00"),
                allocation_derived=False,
            )
        )
        s.commit()
        p = create_allocation_plan(s, AllocationPlanCreate(period_month=date(2026, 11, 1)))
        create_allocation_item(
            s,
            p.id,
            AllocationItemCreate(
                item_name="rent",
                category="Housing",
                planned_amount=Decimal("2000"),
                cadence=AllocationCadence.MONTHLY,
                payment_method=PaymentMethod.CASH,
            ),
        )
        s.commit()

        dining = s.scalar(
            select(Budget).where(
                Budget.period_month == date(2026, 11, 1), Budget.category == "Dining"
            )
        )
        assert dining is not None
        assert dining.allocation_derived is False
        assert dining.amount_limit == Decimal("400.00")

        housing = s.scalar(
            select(Budget).where(
                Budget.period_month == date(2026, 11, 1), Budget.category == "Housing"
            )
        )
        assert housing is not None
        assert housing.allocation_derived is True
    finally:
        s.close()


@pytest.mark.integration
def test_allocation_overwrites_manual_budget_same_category() -> None:
    s = _session()
    try:
        s.add(
            Budget(
                category="Food",
                period_month=date(2026, 12, 1),
                amount_limit=Decimal("999.00"),
                allocation_derived=False,
            )
        )
        s.commit()
        p = create_allocation_plan(s, AllocationPlanCreate(period_month=date(2026, 12, 1)))
        create_allocation_item(
            s,
            p.id,
            AllocationItemCreate(
                item_name="groceries",
                category="Food",
                planned_amount=Decimal("100"),
                cadence=AllocationCadence.MONTHLY,
                payment_method=PaymentMethod.CASH,
            ),
        )
        s.commit()
        b = s.scalar(select(Budget).where(Budget.category == "Food"))
        assert b.amount_limit == Decimal("100.00")
        assert b.allocation_derived is True
    finally:
        s.close()


@pytest.mark.integration
def test_unified_summary_uses_allocation_budget_variance() -> None:
    s = _session()
    try:
        period = date(2026, 8, 1)
        s.add(
            Transaction(
                transaction_date=date(2026, 8, 5),
                description_raw="lunch",
                description_normalized="lunch",
                amount=Decimal("120.00"),
                category="Food",
                category_raw="Food",
                merchant="m",
                source_file="s",
                source_type="csv",
                is_credit=False,
                is_flagged_business=False,
                notes="",
            )
        )
        s.commit()

        p = create_allocation_plan(
            s,
            AllocationPlanCreate(period_month=period),
        )
        create_allocation_item(
            s,
            p.id,
            AllocationItemCreate(
                item_name="food plan",
                category="Food",
                planned_amount=Decimal("100"),
                cadence=AllocationCadence.MONTHLY,
                payment_method=PaymentMethod.CASH,
            ),
        )
        s.commit()

        summary = build_unified_monthly_summary(s, period, as_of=date(2026, 8, 10))
        assert len(summary.budgets) == 1
        row = summary.budgets[0]
        assert row.category == "Food"
        assert row.budget_amount == 100.0
        assert row.actual == 120.0
        assert row.is_over_budget is True
    finally:
        s.close()


@pytest.mark.unit
def test_aggregate_allocation_totals_by_category_empty() -> None:
    s = _session()
    try:
        assert aggregate_allocation_totals_by_category(s, date(2026, 1, 1)) == {}
    finally:
        s.close()
