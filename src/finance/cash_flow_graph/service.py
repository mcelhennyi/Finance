"""Persist and load cash-flow graphs per allocation plan."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from finance.cash_flow_graph.default_plan_graph import default_seeded_plan_cash_flow_graph
from finance.cash_flow_graph.enums import CashFlowAmountRule, CashFlowCadence, CashNodeKind
from finance.cash_flow_graph.schemas import (
    CashFlowEdgeSpec,
    CashFlowGraphDocument,
    CashFlowNodeSpec,
)
from finance.db.models import AllocationPlan, CashFlowEdge, CashFlowNode


def get_plan_graph(session: Session, plan_id: int) -> CashFlowGraphDocument | None:
    """Return the graph for ``plan_id``, or ``None`` if the plan does not exist."""

    plan = session.get(AllocationPlan, plan_id)
    if plan is None:
        return None

    nodes = session.scalars(select(CashFlowNode).where(CashFlowNode.plan_id == plan_id)).all()
    edges = session.scalars(select(CashFlowEdge).where(CashFlowEdge.plan_id == plan_id)).all()

    id_to_ref = {n.id: n.ref for n in nodes}
    node_specs = [
        CashFlowNodeSpec(
            ref=n.ref,
            display_name=n.display_name,
            kind=CashNodeKind(n.kind),
            institution=n.institution,
            layout_x=n.layout_x,
            layout_y=n.layout_y,
        )
        for n in nodes
    ]
    edge_specs: list[CashFlowEdgeSpec] = []
    for e in edges:
        fr = id_to_ref.get(e.from_node_id)
        tr = id_to_ref.get(e.to_node_id)
        if fr is None or tr is None:
            continue
        edge_specs.append(
            CashFlowEdgeSpec(
                ref=e.ref,
                from_ref=fr,
                to_ref=tr,
                label=e.label or "",
                amount_rule=CashFlowAmountRule(e.amount_rule),
                fixed_amount=e.fixed_amount,
                percent_of_inflow=e.percent_of_inflow,
                cadence=CashFlowCadence(e.cadence),
                day_of_month=e.day_of_month,
            )
        )

    return CashFlowGraphDocument(plan_id=plan_id, nodes=node_specs, edges=edge_specs)


def ensure_default_cash_flow_graph_if_empty(session: Session, plan_id: int) -> CashFlowGraphDocument | None:
    """Return the plan graph, inserting the seeded default template when the plan exists but has no nodes.

    Older plans (created before graph seeding) load empty graphs until this runs on first GET.
    """

    doc = get_plan_graph(session, plan_id)
    if doc is None:
        return None
    if doc.nodes:
        return doc
    replace_plan_graph(session, plan_id, default_seeded_plan_cash_flow_graph(plan_id))
    return get_plan_graph(session, plan_id)


def replace_plan_graph(session: Session, plan_id: int, payload: CashFlowGraphDocument) -> None:
    """Replace the entire graph for ``plan_id`` with ``payload`` (validated document)."""

    if payload.plan_id != plan_id:
        raise ValueError("payload.plan_id must match path plan_id")

    plan = session.get(AllocationPlan, plan_id)
    if plan is None:
        raise ValueError("allocation plan not found")

    session.execute(delete(CashFlowEdge).where(CashFlowEdge.plan_id == plan_id))
    session.execute(delete(CashFlowNode).where(CashFlowNode.plan_id == plan_id))
    session.flush()

    now = datetime.utcnow()
    ref_to_id: dict[str, int] = {}

    for spec in payload.nodes:
        row = CashFlowNode(
            plan_id=plan_id,
            ref=spec.ref,
            display_name=spec.display_name,
            kind=spec.kind.value,
            institution=spec.institution,
            layout_x=spec.layout_x,
            layout_y=spec.layout_y,
            created_at=now,
            updated_at=now,
        )
        session.add(row)
        session.flush()
        ref_to_id[spec.ref] = row.id

    for es in payload.edges:
        fn = ref_to_id.get(es.from_ref)
        tn = ref_to_id.get(es.to_ref)
        if fn is None or tn is None:
            raise ValueError(f"edge {es.ref!r} references unknown node ref")

        session.add(
            CashFlowEdge(
                plan_id=plan_id,
                ref=es.ref,
                from_node_id=fn,
                to_node_id=tn,
                label=es.label,
                amount_rule=es.amount_rule.value,
                fixed_amount=es.fixed_amount,
                percent_of_inflow=es.percent_of_inflow,
                cadence=es.cadence.value,
                day_of_month=es.day_of_month,
                created_at=now,
                updated_at=now,
            )
        )
    session.flush()
