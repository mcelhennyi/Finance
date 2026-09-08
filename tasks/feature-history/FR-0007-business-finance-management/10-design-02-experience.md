# FR-0007 — Business workspace experience (level 1)

## Experience goal

Give the owner an unmistakably separate Business workspace that answers three daily questions: what needs review, how the business is performing, and whether tax cash is protected. The interface displays the data boundary but never substitutes for backend workspace enforcement.

## Visual authority

- [`fr-0007-business-shell-overview.html`](../../../docs/design/mockups/fr-0007-business-shell-overview.html)
- [`fr-0007-business-activity-review.html`](../../../docs/design/mockups/fr-0007-business-activity-review.html)
- [`fr-0007-deductions-receipts.html`](../../../docs/design/mockups/fr-0007-deductions-receipts.html)
- [`fr-0007-tax-center.html`](../../../docs/design/mockups/fr-0007-tax-center.html)

The mocks use fictional data and show the intended Finance Hub chrome, context cues, copy, responsive composition, attention states, and tax-language guardrails. They are design authority until amended.

## Application shell and routing

Use a persistent two-level shell:

1. **Global bar:** Finance Hub brand, explicit Personal/Business workspace switcher, help/status, and global application settings.
2. **Context navigation:** Personal destinations when Personal is active; a Business side rail/drawer when Business is active.

Recommended addressable routes:

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

The route id is an input, not authorization. Every query/mutation validates the active workspace server-side and includes workspace identity in cache keys.

## Business navigation

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

Tax Center has local tabs for **Overview**, **Estimates**, **Reserves**, and **Payments**. Do not expose a disabled “Transfer to personal” destination in the first slice; Business settings explains that future integration is not enabled.

## Persistent boundary cues

- Every route shows `Business` plus the business display name; color is reinforcement only.
- Import/create/review dialogs repeat the business name and locked target account.
- Report headings and exports include business, period, accounting basis, as-of time, and reconciliation state.
- Unsaved changes block context switching until saved or discarded.
- A source account belongs to one workspace. Moving an account is a reviewed migration with affected-record preview and audit, not a row toggle.
- Personal purchases on business cards remain in the business account history and are classified as owner-related. Business purchases on personal cards remain Personal until a future reimbursement/contribution workflow links them.

## Overview

Top measures:

- operating cash available;
- income received;
- business expenses;
- operating net;
- estimated/confirmed tax obligation;
- tax reserve target;
- actually reserved cash;
- reserve gap or surplus.

Sections:

- **Needs attention:** uncategorized transactions, missing evidence, stale imports, unmatched deposits, unreconciled cards, upcoming obligations, reserve shortfall.
- **Cash story:** income → operating spend → reserve movements → owner activity → ending cash, with transfer-neutral amounts explained.
- **Accounts & cards:** balances, freshness, statement/reconciliation state, card due/minimum, reserve designation.
- **Tax readiness:** calculation/source status, next due date, target/reserved/paid/gap.
- **Recent activity:** direct, scoped review actions.

Missing setup displays `Tax estimate not configured` or `No reconciled balance`, never `$0 due` or `$0 reserved` as false certainty.

## Accounts and activity

- Accounts filter to Cash, Credit cards, and Tax reserve; show masked identity, balance type/as-of, last import, and reconciliation state.
- Statement import names Business and target account before upload. Preview separates new, possible duplicate, transfer/payment, and invalid rows.
- Transactions distinguish income, expense, transfer, card payment, refund, owner contribution/draw, tax payment, and needs review.
- Desktop uses an accessible table plus detail drawer; phone uses cards and a full-screen editor with sticky actions.
- Editing reconciled activity previews affected reports and requires a reasoned reopen/reversal path.

## Income and expense review

- Income shows payer/client, received date, amount, account, category, matching state, notes, and evidence. Manual income and imported deposits use an explicit match so totals count once.
- Expenses show managerial category, tax mapping, business-use allocation, deduction/evidence/review state, and owner-related treatment.
- Split editing conserves the source amount and exposes the nonbusiness remainder.
- Card payments are never included in expense totals.

