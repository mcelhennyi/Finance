# Branch state — `feat/FR-0006-budget-cash-flow-graph`

| Field | Value |
|------|--------|
| **FR** | **`FR-0006`** — budget cash-flow graph |
| **Branch role** | Feature integration (ticket branches optional) |

## Landed on this branch

- [**Define cash-flow graph persistence contracts**](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md) ([`T-FR-0006-01`](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md)): `src/finance/cash_flow_graph/`, `tests/test_cash_flow_graph_contracts.py`
- [**Compose default for allocation auto-template**](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md) ([`T-FR-0006-07`](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md)): `docker-compose.yml`, `scripts/README.md`, `docs/design/budget-plans-roadmap.md`
- [**Add cash-flow graph migration and ORM models**](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md) ([`T-FR-0006-02`](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md)): `CashFlowNode` / `CashFlowEdge` in `src/finance/db/models.py`, `src/finance/db/migrations/phase2_cash_flow_graph_stub.sql`, `tests/test_cash_flow_graph_models.py`
- [**Expose cash-flow graph CRUD API**](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md) ([`T-FR-0006-03`](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md)): `finance.cash_flow_graph.service`, `GET`/`PUT /api/budget-allocation/plans/{plan_id}/cash-flow-graph`, `tests/test_api_cash_flow_graph.py` (includes `finance.allocation` + shared `budget_allocation` router)

- [**Budget React Flow panel wired to graph API**](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md) ([`T-FR-0006-04`](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md)): `frontend/src/components/budget/CashFlowGraphPanel.tsx`, `frontend/src/lib/cashFlowGraphFlow.ts`, `api.getBudgetCashFlowGraph` / `putBudgetCashFlowGraph`; Vitest `cashFlowGraphFlow.test.ts`

## Next

1. [**Cash-flow time scrub and aggregated views**](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md) ([`T-FR-0006-05`](tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md))
