# Tickets — FR-0007 business finance management

**Feature id:** **`FR-0007`**
**Canonical ids:** **`T-FR-0007-xx`**
**Delivery posture:** Foundation-first. Automatic Business-to-Personal posting remains deferred.

---

### T-FR-0007-01 — Define workspace, ledger, and audit contracts

**Title:** Define workspace, ledger, and audit contracts
**Deps:** none

#### Purpose

Freeze the shared contracts that make Personal and Business separate workspaces on one canonical finance platform. Define workspace identity, accounts, immutable source facts, balanced journal entries/postings, splits, corrections, reconciliation, and the business-side owner-transfer seam before persistence or UI work begins.

#### Why this ticket exists

The current application is a global ledger and `is_flagged_business` is not an isolation boundary. Every later ticket needs one vocabulary for scope, money, balance, provenance, and audit history.

#### Primary areas

- `src/finance/workspaces/`, `src/finance/ledger/`, `src/finance/business/` (new contract modules)
- `src/finance/db/models.py`, `src/api/schemas.py`
- [`10-design-00-skeleton.md`](10-design-00-skeleton.md) and [`10-design-01-ledger-and-tax-model.md`](10-design-01-ledger-and-tax-model.md)

#### Out of scope

Database backfill, live endpoints, business UI, automatic Personal projection, payroll, and tax calculation.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Freeze invariants | Contract tests cover required workspace ids, exact money, balanced per-currency postings, split conservation, reversal/supersession, and owner-transfer idempotency |
| **DEV** | Implement shared contracts | Enums/DTOs/value objects exist with version fields and no persistence writes; FR-0006 integration state and overlapping files are recorded before DEV changes |
| **VAL** | Prove readable interoperability | OpenAPI/schema examples express card purchase/payment, reserve transfer, owner draw, and correction without ambiguity; design deviations are documented |

#### Acceptance criteria

- Workspace scope is required by every new root contract.
- Posted entries cannot be unbalanced or use binary floating-point money.
- `SourceTransaction` is immutable; corrections use an audited replacement chain.
- `OwnerTransfer` defines business identity and idempotency without creating Personal data.
- FR-0006 cash-flow nodes can reference canonical accounts but cannot substitute for them.

---

### T-FR-0007-02 — Install migrations and backfill the Personal workspace

**Title:** Install migrations and backfill the Personal workspace
**Deps:** `T-FR-0007-01`

#### Purpose

Add a repeatable executable migration path, create the workspace/ledger foundation, seed one Personal workspace, and safely backfill all existing finance scope roots before Business writes are enabled.

#### Why this ticket exists

Runtime `create_all()` and SQL stubs cannot safely evolve deployed local databases or verify cross-table backfills. Business isolation depends on a migration that preserves every existing Personal record.

#### Primary areas

- `src/finance/db/`, `src/finance/db/migrations/`, migration entrypoint/configuration
- `src/finance/db/models.py`, `src/finance/db/session.py`
- migration fixtures under `tests/`

#### Out of scope

Business statement import, user-facing workspace switching, and reclassifying legacy flagged rows into Business.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Protect existing data | Upgrade tests start from representative legacy SQLite data and assert row counts, relationships, Personal ownership, indexes, and audit queries |
| **DEV** | Deliver executable migration | Workspace and canonical ledger tables/keys are installed; existing accounts, transactions, income/liability, rules, goals/budgets, and ingest records are backfilled before non-null enforcement |
| **VAL** | Verify upgrade and recovery | Fresh install and legacy upgrade pass; pre-migration backup/export and restore procedure is documented; orphan/cross-scope audits return zero |

#### Acceptance criteria

- Re-running the migration is safe or rejected with a clear version state.
- Existing unqualified data belongs only to seeded Personal.
- Account uniqueness and dedupe keys can be scoped by workspace/account.
- Legacy `is_flagged_business` values remain review hints and move no records automatically.
- Migration failure leaves a recoverable pre-upgrade database.

