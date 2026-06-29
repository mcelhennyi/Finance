# Expansion addendum - 2026-06-29 allocation controls and graph layout cleanup

**Feature:** `FR-0006` - Budget cash-flow graph  
**Ticket:** `T-FR-0006-13` - Allocation controls and graph layout cleanup  
**Request source:** `/expand-feature` follow-up after edge/label deconfliction closeout.

## Raw request

- Deconflict the line between nodes and the labels on them against other nodes, lines, and labels.
- Allow each allocation's account to be a dropdown of configured graph accounts.
- Allow allocation category to be a dropdown of configured categories.
- Remove the "Time view (approximate)" graph view.
- Remove income information in the Plan section; income should be set in allocations.
- Stack pure sinks on the right and pure sources on the left in the React Flow view.
- Ensure routing lines do not go behind any nodes; lines should approach left/right connectors from outside the node body.
- Allocations should not have an "endpoints" dropdown. A single account selector plus allocation role decides whether the row is a sink from that account or a source into that account.

## Design decision

Allocation editing now exposes one account selector:

| Allocation role | UI label | Stored account ref |
|-----------------|----------|--------------------|
| `source` | `Source into <account>` | `to_account_ref = account`, `from_account_ref = null` |
| `sink` | `Sink from <account>` | `from_account_ref = account`, `to_account_ref = null` |

The old dual endpoint editing UI remains a data-compatibility concern only. Existing rows with both refs can still be read and summarized, but the Budget UI normalizes edited rows back to the single-account model.

## UI / behavior changes

- Budget plan details only edit the plan name; source allocation rows are the visible income model.
- The allocation table and add/edit row use category `<select>` controls backed by saved/observed category labels.
- Allocation row account controls use configured cash-flow graph nodes as `<select>` options.
- The graph panel no longer renders the approximate time aggregation table.
- Expanded account allocation filters no longer include an endpoint dropdown.
- Pure source accounts are stacked on the left edge of the graph; pure sink accounts are stacked on the right; through accounts retain their authored x positions.
- Orthogonal routes leave source handles horizontally, approach target handles from the left, avoid endpoint node bodies, and prefer alternate lanes before reusing prior line lanes.

## Implementation map

| Area | Files |
|------|-------|
| Allocation account/category controls | `frontend/src/pages/BudgetPage.tsx`, `frontend/src/lib/budgetAllocation.ts` |
| Graph layout and routing | `frontend/src/lib/cashFlowGraphFlow.ts`, `frontend/src/lib/cashFlowGraphRouting.ts`, `frontend/src/components/budget/CashFlowGraphPanel.tsx` |
| Allocation clusters/filter cleanup | `frontend/src/lib/cashFlowAllocationClusters.ts`, `frontend/src/components/budget/CashFlowGraphPanel.tsx` |
| Starter seed consistency | `src/finance/allocation/default_template.py`, `src/finance/allocation/service.py`, `data/budget-default-plan.yaml` |
| User guidance | `frontend/src/components/budget/BudgetGuideContent.tsx`, `frontend/src/components/budget/budgetFieldTips.ts`, `docs/design/budget-plans-roadmap.md` |

## Ticket addition

Add `T-FR-0006-13` after `T-FR-0006-12`; it is serial because it revises shared allocation controls and the same routing helpers touched by the prior expansions.

## Validation plan

- Backend focused tests for allocation summary/API/seed behavior.
- Frontend focused Vitest for allocation account mapping, cluster filters, source/sink stacking, and endpoint-safe routing.
- Frontend lint/build gate.
- Browser VAL on Budget at desktop and phone width:
  - Plan section has no income controls.
  - Cash-flow graph has no Time view.
  - Allocation add/edit exposes category and a single account selector, no endpoint selector.
  - Graph stacks pure sources left and pure sinks right.
  - SVG routes do not pass through graph node rectangles.
