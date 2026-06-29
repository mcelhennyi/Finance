# Handoff — FR-0006 expansion: account routing and allocation primitives (2026-06-29)

### Executive summary

- **Expansion recorded:** [`30-expand-2026-06-29-account-routing-allocations.md`](../30-expand-2026-06-29-account-routing-allocations.md) captures the account-edge double-click linking request, left-input/right-output account handles, pure source / pure sink / source+sink node roles, square routing, relayout, allocation expansion, filters, and account allocation counts.
- **UI mock:** [`docs/design/mockups/fr-0006-account-routing-allocation-expansion.html`](../../../../docs/design/mockups/fr-0006-account-routing-allocation-expansion.html) shows the Budget graph in context with explicit source/sink allocation primitives: paycheck source, savings sink, Amazon purchase sink, and ordinary expense sinks.
- **Ticket range expanded:** **FR-0006** now runs **`T-FR-0006-01`** through **`T-FR-0006-11`**. Original tickets **`01`–`07`** remain done; new expansion tickets **`08`–`11`** are `todo`.
- **Tracker updated:** [`tasks/ticket-progress.md`](../../../ticket-progress.md), [`20-tickets-dag.md`](../20-tickets-dag.md), [`tickets.md`](../tickets.md), [`REGISTRY.md`](../../REGISTRY.md), [`CURRENT.md`](../../../../CURRENT.md), and [`docs/design/tickets-initial.md`](../../../../docs/design/tickets-initial.md) now point away from `/finish-feature` and toward expansion implementation.

### Suggested next step

Run **`/identify-frontier`** from the feature branch, then start **Unified source/sink allocation primitive contracts** (**`T-FR-0006-08`**) and **Directional account handles and double-click linking** (**`T-FR-0006-09`**) in child worktrees under **`.worktrees/FR-0006-budget-cash-flow-graph/`**.

### Options

- **A. Parallel start:** Run **`T-FR-0006-08`** and **`T-FR-0006-09`** together. This maximizes frontier width because backend allocation primitive work and account-handle UI work are mostly separable.
- **B. Data-first:** Finish **`T-FR-0006-08`** first if the team wants the allocation primitive contract settled before any UI polish.
- **C. Restore missing design page first:** The prior FR-0006 artifacts reference `docs/design/budget-cash-flow-graph.md`, which is absent in this checkout. The expansion addendum is sufficient for implementation, but restoring a concise authoritative page would reduce future link drift.