---

### T-FR-0007-03 — Enforce workspace isolation across existing finance surfaces

**Title:** Enforce workspace isolation across existing finance surfaces
**Deps:** `T-FR-0007-02`

#### Purpose

Make workspace scope mandatory in repositories, services, endpoints, caches, summaries, rules, and exports. Preserve temporary legacy routes as Personal-only compatibility adapters rather than returning Personal and Business together.

#### Why this ticket exists

Accounts, transactions, metrics, filters, merchants, income/liabilities, goals/budgets, and unified summaries are currently global. A workspace switcher without server-side enforcement would leak or corrupt finance data.

#### Primary areas

- `src/api/main.py`, `src/api/routers/`, `src/finance/`
- `frontend/src/api/client.ts`, query/cache keys, contract types
- API isolation tests under `tests/`

#### Out of scope

Business-specific bookkeeping, evidence, tax records, and the final Business UI.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Specify fail-closed scope | Matrix tests cover Personal, Business, wrong-workspace ids, guessed ids, legacy endpoints, cache separation, and aggregate isolation |
| **DEV** | Thread scope end to end | Workspace-qualified routes/repositories/services are implemented; compatibility routes explicitly resolve Personal; cache/query keys include workspace identity |
| **VAL** | Audit every surface | Existing Personal tests still pass, cross-workspace probes return no data or existence leak, and a route/query inventory has no unscoped root access |

#### Acceptance criteria

- No business record can be read, mutated, aggregated, exported, or deduplicated through another workspace.
- Route ids are treated as inputs, not authorization.
- Existing Personal UX remains functional through the compatibility period.
- Workspace identity is present in audit entries and generated exports.
- Errors and logs do not disclose another workspace or sensitive finance content.

---

### T-FR-0007-04 — Import and reconcile business accounts and cards

**Title:** Import and reconcile business accounts and cards
**Deps:** `T-FR-0007-03`

#### Purpose

Support workspace-scoped business checking, reserve cash, and credit-card accounts; preview/commit manual or CSV activity to a locked account; preserve transfers and card payments; and reconcile statement periods.

#### Why this ticket exists

The current ingest path may collapse institutions into one account, uses insufficient dedupe scope, and drops payment-like rows. Those behaviors make business card and cash reconciliation unreliable.

#### Primary areas

- `src/finance/ingestion/`, `src/api/routers/ingest.py`
- new account/reconciliation services and routers
- account/import/reconciliation tests under `tests/`

#### Out of scope

Live institution feeds, credential storage, PDF/OCR statements, and automatic transaction classification.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Freeze import/reconciliation behavior | Fixtures cover checking, card, reserve, charges, deposits, refunds, fees, card payments, two legitimate identical-looking rows, replay, and closing-balance reconciliation |
| **DEV** | Implement scoped account books | Account CRUD/archive, locked-target preview/commit, scoped stable dedupe, balance snapshots, and statement close/reopen are implemented |
| **VAL** | Reconcile realistic statements | Representative checking/card pair reaches zero unexplained difference; import replay is idempotent; no payment/transfer row is silently dropped |

#### Acceptance criteria

- Source account identity maps to one effective canonical account.
- Possible duplicates remain reviewable; only stable scoped identity suppresses replay.
- Reconciled facts cannot be silently edited or deleted.
- Account balances disclose type, source, as-of time, and reconciliation state.
- Business imports cannot target Personal accounts or vice versa.

---

### T-FR-0007-05 — Classify business income, expenses, and owner activity

**Title:** Classify business income, expenses, and owner activity
**Deps:** `T-FR-0007-04`

#### Purpose

Create guided, balanced review actions for income, expense, split, transfer, card payment, refund, owner contribution/draw, tax payment, and needs-review activity. Prevent manual income and imported deposits from counting twice.

