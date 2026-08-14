# FR-0007 parallel design stream — Business workspace UX

## 2026-08-14 — delegated business-workspace UX survey

**Stage:** interface-first design discovery; navigation, screen states, and anti-commingling flows

**Git evidence:** `master` at `8293beb`; additional Budget evidence inspected on `feat/FR-0006-budget-cash-flow-graph` at `8570ebc` because the Budget implementation and its source HTML mocks are not present on the current `master` tree.

**Scope of this stream:** Recommend the information architecture and user flows for a distinct Business side of Finance Hub. This is a consolidation input, not the authoritative FR-0007 experience design or HTML mock. No application code was changed.

## Executive summary

- Business must be a real workspace and data boundary, not a filter over the personal dashboard. Every business-owned record needs an enforced `business_id`/workspace scope; the UI should never depend on the existing `Transaction.is_flagged_business` boolean as the boundary.
- Put an always-visible **Personal / Business** workspace switcher in the global shell, then give Business its own navigation: **Overview**, **Accounts & cards**, **Transactions**, **Income**, **Expenses**, **Deductions & receipts**, **Tax center**, **Reports**, and **Business settings**. Group these into a side rail or drawer rather than adding nine items to the existing top nav.
- Keep the current Finance Hub visual language—slate surfaces, teal actions, rounded cards, compact uppercase labels, tabular currency, loading/empty/error states—but add explicit textual Business identity on every route. Color may reinforce the context but must not be the only signal.
- Treat **Tax center** as three connected but distinct ledgers: estimated obligations, reserved cash, and recorded payments. A calculated estimate is not cash; a reserve target is not a bank transfer; a payment is not automatically a deductible operating expense.
- Defer personal integration to a governed **Owner pay / transfer to personal** contract. When delivered later, one confirmation must create an auditable pair: business outflow plus personal income, linked by a shared transfer id and never duplicated as revenue/expense.
- Before any UI DEV ticket, author source mocks under `docs/design/mockups/` for the shell/overview, activity review, deduction/receipt review, and tax center at desktop and phone widths. Existing FR-0006 source mocks on the feature branch show the project convention to reuse.

## Inspected evidence

### Current shell and page composition

| Evidence | Current behavior | Implication for FR-0007 |
| --- | --- | --- |
| `frontend/src/App.tsx` on `master` | A single `useState<AppPage>` chooses `dashboard`, `unified`, `bbd`, or `settings`; there is no URL router or workspace state. Dashboard queries begin regardless of the active page. | A business side is large enough to require addressable route/context state. At minimum, queries must be mounted only inside the active, scoped workspace. Prefer real routes such as `/business/:businessId/...` over extending one union and nested ternary tree. |
| `frontend/src/components/Layout.tsx` on `master` | Sticky 56px header; logo; horizontal Dashboard / Unified view / BBD buttons; gear icon; centered `max-w-screen-2xl` content. Active state is teal. | Reuse the brand header, focus rings, and content width. Do not put all Business destinations into this already crowded horizontal row. Add a first-class workspace switcher and context-specific secondary navigation. |
| `frontend/src/pages/SettingsPage.tsx` and `settings/SettingsNavTree.tsx` | Responsive two-column layout: sticky hierarchical side tree on desktop, stacked on smaller screens, `aria-current="page"`, visible focus rings. | This is the closest existing pattern for the Business section tree. It can evolve into a reusable context nav, but Business settings and global application settings must remain distinguishable. |
| `frontend/src/pages/UnifiedViewPage.tsx` | Month/as-of controls; KPI grids; explicit loading skeleton, error alert, effective-empty message; grouped sections; horizontally scrollable tables; reconciliation footer. | Reuse its summary grammar for Business Overview and Tax Center. Make calculation time, accounting period, reconciliation state, and estimate assumptions equally explicit. |
| Dashboard components (`UploadZone`, `FilterBar`, `StatCards`, `TransactionTable`) | Import-first workflow, date/category/source filters, KPI cards, search, pagination, table empty/loading states. | These are useful interaction primitives, but their APIs are global today. The Business versions must show a locked business and target account during import and include review/deduction/receipt state. |
| BBD page and components | Prominent disclaimer, structured input sections, pending/error status, story-first charts, detailed-table fallback, lazy spatial view, fixed bottom control dock, modal guide, reduced-motion support. | Reuse the clear “estimate, not advice” posture and story-before-detail approach in Tax Center. Do not reuse browser `localStorage` for tax profile, receipt, EIN/TIN, reserve, or payment data. |

