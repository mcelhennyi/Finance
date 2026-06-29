# FR-0006 — Budget cash-flow graph (persisted + React Flow)

**Status:** `complete` (see [`REGISTRY.md`](../REGISTRY.md)). PR [#9](https://github.com/mcelhennyi/Finance/pull/9) is open from `feat/FR-0006-budget-cash-flow-graph` to `master` for human review. Latest handoff: [`handoffs/2026-06-29-finish-feature.md`](handoffs/2026-06-29-finish-feature.md); closeout: [`90-closeout.md`](90-closeout.md).

**Scope note:** FR-0006 is triad-complete through **`T-FR-0006-11`**. The 2026-06-29 expansion closes the account routing, source/sink allocation primitive, orthogonal routing, and expandable allocation cluster additions.

## Contents

| File | Purpose |
|------|---------|
| [`00-intake.md`](00-intake.md) | Goals, scope, links to prior handoff |
| [`10-design-00-skeleton.md`](10-design-00-skeleton.md) | Public surfaces (L0) |
| [`30-expand-2026-06-29-account-routing-allocations.md`](30-expand-2026-06-29-account-routing-allocations.md) | Expansion addendum for account routing, allocation primitives, filters, and relayout |
| [`20-tickets-dag.md`](20-tickets-dag.md) | Work breakdown + Mermaid DAG |
| [`tickets.md`](tickets.md) | Canonical **`T-FR-0006-xx`** |
| [`90-closeout.md`](90-closeout.md) | Feature-complete closeout, validation, PR audit |
| [`DIARY.md`](DIARY.md) | Consolidated newest-first diary from serial and parallel logs |
| [`serial-diary.md`](serial-diary.md) | Session notes |
| [`parallel/`](parallel/) | Raw parallel ticket worker diaries |

## Summary

Ship a **data-driven** budget cash-flow **graph**: persisted **`CashNode`** / **`CashFlowEdge`** (and optional snapshots), **CRUD API**, **React Flow** on the Budget experience, then **time scrub / aggregation** and **BBD-linked suggestions** per the FR-0006 design artifacts. The 2026-06-29 expansion adds account endpoint linking, explicit source/sink allocations, orthogonal routing, and expandable allocation clusters with filters/counts.
