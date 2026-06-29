"""API tests for cash-flow graph endpoints (FR-0006)."""

from __future__ import annotations

from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from finance.cash_flow_graph.enums import CashFlowAmountRule, CashFlowCadence, CashNodeKind


@pytest.fixture
def cash_flow_api_client(tmp_path, monkeypatch):
    db_file = tmp_path / "cf_api.sqlite"
    monkeypatch.setenv("FINANCE_DB_URL", f"sqlite:///{db_file}")
    monkeypatch.delenv("FINANCE_ALLOCATION_AUTO_TEMPLATE", raising=False)
    import finance.db.session as session_mod

    session_mod._engine = None
    session_mod._SessionLocal = None
    from api.main import app

    with TestClient(app) as client:
        yield client


@pytest.mark.unit
def test_cash_flow_graph_get_seeds_default_then_put_round_trip(cash_flow_api_client: TestClient) -> None:
    c = cash_flow_api_client
    r = c.post(
        "/api/budget-allocation/plans",
        json={"period_month": "2026-06-01", "name": "June"},
    )
    assert r.status_code == 200
    plan_id = r.json()["id"]

    g = c.get(f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph")
    assert g.status_code == 200
    first = g.json()
    assert first["plan_id"] == plan_id
    assert len(first["nodes"]) == 5
    assert {n["ref"] for n in first["nodes"]} == {
        "payroll",
        "checking",
        "savings",
        "ian_chase",
        "ian_chase_sapphire",
    }
    assert len(first["edges"]) == 2

    payload = {
        "plan_id": plan_id,
        "nodes": [
            {
                "ref": "payroll",
                "display_name": "Payroll",
                "kind": CashNodeKind.INCOME_SOURCE.value,
                "institution": None,
                "layout_x": 1.0,
                "layout_y": None,
            },
            {
                "ref": "checking",
                "display_name": "Checking",
                "kind": CashNodeKind.CHECKING.value,
                "institution": None,
                "currency": "USD",
                "current_balance": "1234.56",
                "balance_as_of": "2026-06-15",
                "account_mask": "6789",
                "notes": "Primary account",
                "is_active": True,
                "layout_x": None,
                "layout_y": 2.0,
            },
        ],
        "edges": [
            {
                "ref": "deposit",
                "from_ref": "payroll",
                "to_ref": "checking",
                "label": "",
                "amount_rule": CashFlowAmountRule.FIXED.value,
                "fixed_amount": "3000.00",
                "percent_of_inflow": None,
                "cadence": CashFlowCadence.MONTHLY.value,
                "day_of_month": None,
            },
        ],
    }
    p = c.put(f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph", json=payload)
    assert p.status_code == 200, p.text
    data = p.json()
    assert len(data["nodes"]) == 2
    assert len(data["edges"]) == 1
    assert data["edges"][0]["from_ref"] == "payroll"
    checking = next(n for n in data["nodes"] if n["ref"] == "checking")
    assert checking["current_balance"] == "1234.56"
    assert checking["balance_as_of"] == "2026-06-15"
    assert checking["account_mask"] == "6789"
    assert checking["notes"] == "Primary account"
    assert checking["is_active"] is True

    g2 = c.get(f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph")
    assert g2.status_code == 200
    assert g2.json() == data


@pytest.mark.unit
def test_cash_flow_graph_plan_not_found(cash_flow_api_client: TestClient) -> None:
    c = cash_flow_api_client
    r = c.get("/api/budget-allocation/plans/99999/cash-flow-graph")
    assert r.status_code == 404


@pytest.mark.unit
def test_cash_flow_graph_put_plan_id_mismatch(cash_flow_api_client: TestClient) -> None:
    c = cash_flow_api_client
    r = c.post(
        "/api/budget-allocation/plans",
        json={"period_month": "2026-07-01", "name": "July"},
    )
    plan_id = r.json()["id"]
    payload = {
        "plan_id": plan_id + 1,
        "nodes": [],
        "edges": [],
    }
    pr = c.put(f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph", json=payload)
    assert pr.status_code == 400


@pytest.mark.unit
def test_cash_flow_graph_link_accounts_persists_directed_edge(
    cash_flow_api_client: TestClient,
) -> None:
    c = cash_flow_api_client
    r = c.post(
        "/api/budget-allocation/plans",
        json={"period_month": "2026-08-01", "name": "August"},
    )
    plan_id = r.json()["id"]

    p = c.post(
        f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph/links",
        json={
            "from_ref": "checking",
            "to_ref": "savings",
            "label": "Sweep",
            "amount_rule": CashFlowAmountRule.PERCENT_OF_INFLOW.value,
            "percent_of_inflow": "10",
            "cadence": CashFlowCadence.MONTHLY.value,
        },
    )
    assert p.status_code == 200, p.text
    data = p.json()
    linked = [
        edge
        for edge in data["edges"]
        if edge["from_ref"] == "checking" and edge["to_ref"] == "savings"
    ]
    assert len(linked) == 1
    assert linked[0]["label"] == "Sweep"
    assert Decimal(linked[0]["percent_of_inflow"]) == Decimal("10")

    g = c.get(f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph")
    assert g.status_code == 200
    assert linked[0] in g.json()["edges"]


@pytest.mark.unit
def test_cash_flow_graph_link_accounts_rejects_missing_endpoint(
    cash_flow_api_client: TestClient,
) -> None:
    c = cash_flow_api_client
    r = c.post(
        "/api/budget-allocation/plans",
        json={"period_month": "2026-09-01", "name": "September"},
    )
    plan_id = r.json()["id"]

    p = c.post(
        f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph/links",
        json={
            "from_ref": "checking",
            "to_ref": "missing",
            "amount_rule": CashFlowAmountRule.REMAINDER.value,
            "cadence": CashFlowCadence.MONTHLY.value,
        },
    )
    assert p.status_code == 400


@pytest.mark.unit
def test_cash_flow_graph_replace_rejects_deleting_allocation_endpoint(
    cash_flow_api_client: TestClient,
) -> None:
    c = cash_flow_api_client
    r = c.post(
        "/api/budget-allocation/plans",
        json={"period_month": "2026-10-01", "name": "October"},
    )
    plan_id = r.json()["id"]
    graph = c.get(f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph").json()

    item = c.post(
        f"/api/budget-allocation/plans/{plan_id}/items",
        json={
            "item_name": "Savings sweep",
            "category": "Savings",
            "planned_amount": "1000",
            "cadence": "monthly",
            "allocation_role": "sink",
            "from_account_ref": "checking",
            "to_account_ref": "savings",
            "payment_method": "cash",
        },
    )
    assert item.status_code == 200, item.text

    payload = {
        "plan_id": plan_id,
        "nodes": [node for node in graph["nodes"] if node["ref"] != "savings"],
        "edges": [
            edge
            for edge in graph["edges"]
            if edge["from_ref"] != "savings" and edge["to_ref"] != "savings"
        ],
    }
    replaced = c.put(f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph", json=payload)
    assert replaced.status_code == 400
    assert "savings" in replaced.json()["detail"]
