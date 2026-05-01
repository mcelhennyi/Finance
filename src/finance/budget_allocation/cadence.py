"""Cadence normalization for manual budget allocation amounts.

See Also: tasks/feature-history/FR-0002-budget-entry-page/10-design-01-allocation-model.md
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from enum import StrEnum

_QUANT = Decimal("0.01")


class AllocationCadence(StrEnum):
    """Cadence for a planned allocation line item."""

    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    TWICE_MONTHLY = "twice_monthly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class IncomeAssumptionCadence(StrEnum):
    """Cadence for optional monthly planning income on an allocation plan."""

    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    TWICE_MONTHLY = "twice_monthly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class PaymentMethod(StrEnum):
    """How an allocation line is expected to be funded."""

    CASH = "cash"
    CREDIT = "credit"


def monthly_equivalent(planned_amount: Decimal, cadence: AllocationCadence | str) -> Decimal:
    """Convert a planned amount at the given cadence to a monthly equivalent.

    Uses the deterministic factors from the allocation model design (not calendar-accrual).

    Args:
        planned_amount: Non-negative amount in plan currency at ``cadence``.
        cadence: Item cadence.

    Returns:
        Monthly equivalent rounded to two decimal places (half-up).
    """
    if isinstance(cadence, str):
        cadence = AllocationCadence(cadence)
    if planned_amount < 0:
        raise ValueError("planned_amount must be non-negative")

    if cadence is AllocationCadence.WEEKLY:
        raw = planned_amount * Decimal("4")
    elif cadence in (AllocationCadence.BIWEEKLY, AllocationCadence.TWICE_MONTHLY):
        raw = planned_amount * Decimal("2")
    elif cadence is AllocationCadence.MONTHLY:
        raw = planned_amount
    elif cadence is AllocationCadence.QUARTERLY:
        raw = planned_amount / Decimal("3")
    elif cadence is AllocationCadence.YEARLY:
        raw = planned_amount / Decimal("12")
    else:
        raise ValueError(f"Unsupported cadence: {cadence!r}")

    return raw.quantize(_QUANT, rounding=ROUND_HALF_UP)


def income_monthly_equivalent(amount: Decimal, cadence: IncomeAssumptionCadence | str) -> Decimal:
    """Monthly equivalent for plan-level income assumptions (no quarterly)."""
    if isinstance(cadence, str):
        cadence = IncomeAssumptionCadence(cadence)
    allocation_cadence = AllocationCadence(cadence.value)
    return monthly_equivalent(amount, allocation_cadence)


def float_monthly_equivalent_planned(planned_amount: float, cadence: AllocationCadence) -> float:
    """Float wrapper for API-layer amounts; preserves two-decimal rounding."""
    return float(monthly_equivalent(Decimal(str(planned_amount)), cadence))


def float_monthly_equivalent_income(
    planned_amount: float, cadence: IncomeAssumptionCadence
) -> float:
    """Float wrapper for plan income assumption."""
    return float(income_monthly_equivalent(Decimal(str(planned_amount)), cadence))