### Budget evidence from the active FR-0006 feature branch

The registry says Budget work exists, but current `master` does not contain `BudgetPage`. The latest implementation inspected at `feat/FR-0006-budget-cash-flow-graph` adds:

- responsive top-nav handling (`overflow-x-auto`, compact logo at narrow widths) and a Budget nav item;
- month and saved-plan selection, collapsible plan/summary/map/flow/allocation sections, KPI cards, and contextual docs links;
- an interactive account/cash-flow map, source/sink semantics, and readable derived flow summaries;
- desktop allocation tables that become cards below 768px;
- full-screen edit dialogs on phone and bounded modal dialogs on desktop;
- explicit loading, empty, mutation-error, confirmation, and guide states.

Useful FR-0006 ideas to carry forward are the account/flow mental model, full-screen phone editing, collapsible advanced detail, and safe-area-aware fixed actions. Business accounts should not directly reuse Budget graph records as the accounting ledger, however: planned cash-flow allocations and actual business transactions/tax reserves have different audit semantics.

### Existing HTML mock convention

Source mocks exist on `feat/FR-0006-budget-cash-flow-graph` at:

- `docs/design/mockups/fr-0006-account-routing-allocation-expansion.html`
- `docs/design/mockups/fr-0006-allocation-controls-graph-layout.html`
- `docs/design/mockups/fr-0006-edge-label-deconfliction.html`
- `docs/design/mockups/fr-0006-responsive-budget-width.html`

Generated copies are visible under `site/design/mockups/` on `master`, but generated `site/` output is not the source location for new design authority. The established convention is:

- self-contained static HTML with embedded CSS;
- real Finance Hub look and feel rather than gray wireframes;
- named CSS tokens for slate/teal/status colors, system font stack, tabular money, borders, radii, and shadows;
- existing application chrome around the proposed change;
- media queries near 760px; tables collapse to cards; sidebars disappear or stack;
- phone dialogs use `100dvh`; desktop dialogs are bounded and centered;
- representative content, annotations, semantic labels, and visible key states.

FR-0007 should follow that convention in `docs/design/mockups/`, link the mocks from the authoritative experience design, and treat them as visual authority until amended.

### Current data boundary is not sufficient

| Evidence | Risk |
| --- | --- |
| `Account` has no personal/business workspace or entity owner. Its `name` is globally unique. | A “business card” cannot be safely isolated from personal cards or from a second future business. |
| `Transaction` has `is_flagged_business`, but the field is not returned by `TransactionOut`, queried, set during normal ingestion, or used by metrics/unified summaries. | A boolean flag is only a classification hint, not an authorization, tenancy, or accounting boundary. |
| `/api/transactions`, `/api/metrics`, `/api/filters`, `/api/sources`, merchant overrides, income records, liability records, budgets, and unified summaries are global. | A client-side Business tab could leak and aggregate personal data into business views or vice versa. |
| Ingestion creates/fetches accounts globally by parser source name and duplicate detection ignores account/workspace. | Separate personal and business statements from the same institution can collide, and same-date/amount/description records can be skipped across contexts. |
| Existing income/liability contracts have no business owner. | Current “contract income” in Unified View cannot simply become business revenue without migration and scope decisions. |

The experience design therefore depends on a scope contract enforced by the API and datastore. The UI may display the boundary; it cannot create it.

## Recommended workspace architecture

### 1. Global shell: choose the financial context first

The shell should have two levels:

1. **Global Finance Hub bar** — brand, workspace switcher, global status/help, user/application settings.
2. **Context navigation** — Personal destinations when Personal is active; Business destinations and current business identity when Business is active.

Recommended switcher label examples:

- `Personal`
- `Business · Northstar Contracting`

If multiple businesses are supported later, the Business choice opens an entity picker. Do not call the context merely “Business transactions”; it governs accounts, activity, tax records, reports, and settings.

Persistent context cues on every Business screen:

- visible `Business` label plus the business display name;
- business icon and optional accent treatment, while retaining text for accessibility;
- page title and browser/deep-link route include the business context;
- create/import dialogs repeat “Adding to Northstar Contracting” and the target account;
- breadcrumbs, report headings, exports, and print views name the business and period;
- context switch is blocked by an unsaved-change prompt rather than silently discarding edits.

Recommended URL shape:

