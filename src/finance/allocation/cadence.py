"""Cadence normalization helpers for allocation plans and items.

See Also: tasks/feature-history/FR-0002-budget-entry-page/10-design-01-allocation-model.md
"""

from datetime import date
from decimal import Decimal

from finance.allocation.enums import AllocationCadence, PlanIncomeCadence


def normalize_period_month(d: date) -> date:
    """Return the first calendar day of the month for ``d``."""

    return date(d.year, d.month, 1)


def monthly_equivalent_for_allocation(amount: Decimal, cadence: AllocationCadence) -> Decimal:
    """Deterministic monthly equivalent for an allocation item cadence."""

    table: dict[AllocationCadence, Decimal] = {
        AllocationCadence.WEEKLY: Decimal("4"),
        AllocationCadence.BIWEEKLY: Decimal("2"),
        AllocationCadence.TWICE_MONTHLY: Decimal("2"),
        AllocationCadence.MONTHLY: Decimal("1"),
        AllocationCadence.QUARTERLY: Decimal("1") / Decimal("3"),
        AllocationCadence.YEARLY: Decimal("1") / Decimal("12"),
    }
    return (amount * table[cadence]).quantize(Decimal("0.01"))


def monthly_equivalent_for_plan_income(amount: Decimal, cadence: PlanIncomeCadence) -> Decimal:
    """Monthly equivalent for plan-level income assumptions (no quarterly)."""

    table: dict[PlanIncomeCadence, Decimal] = {
        PlanIncomeCadence.WEEKLY: Decimal("4"),
        PlanIncomeCadence.BIWEEKLY: Decimal("2"),
        PlanIncomeCadence.TWICE_MONTHLY: Decimal("2"),
        PlanIncomeCadence.MONTHLY: Decimal("1"),
        PlanIncomeCadence.YEARLY: Decimal("1") / Decimal("12"),
    }
    return (amount * table[cadence]).quantize(Decimal("0.01"))
