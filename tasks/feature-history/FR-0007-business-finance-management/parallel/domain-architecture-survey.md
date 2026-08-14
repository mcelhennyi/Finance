# Domain architecture survey — business finance workspace

## Date / stage

- **Date:** 2026-08-14
- **Stage:** FR-0007 parallel design survey; architecture and data-boundary evidence only
- **Scope:** Current `master` plus the unmerged `feat/FR-0006-budget-cash-flow-graph` integration branch where its account/allocation work can collide with FR-0007
- **Implementation:** No product code changed

## Executive summary

Finance Hub is a single-user modular monolith with one database and one global personal ledger. Its parser plugins, normalized transaction shape, query/metrics functions, FastAPI/Pydantic pattern, and React query client are useful foundations, but no persistent model or endpoint currently carries a user, owner, tenant, business, or workspace boundary. The existing `Transaction.is_flagged_business` boolean is not exposed in API contracts and is not used by ingestion, queries, budgets, income, liabilities, merchant settings, or the unified monthly view. It cannot provide the required isolation.

FR-0007 should introduce a mandatory **finance workspace** scope shared by personal and business data, backfill all existing records into a default personal workspace, and reuse the canonical account/transaction pipeline inside that scope. Business-only bookkeeping and tax concerns should be attached as separate bounded contexts rather than copied into a second ledger. Future owner pay should cross the boundary only through an explicit, idempotent transfer contract that can later project a business outflow into personal income/budgeting.

The most immediate collision is FR-0006: its unmerged feature branch is 28 commits ahead of and 4 behind `master`, and it adds plan-scoped `CashFlowNode` records plus allocation endpoints. Those are planning representations, not canonical bank/card accounts. FR-0007 should link them to canonical `Account` rows instead of reusing or duplicating them as the business account system.

## Files inspected

### Current `master`

- [`docs/design/system-overview.md`](../../../../docs/design/system-overview.md) — modular-monolith intent, one normalized database, phase roadmap, and existing business-expense flag
- [`docs/design/services/ingestion-service/overview.md`](../../../../docs/design/services/ingestion-service/overview.md) and [`api.md`](../../../../docs/design/services/ingestion-service/api.md) — parser, normalization, category, deduplication, and intended named-account contracts
- [`docs/design/services/analysis-service/overview.md`](../../../../docs/design/services/analysis-service/overview.md) and [`api.md`](../../../../docs/design/services/analysis-service/api.md) — query/aggregate contracts and intended account filtering
- [`docs/design/technology-decisions.md`](../../../../docs/design/technology-decisions.md) — SQLite/PostgreSQL portability and Alembic intent
- [`src/finance/db/models.py`](../../../../src/finance/db/models.py) and [`session.py`](../../../../src/finance/db/session.py) — current ORM, global uniqueness, and `create_all()` schema initialization
- [`src/finance/db/migrations/phase2_goals_budgets_stub.sql`](../../../../src/finance/db/migrations/phase2_goals_budgets_stub.sql) and [`phase2_income_liabilities_stub.sql`](../../../../src/finance/db/migrations/phase2_income_liabilities_stub.sql) — SQL stubs rather than executable Alembic history
- [`src/finance/ingestion/parsers/base.py`](../../../../src/finance/ingestion/parsers/base.py), [`contracts.py`](../../../../src/finance/ingestion/parsers/contracts.py), [`service.py`](../../../../src/finance/ingestion/service.py), and [`src/finance/ingestion/contracts.py`](../../../../src/finance/ingestion/contracts.py) — statement, income, and liability ingestion
- [`src/finance/analysis/service.py`](../../../../src/finance/analysis/service.py), [`src/finance/goals/service.py`](../../../../src/finance/goals/service.py), and [`src/finance/unified/monthly.py`](../../../../src/finance/unified/monthly.py) — global queries and derived monthly totals
- [`src/api/main.py`](../../../../src/api/main.py), [`schemas.py`](../../../../src/api/schemas.py), and routers for [`ingest`](../../../../src/api/routers/ingest.py), [`transactions`](../../../../src/api/routers/transactions.py), [`metrics`](../../../../src/api/routers/metrics.py), [`contracts`](../../../../src/api/routers/contracts.py), [`summary`](../../../../src/api/routers/summary.py), and [`merchant_names`](../../../../src/api/routers/merchant_names.py)
- [`frontend/src/App.tsx`](../../../../frontend/src/App.tsx), [`components/Layout.tsx`](../../../../frontend/src/components/Layout.tsx), [`api/client.ts`](../../../../frontend/src/api/client.ts), and [`types.ts`](../../../../frontend/src/types.ts) — single-shell navigation and unscoped API/query contracts
- [`tests/test_income_liability_contracts.py`](../../../../tests/test_income_liability_contracts.py), [`test_goals_actuals_engine.py`](../../../../tests/test_goals_actuals_engine.py), and [`test_unified_monthly_summary.py`](../../../../tests/test_unified_monthly_summary.py) — current contract and reconciliation assumptions

