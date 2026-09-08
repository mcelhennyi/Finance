"""Pydantic contracts for budget allocation plans and items.

See Also: tasks/feature-history/FR-0002-budget-entry-page/10-design-01-allocation-model.md
"""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, computed_field, field_validator, model_validator

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


def default_plan_name(period_month: date) -> str:
    """Human label derived from the planning month (e.g. ``April 2026``)."""

    return normalize_period_month(period_month).strftime("%B %Y")


class AllocationPlanCreate(BaseModel):
    """Payload for creating an allocation plan."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    period_month: date
    currency: str = Field(default="USD", min_length=3, max_length=3)
    income_amount: Decimal | None = None
    income_cadence: PlanIncomeCadence | None = None

    @model_validator(mode="after")
    def income_fields_paired(self) -> "AllocationPlanCreate":
        has_amount = self.income_amount is not None
        has_cadence = self.income_cadence is not None
        if has_amount != has_cadence:
            raise ValueError("income_amount and income_cadence must both be set or both omitted")
        if has_amount and self.income_amount is not None and self.income_amount <= 0:
            raise ValueError("income_amount must be positive when provided")
        return self

    @field_validator("period_month")
    @classmethod
    def normalize_month(cls, value: date) -> date:
        return normalize_period_month(value)


class AllocationPlanUpdate(BaseModel):
    """Patch-style update for an allocation plan."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    income_amount: Decimal | None = None
    income_cadence: PlanIncomeCadence | None = None

    @model_validator(mode="after")
    def income_fields_paired(self) -> "AllocationPlanUpdate":
        if self.income_amount is None and self.income_cadence is None:
            return self
        has_amount = self.income_amount is not None
        has_cadence = self.income_cadence is not None
        if has_amount != has_cadence:
            raise ValueError("income_amount and income_cadence must both be set or both omitted")
        if has_amount and self.income_amount is not None and self.income_amount <= 0:
            raise ValueError("income_amount must be positive when provided")
        return self


class AllocationPlanOut(BaseModel):
    """Serialized allocation plan including optional income assumption."""

    id: int
    name: str
    period_month: date
    currency: str
    income_amount: float | None
    income_cadence: PlanIncomeCadence | None
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def income_monthly(self) -> float | None:
        if self.income_amount is None or self.income_cadence is None:
            return None
        monthly = monthly_equivalent_for_plan_income(
            Decimal(str(self.income_amount)), self.income_cadence
        )
        return float(monthly)


class AllocationItemCreate(BaseModel):
    """Payload for creating an allocation item; monthly amount is server-derived."""

    item_name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    planned_amount: Decimal = Field(gt=0)
    cadence: AllocationCadence
    allocation_role: AllocationRole = AllocationRole.SINK
    from_account_ref: str | None = Field(default=None, min_length=1, max_length=64)
    to_account_ref: str | None = Field(default=None, min_length=1, max_length=64)
    counterparty: str | None = Field(default=None, min_length=1, max_length=200)
    payment_method: PaymentMethod
    due_day: int | None = Field(default=None, ge=1, le=31)
    notes: str = Field(default="", max_length=2000)
    sort_order: int = Field(default=0, ge=0)

    def computed_monthly_amount(self) -> Decimal:
        """Monthly equivalent for persistence and summaries."""

        return monthly_equivalent_for_allocation(self.planned_amount, self.cadence)


class AllocationItemUpdate(BaseModel):
    """Patch-style update; omitted fields retain existing values at the service layer."""

    item_name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    planned_amount: Decimal | None = Field(default=None, gt=0)
    cadence: AllocationCadence | None = None
    allocation_role: AllocationRole | None = None
    from_account_ref: str | None = Field(default=None, min_length=1, max_length=64)
    to_account_ref: str | None = Field(default=None, min_length=1, max_length=64)
    counterparty: str | None = Field(default=None, min_length=1, max_length=200)
    payment_method: PaymentMethod | None = None
    due_day: int | None = None
    notes: str | None = Field(default=None, max_length=2000)
    sort_order: int | None = Field(default=None, ge=0)

    @field_validator("due_day")
    @classmethod
    def due_day_range(cls, value: int | None) -> int | None:
        if value is None:
            return value
        if not 1 <= value <= 31:
            raise ValueError("due_day must be between 1 and 31")
        return value


class AllocationItemOut(BaseModel):
    """Serialized allocation item including derived monthly amount."""

    id: int
    plan_id: int
    item_name: str
    category: str
    planned_amount: float
    cadence: AllocationCadence
    monthly_amount: float
    allocation_role: AllocationRole = AllocationRole.SINK
    from_account_ref: str | None = None
    to_account_ref: str | None = None
    counterparty: str | None = None
    payment_method: PaymentMethod
    due_day: int | None
    notes: str
    sort_order: int
