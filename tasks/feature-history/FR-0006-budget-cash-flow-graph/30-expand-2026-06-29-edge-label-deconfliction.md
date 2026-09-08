# FR-0006 - Expansion: edge and label deconfliction

## Raw request

Deconflict the line between graph nodes and the labels on those lines against other nodes, lines, and labels.

## Target feature context

- Feature folder: `tasks/feature-history/FR-0006-budget-cash-flow-graph/`
- Current branch / worktree: ticket branch `feat/FR-0006-budget-cash-flow-graph--T-FR-0006-12-edge-label-deconfliction` in `.worktrees/FR-0006-budget-cash-flow-graph/T-FR-0006-12-edge-label-deconfliction/`
- Current ticket range before expansion: `T-FR-0006-01` through `T-FR-0006-11`, all TEST/DEV/VAL `done`
- Current PR / closeout state: PR #9 is open and prior closeout exists; this explicit post-closeout expansion reopens the feature-complete gate until `T-FR-0006-12` is VAL-done.
- Existing design docs: `10-design-00-skeleton.md`, `30-expand-2026-06-29-account-routing-allocations.md`, `20-tickets-dag.md`, `tickets.md`, and `docs/design/budget-plans-roadmap.md`

## Fit with original plan

The original FR-0006 thesis is an editable Budget cash-flow graph that stays readable as the operator adds account relationships and allocation clusters. The previous routing ticket made edges square and obstacle-aware, but edge labels were still placed on a simple midpoint. This expansion keeps the same feature boundary and improves readability of the already-delivered graph surface.

This should stay inside FR-0006 rather than becoming a new feature because it changes only the graph route/label layer and its validation; there is no new backend contract, persistence concept, or product area.

## User experience / operator flow

- Entry points: Budget page -> Cash flow map.
- Happy path: graph edges route around visible account nodes and expanded allocation clusters; labels land beside routed segments without covering another label, node, cluster, or line where a free candidate exists.
- Loading / empty / error / permission states: unchanged from the existing graph panel.
- Responsive and accessibility notes: labels remain visible at desktop and phone widths, truncate long labels, and keep the existing selected-edge edit panel as the accessible text surface.

## Public surfaces and contracts

| Surface | Change | Request / response or type sketch | Compatibility |
|---------|--------|------------------------------------|---------------|
| `OrthogonalRoute` | Add label placement metadata | `{ labelPosition: { x, y }, labelBox: RoutingBox }` alongside existing `points` and `path` | UI-only additive TypeScript type |
| `routeOrthogonalEdges` | Treat previously routed lines and labels as obstacles | Options add label/line dimensions; route output reserves segment boxes and label boxes deterministically | Existing callers can ignore new fields |
| `OrthogonalCashEdge` | Render labels at deconflicted route-provided coordinates | Edge label renderer uses `route.labelPosition`, with midpoint fallback | Existing edges still render if route data is absent |

## Data model, migrations, and lifecycle

No backend data model or migration changes. Route and label boxes are derived from visible React Flow nodes, edge ids, and expanded-cluster obstacles each render pass.

## Backend / service behavior

No backend behavior changes.

## Frontend behavior

- Compute candidate edge routes using the same orthogonal helper from `T-FR-0006-10`.
- Reserve account node boxes and expanded allocation cluster boxes as before.
- After each edge route is chosen, reserve thin boxes for its visible route segments.
- Place the edge label near the longest route segment, offset from the line rather than centered directly on it.
- Treat reserved label boxes and prior route-segment boxes as obstacles for later route and label candidates.
- Keep deterministic ordering by source, target, and edge id so repeated renders are stable.
- Fall back to the closest label candidate if the graph is too dense to find a fully clear label box.

## Mock / example UI

- Mock file: [`docs/design/mockups/fr-0006-edge-label-deconfliction.html`](../../../docs/design/mockups/fr-0006-edge-label-deconfliction.html)
- Current UI used as baseline: Budget page cash-flow map with orthogonal account routes, labels, and expanded allocation clusters.
- Differences from current UI: route labels sit beside clear line segments and the sketch shows reserved clearance around labels and route lanes.

## Existing artifacts to change

| Artifact | Required change | Ticket |
|----------|-----------------|--------|
| `frontend/src/lib/cashFlowGraphRouting.ts` | Add label boxes, label candidate selection, line segment reservations, and deterministic route ordering | `T-FR-0006-12` |
| `frontend/src/lib/cashFlowGraphFlow.ts` and tests | Carry route label metadata through React Flow edge data and cover label/line deconfliction | `T-FR-0006-12` |
| `frontend/src/components/budget/CashFlowGraphPanel.tsx` | Render labels at deconflicted route coordinates, with truncation and fallback | `T-FR-0006-12` |
| `docs/design/budget-plans-roadmap.md`, FR-0006 tracker/diary/closeout | Document the label-aware routing behavior and validation | `T-FR-0006-12` |

## Test and validation strategy

- Unit / contract: Vitest coverage for label boxes avoiding obstacles, label boxes not overlapping each other, route-line reservations changing later bend lanes, and React Flow edge data carrying `labelPosition`.
- Integration: no backend integration change.
- UI rendered inspection: Budget -> Cash flow map at desktop and phone width; verify account nodes, expanded allocation clusters, edge labels, and route lines do not visibly overlap in representative states.
- Docs build / preview: run docs build or documented host exception because this expansion touches `docs/design/`.

## Risks, open questions, and deferrals

- Dense graphs can still run out of clear space. The first pass is deterministic and testable, with a graceful fallback label candidate rather than a heavy routing engine.
- Precise text measurement is deferred. The route helper reserves a conservative fixed label box while the renderer truncates long labels to the same approximate width.
- Automatic node position optimization for very dense graphs remains a later layout-engine concern.

## Ticket expansion plan

- `T-FR-0006-12` - Edge and label deconfliction.

This ticket extends the FR-0006 feature-complete gate. Do not merge PR #9 until `T-FR-0006-12` is TEST/DEV/VAL `done`.
