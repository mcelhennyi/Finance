"""Analysis service — queries, aggregations, and metrics.

See Also: docs/design/services/analysis-service/overview.md
"""

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from finance.db.models import MerchantDisplayOverride, Transaction
from finance.matching import merchant_fingerprint_sql_expr, merchant_name_fingerprint
from finance.merchant_display import effective_display_name


@dataclass
class SpendMetrics:
    total_spent: float = 0.0
    total_credits: float = 0.0
    net_spent: float = 0.0
    transaction_count: int = 0
    avg_per_transaction: float = 0.0
    by_category: dict[str, float] = field(default_factory=dict)
    by_category_count: dict[str, int] = field(default_factory=dict)
    top_merchants: list[tuple[str, float]] = field(default_factory=list)
    daily_trend: list[tuple[str, float]] = field(default_factory=list)
    category_weekly_trend: dict[str, list[tuple[str, float]]] = field(default_factory=dict)
    category_monthly_trend: dict[str, list[tuple[str, float]]] = field(default_factory=dict)
    all_transactions: list[dict] = field(default_factory=list)


def get_transactions(
    session: Session,
    date_from: date | None = None,
    date_to: date | None = None,
    category: str | None = None,
    merchant: str | None = None,
    source_type: str | None = None,
    include_credits: bool = True,
    limit: int | None = None,
) -> list[Transaction]:
    """Query transactions with optional filters.

    See Also: docs/design/services/analysis-service/api.md
    """
    q = session.query(Transaction)

    if date_from:
        q = q.filter(Transaction.transaction_date >= date_from)
    if date_to:
        q = q.filter(Transaction.transaction_date <= date_to)
    if category:
        q = q.filter(Transaction.category.ilike(f"%{category}%"))
    if merchant:
        needle = merchant_name_fingerprint(merchant)
        if len(needle) >= 3:
            fp_n = merchant_fingerprint_sql_expr(Transaction.description_normalized)
            fp_r = merchant_fingerprint_sql_expr(Transaction.description_raw)
            q = q.filter(or_(fp_n.like(f"%{needle}%"), fp_r.like(f"%{needle}%")))
        else:
            q = q.filter(Transaction.description_normalized.ilike(f"%{merchant}%"))
    if source_type:
        q = q.filter(Transaction.source_type == source_type)
    if not include_credits:
        q = q.filter(Transaction.amount > 0)

    q = q.order_by(Transaction.transaction_date.desc())

    if limit:
        q = q.limit(limit)

    return q.all()


def get_merchant_display_overrides(session: Session) -> dict[str, str]:
    """Return merchant_key -> display_name overrides."""
    rows = session.query(MerchantDisplayOverride).all()
    return {r.merchant_key: r.display_name for r in rows}


def compute_metrics(
    transactions: list[Transaction],
    merchant_display_overrides: dict[str, str] | None = None,
) -> SpendMetrics:
    """Compute spending metrics from a list of transactions.

    See Also: docs/design/services/analysis-service/overview.md
    """
    charges = [t for t in transactions if float(t.amount) > 0]
    credits = [t for t in transactions if float(t.amount) < 0]

    total_spent = sum(float(t.amount) for t in charges)
    total_credits = abs(sum(float(t.amount) for t in credits))
    net_spent = total_spent - total_credits

    by_category: dict[str, float] = defaultdict(float)
    by_category_count: dict[str, int] = defaultdict(int)
    for t in charges:
        by_category[t.category] += float(t.amount)
        by_category_count[t.category] += 1

    by_merchant: dict[str, float] = defaultdict(float)
    merchant_display_overrides = merchant_display_overrides or {}
    for t in charges:
        merchant_key = (t.merchant or "").strip()
        if not merchant_key:
            fallback = (t.description_normalized if t.description_normalized else t.description_raw).strip()
            merchant_key = fallback[:200]
        if not merchant_key:
            continue
        by_merchant[merchant_key] += float(t.amount)
    top_merchants = sorted(
        (
            (effective_display_name(merchant_key, merchant_display_overrides.get(merchant_key)), amount)
            for merchant_key, amount in by_merchant.items()
        ),
        key=lambda x: x[1],
        reverse=True,
    )[:10]

    by_date: dict[str, float] = defaultdict(float)
    weekly_by_cat: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    monthly_by_cat: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for t in charges:
        d = t.transaction_date
        key = d.isoformat()
        by_date[key] += float(t.amount)
        y, w, _ = d.isocalendar()
        wk = f"{y}-W{w:02d}"
        mo = f"{d.year}-{d.month:02d}"
        weekly_by_cat[t.category][wk] += float(t.amount)
        monthly_by_cat[t.category][mo] += float(t.amount)
    daily_trend = sorted(by_date.items())

    category_weekly_trend = {
        cat: sorted(((p, round(amt, 2)) for p, amt in buckets.items()), key=lambda x: x[0])
        for cat, buckets in weekly_by_cat.items()
    }
    category_monthly_trend = {
        cat: sorted(((p, round(amt, 2)) for p, amt in buckets.items()), key=lambda x: x[0])
        for cat, buckets in monthly_by_cat.items()
    }

    avg = total_spent / len(charges) if charges else 0.0

    return SpendMetrics(
        total_spent=total_spent,
        total_credits=total_credits,
        net_spent=net_spent,
        transaction_count=len(charges),
        avg_per_transaction=avg,
        by_category=dict(sorted(by_category.items(), key=lambda x: x[1], reverse=True)),
        by_category_count=dict(by_category_count),
        top_merchants=top_merchants,
        daily_trend=daily_trend,
        category_weekly_trend=category_weekly_trend,
        category_monthly_trend=category_monthly_trend,
        all_transactions=[t.to_dict() for t in transactions],
    )


def get_source_types(session: Session) -> list[str]:
    """Return distinct source types (banks) present in the database."""
    results = session.query(Transaction.source_type).distinct().all()
    return sorted([r[0] for r in results if r[0]])


def get_categories(session: Session) -> list[str]:
    """Return all distinct categories present in the database."""
    results = session.query(Transaction.category).distinct().all()
    return sorted([r[0] for r in results if r[0]])


def get_date_range(session: Session) -> tuple[date | None, date | None]:
    """Return the min and max transaction dates in the database."""
    result = session.query(
        func.min(Transaction.transaction_date),
        func.max(Transaction.transaction_date),
    ).first()
    if result:
        return result[0], result[1]
    return None, None
