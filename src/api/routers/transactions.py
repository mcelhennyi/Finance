"""Transaction query endpoints.

See Also: docs/design/services/analysis-service/api.md
"""

from datetime import date

from fastapi import APIRouter, Query

from api.schemas import TransactionOut
from finance.analysis.service import get_transactions
from finance.db.session import get_session

router = APIRouter(tags=["transactions"])


@router.get("/transactions", response_model=list[TransactionOut])
def list_transactions(
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    category: str | None = Query(default=None),
    merchant: str | None = Query(default=None),
    source: str | None = Query(default=None),
    include_credits: bool = Query(default=True),
    limit: int = Query(default=500, le=5000),
) -> list[TransactionOut]:
    with get_session() as session:
        txns = get_transactions(
            session=session,
            date_from=from_date,
            date_to=to_date,
            category=category,
            merchant=merchant,
            source_type=source,
            include_credits=include_credits,
            limit=limit,
        )
        return [
            TransactionOut(
                id=t.id,
                date=t.transaction_date.isoformat(),
                description=t.description_normalized or t.description_raw,
                amount=float(t.amount),
                category=t.category,
                merchant=t.merchant,
                is_credit=t.is_credit,
                source_type=t.source_type,
            )
            for t in txns
        ]
