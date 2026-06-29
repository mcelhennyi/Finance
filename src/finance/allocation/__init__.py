"""Budget allocation domain contracts (plans, items, cadence, summaries).

See Also: tasks/feature-history/FR-0002-budget-entry-page/10-design-01-allocation-model.md
"""

from finance.allocation.cadence import (
    monthly_equivalent_for_allocation,
    monthly_equivalent_for_plan_income,
    normalize_period_month,
)
from finance.allocation.enums import (
    AllocationCadence,
    AllocationRole,
    PaymentMethod,
    PlanIncomeCadence,
)
from finance.allocation.item_sync import refresh_item_monthly_amount
from finance.allocation.schemas import (
    AllocationItemCreate,
    AllocationItemOut,
    AllocationItemUpdate,
    AllocationPlanCreate,
    AllocationPlanOut,
    AllocationPlanUpdate,
)
from finance.allocation.summary import (
    AllocationSummary,
    AllocationSummaryItemInput,
    build_allocation_summary,
    item_slice_from_orm,
)

__all__ = [
    "AllocationCadence",
    "AllocationItemCreate",
    "AllocationItemOut",
    "AllocationItemUpdate",
    "AllocationPlanCreate",
    "AllocationPlanOut",
    "AllocationPlanUpdate",
    "AllocationRole",
    "AllocationSummary",
    "AllocationSummaryItemInput",
    "PaymentMethod",
    "PlanIncomeCadence",
    "build_allocation_summary",
    "item_slice_from_orm",
    "monthly_equivalent_for_allocation",
    "monthly_equivalent_for_plan_income",
    "normalize_period_month",
    "refresh_item_monthly_amount",
]
