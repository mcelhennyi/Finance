# FR-0006 handoff - responsive Budget width

**Date:** 2026-07-01  
**Branch:** `feat/FR-0006-budget-cash-flow-graph` after merging `feat/FR-0006-budget-cash-flow-graph--T-FR-0006-14-responsive-budget-width`  
**PR:** [#9](https://github.com/mcelhennyi/Finance/pull/9)

## Summary

Completed **`T-FR-0006-14`** as a post-closeout FR-0006 expansion. Allocation and account tables now fit the screen using field-priority collapse, compact role/kind signals, and phone card layouts. Allocation/account edit flows now use wide desktop/full-screen mobile modals instead of inline table editing.

## Shipped

- `frontend/src/pages/BudgetPage.tsx`
  - Allocation desktop table with compact role badge/color.
  - Mobile allocation cards.
  - Full-screen/wide allocation edit modal.
  - Category relink table width cleanup.
- `frontend/src/components/budget/CashFlowGraphPanel.tsx`
  - Width-fit account table without the old `64rem` minimum.
  - Full-screen/wide account edit modal.
  - Compact account kind display.
- `frontend/src/components/Layout.tsx`
  - Header no longer widens the 390px viewport.
- `frontend/src/components/OutputHoverTip.tsx`
  - Hidden hover bubbles no longer contribute horizontal overflow.
- `frontend/src/lib/budgetAllocation.ts`, `frontend/src/lib/cashFlowGraphKinds.ts`
  - Shared display helpers with focused tests.

## Validation

- `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm test -- budgetAllocation.test.ts cashFlowGraphKinds.test.ts"` - pass, **20** tests.
- `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"` - pass, **71** tests; existing Vite large-chunk warning remains.
- Browser VAL:
  - Desktop allocation/account tables fit viewport with page overflow **0**.
  - 390px allocation cards and account table self-overflow **0**.
  - 390px allocation/account edit modals fill the viewport and page overflow remains **0**.
  - Console errors **0**.

## Next

Review refreshed PR #9 and merge to `master` when satisfied. Remove repo-root `CURRENT.md` from the default branch after merge.
