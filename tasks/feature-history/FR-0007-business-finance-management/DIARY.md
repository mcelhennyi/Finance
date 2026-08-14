# FR-0007 consolidated diary (newest first)

## 2026-08-14 — source: `serial-diary.md` / design and ticket merge

Completed the layered feature design, authoritative docs page, four browser-inspected source HTML mocks, 13 canonical TEST→DEV→VAL tickets, local DAG, registry/source-index rows, global DAG nodes, progress rows, and design-ready handoff. Validation passed `git diff --check`, exact ticket/DAG/progress counts, browser rendering, and host `mkdocs build --strict`. The synced `./develop build` wrapper was unavailable because this project lacks its expected Compose/docs-service configuration. The selected first ticket is [**Define workspace, ledger, and audit contracts** (`T-FR-0007-01`)](tickets.md#t-fr-0007-01--define-workspace-ledger-and-audit-contracts); implementation has not started.

## 2026-08-14 — source: `parallel/business-workspace-ux.md`

Designed the Business experience around a persistent Personal/Business switcher and Business side navigation: Overview; Accounts & cards; Transactions; Income; Expenses; Deductions & receipts; Tax Center; Reports; Business settings. Established route/state, responsive, accessibility, privacy, and correction behavior. Required four source HTML mocks before UI ticketing and kept projected obligation, reserve target, actually reserved cash, and payments visibly distinct.

Full stream: [`parallel/business-workspace-ux.md`](parallel/business-workspace-ux.md).

## 2026-08-14 — source: `parallel/tax-accounting-domain.md`

Specified guided cash-oriented bookkeeping on balanced postings. Kept source import, accounting classification, tax treatment, evidence, reconciliation, and audit history separate/versioned. Distinguished projection, confirmed obligation, reserve target, reserved cash, and payment. Treated a flat percentage as a reserve policy—not tax due—and bounded the MVP to trustworthy books, evidence, reconciliation, reports, reserve policies, sourced obligations/payments, owner activity, and audit history.

Full stream and current official IRS references: [`parallel/tax-accounting-domain.md`](parallel/tax-accounting-domain.md).

## 2026-08-14 — source: `parallel/domain-architecture-survey.md`

Found that the existing application is one global ledger: `is_flagged_business` is unused and insufficient, account creation/dedupe/import behavior is not workspace-safe, payment-like rows are dropped, manual income can double-count deposits, and aggregate surfaces are global. Recommended one workspace-scoped canonical ledger, separate business/tax contexts, an explicit owner-transfer contract, and an executable migration/backfill path. Flagged active FR-0006 overlap; its planning nodes must reference canonical accounts rather than replace them.

Full stream: [`parallel/domain-architecture-survey.md`](parallel/domain-architecture-survey.md).

## 2026-08-14 — source: `serial-diary.md` / intake and reservation

Reserved `FR-0007` on the default branch and pushed commit `8293beb` before design. Interpreted the request as a first-class Business workspace for a one-owner contract-work business, multi-business-safe in its identifiers, with automatic Business-to-Personal income/budget posting deferred.

## Executive summary

All design streams converge on one result: Business is an enforced workspace on a shared canonical ledger, with balanced books and tax/evidence contexts that remain separate and auditable. The feature is ready for an implementation decision, not marked complete.

## Suggested next step

Run `/identify-frontier` and `/develop-frontier` only if the product owner chooses implementation now. Record the FR-0006 integration base before `T-FR-0007-01` DEV.

## Options

- **A — Recommended:** begin the 13-ticket foundation-first DAG.
- **B:** hold at design for review.
- **C:** explicitly close as design-only work.
