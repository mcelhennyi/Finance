# FR-0007 — Business finance management

## Status

`design` — feature ID reserved; intake, domain boundaries, UI design, and ticket DAG are being prepared.

## Purpose

Add a distinct business side to Finance Hub for managing contract-work finances: business accounts and credit cards, income and expenses, tax deductions, estimated tax obligations, reserved tax cash, and tax payments. The design must preserve a clear business/personal boundary while leaving a governed path for the business to fund personal income and budgets later.

## Planned artifacts

- `00-intake.md` — goals, assumptions, success criteria, and deferred scope
- `10-design-00-skeleton.md` — public surfaces and domain boundaries
- `10-design-01-ledger-and-tax-model.md` — accounting, tax, reserve, and transfer lifecycles
- `10-design-02-experience.md` — business workspace information architecture and flows
- `20-tickets-dag.md` — implementation work breakdown and dependency graph
- `tickets.md` — canonical ticket bodies
- `serial-diary.md`, `parallel/`, `DIARY.md` — design history
- `handoffs/` — resumable feature handoffs

## Executive summary

FR-0007 is reserved for a business-finance workspace that remains operationally separate from personal finances and can later provide explicit owner-pay transfers into the personal budgeting model.

## Suggested next step

Complete the interface-first design and define the first implementation slice before starting `/identify-frontier` or `/develop-frontier`.

## Options

- **A. Foundation-first:** accounts, transactions, categorization, deductions, and tax-reserve tracking before forecasting and personal integration.
- **B. Full vertical slice:** include initial owner-pay and personal-income integration in the first delivery, with greater coupling to existing budget work.
