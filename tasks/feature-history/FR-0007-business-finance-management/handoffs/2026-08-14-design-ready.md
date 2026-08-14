# FR-0007 — Design-ready handoff (2026-08-14)

## Executive summary

FR-0007 is fully designed and ticketed but not implemented. It introduces a server-enforced Business workspace on the shared Finance Hub platform for business accounts/cards, balanced income and expense bookkeeping, receipt/evidence and deduction review, statement reconciliation, tax obligation/reserve/payment tracking, reports, and a future governed owner-transfer bridge into Personal.

Canonical implementation runs from:

- [**Define workspace, ledger, and audit contracts** (`T-FR-0007-01`)](../tickets.md#t-fr-0007-01--define-workspace-ledger-and-audit-contracts)
- through [**Validate the business-finance lifecycle and operator guidance** (`T-FR-0007-13`)](../tickets.md#t-fr-0007-13--validate-the-business-finance-lifecycle-and-operator-guidance)

Only `T-FR-0007-01` is initially dependency-eligible.

## What is ready

- Intake and foundation-first scope: [`../00-intake.md`](../00-intake.md)
- L0 public surfaces and boundaries: [`../10-design-00-skeleton.md`](../10-design-00-skeleton.md)
- Accounting, tax, reserve, evidence, reconciliation, migration, security, and fixtures: [`../10-design-01-ledger-and-tax-model.md`](../10-design-01-ledger-and-tax-model.md)
- Business UX, routes, state matrix, responsive/a11y/security contracts: [`../10-design-02-experience.md`](../10-design-02-experience.md)
- Authoritative docs design and linked source mocks: [`../../../../docs/design/business-finance.md`](../../../../docs/design/business-finance.md)
- Canonical ticket bodies and DAG: [`../tickets.md`](../tickets.md), [`../20-tickets-dag.md`](../20-tickets-dag.md)
- Consolidated evidence/history: [`../DIARY.md`](../DIARY.md)

## Mandatory implementation preflight

The active FR-0006 line overlaps core models, API registration, frontend shell, dependency files, and validation infrastructure. Before `T-FR-0007-01` DEV, record one explicit integration state:

1. FR-0006 has landed in the implementation base;
2. FR-0006 will be rebased/integrated before overlapping FR-0007 work; or
3. FR-0007 intentionally starts without FR-0006, with later merge risk accepted and tracked.

FR-0006 `CashFlowNode`/allocation objects may reference canonical FR-0007 accounts; they must not become the business account ledger.

## Non-negotiable invariants

- Workspace scope is required and server-enforced for roots, queries, writes, totals, caches, dedupe, and exports.
- Exact posted money balances per currency; splits conserve source amounts.
- Source facts and posted history are not silently mutated or deleted.
- Card payments, reserve transfers, and owner contributions/draws remain profit-neutral.
- Projection, confirmed obligation, reserve target, reserved cash, and tax payment remain separate.
- Evidence/category suggestions never become an automatic deduction verdict.
- The first release defines the business-side owner-transfer id but creates no automatic Personal event.

## Git state

- Default branch: `master`
- Skeleton-sync base commit: `8e2d77b`
- FR reservation commit already on the remote: `8293beb`
- Feature state remains `design`; no product code or ticket phase is complete.

## Validation evidence

- `git diff --check` passed.
- Canonical ticket, local DAG, global TEST→DEV→VAL, and progress counts each resolve to 13.
- All four source mocks rendered in the in-app browser with correct context/headings, no desktop horizontal overflow, and no console errors.
- `mkdocs build --strict` passed on the host.
- `./develop build` was attempted first but this project has `docker-compose.yml` without the synced wrapper's expected `compose.yaml`/`docs` service; this repository configuration gap remains for implementation/setup work.

## Suggested next step

Choose implementation or design-only stop. For implementation, run `/identify-frontier`, record the FR-0006 integration state, then use `/develop-frontier` for [**Define workspace, ledger, and audit contracts** (`T-FR-0007-01`)](../tickets.md#t-fr-0007-01--define-workspace-ledger-and-audit-contracts).

## Options

- **A — Recommended:** begin implementation with the 13-ticket foundation-first DAG.
- **B:** pause in `design` for product/accounting review.
- **C:** close as design-only with `90-closeout.md`; later resume this same FR instead of allocating another id.