```text
/personal/dashboard
/personal/unified
/personal/budget
/personal/bbd
/business/:businessId/overview
/business/:businessId/accounts
/business/:businessId/transactions
/business/:businessId/income
/business/:businessId/expenses
/business/:businessId/deductions
/business/:businessId/taxes
/business/:businessId/reports
/business/:businessId/settings
```

The exact router library is an implementation decision, but URL-addressable state is recommended. It provides reliable deep links, browser Back/Forward, refresh persistence, testable permission boundaries, and a place to make the business id explicit.

### 2. Business navigation

Use a desktop side rail and mobile drawer, grouped for scanning:

```text
Business
  Overview

Money
  Accounts & cards
  Transactions
  Income
  Expenses

Tax & records
  Deductions & receipts
  Tax center

Insights
  Reports

Manage
  Business settings
```

Inside **Tax center**, use tabs or a local secondary nav:

- Overview
- Estimates
- Reserves
- Payments

Do not add a disabled “Transfer to personal” primary-nav item in the first slice. Record the future contract in design and, if needed, place a short “Personal integration is not enabled yet” explanation in Business settings. A dead-end nav item increases uncertainty around whether transfers are already counted.

### 3. Boundary rules that the interface must make visible

1. An account belongs to exactly one scope: Personal or one Business entity.
2. Import requires a target account; scope is inherited from that account and cannot be changed per row during routine categorization.
3. A record never appears in both workspaces unless it is one side of an explicitly linked owner transfer.
4. Merchant/category/deduction rules default to business-local. Reusing a personal rule requires an explicit copy, not shared mutable state.
5. A personal purchase on a business card remains in the business account ledger and is classified as an owner-related transaction (for example, owner draw/distribution), not silently moved out of history.
6. A business purchase on a personal card remains a personal-account transaction plus an explicit reimbursement/owner-contribution workflow when that capability exists. The system must not pretend the account was business-owned.
7. Correcting a wrongly scoped account is a reviewed migration with impact preview, confirmation, and audit history—not a row-level toggle.
8. Destructive financial edits should become correction/archive entries where accounting history matters. Reports disclose draft versus reconciled/finalized states.

## Recommended screens and states

### Business Overview

**Job:** Answer “What needs my attention, how is the business doing, and is tax cash protected?” without mixing personal net worth or personal budgets.

Recommended top row:

- Business cash available
- Income received for selected period
- Business expenses for selected period
- Operating net
- Estimated taxes due
- Tax cash reserved
- Reserve gap / surplus

Recommended sections:

- **Needs attention:** uncategorized transactions, missing receipts, stale account imports, unmatched income deposits, card payments due, upcoming tax dates, reserve shortfall.
- **Cash story:** income → operating spend → reserve transfers → owner pay (future) → ending available cash. Reuse the story-first grammar from BBD, not a dense ledger first.
- **Accounts & cards:** balances, last updated, card statement due/minimum, reserve designation.
- **Tax readiness:** estimate timestamp, next due date, reserved amount, gap, payments recorded.
- **Recent activity:** scoped ledger rows with direct review actions.

Required states:

- first-run setup checklist;
- partially configured (business exists, no accounts or no tax profile);
- normal reconciled period;
- attention state (receipt backlog, account stale, card/tax due);
- reserve shortfall and reserve surplus;
- loading skeleton, retriable error, permission denied, and no-activity period.

### Accounts & cards

**Job:** Inventory business-owned cash, tax-storage, and credit accounts; import or connect their activity; track statement obligations without treating card payments as expenses twice.

Views/controls:

- All / Cash / Credit cards / Tax reserve filters;
- account cards or responsive table with institution, masked suffix, type, current/statement balance, available credit, last import, reconciliation status;
- credit-card due date, minimum due, and last payment status;
- explicit `Tax reserve account` designation, with warning if an operating account is selected;
- “Import statement” action that names both business and target account before upload;
- account detail with activity, statements/import history, balance history, and reconciliation status.

States:

- manual account versus connected/imported account;
- current, stale, disconnected, import pending, import error;
- unreconciled versus reconciled statement;
- no accounts onboarding;
- account has possible duplicate activity;
- reviewed account-scope migration preview.

### Transactions

**Job:** Review the complete business ledger and make classification/evidence state obvious.

Tabs:

- All
- Needs review
- Income
- Expenses
- Transfers
- Owner-related

Core columns/cards:

- date, description/merchant or payer, account, transaction type, category, deduction status, receipt status, review status, amount;
- persistent source provenance and import id in detail;
- filters for period, account, category, type, receipt, deduction, review state, amount, and text search;
- detail drawer on desktop / full-screen page-dialog on phone;
- bulk categorization only when every selected row has the same business and compatible transaction type.