#### Why this ticket exists

Business totals are trustworthy only when economic meaning is separate from raw statement text and every classification conserves the source amount.

#### Primary areas

- new bookkeeping/review service under `src/finance/business/`
- ledger posting services and workspace-qualified review API
- classification, split, matching, and correction tests

#### Out of scope

Payroll, distributions for unsupported entity types, invoices/receivables, automatic Personal income, and tax deduction decisions.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Specify economic meaning | Posting fixtures cover all supported review actions, mixed-use splits, processor net deposits, refunds, double-count prevention, and closed-period correction |
| **DEV** | Deliver guided classification | Review/match/split/reverse/supersede APIs create balanced entries and versioned business context while retaining source facts |
| **VAL** | Reconcile books and totals | Card purchase plus payment creates one expense; income is counted once; transfer/owner activity is profit-neutral; audit history reconstructs every total |

#### Acceptance criteria

- Allocation lines conserve the classifiable amount exactly.
- Manual income can be matched to a deposit without duplicate revenue.
- Netted deposits can express gross income plus fees while matching cash.
- User-visible categories do not overwrite ledger or source provenance.
- Owner events create a stable business-side transfer identity but no Personal event.

---

### T-FR-0007-06 — Store receipts and review deduction candidates

**Title:** Store receipts and review deduction candidates
**Deps:** `T-FR-0007-05`

#### Purpose

Add private evidence storage and a versioned deduction-review context for business purpose, managerial category, tax mapping, business-use allocation, candidate/reviewed/excluded status, and provenance.

#### Why this ticket exists

A transaction category is neither proof nor a tax verdict. Evidence and reviewer decisions must remain traceable without mutating source transactions or claiming authority approval.

#### Primary areas

- new evidence and deduction modules under `src/finance/business/`
- private content storage configuration and workspace-qualified APIs
- upload/security/deduction tests under `tests/`

#### Out of scope

OCR extraction, email receipt ingestion, tax eligibility guarantees, mileage/home-office calculators, and adviser collaboration roles.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Specify secure evidence states | Tests cover allowed/rejected content, size/type mismatch, duplicate hash, workspace isolation, mixed-use amounts, candidate/reviewed/excluded transitions, and retention metadata |
| **DEV** | Implement evidence-backed review | Safe storage refs/content hashes, links, business-purpose fields, reviewer/provenance, and superseding assessments are implemented |
| **VAL** | Prove privacy and traceability | Unsafe content is never rendered inline; evidence is absent from normal logs/URLs; exports show evidence state without leaking private content |

#### Acceptance criteria

- Managerial category, tax mapping, business use, evidence, and assessment are separate records/fields.
- Automation can suggest only a candidate state.
- Business-use amount/percent is exact and reconciles to the reviewed allocation.
- Evidence archive/retention actions are audited.
- Copy and API states never imply “IRS approved” or guaranteed deductibility.

---

### T-FR-0007-07 — Plan tax obligations and reserve targets

**Title:** Plan tax obligations and reserve targets
**Deps:** `T-FR-0007-05`

#### Purpose

Model versioned reserve policies, incomplete/provisional estimate snapshots, and manual/adviser/authority-sourced tax obligations with jurisdiction, type, period, due date, provenance, and effective ruleset/source metadata.

#### Why this ticket exists

A reserve percentage is not tax due, and business-only books are often insufficient to calculate the owner's total obligation. The first slice needs useful planning without false certainty.

#### Primary areas

- new tax planning modules under `src/finance/business/tax/`
- workspace-qualified tax configuration/estimate/obligation APIs
- effective-date, versioning, and incomplete-state tests

#### Out of scope

