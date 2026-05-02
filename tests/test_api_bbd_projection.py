"""API tests — BBD projection endpoint."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api.bbd_projection_schemas import MAX_MONTE_CARLO_TRIALS
from api.main import app


@pytest.fixture
def api_client() -> TestClient:
    return TestClient(app)


@pytest.mark.unit
def test_bbd_projection_run_minimal_defaults(api_client: TestClient) -> None:
    res = api_client.post("/api/bbd-projection/run", json={"scenario": {}})
    assert res.status_code == 200
    data = res.json()
    assert "schedule" in data
    assert len(data["schedule"]) > 0
    assert "estate_sell_path" in data and "estate_bbd_path" in data
    assert "bbd_net_advantage_vs_sell_path" in data
    assert data["monte_carlo"] is None


@pytest.mark.unit
def test_bbd_projection_monte_carlo_respects_cap(api_client: TestClient) -> None:
    res = api_client.post(
        "/api/bbd-projection/run",
        json={"scenario": {"timing": {"horizon_years": 15}}, "monte_carlo_trials": MAX_MONTE_CARLO_TRIALS + 1},
    )
    assert res.status_code == 422


@pytest.mark.unit
def test_bbd_projection_optional_monte_carlo(api_client: TestClient) -> None:
    body = {"scenario": {"timing": {"horizon_years": 10}}, "monte_carlo_trials": 20, "monte_carlo_seed": 99}
    res = api_client.post("/api/bbd-projection/run", json=body)
    assert res.status_code == 200
    mc = res.json().get("monte_carlo")
    assert mc is not None
    assert mc["n_trials"] == 20
