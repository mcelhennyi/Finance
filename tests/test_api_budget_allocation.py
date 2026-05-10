"""API tests — budget allocation endpoints (T-FR-0002-02)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def allocation_api_client(tmp_path, monkeypatch):
    """Isolated SQLite file so allocation CRUD does not touch the developer DB."""

    db_file = tmp_path / "alloc_api.sqlite"
    monkeypatch.setenv("FINANCE_DB_URL", f"sqlite:///{db_file}")
    import finance.db.session as session_mod

    session_mod._engine = None
    session_mod._SessionLocal = None
    from api.main import app

    with TestClient(app) as client:
        yield client


@pytest.mark.unit
def test_allocation_plan_and_item_crud_and_summary(allocation_api_client: TestClient) -> None:
    c = allocation_api_client
    r = c.post(
        "/api/budget-allocation/plans",
        json={
            "period_month": "2026-05-15",
            "currency": "USD",
            "income_amount": "5000",
            "income_cadence": "monthly",
        },
    )
    assert r.status_code == 200
    plan = r.json()
    plan_id = plan["id"]
    assert plan["period_month"] == "2026-05-01"
    assert plan["name"] == "May 2026"
    assert plan["income_monthly"] == pytest.approx(5000.0)

    r = c.post(
        f"/api/budget-allocation/plans/{plan_id}/items",
        json={
            "item_name": "Groceries",
            "category": "Food",
            "planned_amount": "100",
            "cadence": "weekly",
            "payment_method": "cash",
            "due_day": 5,
        },
    )
    assert r.status_code == 200
    item = r.json()
    assert item["monthly_amount"] == pytest.approx(400.0)
    item_id = item["id"]

    r = c.get(f"/api/budget-allocation/plans/{plan_id}/items")
    assert r.status_code == 200
    assert len(r.json()["items"]) == 1

    r = c.get(f"/api/budget-allocation/plans/{plan_id}/summary")
    assert r.status_code == 200
    s = r.json()
    assert s["total_monthly_allocated"] == pytest.approx(400.0)
    assert s["cash_allocated"] == pytest.approx(400.0)
    assert s["credit_allocated"] == pytest.approx(0.0)
    assert s["remaining_income"] == pytest.approx(4600.0)
    assert s["category_totals"]["Food"] == pytest.approx(400.0)
    assert "weekly" in s["cadence_totals"]

    r = c.put(
        f"/api/budget-allocation/plans/{plan_id}/items/{item_id}",
        json={"cadence": "monthly", "planned_amount": "200"},
    )
    assert r.status_code == 200
    assert r.json()["monthly_amount"] == pytest.approx(200.0)

    r = c.put(
        f"/api/budget-allocation/plans/{plan_id}",
        json={"name": "Custom May", "income_amount": None, "income_cadence": None},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Custom May"
    assert body["income_amount"] is None
    assert body["income_cadence"] is None
    assert body["income_monthly"] is None

    r = c.get(f"/api/budget-allocation/plans/{plan_id}/summary")
    assert r.status_code == 200
    assert r.json()["remaining_income"] is None

    r = c.delete(f"/api/budget-allocation/plans/{plan_id}/items/{item_id}")
    assert r.status_code == 200
    r = c.get(f"/api/budget-allocation/plans/{plan_id}/items")
    assert r.json()["items"] == []

    r = c.delete(f"/api/budget-allocation/plans/{plan_id}")
    assert r.status_code == 200
    r = c.get(f"/api/budget-allocation/plans/{plan_id}")
    assert r.status_code == 404


@pytest.mark.unit
def test_allocation_sync_surfaces_in_unified_summary(allocation_api_client: TestClient) -> None:
    c = allocation_api_client
    r = c.post("/api/budget-allocation/plans", json={"period_month": "2026-05-01"})
    plan_id = r.json()["id"]
    c.post(
        f"/api/budget-allocation/plans/{plan_id}/items",
        json={
            "item_name": "Food plan",
            "category": "Food",
            "planned_amount": "50",
            "cadence": "monthly",
            "payment_method": "cash",
        },
    )
    u = c.get("/api/unified-view/summary", params={"month": "2026-05-10"})
    assert u.status_code == 200
    budgets = u.json()["budgets"]
    assert len(budgets) == 1
    assert budgets[0]["category"] == "Food"
    assert budgets[0]["budget_amount"] == pytest.approx(50.0)


@pytest.mark.unit
def test_allocation_validation_and_missing_ids(allocation_api_client: TestClient) -> None:
    c = allocation_api_client
    r = c.post(
        "/api/budget-allocation/plans",
        json={"period_month": "2026-06-01", "income_amount": "100", "income_cadence": None},
    )
    assert r.status_code == 422

    r = c.post("/api/budget-allocation/plans", json={"period_month": "2026-06-01"})
    assert r.status_code == 200
    plan_id = r.json()["id"]

    r = c.post(
        f"/api/budget-allocation/plans/{plan_id}/items",
        json={
            "item_name": "X",
            "category": "Y",
            "planned_amount": "10",
            "cadence": "not_a_cadence",
            "payment_method": "cash",
        },
    )
    assert r.status_code == 422

    r = c.get("/api/budget-allocation/plans/99999")
    assert r.status_code == 404

    r = c.post(
        f"/api/budget-allocation/plans/99999/items",
        json={
            "item_name": "X",
            "category": "Y",
            "planned_amount": "10",
            "cadence": "monthly",
            "payment_method": "cash",
        },
    )
    assert r.status_code == 404

    r = c.get(f"/api/budget-allocation/plans/99999/summary")
    assert r.status_code == 404


@pytest.mark.unit
def test_allocation_list_filter_by_month(allocation_api_client: TestClient) -> None:
    c = allocation_api_client
    c.post("/api/budget-allocation/plans", json={"period_month": "2026-07-10"})
    c.post("/api/budget-allocation/plans", json={"period_month": "2026-08-01"})
    r = c.get("/api/budget-allocation/plans", params={"month": "2026-07-20"})
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["period_month"] == "2026-07-01"


@pytest.mark.unit
def test_allocation_auto_template_seeds_when_enabled(
    monkeypatch, allocation_api_client: TestClient
) -> None:
    monkeypatch.setenv("FINANCE_ALLOCATION_AUTO_TEMPLATE", "true")
    c = allocation_api_client
    r = c.get("/api/budget-allocation/plans", params={"month": "2032-03-15"})
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Starter cash-flow template"
    plan_id = items[0]["id"]
    r2 = c.get(f"/api/budget-allocation/plans/{plan_id}/items")
    assert r2.status_code == 200
    assert len(r2.json()["items"]) == 4


@pytest.mark.unit
def test_allocation_auto_template_off_when_disabled(
    monkeypatch, allocation_api_client: TestClient
) -> None:
    monkeypatch.delenv("FINANCE_ALLOCATION_AUTO_TEMPLATE", raising=False)
    c = allocation_api_client
    r = c.get("/api/budget-allocation/plans", params={"month": "2033-04-10"})
    assert r.status_code == 200
    assert r.json()["items"] == []