Filing, payment initiation, a complete federal/state/local tax engine, payroll/sales tax workflows, and individualized tax advice.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Freeze tax uncertainty contracts | Tests cover reserve percent/manual targets, missing inputs, immutable estimate versions, supersession, confirmed/manual obligations, jurisdictions, and stale rulesets |
| **DEV** | Implement planning records | Reserve policies and obligation/estimate versions expose included/excluded inputs, source/review date, as-of time, status, and trace |
| **VAL** | Eliminate false certainty | Incomplete data cannot display as `$0 due` or confirmed; flat percentages are labeled reserve targets; current-source review requirement is documented |

#### Acceptance criteria

- Projection, obligation, and reserve target use distinct types and endpoints.
- Tax/legal form unknown states are supported and restrict conclusions.
- Source URL, jurisdiction, tax year, retrieved/reviewed dates, and ruleset version are retained where applicable.
- Confirmed obligations record who/what established the amount.
- No first-slice result claims to be a filed return or complete taxpayer liability.

---

### T-FR-0007-08 — Track reserved cash and tax payments

**Title:** Track reserved cash and tax payments
**Deps:** `T-FR-0007-04`, `T-FR-0007-07`

#### Purpose

Compute reserve position from policy targets and reconciled ledger cash, match proposed/settled reserve transfers, and record tax payments against obligations without blending target, cash, due, or paid values.

#### Why this ticket exists

The owner needs to know whether money is actually protected and what has actually been paid. A target or virtual bucket alone must not overstate available cash.

#### Primary areas

- reserve-position and payment services under `src/finance/business/tax/`
- ledger matching and workspace-qualified reserve/payment APIs
- reserve/payment lifecycle tests

#### Out of scope

Initiating bank transfers or tax payments, filing returns, and automated authority reconciliation.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Specify conservation and lifecycle | Tests cover target/actual/pending/paid/gap, real account and bounded bucket, partial payments, one payment across obligations, fees, reversal/refund, and stale balances |
| **DEV** | Implement reserve/payment ledgers | Reserve positions use reconciled as-of balances; transfer and authority-payment matching links posted cash events, obligations, evidence, and audit history |
| **VAL** | Reconcile cash and obligation roll-forward | Target changes no cash; matched transfer changes location not profit; settled payment conserves cash and obligation allocations; reverse/refund restores traceable state |

#### Acceptance criteria

- Reserved cash never exceeds reconciled backing cash for a virtual bucket.
- Proposed and matched reserve movements are visually/API-distinct.
- One settled payment cannot be silently linked twice.
- Payment allocations conserve the settled amount excluding explicit fees.
- Every reserve position includes basis, policy version, as-of time, and reconciliation status.

---

### T-FR-0007-09 — Expose business summaries, reports, and exports

**Title:** Expose business summaries, reports, and exports
**Deps:** `T-FR-0007-05`, `T-FR-0007-06`, `T-FR-0007-08`

#### Purpose

Build workspace-qualified read models and exports for the attention-first overview, cash P&L/movement, income, expenses, deduction/evidence register, account/card reconciliation, tax roll-forward, owner activity, and audit history.

#### Why this ticket exists

Screens and exports need one traceable source of truth that discloses period, basis, status, as-of time, and incomplete/reconciliation states instead of recomputing inconsistent totals in the client.

#### Primary areas

- new business reporting/read-model services
- workspace-qualified summary/report/export routers
- calculation, privacy, and CSV contract tests

#### Out of scope

Accrual statements, balance-sheet close, tax forms/e-file, and cross-business consolidation.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Freeze report semantics | Fixtures assert transfer-neutral profit, gross/net income reconciliation, uncategorized disclosure, reserve/payment roll-forward, periods/as-of, and workspace isolation |
| **DEV** | Implement read models and exports | Summary and report APIs return typed money/status/provenance; CSV/audit exports include business, basis, period, versions, and safe evidence references |
| **VAL** | Reconcile every headline | Overview cards reconcile to detailed reports and ledger fixtures; stale/incomplete books are labeled; exports contain no secret path or raw private document content |

#### Acceptance criteria

