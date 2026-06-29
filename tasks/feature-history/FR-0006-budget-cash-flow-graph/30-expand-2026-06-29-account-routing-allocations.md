# FR-0006 - Expansion: account routing and allocation primitives

## Raw request

Make accounts linkable by double-clicking an account edge. Update account nodes so they show pure source accounts, pure sink accounts, and accounts that are both source and sink. Treat the left side of a node as input and the right side as output. Route lines out of nodes without overlap, using square-shaped routing around obstacles. Treat allocations as related to accounts: allow expanding the allocations associated with an account, lay those smaller allocation nodes beneath the account in rows and columns, and relayout after every expand/collapse so nodes do not overlap. Follow-up clarifications: allow filtering expanded allocations by size, frequency, and related fields; show each account's associated allocation count on the account node; update the model and view so all inflows and outflows are allocations that can be linked to accounts, making payroll deposits, savings transfers, and purchases like an Amazon order the same primitive; make every allocation explicitly a source allocation or sink allocation.

## Target feature context

- Feature folder: `tasks/feature-history/FR-0006-budget-cash-flow-graph/`
- Current branch / worktree: `feat/FR-0006-budget-cash-flow-graph` at repo root
- Current ticket range before expansion: `T-FR-0006-01` through `T-FR-0006-07`, all TEST/DEV/VAL `done`
- Existing design docs: `10-design-00-skeleton.md`, `20-tickets-dag.md`, `tickets.md`, and `docs/design/budget-plans-roadmap.md`
- Previous finish state: `handoffs/2026-05-10-finish-feature.md` and PR #9 said the original slice was merge-ready; this expansion reopens the FR-0006 feature-complete gate until the new tickets are done.

## Fit with original plan

The original FR-0006 goal is a persisted, editable Budget cash-flow graph that makes account relationships legible. This expansion is a natural refinement of that graph rather than a new feature: it improves account-to-account linking, node semantics, edge readability, and the relationship between the graph and allocation rows already owned by the Budget plan. The important model shift is that allocation rows become the shared cash-movement primitive for money coming in and money being sent to a destination, with an explicit source/sink role instead of treating "transfer" as a third peer primitive.

The change stays inside FR-0006 because it modifies the same graph panel, graph DTO mapping, allocation-plan API surface, and Budget page workflow. No separate product surface, ingestion model, or external service boundary is introduced.

## User experience / operator flow

- Entry points:
  - Budget page -> Cash flow map.
  - Account node left/right edges on the React Flow canvas.
  - Account node allocation-count badge.
  - Expanded allocation cluster beneath an account.
- Happy path:
  - Operator double-clicks the right/output side of a source-capable account.
  - The UI enters link-pending state for that account and side.
  - Operator double-clicks the left/input side of a different account.
  - The app saves current graph edits, creates the directed link through the existing account-link API, updates the graph, and relayouts.
  - Account nodes display role labels: pure source, pure sink, or source + sink, based on incoming/outgoing edge incidence.
  - Operator records a paycheck allocation as a `source` allocation that funds Main Checking, a savings allocation as a `sink` allocation funded from Main Checking with High Yield Savings as the owned destination, and an Amazon allocation as a `sink` allocation funded from Chase Card or Main Checking with Amazon/category as the external destination. All three are `AllocationItem` rows with explicit `allocation_role` and account endpoints.
  - Operator expands an account. The graph inserts smaller allocation nodes beneath the account, arranged in stable rows/columns.
  - Operator filters expanded allocations by monthly size, cadence/frequency, allocation role (`source` / `sink`), payment method, category text, counterparty text, endpoint role, or due-day range. Account badges continue to show total linked allocations and visible source/sink splits after filters.
- Loading / empty / error / permission states:
  - No plan selected: existing empty plan state remains.
  - No allocations linked to account: account badge shows `0 allocations`; expand action opens an empty allocation cluster with assignment affordance deferred to allocation-line editing.
  - Unknown or deleted allocation account endpoint: API validation rejects writes; read paths surface unassigned allocation rows instead of crashing.
  - Link errors: existing link mutation alert remains, with direction-specific copy for duplicate edges, self-links, and missing endpoints.
  - Permission states: no new permission model.
