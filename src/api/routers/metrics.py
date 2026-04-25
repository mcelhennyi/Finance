"""Metrics and aggregation endpoints.

See Also: docs/design/services/analysis-service/api.md
"""

from datetime import date

from fastapi import APIRouter, Query

from api.schemas import MetricsResponse
from finance.analysis.service import (
    compute_metrics,
    get_merchant_display_overrides,
    get_transactions,
)
from finance.db.session import get_session

router = APIRouter(tags=["metrics"])


@router.get("/metrics", response_model=MetricsResponse)
def get_metrics(
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    category: str | None = Query(default=None),
    source: str | None = Query(default=None),
) -> MetricsResponse:
    with get_session() as session:
        txns = get_transactions(
            session=session,
            date_from=from_date,
            date_to=to_date,
            category=category,
            source_type=source,
            include_credits=True,
        )
        m = compute_metrics(txns, merchant_display_overrides=get_merchant_display_overrides(session))

    return MetricsResponse(
        total_spent=round(m.total_spent, 2),
        total_credits=round(m.total_credits, 2),
        net_spent=round(m.net_spent, 2),
        transaction_count=m.transaction_count,
        avg_per_transaction=round(m.avg_per_transaction, 2),
        by_category={k: round(v, 2) for k, v in m.by_category.items()},
        by_category_count=m.by_category_count,
        top_merchants=[[name, round(amt, 2)] for name, amt in m.top_merchants],
        daily_trend=[[d, round(a, 2)] for d, a in m.daily_trend],
        category_weekly_trend={
            cat: [[p, amt] for p, amt in series]
            for cat, series in m.category_weekly_trend.items()
        },
        category_monthly_trend={
            cat: [[p, amt] for p, amt in series]
            for cat, series in m.category_monthly_trend.items()
        },
    )
