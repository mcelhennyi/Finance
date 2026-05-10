"""Persistence helpers for budget allocation plans and items.

See Also: tasks/feature-history/FR-0002-budget-entry-page/10-design-01-allocation-model.md
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from finance.allocation.budget_sync import sync_allocation_to_budgets
from finance.allocation.default_template import (
    allocation_auto_template_enabled,
    starter_plan_create,
    starter_plan_items,
)
from finance.allocation.enums import PlanIncomeCadence
from finance.allocation.item_sync import refresh_item_monthly_amount
from finance.allocation.schemas import (
    AllocationItemCreate,
    AllocationItemUpdate,
    AllocationPlanCreate,
    AllocationPlanUpdate,
    default_plan_name,
)
from finance.allocation.summary import (
    AllocationSummary,
    build_allocation_summary,
    item_slice_from_orm,
)
from finance.cash_flow_graph.default_plan_graph import default_seeded_plan_cash_flow_graph
from finance.cash_flow_graph.service import replace_plan_graph
from finance.db.models import AllocationItem, AllocationPlan


def create_allocation_plan(session: Session, payload: AllocationPlanCreate) -> AllocationPlan:
    """Insert a plan row; ``name`` defaults from ``period_month`` when omitted."""

    pm = payload.period_month
    name = payload.name if payload.name is not None else default_plan_name(pm)
    now = datetime.utcnow()
    row = AllocationPlan(
        name=name,
        period_month=pm,
        currency=payload.currency,
        income_amount=payload.income_amount,
        income_cadence=payload.income_cadence.value if payload.income_cadence else None,
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    session.flush()
    sync_allocation_to_budgets(session, pm)
    return row


def get_allocation_plan(session: Session, plan_id: int) -> AllocationPlan | None:
    return session.get(AllocationPlan, plan_id)


def list_allocation_plans(session: Session, *, period_month=None) -> list[AllocationPlan]:
    """List plans; optionally seeds a starter template when the month filter matches and list is empty."""

    def _fetch() -> list[AllocationPlan]:
        stmt: Select[tuple[AllocationPlan]] = select(AllocationPlan).order_by(
            AllocationPlan.period_month.desc(), AllocationPlan.id.desc()
        )
        if period_month is not None:
            stmt = stmt.where(AllocationPlan.period_month == period_month)
        return list(session.scalars(stmt))

    rows = _fetch()
    if (
        period_month is not None
        and not rows
        and allocation_auto_template_enabled()
        and isinstance(period_month, date)
    ):
        seed_starter_allocation_plan(session, period_month)
        rows = _fetch()
    return rows


def update_allocation_plan(
    session: Session, plan_id: int, payload: AllocationPlanUpdate
) -> AllocationPlan:
    row = session.get(AllocationPlan, plan_id)
    if row is None:
        raise ValueError("allocation plan not found")

    data = payload.model_dump(exclude_unset=True, mode="python")
    if "income_cadence" in data and data["income_cadence"] is not None:
        data["income_cadence"] = data["income_cadence"].value
    elif "income_cadence" in data and data["income_cadence"] is None:
        data["income_cadence"] = None

    for key, val in data.items():
        setattr(row, key, val)
    row.updated_at = datetime.utcnow()
    session.flush()
    sync_allocation_to_budgets(session, row.period_month)
    return row


def delete_allocation_plan(session: Session, plan_id: int) -> None:
    row = session.get(AllocationPlan, plan_id)
    if row is None:
        raise ValueError("allocation plan not found")
    pm = row.period_month
    session.delete(row)
    session.flush()
    sync_allocation_to_budgets(session, pm)


def create_allocation_item(
    session: Session, plan_id: int, payload: AllocationItemCreate
) -> AllocationItem:
    if session.get(AllocationPlan, plan_id) is None:
        raise ValueError("allocation plan not found")

    row = AllocationItem(
        plan_id=plan_id,
        item_name=payload.item_name,
        category=payload.category,
        planned_amount=payload.planned_amount,
        cadence=payload.cadence.value,
        monthly_amount=Decimal("0.00"),
        payment_method=payload.payment_method.value,
        due_day=payload.due_day,
        notes=payload.notes,
        sort_order=payload.sort_order,
    )
    refresh_item_monthly_amount(row)
    session.add(row)
    session.flush()
    sync_allocation_to_budgets(session, session.get(AllocationPlan, plan_id).period_month)
    return row


def seed_starter_allocation_plan(session: Session, period_month: date) -> AllocationPlan:
    """Insert starter plan + template lines (see ``finance.allocation.default_template``)."""

    plan = create_allocation_plan(session, starter_plan_create(period_month))
    for item_payload in starter_plan_items():
        create_allocation_item(session, plan.id, item_payload)
    replace_plan_graph(session, plan.id, default_seeded_plan_cash_flow_graph(plan.id))
    return plan


def list_allocation_items(session: Session, plan_id: int) -> list[AllocationItem]:
    if session.get(AllocationPlan, plan_id) is None:
        raise ValueError("allocation plan not found")

    stmt = (
        select(AllocationItem)
        .where(AllocationItem.plan_id == plan_id)
        .order_by(AllocationItem.sort_order, AllocationItem.id)
    )
    return list(session.scalars(stmt))


def get_allocation_item(session: Session, plan_id: int, item_id: int) -> AllocationItem | None:
    row = session.get(AllocationItem, item_id)
    if row is None or row.plan_id != plan_id:
        return None
    return row


def update_allocation_item(
    session: Session, plan_id: int, item_id: int, payload: AllocationItemUpdate
) -> AllocationItem:
    row = get_allocation_item(session, plan_id, item_id)
    if row is None:
        raise ValueError("allocation item not found")

    data = payload.model_dump(exclude_unset=True, mode="python")
    if "cadence" in data and data["cadence"] is not None:
        data["cadence"] = data["cadence"].value
    if "payment_method" in data and data["payment_method"] is not None:
        data["payment_method"] = data["payment_method"].value

    for key, val in data.items():
        setattr(row, key, val)
    if "planned_amount" in data or "cadence" in data:
        refresh_item_monthly_amount(row)
    session.flush()
    plan = session.get(AllocationPlan, row.plan_id)
    if plan is not None:
        sync_allocation_to_budgets(session, plan.period_month)
    return row


def delete_allocation_item(session: Session, plan_id: int, item_id: int) -> None:
    row = get_allocation_item(session, plan_id, item_id)
    if row is None:
        raise ValueError("allocation item not found")
    plan = session.get(AllocationPlan, row.plan_id)
    pm = plan.period_month if plan is not None else None
    session.delete(row)
    session.flush()
    if pm is not None:
        sync_allocation_to_budgets(session, pm)


def summarize_allocation_plan(
    session: Session,
    plan_id: int,
) -> AllocationSummary:
    plan = session.get(AllocationPlan, plan_id)
    if plan is None:
        raise ValueError("allocation plan not found")

    slices = [item_slice_from_orm(i) for i in plan.items]
    income_cadence = PlanIncomeCadence(plan.income_cadence) if plan.income_cadence else None
    return build_allocation_summary(
        slices,
        income_amount=plan.income_amount,
        income_cadence=income_cadence,
    )