Correction rules:

- never delete imported source provenance;
- distinguish transfer, card payment, refund, owner contribution/draw, income, and expense so totals do not double count;
- changing a reconciled transaction shows impact, requires confirmation, and writes an audit event;
- potential duplicates go to review rather than disappearing silently.

### Income

**Job:** Track cash received from contract work and any manually recorded income source without double-counting a bank deposit and an income record.

First-slice scope:

- income ledger filtered from business activity;
- payer/client, category, received date, amount, account, source, match/review state, notes/documents;
- manual income entry and CSV/import matching;
- totals by period, payer, and category;
- unmatched income record / unmatched deposit workflow.

Do not promise invoice creation, accounts receivable aging, payment collection, payroll, or 1099 filing unless those are separately designed. The UI may show “received” rather than “revenue” until the chosen cash/accrual accounting basis is explicit.

States:

- matched deposit;
- manual-only income;
- suspected duplicate;
- refund/reversal;
- owner contribution (not income);
- needs payer/category review.

### Expenses

**Job:** Classify operating costs, associate evidence, and separate business expenses from owner-related activity.

Views:

- expense ledger with category, account/card, merchant, deduction candidate, business-use percentage, receipt, reimbursable/owner-related status;
- category and vendor rollups;
- direct “Attach receipt” and “Review deduction” actions;
- clear card-payment exclusion from expense totals;
- split transaction flow when one charge contains multiple categories or mixed business/owner-related portions.

States:

- categorized and reviewed;
- needs category;
- missing receipt;
- possible personal/owner-related charge;
- partially deductible/business-use allocation;
- refunded or reversed;
- duplicate candidate.

### Deductions & receipts

**Job:** Build an evidence-backed tax-review queue, not claim that the application has made a legal tax determination.

Recommended layout:

- summary cards: deduction candidates, reviewed amount, missing receipts, partial-use items, excluded/not deductible;
- work queue grouped by `Needs review`, `Missing evidence`, `Ready`, and `Excluded`;
- row/detail fields: tax category, business purpose, business-use percentage, receipt/document, vendor, date, amount, reviewer note, confidence/source;
- receipt preview/download with metadata and immutable source hash;
- filters by tax year, category, evidence state, and review state;
- export package for accountant review with an audit manifest.

Language guardrails:

- say “deduction candidate,” “reviewed,” and “excluded”; avoid “IRS approved” or “guaranteed deductible”;
- show the tax profile/jurisdiction and tax year used for any mapping;
- retain the underlying accounting category separately from the tax deduction category.

States:

- file upload/processing/error;
- unsafe or unsupported file rejected;
- missing evidence;
- duplicate receipt;
- receipt linked to multiple split lines;
- business-use percentage incomplete;
- ready for review/export;
- excluded with reason.

### Tax Center: Estimates

**Job:** Explain the current estimate, assumptions, period, and uncertainty.

Recommended content:

- tax year/quarter and jurisdiction selector;
- estimated federal, state/local, and self-employment components as separately labeled lines;
- taxable-income inputs and adjustment summary;
- effective reserve rate and estimate range where the model supports uncertainty;
- `Calculated as of` timestamp and stale-assumption warning;
- editable tax profile through Business settings, not opaque magic numbers;
- prominent “Estimate only—not tax advice or a filed return” explanation modeled after BBD’s disclaimer.

Do not combine sales tax, payroll withholding, income tax, franchise tax, and owner personal estimated tax into one unlabeled number. The initial contractor profile should explicitly list the tax types actually modeled and mark the rest unsupported.

### Tax Center: Reserves

**Job:** Show where protected tax cash is stored and whether it covers the current estimate.

Core concepts must remain separate:

- **Estimated obligation** — calculated amount expected to become due.
- **Reserve target** — policy-derived amount the user intends to protect.
- **Reserved cash** — reconciled balance/transfers in one or more designated business accounts.
- **Reserve gap/surplus** — reserved cash minus reserve target.
- **Available operating cash** — a derived planning number, clearly labeled, not a bank balance promise.

Flow:

1. User configures reserve policy (percentage, periodic target, or manual target).
2. System proposes a reserve transfer when income is reviewed.
3. User records or matches the actual movement to the designated reserve account.
4. Dashboard changes from `Suggested` to `Reserved` only after the transfer is recorded/matched.

Never show a ledger-only reserve entry as if money has moved at the bank. If bank automation is not implemented, use “Record transfer” and “Mark matched,” not “Move money.”

