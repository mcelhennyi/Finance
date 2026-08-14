# FR-0007 — Business finance management

## Status

`design` — layered design, four source HTML mocks, and 13 canonical implementation tickets are ready for review. Implementation has not started.

## Purpose

Add a distinct business side to Finance Hub for managing contract-work finances: business accounts and credit cards, income and expenses, tax deductions, estimated tax obligations, reserved tax cash, and tax payments. The design must preserve a clear business/personal boundary while leaving a governed path for the business to fund personal income and budgets later.

## Artifacts

- [`00-intake.md`](00-intake.md) — goals, assumptions, success criteria, and deferred scope
- [`10-design-00-skeleton.md`](10-design-00-skeleton.md) — public surfaces and domain boundaries
- [`10-design-01-ledger-and-tax-model.md`](10-design-01-ledger-and-tax-model.md) — accounting, tax, reserve, and transfer lifecycles
- [`10-design-02-experience.md`](10-design-02-experience.md) — business workspace information architecture and flows
- [`docs/design/business-finance.md`](../../../docs/design/business-finance.md) — authoritative design summary and four source mocks
- [`20-tickets-dag.md`](20-tickets-dag.md) — 13-ticket work breakdown and dependency graph
- [`tickets.md`](tickets.md) — canonical **`T-FR-0007-01`** through **`T-FR-0007-13`** bodies
- [`serial-diary.md`](serial-diary.md), [`parallel/`](parallel/), [`DIARY.md`](DIARY.md) — traceable design history
- [`handoffs/2026-08-14-design-ready.md`](handoffs/2026-08-14-design-ready.md) — resumable design-ready handoff

## Executive summary

FR-0007 is designed as a first-class, server-enforced Business workspace on one shared canonical ledger. The first slice covers accounts/cards, imports and reconciliation, balanced bookkeeping, evidence-backed deduction review, tax planning/reserves/payments, reports, and Business UX. It defines—but does not activate—an idempotent owner-transfer bridge into Personal.

## Suggested next step

Choose whether to begin implementation. If yes, record the current FR-0006 integration state, then run `/identify-frontier` followed by `/develop-frontier`; the only initially eligible ticket is [**Define workspace, ledger, and audit contracts** (`T-FR-0007-01`)](tickets.md#t-fr-0007-01--define-workspace-ledger-and-audit-contracts).

## Options

- **A — Recommended:** start the foundation-first ticket DAG with `/identify-frontier` and `/develop-frontier`.
- **B:** pause after design for product/accounting review; implementation remains untouched.
- **C:** close this as design-only work with `90-closeout.md`; a later continuation can reopen the same FR without allocating a new id.
