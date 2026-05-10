"""Budget allocation REST API (plans, line items, derived summary)."""

from datetime import date

from fastapi import APIRouter, HTTPException, Query

from api.schemas import (
    AllocationItemListResponse,
    AllocationPlanListResponse,
    AllocationSummaryOut,
)
from finance.allocation.cadence import normalize_period_month
from finance.allocation.enums import AllocationCadence, PaymentMethod, PlanIncomeCadence
from finance.allocation.schemas import (
    AllocationItemCreate,
    AllocationItemOut,
    AllocationItemUpdate,
    AllocationPlanCreate,
    AllocationPlanOut,
    AllocationPlanUpdate,
)
from finance.allocation.service import (
    create_allocation_item,
    create_allocation_plan,
    delete_allocation_item,
    delete_allocation_plan,
    get_allocation_item,
    get_allocation_plan,
    list_allocation_items,
    list_allocation_plans,
    summarize_allocation_plan,
    update_allocation_item,
    update_allocation_plan,
)
from finance.allocation.summary import AllocationSummary
from finance.cash_flow_graph.schemas import CashFlowGraphDocument
from finance.cash_flow_graph.service import ensure_default_cash_flow_graph_if_empty, replace_plan_graph
from finance.db.models import AllocationItem, AllocationPlan
from finance.db.session import get_session

router = APIRouter(tags=["budget-allocation"])


