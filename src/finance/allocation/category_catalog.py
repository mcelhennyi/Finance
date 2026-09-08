"""Budget category picker: merge transaction categories, allocation lines, and saved labels.

See Also: tasks/feature-history/FR-0002-budget-entry-page/10-design-01-allocation-model.md
"""

from __future__ import annotations

from collections.abc import Iterable

from datetime import date

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from finance.allocation.budget_sync import sync_allocation_to_budgets
from finance.analysis.service import get_categories
from finance.db.models import AllocationItem, AllocationPlan, BudgetCategoryLabel


def _distinct_allocation_item_categories(session: Session) -> set[str]:
    rows = session.scalars(select(AllocationItem.category).distinct()).all()
    return {r.strip() for r in rows if r and str(r).strip()}


def merged_budget_category_labels(session: Session) -> list[str]:
    """Sorted unique labels for category inputs (transactions + plans + saved catalog)."""

    names: set[str] = set(get_categories(session))
    names |= _distinct_allocation_item_categories(session)
    rows = session.scalars(select(BudgetCategoryLabel.label)).all()
    names |= {r.strip() for r in rows if r and str(r).strip()}
    return sorted(names, key=lambda s: s.lower())


def allocation_item_counts_by_category(session: Session) -> dict[str, int]:
    """Count allocation line rows per exact ``AllocationItem.category`` string."""

    rows = session.execute(
        select(AllocationItem.category, func.count(AllocationItem.id)).group_by(AllocationItem.category)
    ).all()
    out: dict[str, int] = {}
    for cat, cnt in rows:
        if cat is None or not str(cat).strip():
            continue
        out[str(cat).strip()] = int(cnt)
    return out


def list_budget_category_inventory(session: Session) -> list[tuple[str, int, int | None]]:
    """Rows ``(label, allocation_item_count, catalog_id_or_none)`` sorted by label (case-insensitive)."""

    counts = allocation_item_counts_by_category(session)
    catalog_rows = list(session.scalars(select(BudgetCategoryLabel)).all())
    catalog_by_label: dict[str, int] = {r.label: r.id for r in catalog_rows}
    tx_cats = set(get_categories(session))
    all_labels = set(counts) | set(catalog_by_label) | tx_cats
    return [
        (lbl, counts.get(lbl, 0), catalog_by_label.get(lbl))
        for lbl in sorted(all_labels, key=lambda s: s.lower())
    ]


def list_allocation_items_for_category(
    session: Session, label: str
) -> list[tuple[AllocationItem, str, date]]:
    """Allocation lines using one exact category label, with plan context."""

    cleaned = label.strip()
    if not cleaned:
        return []
    rows = session.execute(
        select(AllocationItem, AllocationPlan.name, AllocationPlan.period_month)
        .join(AllocationPlan, AllocationPlan.id == AllocationItem.plan_id)
        .where(AllocationItem.category == cleaned)
        .order_by(
            AllocationPlan.period_month.desc(),
            AllocationPlan.id.desc(),
            AllocationItem.sort_order,
            AllocationItem.id,
        )
    ).all()
    return [(item, plan_name, period_month) for item, plan_name, period_month in rows]


def list_budget_category_catalog(session: Session) -> list[BudgetCategoryLabel]:
    """Saved catalog rows (ordered by label)."""

    return list(
        session.scalars(select(BudgetCategoryLabel).order_by(BudgetCategoryLabel.label)).all()
    )


def ensure_budget_category_labels_from_strings(session: Session, labels: Iterable[str]) -> int:
    """Insert catalog rows for trimmed labels not already present. Returns number of rows inserted."""

    inserted = 0
    for raw in labels:
        c = str(raw).strip()
        if not c:
            continue
        exists = session.scalars(
            select(BudgetCategoryLabel.id).where(BudgetCategoryLabel.label == c).limit(1)
        ).first()
        if exists is not None:
            continue
        session.add(BudgetCategoryLabel(label=c))
        inserted += 1
    if inserted:
        session.flush()
    return inserted


def create_budget_category_label(session: Session, label: str) -> BudgetCategoryLabel:
    """Insert a trimmed catalog label; raises ``ValueError`` on empty or duplicate."""

    cleaned = label.strip()
    if not cleaned:
        raise ValueError("label must not be empty")
    dup = session.scalars(
        select(BudgetCategoryLabel.id).where(BudgetCategoryLabel.label == cleaned).limit(1)
    ).first()
    if dup is not None:
        raise ValueError(f"category label {cleaned!r} already exists")
    row = BudgetCategoryLabel(label=cleaned)
    session.add(row)
    session.flush()
    return row


def count_allocation_items_with_category(session: Session, label: str) -> int:
    c = label.strip()
    if not c:
        return 0
    n = session.scalar(
        select(func.count()).select_from(AllocationItem).where(AllocationItem.category == c)
    )
    return int(n or 0)


def delete_budget_category_label(session: Session, label_id: int) -> None:
    """Remove a catalog row when no allocation line uses that label."""

    row = session.get(BudgetCategoryLabel, label_id)
    if row is None:
        raise ValueError("category label not found")
    if count_allocation_items_with_category(session, row.label) > 0:
        raise ValueError(
            "cannot remove this saved category while allocation lines still use it; "
            "relink those lines to another category first"
        )
    session.delete(row)
    session.flush()


def reassign_allocation_category_and_drop_catalog(
    session: Session, *, from_label: str, replacement_label: str
) -> dict[str, int]:
    """Move all allocation lines off ``from_label`` to ``replacement``, then drop catalog row if any.

    Re-syncs derived budgets for each affected plan month.

    Returns:
        Mapping with ``items_updated`` count.

    Raises:
        ValueError: empty labels, same label, or no lines to move.
    """

    frm = from_label.strip()
    rep = replacement_label.strip()
    if not frm or not rep:
        raise ValueError("from_label and replacement_label must not be empty")
    if frm == rep:
        raise ValueError("replacement_label must differ from from_label")
    n_before = count_allocation_items_with_category(session, frm)
    if n_before == 0:
        raise ValueError("no allocation lines use this category; remove it from saved list with DELETE instead")

    plan_ids = list(
        session.scalars(select(AllocationItem.plan_id).where(AllocationItem.category == frm).distinct()).all()
    )
    session.execute(update(AllocationItem).where(AllocationItem.category == frm).values(category=rep))
    session.flush()

    seen_months: set = set()
    for pid in plan_ids:
        plan = session.get(AllocationPlan, pid)
        if plan is not None and plan.period_month not in seen_months:
            seen_months.add(plan.period_month)
            sync_allocation_to_budgets(session, plan.period_month)

    lbl = session.scalars(select(BudgetCategoryLabel).where(BudgetCategoryLabel.label == frm)).first()
    if lbl is not None:
        session.delete(lbl)
        session.flush()

    ensure_budget_category_labels_from_strings(session, [rep])
    return {"items_updated": n_before}