- Card payments, reserve transfers, and owner draws do not inflate expenses.
- Cash P&L discloses uncategorized/unreconciled amounts and accounting basis.
- Tax output keeps estimated, confirmed due, target, reserved, and paid separate.
- Export totals reproduce from identified source entries and versions.
- Generated files are workspace-scoped and auditable.

---

### T-FR-0007-10 — Deliver the addressable Business workspace shell

**Title:** Deliver the addressable Business workspace shell
**Deps:** `T-FR-0007-03`

#### Purpose

Add an explicit Personal/Business switcher, addressable Business routes, Business navigation, context-safe frontend state/cache boundaries, and first-run/loading/error/empty states based on the approved source mocks.

#### Why this ticket exists

Business must feel like a distinct side of the application while remaining deep-linkable and testable. The UI boundary reinforces—but never replaces—server enforcement.

#### Primary areas

- `frontend/src/App.tsx`, `frontend/src/components/Layout.tsx`, route/query infrastructure
- new `frontend/src/business/` or equivalent feature modules
- [`10-design-02-experience.md`](10-design-02-experience.md) and the four linked source mocks

#### Out of scope

Completed bookkeeping/tax editors, automatic Business-to-Personal transfer UI, and disabled teaser navigation for deferred features.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Specify route/context behavior | Frontend tests cover deep links, workspace switch, unsaved-change guard, query-key separation, no-business setup, not-found/forbidden, and narrow navigation |
| **DEV** | Build shell and states | Global workspace switcher, Business entity cues, routes/nav, overview skeleton/attention states, and responsive accessible shell match source HTML authority |
| **VAL** | Browser-validate context | Desktop and phone walkthroughs confirm focus restoration, semantic landmarks, visible focus, no horizontal overflow, masked ids, and no Personal/Business cache bleed |

#### Acceptance criteria

- Business/entity identity is visible on every Business route without relying on color.
- URL ids never bypass server-side scope checks.
- Context switching handles unsaved work explicitly.
- Phone uses a context drawer/cards/full-screen editors instead of compressed desktop tables.
- Deferred Personal integration is described only in settings/help, not as a broken action.

---

### T-FR-0007-11 — Deliver business books and deduction workflows

**Title:** Deliver business books and deduction workflows
**Deps:** `T-FR-0007-05`, `T-FR-0007-06`, `T-FR-0007-10`

#### Purpose

Deliver the user-facing Accounts & cards, Transactions, Income, Expenses, and Deductions & receipts workflows: import preview, review queues, detail editors, splits, matches, corrections, evidence, and reconciliation states.

#### Why this ticket exists

The owner needs one coherent daily bookkeeping loop from statement activity to reviewed, evidence-backed books—not disconnected CRUD forms.

#### Primary areas

- new Business pages/components and `frontend/src/api/client.ts`
- frontend view models/tests for money, split conservation, and state labels
- source authority: activity-review and deductions-receipts HTML mocks

#### Out of scope

OCR, live feeds, batch tax verdicts, payroll/invoicing, and Personal-account reimbursements.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Specify end-user flows | Component/integration tests cover import preview, possible duplicates, card payment, income match, split, missing/rejected evidence, reconciled correction, and API errors |
| **DEV** | Implement books UI | Tables/cards, search/filter, drawers/full-screen editors, sticky actions, review counts, audit/correction warnings, evidence states, and accessible status copy are wired to scoped APIs |
| **VAL** | Walk the bookkeeping lifecycle | Browser walkthrough imports checking/card fixtures, classifies and splits activity, attaches evidence, reconciles a period, and proves headline totals update once |

#### Acceptance criteria

- Card payments appear for matching but never in expense totals.
- Manual income/imported deposit matching prevents double count.
- Split UI prevents or clearly resolves non-conserving amounts.
- Deduction copy distinguishes candidate, reviewed, needs evidence, and excluded.
- Corrections explain report impact and require the supported reopen/reversal path.