def _plan_to_out(row: AllocationPlan) -> AllocationPlanOut:
    return AllocationPlanOut(
        id=row.id,
        name=row.name,
        period_month=row.period_month,
        currency=row.currency,
        income_amount=float(row.income_amount) if row.income_amount is not None else None,
        income_cadence=PlanIncomeCadence(row.income_cadence) if row.income_cadence else None,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _item_to_out(row: AllocationItem) -> AllocationItemOut:
    return AllocationItemOut(
        id=row.id,
        plan_id=row.plan_id,
        item_name=row.item_name,
        category=row.category,
        planned_amount=float(row.planned_amount),
        cadence=AllocationCadence(row.cadence),
        monthly_amount=float(row.monthly_amount),
        payment_method=PaymentMethod(row.payment_method),
        due_day=row.due_day,
        notes=row.notes,
        sort_order=row.sort_order,
    )


def _summary_to_out(summary: AllocationSummary) -> AllocationSummaryOut:
    return AllocationSummaryOut(
        total_monthly_allocated=float(summary.total_monthly_allocated),
        cash_allocated=float(summary.cash_allocated),
        credit_allocated=float(summary.credit_allocated),
        remaining_income=(
            float(summary.remaining_income) if summary.remaining_income is not None else None
        ),
        category_totals={k: float(v) for k, v in summary.category_totals.items()},
        cadence_totals={k: float(v) for k, v in summary.cadence_totals.items()},
    )


@router.post("/budget-allocation/plans", response_model=AllocationPlanOut)
def post_allocation_plan(payload: AllocationPlanCreate) -> AllocationPlanOut:
    with get_session() as session:
        row = create_allocation_plan(session, payload)
        return _plan_to_out(row)


@router.get("/budget-allocation/plans", response_model=AllocationPlanListResponse)
def get_allocation_plans(
    month: date | None = Query(
        default=None,
        description="If set, only plans for this calendar month (normalized to month start).",
    ),
) -> AllocationPlanListResponse:
    with get_session() as session:
        pm = normalize_period_month(month) if month is not None else None
        rows = list_allocation_plans(session, period_month=pm)
        return AllocationPlanListResponse(items=[_plan_to_out(r) for r in rows])


@router.get("/budget-allocation/plans/{plan_id}", response_model=AllocationPlanOut)
def get_allocation_plan_by_id(plan_id: int) -> AllocationPlanOut:
    with get_session() as session:
        row = get_allocation_plan(session, plan_id)
        if row is None:
            raise HTTPException(status_code=404, detail="allocation plan not found")
        return _plan_to_out(row)


@router.put("/budget-allocation/plans/{plan_id}", response_model=AllocationPlanOut)
def put_allocation_plan(plan_id: int, payload: AllocationPlanUpdate) -> AllocationPlanOut:
    with get_session() as session:
        try:
            row = update_allocation_plan(session, plan_id, payload)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return _plan_to_out(row)


@router.delete("/budget-allocation/plans/{plan_id}")
def remove_allocation_plan(plan_id: int) -> dict[str, bool]:
    with get_session() as session:
        try:
            delete_allocation_plan(session, plan_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return {"deleted": True}


@router.post(
    "/budget-allocation/plans/{plan_id}/items",
    response_model=AllocationItemOut,
)
def post_allocation_item(plan_id: int, payload: AllocationItemCreate) -> AllocationItemOut:
    with get_session() as session:
        try:
            row = create_allocation_item(session, plan_id, payload)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return _item_to_out(row)


@router.get(
    "/budget-allocation/plans/{plan_id}/items",
    response_model=AllocationItemListResponse,
)
def get_allocation_items(plan_id: int) -> AllocationItemListResponse:
    with get_session() as session:
        try:
            rows = list_allocation_items(session, plan_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return AllocationItemListResponse(items=[_item_to_out(r) for r in rows])


@router.get(
    "/budget-allocation/plans/{plan_id}/items/{item_id}",
    response_model=AllocationItemOut,
)
def get_allocation_item_by_id(plan_id: int, item_id: int) -> AllocationItemOut:
    with get_session() as session:
        row = get_allocation_item(session, plan_id, item_id)
        if row is None:
            raise HTTPException(status_code=404, detail="allocation item not found")
        return _item_to_out(row)


@router.put(
    "/budget-allocation/plans/{plan_id}/items/{item_id}",
    response_model=AllocationItemOut,
)
def put_allocation_item(
    plan_id: int, item_id: int, payload: AllocationItemUpdate
) -> AllocationItemOut:
    with get_session() as session:
        try:
            row = update_allocation_item(session, plan_id, item_id, payload)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return _item_to_out(row)


@router.delete("/budget-allocation/plans/{plan_id}/items/{item_id}")
def remove_allocation_item(plan_id: int, item_id: int) -> dict[str, bool]:
    with get_session() as session:
        try:
            delete_allocation_item(session, plan_id, item_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return {"deleted": True}


@router.get(
    "/budget-allocation/plans/{plan_id}/summary",
    response_model=AllocationSummaryOut,
)
def get_allocation_plan_summary(
    plan_id: int,
) -> AllocationSummaryOut:
    with get_session() as session:
        try:
            summary = summarize_allocation_plan(session, plan_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return _summary_to_out(summary)


@router.get(
    "/budget-allocation/plans/{plan_id}/cash-flow-graph",
    response_model=CashFlowGraphDocument,
)
def get_plan_cash_flow_graph(plan_id: int) -> CashFlowGraphDocument:
    """Return nodes and edges for the cash-flow graph attached to this allocation plan."""

    with get_session() as session:
        doc = ensure_default_cash_flow_graph_if_empty(session, plan_id)
        if doc is None:
            raise HTTPException(status_code=404, detail="allocation plan not found")
        return doc


@router.put(
    "/budget-allocation/plans/{plan_id}/cash-flow-graph",
    response_model=CashFlowGraphDocument,
)
def put_plan_cash_flow_graph(plan_id: int, payload: CashFlowGraphDocument) -> CashFlowGraphDocument:
    """Replace the entire cash-flow graph for this plan."""

    with get_session() as session:
        try:
            replace_plan_graph(session, plan_id, payload)
        except ValueError as exc:
            detail = str(exc)
            code = 404 if "not found" in detail.lower() else 400
            raise HTTPException(status_code=code, detail=detail) from exc
        doc = ensure_default_cash_flow_graph_if_empty(session, plan_id)
        assert doc is not None
        return doc
