"""Enumerations for budget cash-flow graph contracts.

See Also:
    docs/design/budget-cash-flow-graph.md
    tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md
"""

from enum import StrEnum


class CashNodeKind(StrEnum):
    """Role of a node in the cash-flow graph."""

    CHECKING = "checking"
    SAVINGS = "savings"
    BROKERAGE_CASH = "brokerage_cash"
    EXTERNAL_POOLED = "external_pooled"
    INCOME_SOURCE = "income_source"
    LIABILITY_SURROGATE = "liability_surrogate"
    OTHER = "other"


class CashFlowAmountRule(StrEnum):
    """How an edge amount is interpreted."""

    FIXED = "fixed"
    PERCENT_OF_INFLOW = "percent_of_inflow"
    REMAINDER = "remainder"


class CashFlowCadence(StrEnum):
    """Recurrence pattern for a cash-flow edge."""

    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ON_DATE = "on_date"
