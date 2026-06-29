# FR-0006 — Budget cash-flow graph (persisted + React Flow)

**Status:** `in-progress` (see [`REGISTRY.md`](../REGISTRY.md)). Prior review PR [#9](https://github.com/mcelhennyi/Finance/pull/9) covered the original `T-FR-0006-01`–`07` slice; the 2026-06-29 expansion adds `T-FR-0006-08`–`11` before the feature-complete gate can pass again. Latest handoff: [`handoffs/2026-06-29-expand-account-routing-allocations.md`](handoffs/2026-06-29-expand-account-routing-allocations.md).

**Scope note:** Original FR-0006 delivery is triad-complete through **`T-FR-0006-07`**. This expansion keeps the feature active until the new allocation primitive, routing, and expansion tickets are complete.

## Contents

| File | Purpose |
|------|---------|
| [`00-intake.md`](00-intake.md) | Goals, scope, links to prior handoff |
| [`10-design-00-skeleton.md`](10-design-00-skeleton.md) | Public surfaces (L0) |
| [`30-expand-2026-06-29-account-routing-allocations.md`](30-expand-2026-06-29-account-routing-allocations.md) | Expansion addendum for account routing, allocation primitives, filters, and relayout |
| [`20-tickets-dag.md`](20-tickets-dag.md) | Work breakdown + Mermaid DAG |
| [`tickets.md`](tickets.md) | Canonical **`T-FR-0006-xx`** |
| [`serial-diary.md`](serial-diary.md) | Session notes |

## Summary

Ship a **data-driven** budget cash-flow **graph**: persisted **`CashNode`** / **`CashFlowEdge`** (and optional snapshots), **CRUD API**, **React Flow** on the Budget experience, then **time scrub / aggregation** and **BBD-linked suggestions** per the FR-0006 design artifacts. The 2026-06-29 expansion adds account endpoint linking, explicit source/sink allocations, orthogonal routing, and expandable allocation clusters with filters/counts.
