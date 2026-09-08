# FR-0007 serial diary

## 2026-08-14 — intake and deconflicted reservation

**Stage:** intake / registry reservation

Reserved **`FR-0007-business-finance-management`** from `origin/master`, advanced the registry counter to 8, committed reservation as `8293beb`, and pushed `master` before doing substantial design work. The raw request is for a distinct business side of Finance Hub covering business credit cards, income, expenses, deductions, taxes due, protected tax cash, and payments, with later Business-to-Personal funding.

Selected a **foundation-first** posture: hard workspace isolation and reliable books precede tax calculations or dashboards. Automatic Personal posting, payroll, sales tax, invoicing, filing/payment initiation, and a full tax engine are deferred.

## 2026-08-14 — parallel discovery

**Stage:** domain, accounting/tax, and experience exploration

Ran three explicit parallel design streams required by the feature-request workflow:

- [`parallel/domain-architecture-survey.md`](parallel/domain-architecture-survey.md) found a global unscoped ledger, insufficient dedupe, dropped card-payment rows, global aggregate queries, unsafe migration conventions, and an active FR-0006 collision.
- [`parallel/tax-accounting-domain.md`](parallel/tax-accounting-domain.md) established a balanced cash-oriented subledger, separate source/accounting/tax/evidence/reconciliation lifecycles, exact-money invariants, reserve-versus-obligation language, first-slice fixtures, and current official IRS references.
- [`parallel/business-workspace-ux.md`](parallel/business-workspace-ux.md) established the Personal/Business switcher, Business route/navigation model, state matrices, four source-mock requirements, and accessibility/security/responsive expectations.

The three streams agreed that Business must be an enforced workspace/entity scope—not `is_flagged_business`, a client filter, or a duplicated application.

## 2026-08-14 — layered design and source mocks

**Stage:** L0–L4 design / visual authority

Authored the intake, skeleton, ledger/tax, experience, and authoritative docs design. Key decisions:

- one canonical workspace-scoped finance platform;
- immutable source transactions plus exact, balanced postings;
- preserved card payments/transfers and scoped import identity;
- separate managerial category, tax mapping, deduction assessment, evidence, and reconciliation state;
- separate tax projection, confirmed obligation, reserve target, actually reserved cash, and settled payment;
- an idempotent business-side `OwnerTransfer` seam, with automatic Personal projection deferred;
- FR-0006 cash-flow planning nodes may link to canonical accounts but cannot become the business account model.

Created four linked HTML source mocks: Business shell/overview, accounts/activity review, deductions/receipts, and Tax Center. Served them from a read-only localhost preview and inspected all four in the in-app browser at the available desktop viewport. Each rendered with the expected heading/context, no horizontal overflow, and no console errors.

## 2026-08-14 — canonical tickets and trackers

**Stage:** design-ready ticket merge

Defined 13 canonical tickets from [**Define workspace, ledger, and audit contracts** (`T-FR-0007-01`)](tickets.md#t-fr-0007-01--define-workspace-ledger-and-audit-contracts) through [**Validate the business-finance lifecycle and operator guidance** (`T-FR-0007-13`)](tickets.md#t-fr-0007-13--validate-the-business-finance-lifecycle-and-operator-guidance). Registered them in the feature registry, ticket source index, global TEST→DEV→VAL DAG, and progress tracker.

Only `T-FR-0007-01` is initially dependency-eligible. Before DEV work touches shared models/API/frontend files, the implementation handoff must state whether the active FR-0006 changes have landed, will be integrated first, or are intentionally absent from the base.

Validation passed: `git diff --check`; exact 13-ticket parity across canonical tickets, local DAG, global TEST→DEV→VAL nodes, and progress rows; all four browser mock renders; and host `mkdocs build --strict`. The synced `./develop build` wrapper could not provide the container check because this project still has `docker-compose.yml` without the wrapper's expected `compose.yaml`/`docs` service, so the installed MkDocs build was used as the documented host fallback.

## Executive summary

FR-0007 is design-ready as a foundation-first Business workspace. The design protects Personal data, preserves auditable source and accounting history, gives the owner useful tax-reserve and payment tracking without false certainty, and leaves a controlled future bridge into Personal budgeting.

## Suggested next step

If implementation is approved, run `/identify-frontier`, record the FR-0006 integration state, then use `/develop-frontier` to begin [**Define workspace, ledger, and audit contracts** (`T-FR-0007-01`)](tickets.md#t-fr-0007-01--define-workspace-ledger-and-audit-contracts).

## Options

- **A — Recommended:** start implementation with the existing 13-ticket foundation-first DAG.
- **B:** pause for product/accounting review while keeping `FR-0007` in `design`.
- **C:** explicitly close as design-only work and add `90-closeout.md`; resume later under the same FR if desired.