- Responsive and accessibility notes:
  - Double-click must have a keyboard/mouse alternative: selecting a node side and pressing a visible icon/button or using an action menu must create the same pending link state.
  - Handles must be at least 24px high in rendered UI, even if the visible connector is smaller.
  - Expanded allocation mini-nodes collapse into one column on narrow viewports; relayout should keep the account node above its visible allocation cluster.

## Public surfaces and contracts

| Surface | Change | Request / response or type sketch | Compatibility |
|---------|--------|------------------------------------|---------------|
| `AllocationItemCreate` / `AllocationItemUpdate` / `AllocationItemOut` | Treat allocation rows as explicit source/sink cash-movement primitives | `allocation_role?: 'source' | 'sink'`, `from_account_ref?: string | null`, `to_account_ref?: string | null`, optional `counterparty?: string | null`; non-null account refs must match `CashFlowNodeSpec.ref` in the same plan graph | Backward-compatible additive fields; existing rows default to `sink` with null endpoints |
| `allocation_items` persistence | Add source/sink role and nullable account endpoints | `allocation_role VARCHAR(32) NOT NULL DEFAULT 'sink'`, `from_account_ref VARCHAR(64) NULL`, `to_account_ref VARCHAR(64) NULL`, `counterparty VARCHAR(200) NULL`; service-level validation instead of FK because graph replace currently deletes/reinserts nodes | Requires migration/stub update; old data remains valid |
| `GET /budget-allocation/plans/{plan_id}/items` | Return allocation role and account endpoints | Existing `items[]` entries include `allocation_role`, `from_account_ref`, `to_account_ref`, `counterparty` | Additive response fields |
| `POST/PUT /budget-allocation/plans/{plan_id}/items` | Accept source/sink allocation rows | Body may include role metadata and endpoints; reject refs outside the plan graph; reject impossible endpoint shape for the chosen role | Additive request fields |
| `budgetAllocationSummary` / plan money-flow summary | Prefer source/sink allocation rows | Summary computes income from `allocation_role='source'` rows when present, sink totals separately from account-to-account storage, and plan-level `income_amount` remains a fallback until migrated | Backward-compatible summary behavior |
| `CashFlowGraphPanel` props | Receive allocation rows or query them locally | Either pass `items` from `BudgetPage` or query `budgetItems`; derive account counts and expanded allocation clusters | No backend graph DTO change required |
| `CashFlowRfNode.data` | Add UI-only role/count metadata | `{ role: 'source' | 'sink' | 'source_sink' | 'unlinked', allocationCount, visibleAllocationCount }` | UI-only, not persisted |
| React Flow edges | Use custom orthogonal edge routing | `points: Array<{x,y}>` or generated SVG path from node bounds and lane index | Existing `CashFlowEdgeSpec` remains unchanged |

## Data model, migrations, and lifecycle

- `allocation_items` becomes the plan-scoped cash-movement table for source allocations and sink allocations. The existing name can remain for compatibility, but UI copy should call rows "allocations" or "cash-flow allocations" rather than "expenses only."
- `allocation_role` determines the meaning of the positive `planned_amount`:
  - `source`: money originates from this allocation and enters an account; `to_account_ref` is the account receiving money; `from_account_ref` is usually null because the allocation itself is the source. Example: Paycheck -> Checking.
  - `sink`: money leaves a funding account toward this allocation; `from_account_ref` is the account funding it; `to_account_ref` may be an owned destination account for storage/debt/investment sinks or null for external purchases. Examples: Checking -> Savings, Card -> Amazon.
- There is no persisted third allocation role for transfers. Storage/rebalancing is a `sink` allocation with an owned `to_account_ref`, which keeps every allocation explicitly source or sink while still showing account-to-account movement.
- Account endpoint refs point to `cash_flow_nodes.ref` by value within the same `plan_id`, not to `cash_flow_nodes.id`, because full graph replacement currently deletes/reinserts graph rows.
- Allocation item create/update validates non-null account endpoints against the current plan graph.
- Graph replacement validates that no persisted allocation item keeps a `from_account_ref` or `to_account_ref` that would disappear from the graph. The first implementation should reject the save and tell the operator to reassign or clear linked allocations before deleting the account node.
- Counts are computed from allocation items:
  - `totalAllocationCount`: all allocation rows where `from_account_ref === node.ref` or `to_account_ref === node.ref`.
  - `sourceAllocationCount`: source allocation rows where `to_account_ref === node.ref`.
  - `sinkAllocationCount`: sink allocation rows where `from_account_ref === node.ref` or `to_account_ref === node.ref`.
  - `visibleAllocationCount`: rows remaining after expanded-allocation filters.
  - `monthlyVisibleTotal`: sum of `monthly_amount` for visible rows.
