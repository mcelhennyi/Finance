"""Filter option and source endpoints."""

from fastapi import APIRouter

from api.schemas import FiltersResponse, SourceOption
from finance.analysis.service import get_categories, get_date_range, get_source_types
from finance.db.session import get_session
from finance.ingestion.parsers import ALL_PARSERS

router = APIRouter(tags=["filters"])


@router.get("/filters", response_model=FiltersResponse)
def get_filters() -> FiltersResponse:
    with get_session() as session:
        categories = get_categories(session)
        sources = get_source_types(session)
        date_min, date_max = get_date_range(session)

    return FiltersResponse(
        categories=categories,
        sources=sources,
        date_min=date_min.isoformat() if date_min else None,
        date_max=date_max.isoformat() if date_max else None,
    )


@router.get("/sources", response_model=list[SourceOption])
def list_sources() -> list[SourceOption]:
    options = [
        SourceOption(key=p.source_key, name=p.source_name)
        for p in ALL_PARSERS
        if p.source_key != "generic"
    ]
    options.append(SourceOption(key="auto", name="Auto-detect"))
    return options
