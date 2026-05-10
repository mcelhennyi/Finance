# FR-0003 — BBD projection web UI

**Status:** **`complete`** per [`REGISTRY.md`](../REGISTRY.md). Baseline tickets **[`T-FR-0003-01`](tickets.md)**–**[`04`](tickets.md)** and follow-up on **`feat/FR-0003-bbd-ui-followup`** are integrated on **`master`**. Follow-up PR **[#6](https://github.com/mcelhennyi/Finance/pull/6)** merged **2026-05-10**. **Closeout:** [`90-closeout.md`](90-closeout.md) · **planned vs actual:** [`planned-vs-actual.md`](planned-vs-actual.md) · **finish handoff:** [`handoffs/2026-05-02-finish-feature.md`](handoffs/2026-05-02-finish-feature.md).

**Earlier tranche:** landed on default branch (**`master`**) before the modal/preset/hydrate follow-up documented in **`planned-vs-actual.md`**.  

**Script:** [`scripts/bbd_projection.py`](../../../scripts/bbd_projection.py)

## Artifacts

| Doc | Purpose |
|-----|---------|
| [`00-intake.md`](00-intake.md) | Goals and success criteria |
| [`10-design-00-skeleton.md`](10-design-00-skeleton.md) | Public surfaces (API + UI contracts) |
| [`20-tickets-dag.md`](20-tickets-dag.md) | Ticket table + Mermaid DAG (draft mirrors `tickets.md`) |
| [`tickets.md`](tickets.md) | Canonical **`T-FR-0003-xx`** sections |
| [`serial-diary.md`](serial-diary.md) | Serial session notes |

## Summary

Expose the Buy, Borrow, Die projection model via a backend API (wrapping importable simulation code) and a React page to edit scenario inputs, run deterministic and optional Monte Carlo projections, and view schedules and terminal estate comparisons.