- Existing `payment_method` remains a funding summary dimension (`cash` / `credit`) and does not replace account endpoints.
- Existing `AllocationPlan.income_amount` and `income_cadence` remain compatibility fields. Once inflow allocations exist for a plan, summaries and graph labels should prefer those allocation rows as the source of income truth; plan-level income remains fallback data for older plans and starter templates.

## Backend / service behavior

- Extend allocation schemas, ORM model, migration stub, seed YAML import/export, and API tests for `allocation_role`, `from_account_ref`, `to_account_ref`, and `counterparty`.
- Update allocation create/update service validation:
  - `None` / missing is allowed.
  - Non-null endpoint refs must match a cash-flow graph node for the same plan.
  - Sink rows with both endpoints set may optionally create/suggest the matching graph edge, but silent graph writes remain out of scope unless the operator confirms.
  - Invalid refs return a 422/400-style error matching existing API patterns.
- Update graph replacement service validation so deleting a node referenced by allocations fails deterministically.
- Update allocation summary math so source allocations can drive monthly income and sink allocations are split into external spend vs owned-account storage/investment/debt destinations.
- No new account-count endpoint is required for the first pass; the frontend can derive counts from existing `listBudgetAllocationItems` data.

## Frontend behavior

- Node role and handles:
  - Pure source: no incoming edges, at least one outgoing edge; right/output handle active, left/input handle disabled or muted.
  - Pure sink: at least one incoming edge, no outgoing edges; left/input handle active, right/output handle disabled or muted.
  - Source + sink: at least one incoming and one outgoing edge; both handles active.
  - Unlinked: no edges; both sides available in neutral state until role is established.
- Linking gesture:
  - Double-clicking an account's right edge starts an outgoing link.
  - Double-clicking another account's left edge completes the link.
  - Double-clicking an incompatible side should not create an invalid reversed/self edge.
  - Keyboard/action-menu alternative must call the same link state machine.
- Routing:
  - Edges leave the right side of a node and enter the left side of the target.
  - Multiple outgoing edges from the same node use separate lane offsets so their first horizontal segments do not overlap.
  - Routes are orthogonal polylines with square corners.
  - The route planner avoids account nodes and expanded allocation clusters by choosing a free lane around bounding boxes.
- Allocation expansion:
  - Account badges show total linked allocation count at all times.
  - Expanded account clusters show total, visible count, visible monthly source/sink totals, owned-destination sink totals, and active filters.
  - Allocation mini-nodes are smaller than account nodes and are organized beneath the account in stable rows/columns.
  - Filters include minimum/maximum monthly size, cadence/frequency, allocation role (`source` / `sink`), payment method, category search, counterparty text, endpoint role (funds this account vs funded by this account), and due-day range where available.
  - Mini-node labels make the primitive explicit: `Paycheck deposit` (`source`, -> Checking), `Savings sweep` (`sink`, Checking -> Savings), `Amazon order` (`sink`, Card/Checking -> external purchase/category).
  - Allocation mini-nodes should have their own source/sink visual treatment: source allocations use an output-oriented badge/handle; sink allocations use an input-oriented badge/handle.
  - Expanding, collapsing, or changing filters recomputes graph layout so no account node, allocation mini-node, or cluster overlaps another visible element.

## Mock / example UI

- Mock file: [`docs/design/mockups/fr-0006-account-routing-allocation-expansion.html`](../../../docs/design/mockups/fr-0006-account-routing-allocation-expansion.html)
- Current UI used as baseline: Budget page cash-flow map with React Flow panel, account table, account link controls, time aggregation, and BBD suggestions.
- Differences from current UI:
  - Account nodes have left input and right output handles.
  - Account role and allocation-count badges are visible on nodes.
  - Account linking is represented as edge/side interaction instead of the current source/destination selector block.
  - Expanded allocations are mini-nodes under the account, with filter controls and count/total summaries across source and sink allocations.
  - Routes are square orthogonal paths around nodes/clusters.

