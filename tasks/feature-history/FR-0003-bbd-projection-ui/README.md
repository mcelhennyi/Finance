# FR-0003 — BBD projection web UI

**Status:** follow-up **`feat/FR-0003-bbd-ui-followup`** — **planned vs actual**: [`planned-vs-actual.md`](planned-vs-actual.md) · **finish handoff**: [`handoffs/2026-05-02-finish-feature.md`](handoffs/2026-05-02-finish-feature.md) · **PR:** *(replace after `gh pr create`)*  

**Earlier tranche:** complete on default branch (**`master`**) prior to modal/preset/hydrate follow-up (**`T-FR-0003-01`**–**`04`** baseline).  

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
