# Branch state — `feat/FR-0006-budget-cash-flow-graph`

| Field | Value |
|------|--------|
| **FR** | **`FR-0006`** — budget cash-flow graph |
| **Branch role** | Feature integration |

## Landed on this branch

All **`tickets.md`** tickets **`T-FR-0006-01`** ... **`T-FR-0006-11`** are triad-complete on this integration line (see **`tasks/ticket-progress.md`**).

Highlights: **`finance.cash_flow_graph`** persistence + API; **`CashFlowGraphPanel`** (**`@xyflow/react`**); arrowed money-direction edges; account-to-account link API / Budget controls; **`cashFlowTimeAggregation`** + time-grain UI; **`bbdCashFlowSuggestions`** + explicit BBD suggestion flow (**no silent writes**); source/sink allocation primitives with account endpoints; directional left/right account handles; orthogonal routing; expandable allocation clusters with filters and counts.

## In flight

None. **FR-0006** passed the feature-complete gate on 2026-06-29; closeout artifacts are drafted under **`tasks/feature-history/FR-0006-budget-cash-flow-graph/`**.

## Next

1. Review PR [**#9**](https://github.com/mcelhennyi/Finance/pull/9) from **`feat/FR-0006-budget-cash-flow-graph`** to **`master`**.
2. Merge when satisfied; the feature branch is retained for audit.
3. After merge, remove repo-root **`CURRENT.md`** from the default branch so **`master`** stays neutral.