### Active FR-0006 branch inspected with `git show`

- `src/finance/db/models.py` on `feat/FR-0006-budget-cash-flow-graph`
- `src/finance/allocation/{schemas.py,service.py,summary.py}` and `src/finance/cash_flow_graph/{schemas.py,service.py}` on that branch
- `src/api/routers/budget_allocation.py` and its migration stubs on that branch
- `tasks/feature-history/FR-0006-budget-cash-flow-graph/30-expand-2026-06-29-account-routing-allocations.md` on that branch

## Current reusable contracts

| Existing contract | Reuse | Required adaptation for FR-0007 |
| --- | --- | --- |
| `StatementParser` -> `RawTransaction` | Keep parser plugins source-format-specific and shared across personal/business workspaces. | Ingestion must receive an explicit `workspace_id` and canonical `account_id`; parsers must not choose ownership. |
| `Account` -> `Transaction` | Keep one canonical ledger for both sides of the application. The current amount convention can remain as a compatibility field. | Scope both records; remove global account-name uniqueness; enforce account/workspace agreement; add account balance/statement snapshots for business cards and bank accounts. |
| `get_transactions()` + `compute_metrics()` | Metrics are reusable when the input set is already correctly scoped. | Make workspace scope required and fail closed at repository/service boundaries; add account/activity filters. |
| `IncomeRecord` / `LiabilityRecord` CRUD and soft deletion | Reuse lifecycle and Pydantic/FastAPI patterns. | Add workspace scope and settlement links so imported deposits/card balances are not double counted. Business revenue and card balance snapshots need explicit source-of-truth rules. |
| `Budget`, `Goal`, and unified summary adapters | Reuse the composition/read-model pattern. | Scope every source table and query. Do not automatically feed business revenue into personal budgets; owner transfers are the future integration seam. |
| Merchant/category normalization | Reuse display normalization. | Separate installation-wide merchant identity/display from workspace-specific category and deduction rules, or explicitly scope all overrides. Current global mutable overrides are unsafe for distinct personal/business semantics. |
| FastAPI routers + Pydantic DTOs | Keep the current module/DTO style. | Add workspace-qualified routes and consistent not-found/cross-scope rejection. There is currently no auth principal to infer scope from. |
| React Query client and page shell | Keep shared fetch/query utilities and one application build. | Put `workspace_id` in query keys and requests; add a first-class personal/business workspace switch rather than a disconnected second frontend. |
| FR-0006 `AllocationItem` source/sink primitives | Reuse later for planned owner pay, tax-reserve sweeps, and personal budgeting projections. | Treat `CashFlowNode` as plan-local. Add a nullable durable link to canonical `Account`; do not make graph node refs the business account identity. |

## Collision and data-integrity risks

