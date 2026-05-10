"""Keep persisted allocation items aligned with cadence normalization."""

from finance.allocation.cadence import monthly_equivalent_for_allocation
from finance.allocation.enums import AllocationCadence
from finance.db.models import AllocationItem


def refresh_item_monthly_amount(item: AllocationItem) -> None:
    """Set ``item.monthly_amount`` from ``planned_amount`` and ``cadence``."""

    cadence = AllocationCadence(item.cadence)
    item.monthly_amount = monthly_equivalent_for_allocation(item.planned_amount, cadence)
