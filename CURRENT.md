# Branch state — `feat/FR-0006-budget-cash-flow-graph`

| Field | Value |
|------|--------|
| **FR** | **`FR-0006`** — budget cash-flow graph |
| **Branch role** | Feature integration |

## Landed on this branch

All **`tickets.md`** tickets **`T-FR-0006-01`** ... **`T-FR-0006-14`** are triad-complete on this integration line (see **`tasks/ticket-progress.md`**). The post-closeout responsive Budget width expansion is complete.

Highlights: **`finance.cash_flow_graph`** persistence + API; **`CashFlowGraphPanel`** (**`@xyflow/react`**); arrowed money-direction edges; account-to-account link API / Budget controls; **`bbdCashFlowSuggestions`** + explicit BBD suggestion flow (**no silent writes**); source/sink allocation primitives with role-aware account controls; directional left/right account handles; orthogonal routing; expandable allocation clusters with filters and counts; label-aware route deconfliction; single account/category allocation dropdowns; pure source/sink graph stacking; responsive allocation/account tables with full-screen edit modals.

## In flight

_None._

## Next

1. Review refreshed PR [**#9**](https://github.com/mcelhennyi/Finance/pull/9).
2. Merge **`feat/FR-0006-budget-cash-flow-graph`** to **`master`** when satisfied.
3. Remove repo-root **`CURRENT.md`** from the default branch after merge.
