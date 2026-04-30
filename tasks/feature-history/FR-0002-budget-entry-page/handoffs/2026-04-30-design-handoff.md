# FR-0002 — Design handoff (2026-04-30)

## Executive summary

Reserved **FR-0002 budget entry page** and created the design/ticket artifacts for manual budget allocation entry. The feature is scoped to manual entry first, using the provided spreadsheet sample only as evidence for supported data and calculations, not as source language or UI design.

Canonical implementation tickets are now defined in `tickets.md`:

- **Define budget allocation contracts** (`T-FR-0002-01`)
- **Expose budget allocation API** (`T-FR-0002-02`)
- **Sync allocation totals into unified budgets** (`T-FR-0002-03`)
- **Deliver budget entry page** (`T-FR-0002-04`)
- **Validate and document budget entry workflow** (`T-FR-0002-05`)

## Suggested next step

Run `/identify-frontier`, then start implementation with `/develop-frontier`. The first eligible ticket should be **Define budget allocation contracts** (`T-FR-0002-01`) because its cross-feature dependency, **Deliver Phase 2 unified dashboard view** (`T-FR-0001-05`), is already VAL-done.

## Options

- **A.** Start implementation now with the frontier workflow.
- **B.** Pause after design and review the FR-0002 contracts before implementation.
