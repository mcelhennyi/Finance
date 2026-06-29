# Branch state — `feat/FR-0006-budget-cash-flow-graph`

| Field | Value |
|------|--------|
| **FR** | **`FR-0006`** — budget cash-flow graph |
| **Branch role** | Feature integration |

## Landed on this branch

All **`tickets.md`** tickets **`T-FR-0006-01`** … **`T-FR-0006-07`** are triad-complete on this integration line (see **`tasks/ticket-progress.md`**).

Highlights: **`finance.cash_flow_graph`** persistence + API; **`CashFlowGraphPanel`** (**`@xyflow/react`**); arrowed money-direction edges; account-to-account link API / Budget controls; **`cashFlowTimeAggregation`** + time-grain UI; **`bbdCashFlowSuggestions`** + explicit BBD suggestion flow (**no silent writes**).

## In flight

The 2026-06-29 expansion reopens **FR-0006** with **`T-FR-0006-08`** … **`T-FR-0006-11`**:

- **Unified source/sink allocation primitive contracts** (**`T-FR-0006-08`**).
- **Directional account handles and double-click linking** (**`T-FR-0006-09`**).
- **Orthogonal routing and obstacle-aware relayout** (**`T-FR-0006-10`**).
- **Expandable allocation clusters with filters and counts** (**`T-FR-0006-11`**).

## Next

1. Run **`/identify-frontier`** for the new FR-0006 expansion tickets.
2. Start **`T-FR-0006-08`** and **`T-FR-0006-09`** in child worktrees under **`.worktrees/FR-0006-budget-cash-flow-graph/`**.
3. Do **not** run **`/finish-feature`** until **`T-FR-0006-08`** … **`T-FR-0006-11`** are TEST/DEV/VAL `done`.
