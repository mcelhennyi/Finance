"""BBD projection API — wraps `finance.bbd.engine`."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.bbd_projection_schemas import (
    BbdDefaultScenarioResponse,
    BbdRunRequest,
    BbdRunResponse,
    run_bbd_from_request,
    scenario_engine_to_bbdscenario_in,
)
from finance.bbd.engine import load_engine_default_seed_scenario

router = APIRouter(tags=["bbd-projection"])


@router.get("/bbd-projection/default-scenario", response_model=BbdDefaultScenarioResponse)
def bbd_default_scenario() -> BbdDefaultScenarioResponse:
    """Return the seeded default scenario for SPA hydration (`FINANCE_BBD_DEFAULT_YAML`, default `/seed/ian.yaml`).

    Falls back to a sibling `.toml` when YAML is absent. Shape matches POST `/bbd-projection/run` `scenario`.
    """
    try:
        loaded = load_engine_default_seed_scenario()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return BbdDefaultScenarioResponse(scenario=scenario_engine_to_bbdscenario_in(loaded))


@router.post("/bbd-projection/run", response_model=BbdRunResponse)
def bbd_projection_run(body: BbdRunRequest) -> BbdRunResponse:
    """Run deterministic projection; optional Monte Carlo summary (capped trials).

    Stateless: scenario is not persisted.
    """
    return run_bbd_from_request(body)