## Deductions and receipts

The page is an evidence-backed review queue, not an automated eligibility decision.

- Summary labels: **Candidates**, **Reviewed**, **Needs evidence**, **Partial business use**, **Excluded**.
- Detail includes tax year/profile, tax category mapping, business purpose, business-use amount/percent, evidence, reviewer/source, and audit history.
- Copy uses `candidate`, `reviewed`, and `excluded`; it never uses `IRS approved` or `guaranteed deductible`.
- Evidence processing shows uploading/scanning/ready/rejected/duplicate states and never renders unsafe content inline.

## Tax Center

Always display these separately:

| Value | Meaning |
|---|---|
| **Estimated obligation** | Versioned planning output or confirmed schedule for a period/jurisdiction |
| **Reserve target** | Policy-derived amount the owner intends to protect |
| **Reserved cash** | Reconciled balance or bounded allocation actually set aside |
| **Payments recorded** | Settled/matched payments against obligations |
| **Gap / surplus** | Reserved cash minus target, with as-of time |

- Estimates show tax year/period, jurisdiction/components, assumptions, missing inputs, ruleset/source version, calculated-as-of, confidence, and an estimate-only disclaimer.
- Reserves distinguish proposed from matched transfers and never use “Move money” unless payment initiation exists.
- Payments capture authority, type/period, date, amount, source account, status, reference/evidence, linked obligation, and reversal/refund history.
- Sales tax, payroll withholding, income tax, franchise tax, and owner personal estimated tax are never collapsed into one unlabeled total.

## Reports and settings

First-slice reports:

- cash-basis P&L/cash movement;
- income by payer/category;
- expenses by managerial category;
- deduction/evidence register;
- account/card reconciliation;
- tax estimate/obligation/reserve/payment roll-forward;
- owner contribution/draw activity;
- audit/change export.

Business settings contains profile, accounting/tax method, jurisdictions, tax-year/calendar, reserve policy, categories/rules, accounts/import defaults, audit/export/retention, and future Personal integration status. Global application settings remain under the header gear.

## Required route-state validation matrix

| Surface | Required states |
|---|---|
| Shell | Personal, Business, narrow drawer, deep link, unsaved context switch |
| Overview | first run, partial setup, normal, needs attention, reserve gap/surplus, loading/error |
| Accounts/import | no accounts, stale/disconnected, preview, possible duplicate, import error, reconciled |
| Transactions | empty, needs review, split, transfer/card payment, owner-related, correction warning |
| Deductions/evidence | upload/processing/rejected, missing evidence, partial use, ready, excluded |
| Tax Center | unconfigured, incomplete/stale estimate, target only, matched reserve, partial/paid/reversed payment |
| Reports | no data, incomplete review, stale accounts, generating, export failure/success |

## Responsive and accessibility contract

- Desktop: sticky global header, 220–240px Business side rail, bounded content, optional detail drawer.
- Phone: explicit Business context button and entity name in drawer; dense tables become cards; editors use `100dvh`, safe-area insets, sticky footer, and no stacked fixed docks.
- Semantic landmarks/headings/tables/forms, skip link, visible focus, `aria-current`, focus trapping/restoration, 44px targets, restrained live regions, and chart text/table alternatives.
- Workspace switch announces the new context and moves focus to the page heading.
- Money is announced with type (`$250 expense`) rather than color/sign alone; color never carries status alone.
- Respect reduced motion and keep all explanations accessible without hover.

## Security presentation contract

- Never put raw statements, receipt text, taxpayer/account identifiers, signed evidence URLs, or tax payloads in URLs/logs/errors.
- Mask sensitive identifiers; reveal/export is explicit and audited.
- Scope-safe not-found/permission errors do not disclose records in another workspace.
- Financial success/correction messages name the resulting status, not only a transient colored toast.
- Archive/export confirmations name the Business, period, content, and consequences.