1. **There is no ownership boundary today.** Every API handler opens the same global session; ORM tables and DTOs have no user/tenant/workspace key. All query, filter, merchant, income, liability, budget, goal, and summary operations see installation-wide data.
2. **`is_flagged_business` is a dead-end discriminator.** It is a single boolean on `Transaction`, is omitted from `TransactionOut`/frontend types, and is ignored by all aggregates. It cannot distinguish multiple businesses, business accounts, tax settings, rules, or transfer ownership.
3. **Ingestion conflates institution with account.** `_get_or_create_account()` names an account from `parser.source_name`, so every Chase upload resolves to one globally named `Chase` account. The documented `--account` contract is not implemented by the FastAPI upload route.
4. **Deduplication can discard valid business data.** The key is only date + amount + raw description; it omits account, workspace, source row id, and file hash. The same charge on two cards or in personal/business workspaces can collide.
5. **Payments/transfers are silently dropped.** Parser keyword detection skips payment-like rows. Business credit-card payments, owner pay, tax-reserve transfers, and tax payments must be classified/reconciled, not deleted from the ledger.
6. **Current income can double count bank deposits.** `IncomeRecord` is independent of `Transaction`, while the unified summary adds income records and transaction credits. Business revenue needs explicit invoice/receipt/settlement links and authoritative total rules.
7. **Budgets and summaries will bleed across workspaces.** Monthly transactions, income, liabilities, budgets, goals, category catalogs, and merchant settings are queried globally. Adding a business page without scoping the underlying services would corrupt both sides' totals.
8. **Migration delivery is not yet production-safe.** Runtime uses `Base.metadata.create_all()`. The repository declares Alembic as the decision/dependency but only has SQL stubs. `create_all()` will not add workspace columns or backfill existing SQLite databases.
9. **Canonical accounts and FR-0006 planning accounts can diverge.** FR-0006 `CashFlowNode` is plan-scoped and graph replacement deletes/reinserts rows while allocations link by string ref. Business cards/accounts need durable canonical identity and balance history; a plan node should reference that identity rather than become it.
10. **FR-0006 is not on `master`.** Its feature branch contains allocation/account-routing product code and 77 relevant changed paths relative to its merge base. FR-0007 tickets that touch models, API registration, frontend shell/types, or budget integration must be based on an explicit FR-0006 disposition to avoid designing against stale `master` files.

## Recommended bounded contexts

### 1. Workspace directory and business profile

Owns isolation and business identity, not authentication.

```text
FinanceWorkspace { id, kind: personal|business, name, base_currency, status }
BusinessProfile { workspace_id, display/legal name, tax treatment, jurisdiction, tax-year settings }
```

- One installation may start with one personal and one business workspace; the shape supports more businesses without changing ledger contracts.
- Backfill all current data into a seeded personal workspace.
- Authorization can be added later, but services must still require scope now; self-hosted/single-user is not a reason to leave data unscoped.

### 2. Ledger, accounts, and ingestion

Owns canonical accounts, imported/manual transactions, statements, balances, and reconciliation.

```text
FinancialAccount { id, workspace_id, institution, name, type, currency, status }
AccountBalanceSnapshot { account_id, as_of, current/statement/available balance, credit_limit? }
LedgerTransaction { id, workspace_id, account_id, date, amount, activity_type, source provenance }
IngestionRun { id, workspace_id, account_id, source/hash/status/counts }
```

- Require workspace + account on upload. Parser selection remains independent.
- Dedupe within workspace/account using a stable source id when available, otherwise a documented fingerprint.
- Preserve payment and transfer rows with `activity_type` such as `expense`, `revenue`, `refund`, `transfer`, `card_payment`, `tax_payment`, or `owner_transfer`; do not rely on amount sign alone for meaning.
- Cross-workspace account ids must be rejected before persistence.

### 3. Business bookkeeping and evidence

Owns business meaning layered onto common ledger transactions.

```text
BusinessTransactionClassification {
  workspace_id, transaction_id, business_use_percent,
  bookkeeping_category, deduction_category,
  deduction_status: candidate|confirmed|excluded,
  review_status, memo, evidence_refs
}
BusinessRevenueRecord { workspace_id, client/source, gross, date, invoice/payment status, settlement_transaction_id? }
```

