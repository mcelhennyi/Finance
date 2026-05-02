"""BBD projection API — wraps `finance.bbd.engine`."""

from __future__ import annotations

from fastapi import APIRouter

from api.bbd_projection_schemas import (
    BbdRunRequest,
    BbdRunResponse,
    run_bbd_from_request,
)

router = APIRouter(tags=["bbd-projection"])


@router.post("/bbd-projection/run", response_model=BbdRunResponse)
def bbd_projection_run(body: BbdRunRequest) -> BbdRunResponse:
    """Run deterministic projection; optional Monte Carlo summary (capped trials).

    Stateless: scenario is not persisted.
    """
    return run_bbd_from_request(body)
