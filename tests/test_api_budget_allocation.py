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
    assert item["allocation_role"] == "sink"
    assert item["from_account_ref"] is None
    assert item["to_account_ref"] is None
    assert item["counterparty"] is None
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
def test_allocation_items_accept_source_sink_account_endpoints(
    allocation_api_client: TestClient,
) -> None:
    c = allocation_api_client
    r = c.post(
        "/api/budget-allocation/plans",
        json={
            "period_month": "2026-05-01",
            "income_amount": "9999",
            "income_cadence": "monthly",
        },
    )
    assert r.status_code == 200
    plan_id = r.json()["id"]
    assert c.get(f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph").status_code == 200

    source = c.post(
        f"/api/budget-allocation/plans/{plan_id}/items",
        json={
            "item_name": "Paycheck",
            "category": "Income",
            "planned_amount": "5000",
            "cadence": "monthly",
            "allocation_role": "source",
            "to_account_ref": "checking",
            "counterparty": "Employer",
            "payment_method": "cash",
        },
    )
    assert source.status_code == 200, source.text
    assert source.json()["allocation_role"] == "source"
    assert source.json()["to_account_ref"] == "checking"
    assert source.json()["counterparty"] == "Employer"

    sink = c.post(
        f"/api/budget-allocation/plans/{plan_id}/items",
        json={
            "item_name": "Savings sweep",
            "category": "Savings",
            "planned_amount": "1250",
            "cadence": "monthly",
            "allocation_role": "sink",
            "from_account_ref": "checking",
            "to_account_ref": "savings",
            "payment_method": "cash",
        },
    )
    assert sink.status_code == 200, sink.text

    r = c.get(f"/api/budget-allocation/plans/{plan_id}/items")
    rows = {item["item_name"]: item for item in r.json()["items"]}
    assert rows["Paycheck"]["allocation_role"] == "source"
    assert rows["Paycheck"]["to_account_ref"] == "checking"
    assert rows["Savings sweep"]["from_account_ref"] == "checking"
    assert rows["Savings sweep"]["to_account_ref"] == "savings"

    summary = c.get(f"/api/budget-allocation/plans/{plan_id}/summary").json()
    assert summary["total_monthly_allocated"] == pytest.approx(1250.0)
    assert summary["cash_allocated"] == pytest.approx(1250.0)
    assert summary["remaining_income"] == pytest.approx(3750.0)
    assert "Income" not in summary["category_totals"]

    updated = c.put(
        f"/api/budget-allocation/plans/{plan_id}/items/{sink.json()['id']}",
        json={"to_account_ref": None, "counterparty": "Brokerage"},
    )
    assert updated.status_code == 200
    assert updated.json()["to_account_ref"] is None
    assert updated.json()["counterparty"] == "Brokerage"


@pytest.mark.unit
def test_allocation_item_endpoint_refs_must_exist_in_plan_graph(
    allocation_api_client: TestClient,
) -> None:
    c = allocation_api_client
    r = c.post("/api/budget-allocation/plans", json={"period_month": "2026-05-01"})
    plan_id = r.json()["id"]
    assert c.get(f"/api/budget-allocation/plans/{plan_id}/cash-flow-graph").status_code == 200

    r = c.post(
        f"/api/budget-allocation/plans/{plan_id}/items",
        json={
            "item_name": "Bad endpoint",
            "category": "Other",
            "planned_amount": "10",
            "cadence": "monthly",
            "allocation_role": "sink",
            "from_account_ref": "missing",
            "payment_method": "cash",
        },
    )
    assert r.status_code == 400
    assert "missing" in r.json()["detail"]


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
def test_allocation_list_all_plans_without_month(allocation_api_client: TestClient) -> None:
    c = allocation_api_client
    c.post("/api/budget-allocation/plans", json={"period_month": "2026-09-15"})
    c.post("/api/budget-allocation/plans", json={"period_month": "2026-10-01"})
    r = c.get("/api/budget-allocation/plans")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 2
    months = {it["period_month"] for it in items}
    assert "2026-09-01" in months
    assert "2026-10-01" in months


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
    assert items[0]["income_amount"] is None
    assert items[0]["income_monthly"] is None
    plan_id = items[0]["id"]
    r2 = c.get(f"/api/budget-allocation/plans/{plan_id}/items")
    assert r2.status_code == 200
    rows = {item["item_name"]: item for item in r2.json()["items"]}
    assert len(rows) == 5
    assert rows["Paycheck"]["allocation_role"] == "source"
    assert rows["Paycheck"]["to_account_ref"] == "checking"
    assert rows["Essential spending (bills & lifestyle)"]["from_account_ref"] == "checking"


@pytest.mark.unit
def test_allocation_auto_template_off_when_disabled(
    monkeypatch, allocation_api_client: TestClient
) -> None:
    monkeypatch.delenv("FINANCE_ALLOCATION_AUTO_TEMPLATE", raising=False)
    c = allocation_api_client
    r = c.get("/api/budget-allocation/plans", params={"month": "2033-04-10"})
    assert r.status_code == 200
    assert r.json()["items"] == []


@pytest.mark.unit
def test_budget_category_catalog_and_options_merge(allocation_api_client: TestClient) -> None:
    c = allocation_api_client
    r = c.get("/api/budget-allocation/category-options")
    assert r.status_code == 200
    assert r.json()["labels"] == []

    r = c.get("/api/budget-allocation/category-inventory")
    assert r.status_code == 200
    assert r.json()["items"] == []

    r = c.post("/api/budget-allocation/category-catalog", json={"label": "  Kids  "})
    assert r.status_code == 200
    body = r.json()
    assert body["label"] == "Kids"
    label_id = body["id"]

    r = c.get("/api/budget-allocation/category-inventory")
    kids_row = next(x for x in r.json()["items"] if x["label"] == "Kids")
    assert kids_row["allocation_item_count"] == 0
    assert kids_row["catalog_id"] == label_id

    r = c.post("/api/budget-allocation/category-catalog", json={"label": "Kids"})
    assert r.status_code == 409

    r = c.post("/api/budget-allocation/plans", json={"period_month": "2026-11-01"})
    plan_id = r.json()["id"]
    c.post(
        f"/api/budget-allocation/plans/{plan_id}/items",
        json={
            "item_name": "Rent",
            "category": "Living",
            "planned_amount": "100",
            "cadence": "monthly",
            "payment_method": "cash",
        },
    )

    r = c.get("/api/budget-allocation/category-options")
    assert r.status_code == 200
    labels = r.json()["labels"]
    assert "Kids" in labels
    assert "Living" in labels

    inv = c.get("/api/budget-allocation/category-inventory").json()["items"]
    living_row = next(x for x in inv if x["label"] == "Living")
    assert living_row["allocation_item_count"] == 1
    assert living_row["catalog_id"] is not None
    r = c.delete(f"/api/budget-allocation/category-catalog/{living_row['catalog_id']}")
    assert r.status_code == 400

    r = c.post(
        "/api/budget-allocation/category-reassign",
        json={"from_label": "Living", "replacement_label": "Housing"},
    )
    assert r.status_code == 200
    assert r.json()["items_updated"] == 1
    items = c.get(f"/api/budget-allocation/plans/{plan_id}/items").json()["items"]
    assert items[0]["category"] == "Housing"

    r = c.delete(f"/api/budget-allocation/category-catalog/{label_id}")
    assert r.status_code == 200
    r = c.delete("/api/budget-allocation/category-catalog/99999")
    assert r.status_code == 404

    r = c.get("/api/budget-allocation/category-options")
    assert "Kids" not in r.json()["labels"]
    assert "Living" not in r.json()["labels"]
    assert "Housing" in r.json()["labels"]


@pytest.mark.unit
def test_budget_category_inventory_lists_linked_lines(allocation_api_client: TestClient) -> None:
    c = allocation_api_client
    r = c.post("/api/budget-allocation/plans", json={"period_month": "2026-11-01"})
    november_plan = r.json()
    r = c.post("/api/budget-allocation/plans", json={"period_month": "2026-12-01"})
    december_plan = r.json()

    r = c.post(
        f"/api/budget-allocation/plans/{november_plan['id']}/items",
        json={
            "item_name": "Rent",
            "category": "Living",
            "planned_amount": "2100",
            "cadence": "monthly",
            "payment_method": "cash",
        },
    )
    rent = r.json()
    c.post(
        f"/api/budget-allocation/plans/{december_plan['id']}/items",
        json={
            "item_name": "Utilities",
            "category": "Living",
            "planned_amount": "240",
            "cadence": "monthly",
            "payment_method": "credit",
        },
    )

    r = c.get("/api/budget-allocation/category-inventory/items", params={"label": "Living"})
    assert r.status_code == 200
    lines = r.json()["items"]
    assert [line["item_name"] for line in lines] == ["Utilities", "Rent"]
    assert lines[0]["plan_name"] == "December 2026"
    assert lines[0]["period_month"] == "2026-12-01"
    assert lines[0]["plan_id"] == december_plan["id"]
    assert lines[1]["planned_amount"] == pytest.approx(2100.0)

    r = c.put(
        f"/api/budget-allocation/plans/{november_plan['id']}/items/{rent['id']}",
        json={"category": "Housing"},
    )
    assert r.status_code == 200

    living_lines = c.get(
        "/api/budget-allocation/category-inventory/items", params={"label": "Living"}
    ).json()["items"]
    housing_lines = c.get(
        "/api/budget-allocation/category-inventory/items", params={"label": "Housing"}
    ).json()["items"]
    assert [line["item_name"] for line in living_lines] == ["Utilities"]
    assert [line["item_name"] for line in housing_lines] == ["Rent"]

    inv = c.get("/api/budget-allocation/category-inventory").json()["items"]
    assert next(x for x in inv if x["label"] == "Living")["allocation_item_count"] == 1
    assert next(x for x in inv if x["label"] == "Housing")["allocation_item_count"] == 1