### Tax Center: Payments

**Job:** Record payment events against obligations and show their source and evidence.

Fields:

- tax type, jurisdiction/agency, tax period, payment date, amount, source account, confirmation/reference, receipt/document, notes;
- link to the estimate/obligation version the payment applies to;
- payment status such as planned, submitted, confirmed, reversed;
- remaining amount due and reserve balance after confirmed payment.

Corrections should be explicit reversals or amendments. Recording a payment from the tax reserve account must not create a second operating expense, and estimated owner income-tax treatment must follow the configured entity/tax model rather than being labeled universally deductible.

### Reports

**Job:** Give the owner and accountant repeatable, traceable outputs.

First-slice reports:

- cash-basis income and expense statement / profit-and-loss view if cash basis is selected;
- income by payer and category;
- expenses by accounting category;
- deduction-candidate summary with receipt coverage;
- tax estimate, reserve, and payment reconciliation;
- account and card activity export;
- owner contribution/distribution report.

Every report should show business identity, accounting basis, date range, generated-at time, included/excluded states, and whether the period is draft or reconciled. CSV should be available for detail; printable/PDF presentation can be a later ticket if not foundational.

Required states: no data, incomplete review warning, stale account warning, generation pending, export error, and successful export with file contents described before download.

### Business settings

Sections:

- **Business profile:** display/legal name, entity type, start date, fiscal year, base currency; sensitive identifiers masked and revealed only through an explicit protected action.
- **Tax profile:** accounting basis, filing profile/election, jurisdictions, modeled tax types, reserve policy, estimated-payment calendar, disclaimer acknowledgement/version.
- **Categories & rules:** business accounting categories, tax mappings, merchant/payer rules, default receipt thresholds.
- **Accounts & imports:** connector/import defaults, account-scope migration tools, duplicate policy.
- **Data & audit:** audit log, export bundle, retention, archive business, backup/restore guidance.
- **Access:** owner-only in the first slice; future accountant/bookkeeper roles shown only when authorization is implemented.
- **Personal integration:** informational status and future owner-pay contract; no automatic sharing toggle.

Keep this separate from the existing application Settings gear. The gear can open global application settings; Business settings lives inside the active Business context.

## Core user flows

### Flow A — First business setup

1. Choose `Business` in the workspace switcher.
2. Create/select a business identity; explain separation from Personal.
3. Choose accounting basis and minimal tax profile, with unsupported areas stated.
4. Add a business checking account, business credit card, and optional tax reserve account.
5. Set a reserve policy or explicitly defer it.
6. Import a statement into a locked target account.
7. Land on `Needs review` with setup progress and next actions.

The user can skip optional tax configuration, but Overview must then show `Tax estimate not configured`, not `$0 due`.

### Flow B — Review an imported expense

1. Import names `Business · Northstar Contracting` and `Card · 4412` before confirmation.
2. Parsed rows are deduplicated within that account/business/import context.
3. Open a charge in the review drawer.
4. Confirm expense type and accounting category.
5. Mark deduction candidate/excluded; enter business purpose and percentage if required.
6. Attach or link receipt.
7. Save and return to the queue; focus advances predictably.

### Flow C — Record income and protect tax cash

1. Review an incoming business deposit or add an income record.
2. Match deposit and income record, preventing double counting.
3. Confirm payer/category and received date.
4. Tax Center recalculates or marks estimate stale, depending on policy.
5. Reserve policy proposes an amount and named destination.
6. User records/matches the actual transfer; only then does reserved cash increase.

### Flow D — Record a tax payment

1. Open Tax Center for a due period.
2. Review obligation, previous payments, reserve, and remaining due.
3. Add payment with agency, source account, date, reference, and evidence.
4. Preview accounting effects before confirmation.
5. Confirm; obligation and reserve reconciliation update, with audit history.

### Flow E — Correct owner-related or wrongly scoped activity

- **Personal charge on business card:** classify as owner-related draw/distribution (entity rules apply), attach explanation, preserve the business-account record.
- **Business expense on personal account:** remain in Personal and create a later reimbursement/owner-contribution record when that workflow exists; do not move the source bank row.
- **Entire account assigned to wrong workspace:** use a separate reviewed account migration with affected-record count, report impact, target confirmation, and audit record.

### Flow F — Future owner pay / transfer to Personal

Deferred contract, to prevent future design from coupling the ledgers incorrectly:

