# FR-0006 — Budget cash-flow graph (persisted + React Flow)

**Status:** `in-progress` (see [`REGISTRY.md`](../REGISTRY.md)).

## Contents

| File | Purpose |
|------|---------|
| [`00-intake.md`](00-intake.md) | Goals, scope, links to prior handoff |
| [`10-design-00-skeleton.md`](10-design-00-skeleton.md) | Public surfaces (L0) |
| [`20-tickets-dag.md`](20-tickets-dag.md) | Work breakdown + Mermaid DAG |
| [`tickets.md`](tickets.md) | Canonical **`T-FR-0006-xx`** |
| [`serial-diary.md`](serial-diary.md) | Session notes |

## Summary

Ship a **data-driven** budget cash-flow **graph**: persisted **`CashNode`** / **`CashFlowEdge`** (and optional snapshots), **CRUD API**, **React Flow** on the Budget experience, then **time scrub / aggregation** and **BBD-linked suggestions** per [`docs/design/budget-cash-flow-graph.md`](../../../docs/design/budget-cash-flow-graph.md). A small parallel ticket covers **Compose defaults** for **`FINANCE_ALLOCATION_AUTO_TEMPLATE`**.
