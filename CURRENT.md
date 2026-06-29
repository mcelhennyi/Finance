# Branch state — `feat/FR-0006-budget-cash-flow-graph`

| Field | Value |
|------|--------|
| **FR** | **`FR-0006`** — budget cash-flow graph |
| **Branch role** | Feature integration |

## Landed on this branch

All **`tickets.md`** tickets **`T-FR-0006-01`** ... **`T-FR-0006-12`** are triad-complete on this integration line (see **`tasks/ticket-progress.md`**). The post-closeout routing/label deconfliction expansion is complete.

Highlights: **`finance.cash_flow_graph`** persistence + API; **`CashFlowGraphPanel`** (**`@xyflow/react`**); arrowed money-direction edges; account-to-account link API / Budget controls; **`cashFlowTimeAggregation`** + time-grain UI; **`bbdCashFlowSuggestions`** + explicit BBD suggestion flow (**no silent writes**); source/sink allocation primitives with account endpoints; directional left/right account handles; orthogonal routing; expandable allocation clusters with filters and counts; label-aware route deconfliction.

## In flight

None. **`FR-0006`** is complete and PR [**#9**](https://github.com/mcelhennyi/Finance/pull/9) is ready for refreshed review.

## Next

1. Review / merge PR [**#9**](https://github.com/mcelhennyi/Finance/pull/9).
2. After merge, remove repo-root **`CURRENT.md`** from the default branch.