1. Select business source account, personal destination, amount, date, and transfer purpose (`owner draw`, `payroll`, `reimbursement`, or another supported type).
2. Preview both sides and tax/reporting treatment.
3. Confirm once.
4. Create an idempotent linked pair with one transfer id: business cash outflow and personal inflow.
5. Exclude the transfer from business operating expense/revenue and personal duplicate income rules as appropriate to its type.
6. Reversal changes both sides atomically and remains in audit history.

No automatic rule should feed Business net income directly into Personal budget income. Only confirmed transfer events cross the boundary.

## Cross-screen state matrix

| State | Required presentation |
| --- | --- |
| Loading | Shape-matched skeletons; retain page title and Business identity. |
| Empty | Explain why it is empty and give one scoped next action; never show `$0` when setup is missing. |
| Partial setup | Checklist with completed/deferred steps; features depending on missing tax/account setup explain the dependency. |
| Error | Plain-language message, safe retry, non-sensitive reference id; no stack trace, file path, token, or raw bank payload. |
| Offline/stale | Last-updated timestamp and stale badge; do not imply current balance or current estimate. |
| Needs review | Count, reason, next action, and queue progress. |
| Reconciled/finalized | Labeled period status; corrections require impact preview and audit event. |
| Permission denied | Name the capability, not hidden data; return to an allowed Business screen. |
| Destructive/archive | Entity/account/period named in confirmation, consequences listed, typed confirmation for material archive where appropriate. |
| Success | In-context acknowledgement with resulting record/status, not only a transient color toast. |

## Responsive behavior

- **Desktop (`>= 1024px`):** sticky global header plus 220–240px Business side rail; content uses current `max-w-screen-2xl`; detail drawers may sit beside tables.
- **Tablet:** collapsible rail; retain workspace switcher and Business name; local tabs may scroll, but primary context navigation should use a menu rather than silently clipping.
- **Phone (`< 768px`):** top bar shows logo, explicit `Business` context button, current entity in the drawer header, and a menu. Consider a four-item bottom bar (`Overview`, `Activity`, `Taxes`, `More`) only if all destinations remain reachable and labels do not truncate.
- Convert dense tables to cards, following the FR-0006 responsive mock. Keep amounts, review status, receipt state, and primary action visible before secondary metadata.
- Use full-screen `100dvh` edit/review dialogs on phone, bounded dialogs/drawers on desktop, sticky action footers, and safe-area insets.
- Do not encode reports solely as wide tables; provide mobile summaries and downloadable detail.
- Fixed docks must not cover transaction rows, tax actions, or virtual keyboards. Multiple page-specific docks should never stack.

## Accessibility requirements

- A skip link should bypass the global header and context nav.
- Workspace switcher is a labeled control with the current selection announced. Switching context moves focus to the new page heading and announces `Business workspace: <name>`.
- Use semantic `nav`, `main`, headings, tables, forms, fieldsets, and `aria-current`; retain the project’s visible `focus-visible` rings.
- Color reinforces but never replaces labels such as `Business`, `Needs review`, `Reserve gap`, `Income`, `Expense`, `Source`, and `Destination`.
- Minimum interactive target near 44×44 CSS pixels; do not depend on hover for receipt/deduction explanations.
- Dialogs trap focus, close on Escape when safe, restore focus to the opener, and require explicit confirmation for financial side effects.
- Import progress, save status, and recalculation status use restrained live regions; avoid announcing every table change.
- Charts have text summaries and accessible table/detail alternatives. Tax and reserve comparisons must remain understandable without color or WebGL.
- Respect `prefers-reduced-motion`; smooth scroll and animated amount transitions are optional enhancements.
- Currency is exposed with clear sign and type semantics (`$250.00 expense`, not color-only red/green); use tabular numerals visually.
- Error copy associates with fields and summary alerts. Tax estimate inputs explain units, period, and jurisdiction.

## Security and privacy requirements

