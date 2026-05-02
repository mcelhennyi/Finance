"""API tests — BBD projection endpoint."""

from __future__ import annotations

import shutil
from pathlib import Path
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
    first = data["schedule"][0]
    assert first["taxes_delta_yoy"] is None and first["gross_income_delta_yoy"] is None
    assert "gross_cash_income" in first and first["gross_cash_income"] == pytest.approx(
        first["w2_income"]
        + first["rental_net_cash_flow"]
        + first["portfolio_dividends"]
        + first["drawdown_borrowed"],
    )
    second = data["schedule"][1]
    assert second["taxes_delta_yoy"] == pytest.approx(second["taxes_paid"] - first["taxes_paid"])
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


@pytest.mark.unit
def test_bbd_default_scenario_yaml(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    repo = Path(__file__).resolve().parents[1]
    yaml_path = repo / "data" / "seed-statements" / "ian.yaml"
    monkeypatch.setenv("FINANCE_BBD_DEFAULT_YAML", str(yaml_path))

    res = api_client.get("/api/bbd-projection/default-scenario")
    assert res.status_code == 200
    data = res.json()
    assert data["scenario"]["timing"]["horizon_years"] == 50
    assert data["scenario"]["strategy"]["drawdown_start_year_offset"] == 25
    assert len(data["scenario"]["properties"]) == 1
    assert len(data["scenario"]["private_equity"]) == 1


@pytest.mark.unit
def test_bbd_default_scenario_fallback_toml_when_yaml_missing(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """YAML path missing ⇒ load sibling `{stem}.toml` with the same basename."""
    repo = Path(__file__).resolve().parents[1]
    shutil.copy(repo / "data" / "seed-statements" / "ian.toml", tmp_path / "foo.toml")
    monkeypatch.setenv("FINANCE_BBD_DEFAULT_YAML", str(tmp_path / "foo.yaml"))

    assert not (tmp_path / "foo.yaml").is_file()

    res = api_client.get("/api/bbd-projection/default-scenario")
    assert res.status_code == 200
    assert res.json()["scenario"]["timing"]["horizon_years"] == 50


@pytest.mark.unit
def test_scenario_from_payload_maps_property_rows_without_name_error() -> None:
    """Regression: `scenario_from_payload` referenced `Property` without importing it (HTTP 500)."""
    from api.bbd_projection_schemas import BbdPropertyIn, BbdScenarioIn, scenario_from_payload

    body = BbdScenarioIn(
        properties=[
            BbdPropertyIn(
                name="Regression Home",
                purchase_price=350_000.0,
                purchase_year=2020,
                current_value=400_000.0,
                mortgage_balance=200_000.0,
                mortgage_rate=0.03,
                mortgage_term_years=30,
                mortgage_origination_year=2020,
                monthly_piti=2100.0,
                monthly_market_rent=2200.0,
            ),
        ],
    )
    assert scenario_from_payload(body).properties[0].name == "Regression Home"
