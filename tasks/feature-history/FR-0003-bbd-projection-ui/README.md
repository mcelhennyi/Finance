# FR-0003 — BBD projection web UI

**Status:** design (registry + tickets landed)  
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