- Enforce business scope and authorization in every backend query/mutation; a route business id cannot be trusted because it came from the visible workspace selector.
- Never use frontend `localStorage` for business profile identifiers, tax assumptions, receipt metadata/content, account details, reserve state, or payments. The BBD preset pattern is not appropriate for sensitive business records.
- Mask account numbers and EIN/TIN-like values by default. Copy/reveal is explicit, time-limited where practical, and audited for sensitive identifiers.
- Receipt/document upload must allowlist formats, enforce size limits, generate safe storage names, verify content rather than extension, prevent executable inline rendering, and avoid exposing filesystem paths.
- Store immutable source hashes/provenance for imports and receipts. Prevent cross-business duplicate checks from leaking whether another scope has a matching record.
- Do not put sensitive values, raw statements, receipt text, personal identifiers, signed storage URLs, or tax payloads in logs, errors, analytics, or browser URLs.
- Audit account-scope migration, transaction correction, deduction status, tax-profile changes, reserve matches, payments, exports, and future owner transfers.
- Exports name their scope and contents before generation; material exports require explicit confirmation and should support redacted accountant packages.
- Prefer archive/correction over hard delete for financial records. Business deletion/archive needs backup/export guidance and a clear retention contract.
- If roles are introduced, define owner/accountant/bookkeeper permissions server-side. Do not show collaborative access controls before enforcement exists.
- Prominently state tax estimates and deduction classifications are planning/review aids, not filed returns or individualized tax/legal advice.

## Authoritative mock requirements for the parent design

Before UI tickets are authored, create and link at least these source mocks:

1. **`docs/design/mockups/fr-0007-business-shell-overview.html`**
   - latest real Finance Hub chrome;
   - Personal/Business workspace switcher;
   - named Business context and desktop side nav;
   - populated Overview, first-run setup, reserve-gap alert, loading/error examples;
   - phone frame showing drawer/context behavior.
2. **`docs/design/mockups/fr-0007-business-activity-review.html`**
   - Accounts & cards state plus statement-import confirmation;
   - Transactions tabs/filtering;
   - desktop table and phone cards;
   - transaction review drawer/full-screen editor with income, expense, transfer, card-payment, and owner-related choices;
   - duplicate and reconciled-correction warnings.
3. **`docs/design/mockups/fr-0007-deductions-receipts.html`**
   - evidence queue, receipt state, deduction candidate/review/exclusion language;
   - receipt preview, business-purpose and percentage fields;
   - unsafe upload/missing evidence/ready states.
4. **`docs/design/mockups/fr-0007-tax-center.html`**
   - Estimates / Reserves / Payments tabs;
   - clear separation of obligation, target, reserved cash, gap, available cash;
   - stale assumptions, unconfigured tax profile, proposed versus matched reserve transfer, confirmed payment and reversal states;
   - estimate disclaimer and accessible data alternative to any chart.
5. **Optional `fr-0007-business-reports-settings.html`** if the first four cannot show report/accounting-basis/business-profile context without becoming overloaded.

Mocks should use representative but fictional names, masked account suffixes, and non-sensitive sample data. They should show real copy, form labels, spacing, focus, status, and responsive behavior—not box-only wireframes. Use textual Business cues in addition to any accent-color variation.

## Ticket implications for consolidation

Do not assign ids from this parallel stream; the serial owner should merge these boundaries into the canonical DAG. Recommended ticket seams and dependencies:

| Candidate ticket seam | Why it is separate | Dependency / contention note |
| --- | --- | --- |
| Define workspace/business identity and scope contracts | Everything else must know how Personal and one or more businesses are identified and authorized. | P0 foundation. Must precede persistence/API/UI. |
| Migrate and scope accounts, transactions, income, liabilities, rules, and duplicate detection | Current records/endpoints are global and the legacy boolean is insufficient. | Depends on scope contracts; migration needs explicit legacy ownership strategy. |
| Deliver addressable workspace shell and navigation | Avoids expanding `App.tsx` state/ternaries and crowded top nav; centralizes context safety. | Depends on authoritative shell mock and scope contract. Own `App.tsx`, `Layout.tsx`, routing, shared nav to avoid hot-file conflicts. |
| Add business accounts/cards and scoped ingestion/reconciliation | Enables real account ownership, card dues, target-account imports, provenance, duplicate handling. | After scoped persistence; can parallelize with tax contracts once public interfaces settle. |
| Add business ledger classification and review workflow | Owns transaction types, splits, transfers/card-payment exclusion, corrections, reconciliation. | After scoped persistence/accounts; foundation for expense/deduction/report UI. |
| Add business income matching | Prevents deposit/manual-income double counting and supports payer/category reporting. | After scoped ledger; clarify cash/accrual basis first. |
| Add receipt/document evidence store | Sensitive upload lifecycle and immutable provenance deserve isolated security and tests. | After scope contract; can run parallel to ledger if link interface is locked. |
| Add deduction classification and evidence workflow | Keeps accounting category separate from tax treatment and provides review states. | Depends on ledger + receipt interface + tax category contract. |
| Define tax profile, estimate versions, obligations, and calendars | Tax calculations need explicit supported types, jurisdiction, basis, assumptions, and versioning. | Can start after business identity; use professional review for formulas/rules. |
| Add reserve policy, reserve ledger, account matching, and payment records | Separates planned target, cash storage, and actual payment; prevents double counting. | Depends on tax obligation contract + scoped accounts/ledger. |
| Deliver Business Overview | Composes accounts, ledger, review queue, and tax readiness into attention-first dashboard. | After read APIs stabilize; authoritative overview mock required. |
| Deliver Money screens | Accounts/cards, transactions, income, and expenses responsive UI. | After shell + relevant APIs; one UI facade ticket should own shared client/types. |
| Deliver Deductions/receipts and Tax Center screens | Sensitive, state-rich workflows need dedicated scripted and browser validation. | After shell + domain APIs + authoritative mocks. |
| Deliver reports/export and Business settings | Completes operator control, audit posture, accounting basis, category mapping, and accountant handoff. | Reports after ledger/tax; settings foundation fields may land earlier. |
| Security/audit/export threat validation | Cross-cutting access, file upload, sensitive display, audit, and report checks. | Specify in every acceptance criterion plus dedicated integration audit/VAL. |
| Document future owner-pay transfer contract | Preserves a safe seam to Personal without implementing coupling now. | Design-only/deferred implementation unless user explicitly promotes it. |
| Integrated UI VAL and operator docs | Requires deterministic frontend checks plus browser inspection across routes/states/desktop/phone. | Final dependency on all first-slice UI; use containerized project commands. |

