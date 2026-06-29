"""Cash-flow graph domain contracts (per allocation plan).

See Also: docs/design/budget-cash-flow-graph.md
"""

from finance.cash_flow_graph.enums import CashFlowAmountRule, CashFlowCadence, CashNodeKind
from finance.cash_flow_graph.schemas import (
    CashFlowAccountLinkRequest,
    CashFlowEdgeSpec,
    CashFlowGraphDocument,
    CashFlowNodeSpec,
)
from finance.cash_flow_graph.service import (
    ensure_default_cash_flow_graph_if_empty,
    get_plan_graph,
    replace_plan_graph,
)

__all__ = [
    "CashFlowAmountRule",
    "CashFlowAccountLinkRequest",
    "CashFlowCadence",
    "CashFlowGraphDocument",
    "CashFlowEdgeSpec",
    "CashFlowNodeSpec",
    "CashNodeKind",
    "ensure_default_cash_flow_graph_if_empty",
    "get_plan_graph",
    "replace_plan_graph",
]
