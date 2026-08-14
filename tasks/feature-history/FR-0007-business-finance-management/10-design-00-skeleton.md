# FR-0007 — Design (level 0, skeleton)

## Purpose

Add a first-class Business workspace to Finance Hub that keeps business books isolated from personal finances while reusing the same local-first platform. The workspace owns business accounts, balanced activity, income/expense classification, deduction evidence, tax planning, reserve cash, tax payments, reports, and a future governed bridge into personal budgeting.

## Actors

- **Business owner:** imports account activity, reviews books, protects tax cash, records obligations/payments, and reads reports.
- **Tax professional or accountant (external reviewer):** receives traceable exports and may supply confirmed obligations; collaborative access is deferred.
- **Financial institution or statement source:** supplies business checking, savings, reserve-account, card, and payment activity.
- **Tax authority:** defines jurisdiction-specific obligations and receives recorded payments; Finance Hub does not submit payments in the first slice.
- **Personal Finance workspace:** future recipient of explicit owner-pay events, never of unreviewed business profit.

## Architectural decisions

1. **Workspace is the boundary.** Every account, source transaction, journal entry, business classification, document, rule, tax record, query, and export carries a required workspace id. The existing `Transaction.is_flagged_business` remains only a legacy review hint.
2. **One canonical finance platform.** Personal and business workspaces share parser, storage, API, and UI infrastructure; business bookkeeping and tax contexts attach to the shared account/ledger boundary instead of duplicating the whole application.
3. **Balanced business postings.** Imported/manual source facts are immutable. Guided classifications create exact-money debit/credit postings that balance per currency, so card payments, reserve transfers, owner activity, and refunds do not become duplicate income or expense.
4. **Tax states stay separate.** Projection, confirmed obligation, reserve target, reserved cash, filing evidence, and settled payment are different records and values.
5. **Evidence does not equal eligibility.** Managerial category, tax-category mapping, deduction assessment, business-use allocation, and supporting documents have separate lifecycles and provenance.
6. **Personal integration is an explicit bridge.** The first slice defines business-side `OwnerTransfer` identity and types but defers automatic personal posting.
7. **FR-0006 planning nodes are not accounts.** Budget cash-flow nodes may later link to a canonical account; they cannot become the business ledger or durable account identity.

## Public surfaces (skeleton)

| Surface | Kind | Contract sketch | Logical owner |
|---|---|---|---|
| `FinanceWorkspace` | Domain type | `{id, kind: personal|business, name, base_currency, status}` | Workspace directory |
| `BusinessProfile` | Domain type | `{workspace_id, legal_form, federal_tax_classification, accounting_method, jurisdictions[], tax_year, effective_from}` with `unknown` supported | Business configuration |
| `/api/workspaces` | REST | List/create workspaces; existing data resolves only to the seeded Personal workspace during compatibility migration | Workspace API |
| `/api/workspaces/{workspace_id}/business-profile` | REST | Read/update effective-dated business identity and tax configuration | Business API |
| `LedgerAccount` | Domain type | Workspace-scoped asset/liability/equity/income/expense account with operational role and currency | Ledger |
| `SourceTransaction` | Domain type | Immutable imported/manual fact with account, source id/fingerprint, provenance, raw amount, dates, and status | Ingestion |
| `JournalEntry` / `Posting` | Domain types | Posted event whose non-negative debit/credit lines balance exactly per currency; corrections reverse/supersede | Ledger |
| `/api/workspaces/{workspace_id}/accounts` | REST | CRUD/archive business accounts, balance snapshots, and statement periods; reject cross-workspace ids | Accounts API |
| `/api/workspaces/{workspace_id}/accounts/{account_id}/imports` | REST | Preview/commit import to a locked target account; preserve charges, deposits, fees, refunds, transfers, and card payments | Ingestion API |
| `/api/workspaces/{workspace_id}/transactions` | REST | Scoped activity with source, account, type, category, review, evidence, deduction, and reconciliation summaries | Ledger query API |
| `TransactionAllocation` | Domain type | Split lines conserve the source amount and separate business/nonbusiness treatments | Bookkeeping |
| `DeductionAssessment` | Domain type | Versioned status, business-use amount/percent, tax mapping, evidence state, reviewer, and provenance | Tax readiness |
| `EvidenceItem` | Domain type | Private immutable document metadata/content hash with safe storage ref and retention policy | Evidence store |
| `/api/workspaces/{workspace_id}/business/review` | REST | Classify/split activity, link evidence, record business purpose, reverse/supersede reviewed facts | Bookkeeping API |
| `TaxEstimateVersion` | Domain type | Immutable planning snapshot with inputs, missing inputs, ruleset/source version, trace, confidence, and result | Tax planning |
| `TaxObligation` | Domain type | Jurisdiction/type/period/due date/amount/source/status; links estimates, evidence, and payments | Tax ledger |
| `ReservePolicy` / `ReservePosition` | Domain types | Versioned target rule plus actual reconciled cash/bucket position, pending transfers, and gap/surplus | Reserve planning |
| `TaxPayment` | Domain type | Scheduled/pending/settled/reversed payment linked to bank activity, obligations, and confirmation evidence | Tax ledger |
| `/api/workspaces/{workspace_id}/business/taxes/*` | REST | Estimate versions, obligations, reserve policies/positions, payment matching, and tax calendar configuration | Tax API |
| `BusinessFinanceSummary` | Read model | Period/as-of cash, income, expense, profit, account/card, review queue, tax target/due/reserved/paid/gap, and reconciliation state | Reporting |
| `/api/workspaces/{workspace_id}/business/summary` | REST | Workspace-qualified attention-first overview; every total includes provenance/status/as-of metadata | Reporting API |
| `/api/workspaces/{workspace_id}/business/reports/*` | REST/export | Cash P&L, cash movement, account reconciliation, income, deduction/evidence, tax reserve/payment, owner activity, and audit exports | Reporting |
| `OwnerTransfer` | Deferred bridge type | `{id, business_workspace_id, personal_workspace_id, kind, amount, date, business_entry_id, personal_event_id?, status, idempotency_key}` | Workspace bridge |
| `/business/:businessId/*` | UI routes | Addressable Business shell: overview, accounts, transactions, income, expenses, deductions, taxes, reports, settings | Business frontend |

