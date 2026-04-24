# User Stories & Financial Pain Points

## Overview

This document captures the real financial needs, pain points, and desired outcomes that drive the Finance Hub system design. Every feature in the system traces back to a story here.

---

## Story 1: "I have no idea where my money goes"

**Context**: Multiple credit cards, automatic subscriptions, occasional cash, and a mortgage. Each month ends and the bank account is lower than expected — but pinpointing exactly why is painful.

**Pain Points**:

- Credit card statements are per-card, not unified
- Categories from the bank are inconsistent (e.g., "BUSINESS SERVICES" covers everything from healthcare to Amazon)
- Merchants aren't always recognizable from statement descriptions (e.g., "SQ *ACME CO" — what is that?)
- No single place shows total outflow across all cards + bank

**Desired Outcome**:

- One view showing every dollar spent, across all cards, categorized correctly
- Ability to search by merchant name (human-readable) or category
- Monthly and weekly breakdowns

**Features Driven By This Story**:

- Multi-source ingestion (Phase 1)
- Merchant normalization and override mapping (Phase 1)
- Category remapping and custom categories (Phase 1)
- Unified transaction view (Phase 2)

---

## Story 2: "I want to know if I'm on track to hit my savings goals"

**Context**: Goal of saving $X per month for a house down payment. Some months are better than others but there's no feedback loop.

**Pain Points**:

- No visibility into whether spending this month is over or under budget
- Goals exist in a spreadsheet that is rarely updated
- Hard to separate "necessary" spending from discretionary

**Desired Outcome**:

- Set a monthly spending goal per category (e.g., dining: $400/month)
- See actual vs. goal, green/red, at a glance
- Alert or indicator when a category is trending over budget mid-month

**Features Driven By This Story**:

- Goal definition and tracking (Phase 2)
- Budget vs. actual by category (Phase 2)
- In-month spend alerts (Phase 2)

---

## Story 3: "I need to understand my full financial picture"

**Context**: Beyond credit cards, there's a mortgage, student loans, and irregular income (freelance + salary). The total net worth picture — assets, liabilities, net cash flow — is unknown.

**Pain Points**:

- No unified view of income vs. outflow
- Mortgage principal vs. interest breakdown isn't tracked
- Irregular income makes monthly budgeting hard

**Desired Outcome**:

- Ingest mortgage statements — see principal paid, interest, escrow each month
- Track income sources (salary, freelance, reimbursements)
- See net cash flow: total inflow minus total outflow per month

**Features Driven By This Story**:

- Income tracking and ingestion (Phase 2)
- Liability tracking (mortgage, loans) (Phase 2)
- Net cash flow dashboard (Phase 2)

---

## Story 4: "What happens to my finances if I get a raise? Or take on a new debt?"

**Context**: Considering a car purchase, or a career change. Want to model impact before committing.

**Pain Points**:

- Can't see the long-term ripple of a financial decision
- Spreadsheet projections are one-off and don't connect to real historical data
- Hard to compare scenarios side-by-side

**Desired Outcome**:

- Define a scenario: "new income +$2k/month starting June"
- See projected savings, net worth, and month-by-month cash flow over 12-24 months
- Compare base case vs. scenario side-by-side

**Features Driven By This Story**:

- Scenario modeling engine (Phase 3)
- Future projection charts (Phase 3)
- Scenario comparison view (Phase 3)

---

## Story 5: "I want to see trends — am I spending more or less than I used to?"

**Context**: Has been tracking spending loosely for years. Wants to see if habits are improving.

**Pain Points**:

- Bank apps show current month but not multi-year trends
- Category-level trends (e.g., dining creeping up over 18 months) are invisible
- No way to correlate life events (moved, got a raise) with spending changes

**Desired Outcome**:

- Year-over-year category trend charts
- Rolling 3-month and 12-month averages per category
- Ability to annotate a date with a life event ("bought car", "moved to Austin")

**Features Driven By This Story**:

- Trend analysis engine (Phase 3)
- Rolling average calculations (Phase 3)
- Life event annotations (Phase 3)

---

## Story 6: "Receipts are piling up and I can't reconcile them"

**Context**: Business expenses and personal expenses mix on one card. Receipts are photos in a camera roll that never get organized.

**Pain Points**:

- No way to match a receipt to a credit card transaction
- Manual expense reports are painful
- Can't prove a business expense without the receipt

**Desired Outcome**:

- Ingest receipt images (photo or PDF)
- Auto-match receipts to transactions by amount + date + merchant
- Flag a transaction as "business expense" with receipt attached

**Features Driven By This Story**:

- Receipt ingestion via OCR (Phase 1)
- Receipt-to-transaction matching (Phase 1 / Phase 2)
- Business expense flagging (Phase 2)
