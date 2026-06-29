"""Tests for YAML budget default seeding."""

from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest
from sqlalchemy import select

from finance.allocation.cadence import normalize_period_month
from finance.allocation.enums import AllocationCadence, PaymentMethod, PlanIncomeCadence
from finance.cash_flow_graph.service import get_plan_graph, replace_plan_graph
from finance.cash_flow_graph.schemas import CashFlowGraphDocument
from finance.db.models import AllocationPlan, BudgetCategoryLabel
from finance.db.session import get_session, init_db
from finance.seed_budget_allocation_yaml import (
    apply_budget_seed_yaml,
    default_budget_yaml_path,
    document_to_creates,
    export_budget_seed_yaml,
    load_budget_seed_document,
    parse_budget_seed_yaml,
    try_seed_budget_default_yaml,
)


@pytest.fixture
def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


MINIMAL_YAML = """
version: 1
period_month: "2026-05-01"
plan:
  name: Test plan
  currency: USD
  income_amount: "5000.00"
  income_cadence: monthly
items:
  - item_name: Rent
    category: Living
    planned_amount: "1200.00"
    cadence: monthly
    payment_method: cash
    due_day: 1
"""


MINIMAL_YAML_WITH_GRAPH = MINIMAL_YAML + """
cash_flow_graph:
  nodes:
    - ref: payroll
      display_name: Income
      kind: income_source
      institution: null
      layout_x: 0
      layout_y: 0
    - ref: checking
      display_name: Checking
      kind: checking
      institution: null
      layout_x: 180
      layout_y: 0
  edges:
    - ref: e_pay_chk
      from_ref: payroll
      to_ref: checking
      label: All in
      amount_rule: percent_of_inflow
      fixed_amount: null
      percent_of_inflow: "100"
      cadence: monthly
      day_of_month: null
"""


SOURCE_SINK_YAML_WITH_GRAPH = """
version: 1
period_month: "2026-05-01"
plan:
  name: Source sink plan
  currency: USD
items:
  - item_name: Paycheck
    category: Income
    planned_amount: "5000.00"
    cadence: monthly
    allocation_role: source
    to_account_ref: checking
    counterparty: Employer
    payment_method: cash
  - item_name: Savings sweep
    category: Savings
    planned_amount: "1250.00"
    cadence: monthly
    allocation_role: sink
    from_account_ref: checking
    to_account_ref: savings
    payment_method: cash
cash_flow_graph:
  nodes:
    - ref: checking
      display_name: Checking
      kind: checking
      institution: null
      layout_x: 0
      layout_y: 0
    - ref: savings
      display_name: Savings
      kind: savings
      institution: null
      layout_x: 180
      layout_y: 0
  edges: []
"""


@pytest.fixture
def isolated_db(tmp_path, monkeypatch):
    db_file = tmp_path / "seed_yaml.sqlite"
    monkeypatch.setenv("FINANCE_DB_URL", f"sqlite:///{db_file}")
    import finance.db.session as session_mod

    session_mod._engine = None
    session_mod._SessionLocal = None


def test_tracked_example_yaml_loads(repo_root: Path) -> None:
    path = repo_root / "data" / "budget-default-plan.yaml"
    doc = load_budget_seed_document(path)
    assert doc.version == 1
    assert len(doc.items) == 45
    assert doc.cash_flow_graph is not None
    assert len(doc.cash_flow_graph.nodes) == 8
    assert len(doc.cash_flow_graph.edges) == 5
    assert {n.ref for n in doc.cash_flow_graph.nodes} == {
        "payroll",
        "checking",
        "savings",
        "ian_chase",
        "ian_chase_sapphire",
        "natalie_chase",
        "natalie_chase_freedom",
        "brokerage",
    }


def test_parse_minimal_yaml() -> None:
    doc = parse_budget_seed_yaml(MINIMAL_YAML)
    assert doc.plan.name == "Test plan"
    assert doc.plan.income_cadence == PlanIncomeCadence.MONTHLY
    assert len(doc.items) == 1
    assert doc.items[0].cadence == AllocationCadence.MONTHLY
    assert doc.items[0].payment_method == PaymentMethod.CASH
    assert doc.cash_flow_graph is None


def test_document_to_creates() -> None:
    doc = parse_budget_seed_yaml(MINIMAL_YAML)
    plan, items = document_to_creates(doc)
    assert doc.period_month is not None
    assert plan.period_month == normalize_period_month(doc.period_month)
    assert len(items) == 1


def test_apply_budget_seed_yaml_round_trip(isolated_db, tmp_path: Path) -> None:
    path = tmp_path / "seed.yaml"
    path.write_text(MINIMAL_YAML, encoding="utf-8")
    init_db()
    with get_session() as session:
        n, pm = apply_budget_seed_yaml(session, path)
        plan = session.scalars(
            select(AllocationPlan).where(AllocationPlan.period_month == pm)
        ).first()
        assert plan is not None
        graph = get_plan_graph(session, plan.id)
    assert n == 1
    assert pm.isoformat() == "2026-05-01"
    assert graph is not None
    assert {node.ref for node in graph.nodes} == {
        "payroll",
        "checking",
        "savings",
        "ian_chase",
        "ian_chase_sapphire",
    }
    assert {(e.from_ref, e.to_ref) for e in graph.edges} == {
        ("payroll", "checking"),
        ("savings", "checking"),
    }
    with get_session() as session:
        labels = [r.label for r in session.scalars(select(BudgetCategoryLabel)).all()]
    assert len(labels) >= 1
    assert "Living" in labels