- Keep raw bank/card facts in the shared ledger and business/tax judgments in this context.
- A classification revision should retain an audit trail; deleting/changing an import must not silently erase tax evidence.
- Revenue records and ledger deposits must reconcile through explicit settlement links so dashboards count money once.

### 4. Tax planning, reserves, and payments

Owns versioned estimates and the cash reserved/paid against them. It must not present itself as filing or professional tax advice.

```text
TaxProfile { workspace_id, jurisdiction/treatment, effective dates, configured assumptions }
TaxPeriod { workspace_id, period, status }
TaxEstimateSnapshot { period_id, as_of, inputs, ruleset/assumption version, taxable basis, estimated due }
TaxReserveEvent { period_id, date, amount, source account, reserve account, linked ledger transactions }
TaxPayment { period_id, date, amount, authority, confirmation/evidence, linked ledger transaction }
```

- “Taxes due” should be an immutable/versioned calculation snapshot, not one mutable number.
- Reserved tax cash must identify the actual storage account and reconcile to ledger transfers; a dashboard-only bucket would overstate available cash.
- Tax rules/rates and entity treatment remain configured assumptions until a separate, reviewed tax-engine design settles them.

### 5. Inter-workspace owner transfer

This is the future public seam between business and personal finance.

```text
OwnerTransfer {
  id, source_business_workspace_id, destination_personal_workspace_id,
  amount, date, kind: draw|payroll|distribution|reimbursement,
  source_transaction_id, destination_transaction_id?, status, idempotency_key
}
```

- A business-side transfer is recorded first and remains auditable there.
- A later personal adapter creates or links the corresponding personal income/budget event exactly once.
- The transfer kind is explicit because draw, payroll, distribution, and reimbursement are not interchangeable for bookkeeping or tax treatment.
- FR-0007 should define this contract now but can defer automatic personal projection until the personal budgeting model and tax treatment are settled.

### 6. Business read models

Business dashboards should consume a workspace-qualified summary facade rather than joining tables in UI code.

```text
BusinessFinanceSummary {
  period, cash/revenue/expense totals, unreconciled counts,
  deduction candidates/confirmed totals,
  estimated tax due, reserved, paid, reserve gap,
  account/card balances and upcoming obligations
}
```

The summary returns provenance/as-of dates and distinguishes calculated, confirmed, imported, and manually entered amounts.

## Recommended public interfaces

| Surface | Initial contract direction |
| --- | --- |
| Workspace selection | `GET/POST /api/workspaces`; `GET/PUT /api/workspaces/{workspace_id}/business-profile` |
| Accounts/balances | `/api/workspaces/{workspace_id}/accounts` and `/accounts/{account_id}/balance-snapshots`; reject mismatched account/workspace ids |
| Ingestion | `POST /api/workspaces/{workspace_id}/accounts/{account_id}/ingestion-runs`; response keeps current parsed/inserted/skipped/errors shape plus run id and classification counts |
| Transactions | `GET /api/workspaces/{workspace_id}/transactions`; return account id, activity type, business classification summary, and provenance |
| Business classification | `PUT /api/workspaces/{workspace_id}/business/transactions/{transaction_id}/classification`; revision/evidence-aware |
| Revenue | `/api/workspaces/{workspace_id}/business/revenue`; optional settlement transaction link and reconciliation state |
| Tax | `/api/workspaces/{workspace_id}/business/tax-periods`, nested estimate snapshots, reserve events, and payments |
| Dashboard | `GET /api/workspaces/{workspace_id}/business/summary?period=...&as_of=...` |
| Owner pay | `POST /api/workspaces/{business_workspace_id}/owner-transfers`; personal projection endpoint/event deferred but idempotency contract fixed |
| Compatibility | Existing unqualified personal endpoints may temporarily resolve only the seeded personal workspace, emit deprecation documentation, and never union personal + business data. |

