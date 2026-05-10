"""ORM tests for cash-flow graph tables (FR-0006)."""

from datetime import date, datetime
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from finance.cash_flow_graph.enums import CashFlowAmountRule, CashFlowCadence, CashNodeKind
from finance.db.models import AllocationPlan, Base, CashFlowEdge, CashFlowNode


def _session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    return factory()


@pytest.mark.unit
def test_cash_flow_nodes_edges_round_trip_and_cascade() -> None:
    s = _session()
    plan = AllocationPlan(
        name="Jan",
        period_month=date(2026, 1, 1),
        currency="USD",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    s.add(plan)
    s.flush()
    pid = plan.id

    n1 = CashFlowNode(
        plan_id=pid,
        ref="income",
        display_name="Income",
        kind=CashNodeKind.INCOME_SOURCE.value,
        institution=None,
        layout_x=10.5,
        layout_y=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    n2 = CashFlowNode(
        plan_id=pid,
        ref="checking",
        display_name="Checking",
        kind=CashNodeKind.CHECKING.value,
        institution="Bank",
        layout_x=None,
        layout_y=20.0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    s.add_all([n1, n2])
    s.flush()

    edge = CashFlowEdge(
        plan_id=pid,
        ref="salary",
        from_node_id=n1.id,
        to_node_id=n2.id,
        label="Deposit",
        amount_rule=CashFlowAmountRule.FIXED.value,
        fixed_amount=Decimal("4000.00"),
        percent_of_inflow=None,
        cadence=CashFlowCadence.MONTHLY.value,
        day_of_month=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    s.add(edge)
    s.commit()

    s.expunge_all()
    loaded = s.scalars(select(CashFlowEdge).where(CashFlowEdge.plan_id == pid)).first()
    assert loaded is not None
    assert loaded.ref == "salary"
    assert loaded.from_node_id != loaded.to_node_id
    assert float(loaded.fixed_amount) == 4000.0

    # Deleting plan cascades to nodes and edges
    p2 = s.get(AllocationPlan, pid)
    s.delete(p2)
    s.commit()
    assert s.scalars(select(CashFlowNode)).all() == []
    assert s.scalars(select(CashFlowEdge)).all() == []


@pytest.mark.unit
def test_unique_plan_ref_per_node() -> None:
    s = _session()
    plan = AllocationPlan(
        name="Feb",
        period_month=date(2026, 2, 1),
        currency="USD",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    s.add(plan)
    s.flush()
    pid = plan.id
    s.add(
        CashFlowNode(
            plan_id=pid,
            ref="dup",
            display_name="A",
            kind=CashNodeKind.OTHER.value,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
    )
    s.flush()
    s.add(
        CashFlowNode(
            plan_id=pid,
            ref="dup",
            display_name="B",
            kind=CashNodeKind.OTHER.value,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
    )
    with pytest.raises(IntegrityError):
        s.commit()