---

### T-FR-0007-12 — Deliver Tax Center and reports workflows

**Title:** Deliver Tax Center and reports workflows
**Deps:** `T-FR-0007-08`, `T-FR-0007-09`, `T-FR-0007-10`

#### Purpose

Deliver Tax Center Overview/Estimates/Reserves/Payments and Business Reports with clear estimate-only language, separate financial states, due dates, source/version detail, reserve gaps, payment matching, and safe exports.

#### Why this ticket exists

Tax readiness is useful only when the owner can distinguish a planning estimate, confirmed obligation, desired reserve, protected cash, and actual payment at a glance.

#### Primary areas

- new Tax Center and Reports pages/components
- frontend tax/report view models and API client methods
- source authority: tax-center and business-overview HTML mocks

#### Out of scope

Tax filing, payment/transfer initiation, automatic deadline guarantees, and a full taxpayer calculator.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Specify truthful states | Frontend tests cover unconfigured/incomplete/stale estimate, confirmed due, target-only, pending/matched reserve, partial/paid/reversed payment, report generation/export errors |
| **DEV** | Implement Tax Center and reports | Separate cards/tabs, assumption/source detail, reserve position, obligation/payment history, report filters, tables/text alternatives, and safe download flows are wired |
| **VAL** | Browser-validate tax clarity | A full walkthrough proves no state is mislabeled, target changes do not imply moved cash, settled payments update the right roll-forward, and responsive/a11y behavior matches design |

#### Acceptance criteria

- Estimated obligation, confirmed due, reserve target, reserved cash, and payments are never collapsed.
- Incomplete assumptions never render as `$0 due`.
- “Record transfer/payment” describes recording or matching unless initiation exists.
- Every figure exposes period/as-of/status and appropriate source/version detail.
- Reports and downloads name the Business and never expose sensitive raw content in URLs.

---

### T-FR-0007-13 — Validate the business-finance lifecycle and operator guidance

**Title:** Validate the business-finance lifecycle and operator guidance
**Deps:** `T-FR-0007-11`, `T-FR-0007-12`

#### Purpose

Run the cross-layer validation matrix, migration rehearsal, security/privacy audit, responsive/accessibility browser pass, and operator/manual documentation for the first complete Business finance slice.

#### Why this ticket exists

The most dangerous failures cross ticket boundaries: duplicate income, missing card payments, scope leakage, non-conserving tax/payment states, unrecoverable migrations, or UI language that overstates certainty.

#### Primary areas

- end-to-end/integration fixtures under `tests/` and frontend test suites
- `docs/manual/`, operator/validation documentation, feature diary/handoff
- feature closeout evidence after the repository's §2d gate is met

#### Out of scope

Deferred modules and automatic Personal projection. Completing this ticket does not authorize filing, payments, or financial advice.

#### Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| **TEST** | Execute the acceptance matrix | Legacy upgrade, workspace attacks, checking/card/import/review/reconcile, deduction/evidence, tax reserve/payment, exports, owner seam, error recovery, phone/desktop, and a11y cases are automated or explicitly recorded |
| **DEV** | Close integration gaps and document | Only defects found by the matrix are fixed; operator/manual pages explain setup, imports, corrections, evidence, tax-state meanings, backup/restore, and limitations |
| **VAL** | Produce release evidence | `./develop validate` and docs build pass; browser checks are recorded; totals reconcile to fixtures; feature gate/closeout state is updated accurately |

#### Acceptance criteria

- The representative business lifecycle completes without Personal totals changing.
- Cross-workspace and evidence-security tests fail closed.
- Migration/backup/restore is rehearsed against legacy data.
- Cash, profit, reserve, obligation, and payment roll-forwards reproduce exactly.
- Automatic owner-pay projection remains absent while the stable bridge id is demonstrable.
- Operator guidance states tax limitations and source-review dates plainly.

---