## Data in / out

| Input | Output | Storage |
|---|---|---|
| Bank/card CSV or manual event | Immutable source facts, import review, balanced postings, unresolved queue | Workspace/account-scoped source and ledger tables |
| Receipt, invoice, statement, tax notice, or payment confirmation | Safe evidence object, content hash, completeness state, linked audit record | Private evidence storage plus relational metadata |
| Classification, split, business purpose, tax mapping | Versioned business allocation and deduction assessment | Business bookkeeping context |
| Business/profile/tax assumptions | Effective-dated profile, ruleset selection, warnings | Business/tax configuration |
| Book totals plus outside-business inputs | Versioned estimate or incomplete projection with trace | Tax estimate snapshots |
| User/adviser schedule or authority notice | Confirmed/planned obligation | Tax obligations |
| Reserve policy and matched transfers | Target, actual reserved cash, pending amount, gap/surplus | Reserve policies plus ledger links |
| Recorded/matched authority payment | Paid/remaining obligation and reserve roll-forward | Tax payment plus ledger/evidence links |
| Reporting request | Traceable screen/CSV export with business, basis, period, as-of, states, and versions | Generated result; no hidden editable totals |
| Future owner transfer | One business event and, later, exactly one linked personal inflow | Paired workspace records plus bridge identity |

## Compatibility and migration boundary

- Seed one Personal workspace and backfill existing accounts, transactions, income/liabilities, budgets/goals, ingestion logs, and rules before business writes are enabled.
- Replace global account-name uniqueness and unscoped dedupe with workspace/account keys.
- Existing unqualified endpoints temporarily target Personal only and never return a union of Personal and Business.
- Install an executable migration path; runtime `create_all()` and SQL stubs cannot safely backfill deployed SQLite databases.
- Legacy business flags are reviewed at account/transaction level; they are not automatically moved into Business books.

## Selected first-slice scope

- One Business workspace UX, multi-business-safe ids.
- Cash-oriented books backed by balanced postings.
- Business checking, reserve cash, credit cards, manual and CSV activity.
- Guided income, expense, split, transfer, card-payment, owner-contribution/draw, refund, tax-payment, and needs-review classifications.
- Receipt/evidence storage, deduction-review queue, statement reconciliation, cash P&L and exports.
- Reserve percentage/manual targets; actual reserved cash; manual/adviser-confirmed obligations; recorded/matched payments.
- Stable business-side owner-transfer id, with personal projection deferred.

## Deferred modules

Tax filing/payment initiation, complete federal/state/local tax engines, payroll/employment tax, sales tax, invoicing/AR/AP, inventory/COGS, fixed assets/depreciation, mileage/home-office calculators, accrual close, multi-owner/entity consolidation, roles/collaboration, live bank feeds, and automatic personal-budget posting.

## Risks carried into deeper design

- Shared model/API/frontend files overlap active FR-0006 work. Implementation must begin from an explicit FR-0006 integration state.
- Tax claims age quickly; rates, calendars, forms, entity treatment, and jurisdiction packs require source/review dates and effective versions.
- Evidence contains sensitive financial and identity information and requires private storage, safe rendering, audit, retention, backup, and redacted export behavior.
- A virtual reserve bucket can overstate protected cash unless allocations are bounded by a real reconciled account balance.
