# T-FR-0006-14 - Responsive Budget tables and full-screen edit forms

**Branch / worktree:** `feat/FR-0006-budget-cash-flow-graph--T-FR-0006-14-responsive-budget-width` / `.worktrees/FR-0006-budget-cash-flow-graph/T-FR-0006-14-responsive-budget-width/`

## TEST

Status: done

- Defined the responsive priority contract in [`30-expand-2026-07-01-responsive-budget-width.md`](../30-expand-2026-07-01-responsive-budget-width.md).
- Registered the ticket in [`tickets.md`](../tickets.md), [`20-tickets-dag.md`](../20-tickets-dag.md), the global DAG, and [`tasks/ticket-progress.md`](../../../ticket-progress.md).
- Added focused tests for compact allocation role labels and cash-flow account kind display helpers.

## DEV

Status: done

- Implemented allocation table width strategy: desktop table, mobile cards, compact role badges/color, account linkage moved to graph/modal detail.
- Implemented account table width strategy: no `64rem` minimum, compact kind labels, lower-priority detail columns hidden at breakpoints.
- Moved allocation and account edit flows to wide desktop/full-screen mobile modals.
- Tightened `Layout` mobile header behavior and `OutputHoverTip` hidden state so inactive chrome/tooltips do not create 390px page overflow.

## VAL

Status: done

- Focused frontend tests: `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm test -- budgetAllocation.test.ts cashFlowGraphKinds.test.ts"` - pass, **20** tests.
- Full frontend gate: `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"` - pass, **71** tests; build passed with the existing Vite large-chunk warning.
- Browser VAL used the existing API on `localhost:3500` and this worktree's Vite server on `localhost:3502`.
- Desktop: allocation table and account table both fit viewport with page overflow **0**, account-table parent overflow **0**, allocation-table parent overflow **0**.
- 390px: page overflow **0**, allocation card grid self-overflow **0**, account table self-overflow **0**.
- 390px modals: allocation edit modal and account edit modal each measured full viewport width/height (**375x844** in the browser viewport) with page overflow **0**.
- Browser console errors: **0**.
