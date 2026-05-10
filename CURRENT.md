# Current branch state

| Field | Value |
|------|--------|
| **FR** | FR-0006 |
| **Feature folder** | `tasks/feature-history/FR-0006-budget-cash-flow-graph/` |
| **This branch** | `feat/FR-0006-budget-cash-flow-graph--T-FR-0006-04-react-flow` (ticket / implementation) |
| **Parent branch** | `feat/FR-0006-budget-cash-flow-graph` |
| **Last meaningful update** | 2026-05-10 |

## What is on this branch

- Budget **cash flow map** UI: **`CashFlowGraphPanel`** (`@xyflow/react`) on **`BudgetPage`**, wired to **`GET`/`PUT …/cash-flow-graph`** with **`CashFlowGraphDocument`** types.
- **`frontend/src/lib/cashFlowGraphFlow.ts`** + Vitest round-trip; API client methods on **`api`**.
- Root **`docker-compose.yml`**: **`web.environment.NODE_OPTIONS`** for reliable **`npm run build`** in Docker.

## In flight / blockers

- None. **Open PR** into **`feat/FR-0006-budget-cash-flow-graph`** for human review; after merge, continue **`T-FR-0006-05`** on the feature branch / new worktree per workflow.

## Next

1. Merge PR **`feat/FR-0006-budget-cash-flow-graph--T-FR-0006-04-react-flow` → `feat/FR-0006-budget-cash-flow-graph`**.
2. Start **`T-FR-0006-05`** (time scrub + aggregation) when prioritized.
