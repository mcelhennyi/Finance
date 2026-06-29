# FR-0006 — Budget cash-flow graph (persisted + React Flow)

**Status:** `complete` through post-closeout expansion `T-FR-0006-13`. PR [#9](https://github.com/mcelhennyi/Finance/pull/9) is open from `feat/FR-0006-budget-cash-flow-graph` to `master` and has been refreshed by the allocation-controls/graph-layout expansion. Latest completed handoff: [`handoffs/2026-06-29-finish-feature-allocation-controls-graph-layout.md`](handoffs/2026-06-29-finish-feature-allocation-controls-graph-layout.md); closeout: [`90-closeout.md`](90-closeout.md).

**Scope note:** FR-0006 is triad-complete through **`T-FR-0006-13`**. The final post-closeout expansion added role-aware allocation account/category controls, removed plan income and Time view UI, stacked pure source/sink nodes, and tightened endpoint-safe route approach.

## Contents

| File | Purpose |
|------|---------|
| [`00-intake.md`](00-intake.md) | Goals, scope, links to prior handoff |
| [`10-design-00-skeleton.md`](10-design-00-skeleton.md) | Public surfaces (L0) |
| [`30-expand-2026-06-29-account-routing-allocations.md`](30-expand-2026-06-29-account-routing-allocations.md) | Expansion addendum for account routing, allocation primitives, filters, and relayout |
| [`30-expand-2026-06-29-edge-label-deconfliction.md`](30-expand-2026-06-29-edge-label-deconfliction.md) | Expansion addendum for edge and label collision avoidance |
| [`30-expand-2026-06-29-allocation-controls-graph-layout.md`](30-expand-2026-06-29-allocation-controls-graph-layout.md) | Expansion addendum for allocation dropdown controls, graph source/sink stacking, and endpoint-safe route approach |
| [`20-tickets-dag.md`](20-tickets-dag.md) | Work breakdown + Mermaid DAG |
| [`tickets.md`](tickets.md) | Canonical **`T-FR-0006-xx`** |
| [`90-closeout.md`](90-closeout.md) | Feature-complete closeout, validation, PR audit |
| [`DIARY.md`](DIARY.md) | Consolidated newest-first diary from serial and parallel logs |
| [`serial-diary.md`](serial-diary.md) | Session notes |
| [`parallel/`](parallel/) | Raw parallel ticket worker diaries |

## Summary

Ship a **data-driven** budget cash-flow **graph**: persisted **`CashNode`** / **`CashFlowEdge`** (and optional snapshots), **CRUD API**, **React Flow** on the Budget experience, then **time scrub / aggregation** and **BBD-linked suggestions** per the FR-0006 design artifacts. The 2026-06-29 expansions add explicit source/sink allocations, role-aware account controls, orthogonal routing, expandable allocation clusters with filters/counts, edge/label deconfliction, and graph layout cleanup.
