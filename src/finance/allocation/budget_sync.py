"""Project allocation item totals into monthly :class:`~finance.db.models.Budget` rows.

Allocation-managed budgets **replace** any prior row for the same ``(category, period_month)``
when allocation produces a total for that category (design: allocation owns the category/month
for Budget-page-driven plans). Manual budgets for categories that never appear in allocation
totals are left unchanged.

See Also: tasks/feature-history/FR-0002-budget-entry-page/10-design-01-allocation-model.md
"""

from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from finance.allocation.cadence import normalize_period_month
from finance.db.models import AllocationItem, AllocationPlan, Budget


def aggregate_allocation_totals_by_category(
    session: Session, period_month: date
) -> dict[str, Decimal]:
    """Sum ``monthly_amount`` by category for all allocation plans in ``period_month``."""

    pm = normalize_period_month(period_month)
    stmt = (
        select(AllocationItem.category, func.sum(AllocationItem.monthly_amount))
        .join(AllocationPlan, AllocationItem.plan_id == AllocationPlan.id)
        .where(AllocationPlan.period_month == pm)
        .group_by(AllocationItem.category)
    )
    out: dict[str, Decimal] = {}
    for category, total in session.execute(stmt).all():
        if total is None:
            continue
        amt = Decimal(total).quantize(Decimal("0.01"))
        if amt > 0:
            out[category] = amt
    return out


def sync_allocation_to_budgets(session: Session, period_month: date) -> None:
    """Upsert or remove allocation-derived category budgets for a single calendar month."""

    pm = normalize_period_month(period_month)
    totals = aggregate_allocation_totals_by_category(session, pm)

    managed = session.scalars(
        select(Budget).where(
            Budget.period_month == pm,
            Budget.allocation_derived.is_(True),
        )
    ).all()
    for row in managed:
        if row.category not in totals:
            session.delete(row)

    for category, amount_limit in totals.items():
        existing = session.scalar(
            select(Budget).where(Budget.period_month == pm, Budget.category == category)
        )
        if existing is None:
            session.add(
                Budget(
                    category=category,
                    period_month=pm,
                    amount_limit=amount_limit,
                    currency="USD",
                    allocation_derived=True,
                )
            )
        else:
            existing.amount_limit = amount_limit
            existing.allocation_derived = True

    session.flush()
