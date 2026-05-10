"""Enumerations for budget allocation contracts."""

from enum import StrEnum


class AllocationCadence(StrEnum):
    """Cadence for a planned allocation item amount."""

    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    TWICE_MONTHLY = "twice_monthly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class PlanIncomeCadence(StrEnum):
    """Cadence for optional income assumption on an allocation plan."""

    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    TWICE_MONTHLY = "twice_monthly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class PaymentMethod(StrEnum):
    """How an allocation item is expected to be funded."""

    CASH = "cash"
    CREDIT = "credit"
