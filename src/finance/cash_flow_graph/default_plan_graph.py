"""Default cash-flow graph for newly seeded allocation plans.

Seeded plans attach a small graph so the Budget page map shows checking, savings,
income, and a Chase umbrella with one linked card node, with savings feeding checking.

See Also:
    docs/design/budget-cash-flow-graph.md
"""

from __future__ import annotations

from decimal import Decimal

from finance.cash_flow_graph.enums import CashFlowAmountRule, CashFlowCadence, CashNodeKind
from finance.cash_flow_graph.schemas import CashFlowEdgeSpec, CashFlowGraphDocument, CashFlowNodeSpec


def default_seeded_plan_cash_flow_graph(plan_id: int) -> CashFlowGraphDocument:
    """Return a validated graph document for ``plan_id`` (path id only; caller persists)."""

    return CashFlowGraphDocument(
        plan_id=plan_id,
        nodes=[
            CashFlowNodeSpec(
                ref="payroll",
                display_name="Income",
                kind=CashNodeKind.INCOME_SOURCE,
                institution=None,
                layout_x=220.0,
                layout_y=40.0,
            ),
            CashFlowNodeSpec(
                ref="checking",
                display_name="Checking",
                kind=CashNodeKind.CHECKING,
                institution=None,
                layout_x=220.0,
                layout_y=200.0,
            ),
            CashFlowNodeSpec(
                ref="savings",
                display_name="Savings",
                kind=CashNodeKind.SAVINGS,
                institution=None,
                layout_x=40.0,
                layout_y=200.0,
            ),
            CashFlowNodeSpec(
                ref="ian_chase",
                display_name="Ian's Chase",
                kind=CashNodeKind.LIABILITY_SURROGATE,
                institution="Chase",
                parent_ref=None,
                layout_x=400.0,
                layout_y=160.0,
            ),
            CashFlowNodeSpec(
                ref="ian_chase_sapphire",
                display_name="Sapphire (Ian)",
                kind=CashNodeKind.LIABILITY_SURROGATE,
                institution="Chase",
                parent_ref="ian_chase",
                layout_x=400.0,
                layout_y=260.0,
            ),
        ],
        edges=[
            CashFlowEdgeSpec(
                ref="edge-income-checking",
                from_ref="payroll",
                to_ref="checking",
                label="Deposits to checking",
                amount_rule=CashFlowAmountRule.PERCENT_OF_INFLOW,
                fixed_amount=None,
                percent_of_inflow=Decimal("100"),
                cadence=CashFlowCadence.MONTHLY,
                day_of_month=None,
            ),
            CashFlowEdgeSpec(
                ref="edge-savings-checking",
                from_ref="savings",
                to_ref="checking",
                label="Savings to checking",
                amount_rule=CashFlowAmountRule.REMAINDER,
                fixed_amount=None,
                percent_of_inflow=None,
                cadence=CashFlowCadence.MONTHLY,
                day_of_month=None,
            ),
        ],
    )