## Migration sequence

1. Introduce an executable migration mechanism before feature data is written; an Alembic environment is the documented direction.
2. Create the seeded personal workspace, then add nullable `workspace_id` to scope roots (`accounts`, `transactions`, income/liability, budgets/goals, ingestion logs, rules/settings, and FR-0006 plans when present).
3. Backfill existing rows to personal; derive transaction workspace from account where possible and explicitly handle null-account legacy rows.
4. Replace global uniqueness with workspace-scoped constraints/indexes, especially account names and category/merchant rules as decided.
5. Add composite/application checks that referenced accounts, transactions, plans, graph nodes, classifications, and tax records remain in one workspace.
6. Make workspace keys non-null after audit queries return no orphans; only then expose business writes.
7. Keep a rollback/export path for the local SQLite database and validate the same migration against PostgreSQL-compatible SQLAlchemy behavior.

## Ticket implications

The ticket DAG should serialize the shared foundation, then widen into business-specific streams:

1. **Define workspace, account, ledger, tax, and owner-transfer public contracts.** Resolve the scope carrier (path is recommended), compatibility behavior, activity taxonomy, and canonical-vs-planning account relationship.
2. **Install migrations and backfill the personal workspace.** This must precede all business writes.
3. **Make existing repositories/APIs fail closed by workspace.** Cover transactions, filters, metrics, merchant/category rules, income/liabilities, budgets/goals, unified summary, and regression tests proving zero cross-workspace leakage.
4. **Add canonical business accounts, balances, and account-targeted ingestion.** Fix account selection, account/workspace dedupe, payment/transfer preservation, and ingestion provenance together.
5. **Add business bookkeeping classification and evidence.** Expense/revenue categorization, partial business use, deduction candidate/confirmation lifecycle, and audit history.
6. **Add revenue settlement/reconciliation.** Prevent imported deposits and manual invoices/payments from double counting.
7. **Add versioned tax-period estimation contracts.** Assumption/ruleset provenance and calculation snapshots; no hard-coded current-law claim without separate review.
8. **Add tax reserve and payment tracking.** Link actual transfers/accounts and calculate due/reserved/paid/gap.
9. **Expose the business summary facade.** Reconciliation, card balances, income/expense, deductions, and tax state.
10. **Deliver the workspace shell and business UI.** Workspace-aware query keys, loading/empty/error states, accounts/transactions/review/tax surfaces, and rendered browser validation.
11. **Define owner-transfer creation and FR-0006 adapter seam.** Implement business-side audit record now; defer or separately gate automatic personal income/budget projection.

Shared hot files (`src/finance/db/models.py`, `src/api/main.py`, API schemas, frontend `App.tsx`/`Layout.tsx`/types/client) make tickets 1-4 foundational and mostly serial. Bookkeeping, tax contracts, and UI mocks can proceed in parallel once the workspace contract is fixed. Before implementation, rebase/design against the chosen FR-0006 integration state because that branch changes the same model/API/frontend surfaces.

## Suggested next step

Consolidate this survey into `10-design-00-skeleton.md`, explicitly adopt a workspace-qualified shared ledger, and settle the canonical `Account` <-> FR-0006 `CashFlowNode` link plus owner-transfer classification contract before writing the final ticket DAG.

## Options

- **Foundation-first (recommended):** workspace/migration/isolation -> business accounts and ledger -> classifications/reconciliation -> tax reserve/estimates -> business UI; keep personal projection deferred behind the owner-transfer contract.
- **Full vertical slice:** include automatic business-to-personal owner-pay projection in FR-0007. This delivers the future bridge sooner but couples the feature to unsettled personal-budget and entity-tax semantics.
- **Separate business tables/app:** fastest apparent isolation, but duplicates parsers, queries, accounts, reconciliation, settings, and migrations and makes later integration harder. Use only if the product intentionally wants two independent ledgers rather than one finance system.