def test_apply_budget_seed_yaml_inline_graph_overrides_default(isolated_db, tmp_path: Path) -> None:
    path = tmp_path / "with_graph.yaml"
    path.write_text(MINIMAL_YAML_WITH_GRAPH, encoding="utf-8")
    init_db()
    with get_session() as session:
        apply_budget_seed_yaml(session, path)
        plan = session.scalars(
            select(AllocationPlan).where(AllocationPlan.period_month == date(2026, 5, 1))
        ).first()
        assert plan is not None
        graph = get_plan_graph(session, plan.id)
    assert graph is not None
    assert len(graph.nodes) == 2
    assert {n.ref for n in graph.nodes} == {"payroll", "checking"}
    assert len(graph.edges) == 1


def test_try_seed_uses_finance_budget_default_yaml(isolated_db, tmp_path: Path, monkeypatch):
    path = tmp_path / "custom.yaml"
    path.write_text(MINIMAL_YAML, encoding="utf-8")
    monkeypatch.setenv("FINANCE_BUDGET_DEFAULT_YAML", str(path))
    init_db()
    with get_session() as session:
        ran, msg = try_seed_budget_default_yaml(session)
    assert ran is True
    assert "1 line" in msg


def test_default_budget_yaml_path_resolves_repo_file(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("FINANCE_BUDGET_DEFAULT_YAML", raising=False)
    p = default_budget_yaml_path()
    assert p.name == "budget-default-plan.yaml"


def test_export_budget_seed_yaml_uses_existing_seed_selector(isolated_db, tmp_path: Path) -> None:
    path = tmp_path / "seed.yaml"
    path.write_text(MINIMAL_YAML_WITH_GRAPH, encoding="utf-8")
    init_db()
    with get_session() as session:
        apply_budget_seed_yaml(session, path)
        plan = session.scalars(
            select(AllocationPlan).where(AllocationPlan.period_month == date(2026, 5, 1))
        ).first()
        assert plan is not None
        item = plan.items[0]
        item.planned_amount = Decimal("1300.25")
        item.notes = "Adjusted in the UI"
        path_out, count, pm, name = export_budget_seed_yaml(session, path)

    assert path_out == path
    assert count == 1
    assert pm == date(2026, 5, 1)
    assert name == "Test plan"
    doc = load_budget_seed_document(path)
    assert doc.items[0].planned_amount == Decimal("1300.25")
    assert doc.items[0].notes == "Adjusted in the UI"
    assert doc.cash_flow_graph is not None
    assert len(doc.cash_flow_graph.nodes) == 2
    assert len(doc.cash_flow_graph.edges) == 1


def test_export_budget_seed_yaml_plan_id_allows_renamed_plan(isolated_db, tmp_path: Path) -> None:
    path = tmp_path / "seed.yaml"
    path.write_text(MINIMAL_YAML_WITH_GRAPH, encoding="utf-8")
    init_db()
    with get_session() as session:
        apply_budget_seed_yaml(session, path)
        plan = session.scalars(
            select(AllocationPlan).where(AllocationPlan.period_month == date(2026, 5, 1))
        ).first()
        assert plan is not None
        plan.name = "Renamed in UI"
        graph = get_plan_graph(session, plan.id)
        assert graph is not None
        replace_plan_graph(
            session, plan.id, CashFlowGraphDocument(plan_id=plan.id, nodes=graph.nodes, edges=[])
        )
        export_budget_seed_yaml(session, path, plan_id=plan.id)

    doc = load_budget_seed_document(path)
    assert doc.plan.name == "Renamed in UI"
    assert doc.cash_flow_graph is not None
    assert len(doc.cash_flow_graph.edges) == 0


def test_seed_yaml_round_trips_source_sink_allocation_fields(
    isolated_db, tmp_path: Path
) -> None:
    path = tmp_path / "source_sink.yaml"
    path.write_text(SOURCE_SINK_YAML_WITH_GRAPH, encoding="utf-8")
    init_db()
    with get_session() as session:
        apply_budget_seed_yaml(session, path)
        plan = session.scalars(
            select(AllocationPlan).where(AllocationPlan.name == "Source sink plan")
        ).one()
        export_budget_seed_yaml(session, path, plan_id=plan.id)

    doc = load_budget_seed_document(path)
    rows = {item.item_name: item for item in doc.items}
    assert rows["Paycheck"].allocation_role.value == "source"
    assert rows["Paycheck"].to_account_ref == "checking"
    assert rows["Paycheck"].counterparty == "Employer"
    assert rows["Savings sweep"].allocation_role.value == "sink"
    assert rows["Savings sweep"].from_account_ref == "checking"
    assert rows["Savings sweep"].to_account_ref == "savings"
