"""Derived allocation summary totals (server-side aggregation).

See Also: tasks/feature-history/FR-0002-budget-entry-page/10-design-01-allocation-model.md
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable

from finance.allocation.cadence import monthly_equivalent_for_plan_income
from finance.allocation.enums import PaymentMethod, PlanIncomeCadence


@dataclass(frozen=True)
class AllocationSummary:
    """Aggregates returned by the budget allocation summary contract."""

    total_monthly_allocated: Decimal
    cash_allocated: Decimal
    credit_allocated: Decimal
    remaining_income: Decimal | None
    category_totals: dict[str, Decimal]
    cadence_totals: dict[str, Decimal]


@dataclass(frozen=True)
class AllocationSummaryItemInput:
    """Minimal item shape for summary math (ORM rows or API test doubles)."""

    category: str
    cadence: str
    monthly_amount: Decimal
    payment_method: str
    due_day: int | None


def build_allocation_summary(
    items: Iterable[AllocationSummaryItemInput],
    *,
    income_amount: Decimal | None,
    income_cadence: PlanIncomeCadence | None,
) -> AllocationSummary:
    """Compute summary totals from normalized item monthly amounts."""

    category_totals: dict[str, Decimal] = {}
    cadence_totals: dict[str, Decimal] = {}
    total = Decimal("0.00")
    cash = Decimal("0.00")
    credit = Decimal("0.00")

    for row in items:
        m = row.monthly_amount
        total += m
        cat = row.category
        category_totals[cat] = category_totals.get(cat, Decimal("0.00")) + m

        cad_key = row.cadence
        cadence_totals[cad_key] = cadence_totals.get(cad_key, Decimal("0.00")) + m

        if row.payment_method == PaymentMethod.CASH.value:
            cash += m
        elif row.payment_method == PaymentMethod.CREDIT.value:
            credit += m

    income_monthly: Decimal | None = None
    if income_amount is not None and income_cadence is not None:
        income_monthly = monthly_equivalent_for_plan_income(income_amount, income_cadence)

    remaining: Decimal | None = None
    if income_monthly is not None:
        remaining = (income_monthly - total).quantize(Decimal("0.01"))

    return AllocationSummary(
        total_monthly_allocated=total.quantize(Decimal("0.01")),
        cash_allocated=cash.quantize(Decimal("0.01")),
        credit_allocated=credit.quantize(Decimal("0.01")),
        remaining_income=remaining,
        category_totals={
            k: v.quantize(Decimal("0.01")) for k, v in sorted(category_totals.items())
        },
        cadence_totals={k: v.quantize(Decimal("0.01")) for k, v in sorted(cadence_totals.items())},
    )


def item_slice_from_orm(item: object) -> AllocationSummaryItemInput:
    """Adapt an :class:`~finance.db.models.AllocationItem` ORM row for summary math."""

    return AllocationSummaryItemInput(
        category=item.category,
        cadence=item.cadence,
        monthly_amount=item.monthly_amount,
        payment_method=item.payment_method,
        due_day=item.due_day,
    )
