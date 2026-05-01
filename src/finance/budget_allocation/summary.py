"""Derived totals for an allocation plan (read-side contract helpers).

See Also: tasks/feature-history/FR-0002-budget-entry-page/10-design-01-allocation-model.md
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

from finance.budget_allocation.cadence import PaymentMethod


def _r2(value: float) -> float:
    return round(float(value), 2)


@dataclass(frozen=True)
class AllocationItemSummaryInput:
    """Minimal inputs needed to aggregate allocation summary totals."""

    category: str
    cadence: str
    monthly_amount: float
    payment_method: str
    due_day: int | None


@dataclass(frozen=True)
class AllocationSummaryTotals:
    """Server-owned summary for a plan and its line items."""

    total_monthly_allocated: float
    cash_allocated: float
    credit_allocated: float
    remaining_income: float | None
    timing_sensitive_cash: float
    category_totals: dict[str, float]
    cadence_totals: dict[str, float]


def build_allocation_summary(
    items: Sequence[AllocationItemSummaryInput],
    *,
    monthly_income_assumption: float | None = None,
    due_day_cutoff: int = 17,
) -> AllocationSummaryTotals:
    """Compute derived totals from normalized monthly line amounts.

    Args:
        items: Line items with backend-derived ``monthly_amount``.
        monthly_income_assumption: Optional plan income already converted to monthly.
        due_day_cutoff: Cash lines with ``due_day`` strictly less than this count as
            timing-sensitive (design default 17).

    Returns:
        Rounded totals suitable for API responses.
    """
    total = 0.0
    cash = 0.0
    credit = 0.0
    timing_cash = 0.0
    by_category: dict[str, float] = {}
    by_cadence: dict[str, float] = {}

    for it in items:
        m = float(it.monthly_amount)
        total += m
        by_category[it.category] = by_category.get(it.category, 0.0) + m
        by_cadence[it.cadence] = by_cadence.get(it.cadence, 0.0) + m

        pm = PaymentMethod(it.payment_method)
        if pm is PaymentMethod.CASH:
            cash += m
            if it.due_day is not None and it.due_day < due_day_cutoff:
                timing_cash += m
        elif pm is PaymentMethod.CREDIT:
            credit += m

    remaining: float | None = None
    if monthly_income_assumption is not None:
        remaining = _r2(monthly_income_assumption - total)

    return AllocationSummaryTotals(
        total_monthly_allocated=_r2(total),
        cash_allocated=_r2(cash),
        credit_allocated=_r2(credit),
        remaining_income=remaining,
        timing_sensitive_cash=_r2(timing_cash),
        category_totals={k: _r2(v) for k, v in sorted(by_category.items())},
        cadence_totals={k: _r2(v) for k, v in sorted(by_cadence.items())},
    )