Parallelization guidance:

- After scope contracts are VAL-done, account/ingestion, receipt storage, and tax-profile/estimate contracts can proceed in parallel if their public link interfaces are frozen.
- Serialize shared frontend shell/API-client/type edits through one facade owner; feature UI tickets should own separate folders and consume the facade.
- Overview and Reports come after the read models they aggregate. Do not let them invent alternate totals client-side.
- UI tickets are blocked on authoritative HTML mocks by project rule.
- Every user-visible ticket needs scripted checks plus rendered desktop/phone route-state validation before VAL.

## Open decisions for the serial owner

1. **Initial entity model:** one sole-proprietor business now but multi-business-ready ids, or explicit multi-business UX in the first release. Recommendation: multi-business-safe data contract, one-business-focused first UX.
2. **Accounting basis:** cash basis is the simplest contractor-first default, but it must be explicit and not silently hard-coded if accrual is planned.
3. **Tax scope:** identify exactly which federal/state/local/self-employment tax calculations are supported and which are manual. This needs current tax-domain/legal review before implementation.
4. **Legacy ownership migration:** decide whether existing accounts, transactions, income, and liabilities default to Personal, go through an assignment wizard, or use a configurable migration. Recommendation: default to Personal with a reviewed account-level migration; never infer from `is_flagged_business` alone.
5. **Routing:** introduce an addressable router now (recommended) or retain app-state navigation for a deliberately small first slice. Router migration has near-term cost but avoids deep-link/history/context debt.
6. **Receipt storage:** local encrypted/self-hosted storage, object storage, and backup/retention expectations need a security contract before upload tickets.
7. **Reserve truth source:** designated bank-account balance, matched transfer subledger, or both with reconciliation. Recommendation: both, with provenance and a visible mismatch state.
8. **Owner transfers:** keep implementation deferred (recommended) or include a minimal paired-transfer slice. Including it pulls Personal Budget/Unified dependencies into FR-0007 and increases commingling risk.

## Suggested next step

Consolidate these workspace boundaries and flows into `10-design-02-experience.md`, then create the four required source HTML mocks from the latest FR-0006 shell context before finalizing any Business UI tickets. In parallel, the domain design should make business/account ownership and tax reserve/payment semantics explicit so the mock cannot imply unsupported behavior.

## Options

- **A. Foundation-first (recommended):** ship workspace scope, accounts/cards, scoped ledger review, receipts/deductions, and transparent tax reserve/payment tracking. Keep owner-pay integration as a documented future contract. Lowest commingling risk and cleanest DAG.
- **B. Vertical owner-pay slice:** add one paired Business → Personal transfer and personal-income handoff to the first release. More immediately connected, but it couples FR-0007 to Budget/Unified models and substantially increases migration, reconciliation, and test scope.
- **C. UI-only business filter:** reuse the current transaction boolean and global APIs. Not recommended: it cannot provide safe isolation, correct duplicate detection, scoped rules, or trustworthy reports.
