# FR-0007 — Intake

| Field | Value |
|---|---|
| **Title** | Business finance management |
| **Requester** | Product owner |
| **Target timeline** | Not specified; design should support incremental delivery |
| **Constraints** | Self-hosted and privacy-first; preserve a hard personal/business boundary; reuse Finance Hub ingestion and reporting patterns; exact-money arithmetic; U.S.-first tax planning with jurisdiction/entity/rule versions; calculations must not present planning as tax advice or a filed obligation |
| **Success definition** | 1. The owner can manage business accounts and credit cards without mixing them into personal totals. 2. Income, expenses, deduction candidates, evidence, tax obligations, reserved tax cash, and payments reconcile to source activity. 3. The design leaves an idempotent, auditable path for later owner-pay transfers into personal income and budgeting. |
| **Out of scope** | Tax filing or payment initiation; automatic deduction verdicts; payroll; sales tax; invoicing/AR/AP; inventory; depreciation; multi-owner accounting; accrual close; live bank feeds; automatic business-to-personal posting in the first slice |
| **Links** | [`README.md`](README.md), [`10-design-00-skeleton.md`](10-design-00-skeleton.md), [`10-design-01-ledger-and-tax-model.md`](10-design-01-ledger-and-tax-model.md), [`10-design-02-experience.md`](10-design-02-experience.md), [`docs/design/business-finance.md`](../../../docs/design/business-finance.md) |

## Raw request

The requester is starting a contract-work business and wants a new side of Finance Hub dedicated to business finances. It must track business credit cards, income, expenses, tax deductions, taxes due, and the cash stored for taxes. Later, the business and personal sides should connect through budgeting accounts so confirmed money moving out of the business can feed the personal side as income.

## Product interpretation

- “New side” means a first-class Business workspace inside the same application, not a client-side filter or a second unrelated ledger.
- “Fully manage” in the first release means trustworthy cash-oriented bookkeeping and tax readiness: scoped accounts, balanced activity, categorization, evidence, reconciliation, reports, reserve planning, obligations, and recorded payments.
- The first UX is optimized for one owner and one contract-work business, while identifiers and constraints remain safe for more than one business later.
- The initial accounting experience is guided cash-basis bookkeeping backed by balanced postings. Users should not need accounting jargon for routine classification.
- “Taxes due” is never one unexplained mutable number. The system distinguishes a projection, a user/adviser-confirmed obligation, a reserve target, actually reserved cash, and a settled payment.
- A flat percentage can drive a reserve policy, but it is not labeled as confirmed tax due.
- The future personal bridge uses explicit owner-transfer types such as draw, payroll, distribution, or reimbursement. Business profit is never copied automatically into personal income.

## Selected delivery posture

**Foundation-first.** Establish workspace isolation and a reliable business ledger before tax calculations or dashboards. Deliver reserve rules and manual/adviser-confirmed obligations first; a complete estimated-tax worksheet remains a later, separately reviewed capability.

## Compliance posture

This is product modeling, not tax, legal, or accounting advice. Tax profiles, classifications, rates, calendars, forms, jurisdictions, and tax-year rules are effective-dated and source-versioned. Unknown or incomplete inputs produce a visible incomplete state, never `$0 due` or an eligibility guarantee.
