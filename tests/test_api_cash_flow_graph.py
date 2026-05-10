"""API tests for cash-flow graph endpoints (FR-0006)."""

from __future__ import annotations

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
def test_cash_flow_graph_get_empty_then_put_round_trip(cash_flow_api_client: TestClient) -> None:
    c = cash_flow_api_client
    r = c.post(
        "/api/budget-allocation/plans",
        json={"period_month": "2026-06-01", "name": "June"},
    )
    assert r.status_code == 200
    plan_id = r.json()["id"]

    g = c.get(f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph")
    assert g.status_code == 200
    empty = g.json()
    assert empty["plan_id"] == plan_id
    assert empty["nodes"] == []
    assert empty["edges"] == []

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
