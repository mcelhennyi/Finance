"""Seeded default allocation plan (optional) when a month has no plans yet.

The template encodes a generic *payroll → spending / savings buckets* story using
allocation lines only; interactive cash-flow graph and BBD linkage are future work.

See Also: docs/design/budget-plans-roadmap.md
"""

import os
from datetime import date
from decimal import Decimal

from finance.allocation.enums import AllocationCadence, PaymentMethod, PlanIncomeCadence
from finance.allocation.schemas import AllocationItemCreate, AllocationPlanCreate

# Human-readable; operators rename after load.
STARTER_PLAN_NAME = "Starter cash-flow template"


def allocation_auto_template_enabled() -> bool:
    """True when empty month view should create the starter plan (opt-in via env)."""

    return os.environ.get("FINANCE_ALLOCATION_AUTO_TEMPLATE", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )


def starter_plan_create(period_month: date) -> AllocationPlanCreate:
    """Illustrative plan: monthly income and category lines users replace with real data."""

    return AllocationPlanCreate(
        name=STARTER_PLAN_NAME,
        period_month=period_month,
        currency="USD",
        income_amount=Decimal("8000.00"),
        income_cadence=PlanIncomeCadence.MONTHLY,
    )


def starter_plan_items() -> list[AllocationItemCreate]:
    """Template lines: essential spend, channel to long- and short-term savings, credit cycle."""

    return [
        AllocationItemCreate(
            item_name="Essential spending (bills & lifestyle)",
            category="Essential",
            planned_amount=Decimal("3200.00"),
            cadence=AllocationCadence.MONTHLY,
            payment_method=PaymentMethod.CASH,
            notes="Template — amounts reflect a generic payroll→checking→spends split.",
            sort_order=0,
        ),
        AllocationItemCreate(
            item_name="Long-term savings allocation",
            category="Savings",
            planned_amount=Decimal("1500.00"),
            cadence=AllocationCadence.MONTHLY,
            payment_method=PaymentMethod.CASH,
            notes="Template — adjust or replace when you map transfers from checking.",
            sort_order=1,
        ),
        AllocationItemCreate(
            item_name="Short-term savings / emergency buffer",
            category="Savings",
            planned_amount=Decimal("500.00"),
            cadence=AllocationCadence.MONTHLY,
            payment_method=PaymentMethod.CASH,
            notes="Template row.",
            sort_order=2,
        ),
        AllocationItemCreate(
            item_name="Credit card / revolving cycle",
            category="Credit",
            planned_amount=Decimal("800.00"),
            cadence=AllocationCadence.MONTHLY,
            payment_method=PaymentMethod.CREDIT,
            notes="Template — models monthly carry paid from checking.",
            sort_order=3,
        ),
    ]