## Existing artifacts to change

| Artifact | Required change | Ticket |
|----------|-----------------|--------|
| `src/finance/db/models.py`, allocation migration stub, allocation schemas/service/router/tests | Add `allocation_role`, endpoint refs, counterparty, summary semantics, endpoint validation, and graph replace integrity | `T-FR-0006-08` |
| `frontend/src/types.ts`, `frontend/src/lib/budgetAllocation.ts`, Budget allocation tests | Add allocation primitive typing, endpoint fields, and form payload support for source/sink rows | `T-FR-0006-08` |
| `frontend/src/components/budget/CashFlowGraphPanel.tsx` | Replace top/bottom handles with left/right role handles; add double-click link state machine and accessible fallback | `T-FR-0006-09` |
| `frontend/src/lib/cashFlowGraphFlow.ts` and new routing/layout helper tests | Derive node roles; generate non-overlapping orthogonal routes; relayout after expand/collapse/filter changes | `T-FR-0006-10` |
| `frontend/src/components/budget/CashFlowGraphPanel.tsx`, `frontend/src/pages/BudgetPage.tsx` | Render allocation mini-nodes, filters, counts, and visible totals under expanded accounts | `T-FR-0006-11` |
| `docs/design/budget-plans-roadmap.md`, `scripts/README.md`, FR-0006 diary/handoffs | Document operator workflow and validation notes | `T-FR-0006-11` |

## Test and validation strategy

- Unit / contract:
  - Backend tests for role defaults, source/sink summary math, endpoint create/update/list behavior, invalid refs, nullable backward compatibility, and graph deletion protection.
  - Frontend unit tests for allocation primitive form mapping, node role derivation, link state transitions, account allocation counts, allocation filters, and route point generation.
- Integration:
  - API tests covering source allocation rows and sink allocation rows linked to graph accounts and rejection when graph replace removes referenced endpoint refs.
  - Budget page tests or component tests for expand/collapse/filter state and visible counts.
- UI rendered inspection:
  - Budget -> Cash flow map at desktop and phone-sized viewport.
  - States: unlinked graph, pure source, pure sink, source + sink, pending double-click link, duplicate/self-link error, expanded account with filters, empty account expansion, filter hiding all allocations.
  - Verify no visible overlap after expand/collapse/filter changes and that routes remain orthogonal and nonblank.
- Docs build / preview:
  - If docs are changed beyond this addendum/mock, run the project doc build or record a host-local exception.

## Risks, open questions, and deferrals

- The FR-0006 history references `docs/design/budget-cash-flow-graph.md`, but that file is not present in the current checkout or HEAD. This expansion records the missing authoritative doc as a documentation risk; implementation can proceed from this addendum plus the existing tickets unless the team wants the missing design page restored first.
- Obstacle-avoiding graph routing can grow complex. The first implementation should use deterministic, testable orthogonal lanes rather than introducing a heavy layout engine unless tests show the local helper cannot satisfy common Budget graphs.
- Allocation mini-nodes are display nodes backed by allocation rows, not new persisted graph account nodes. Persisting them as `CashFlowNode` rows is deferred unless a later feature needs allocation-level edges.
- Reworking `AllocationItem` into a differently named table is deferred. The compatibility path is to evolve the existing table/API first, then consider a rename only if the code becomes misleading.
- Multiple expanded accounts are allowed only if the relayout helper keeps them non-overlapping. If this proves too wide for the first pass, the UI may initially keep one expanded account open at a time, documented in VAL.

## Ticket expansion plan

- `T-FR-0006-08` - Unified source/sink allocation primitive contracts.
- `T-FR-0006-09` - Directional account handles and double-click linking.
- `T-FR-0006-10` - Orthogonal routing and obstacle-aware relayout.
- `T-FR-0006-11` - Expandable allocation clusters with filters and counts.

These tickets extend the FR-0006 feature-complete gate. Do not run `/finish-feature` again until `T-FR-0006-01` through `T-FR-0006-11` are all TEST/DEV/VAL `done`.
