export interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  category: string
  merchant: string
  merchant_display: string
  is_credit: boolean
  source_type: string
}

export interface MerchantNameRow {
  merchant_key: string
  transaction_count: number
  auto_pretty: string
  override_display: string | null
  effective_display: string
  needs_review: boolean
}

/** Response from PUT /merchant-names (Save) — includes seed file sync status. */
export interface MerchantOverrideSaveResponse extends MerchantNameRow {
  seed_file_synced: boolean
  seed_file_error: string | null
}

export interface MerchantDeleteResponse {
  ok: boolean
  merchant_key: string
  seed_file_synced: boolean
  seed_file_error: string | null
}

export interface MerchantNameListResponse {
  rows: MerchantNameRow[]
}

export interface Metrics {
  total_spent: number
  total_credits: number
  net_spent: number
  transaction_count: number
  avg_per_transaction: number
  by_category: Record<string, number>
  by_category_count: Record<string, number>
  top_merchants: [string, number][]
  daily_trend: [string, number][]
  category_weekly_trend: Record<string, [string, number][]>
  category_monthly_trend: Record<string, [string, number][]>
}

export interface Filters {
  categories: string[]
  sources: string[]
  date_min: string | null
  date_max: string | null
}

export interface SourceOption {
  key: string
  name: string
}

export interface FilterState {
  from: string
  to: string
  category: string
  source: string
}

export interface IngestionResult {
  source_file: string
  source_type: string
  records_parsed: number
  records_inserted: number
  records_skipped: number
  errors: string[]
  duration_seconds: number
}

/** GET /unified-view/summary — matches API (snake_case). */
export interface BudgetSummaryRow {
  budget_id: number
  category: string
  period_month: string
  budget_amount: number
  actual: number
  variance: number
  is_over_budget: boolean
  is_incomplete_month: boolean
  trending_over_budget: boolean
}

export interface GoalSummaryRow {
  goal_id: number
  name: string
  goal_type: string
  period_month: string
  target: number
  actual: number
  remaining: number
  progress_ratio: number
  is_complete: boolean
}

export interface CardCashFlow {
  total_charges: number
  total_credits: number
  net_spent: number
  transaction_count: number
  by_category: Record<string, number>
}

export interface ContractAggregate {
  total_income: number
  total_liabilities: number
  net_cash_after_liabilities: number
  active_income_count: number
  active_liability_count: number
}

export interface LiabilityLineItem {
  id: number
  name: string
  liability_type: string
  principal_amount: number
  as_of_date: string
  currency: string
}

export interface NetWorthBreakdown {
  assets_total: number
  assets_tracked: boolean
  liabilities_total: number
  net_worth: number
  liability_line_items: LiabilityLineItem[]
}

export interface Reconciliation {
  unified_operating_net: number
  independent_operating_net: number
  discrepancy: number
  within_tolerance: boolean
  income_aggregate_vs_line_items: number
  within_tolerance_income: boolean
}

export interface UnifiedViewSummary {
  period_month: string
  as_of: string
  currency: string
  budgets: BudgetSummaryRow[]
  goals: GoalSummaryRow[]
  card_cash_flow: CardCashFlow
  contracts: ContractAggregate
  net_worth: NetWorthBreakdown
  reconciliation: Reconciliation
}

/** One simulation year from `/api/bbd-projection/run` (parity with backend `YearStateRow`). */
export interface BbdScheduleRow {
  year: number
  age: number
  w2_income: number
  rental_net_cash_flow: number
  portfolio_dividends: number
  drawdown_borrowed: number
  taxes_paid: number
  living_expenses: number
  gross_cash_income: number
  taxes_delta_yoy: number | null
  gross_income_delta_yoy: number | null
  portfolio_value: number
  portfolio_basis: number
  portfolio_unrealized_gain: number
  properties_value: number
  properties_mortgage_balance: number
  pe_value: number
  pe_basis: number
  pe_exited_this_year: boolean
  sbloc_balance: number
  heloc_refi_balance: number
  total_assets: number
  total_liabilities: number
  net_worth: number
  sbloc_capacity_remaining: number
  sbloc_ltv: number
  margin_call: boolean
  sofr: number
  sbloc_rate: number
}

export interface BbdEstateOutcomeRow {
  label: string
  gross_estate: number
  debt_to_repay: number
  cap_gains_tax: number
  depreciation_recapture_tax: number
  net_to_heirs: number
}

export interface BbdMonteCarloSummary {
  n_trials: number
  final_nw_p10: number
  final_nw_p50: number
  final_nw_p90: number
  final_nw_mean: number
  margin_call_rate: number
  bankrupt_rate: number
}

export interface BbdRunResponse {
  schedule: BbdScheduleRow[]
  estate_sell_path: BbdEstateOutcomeRow
  estate_bbd_path: BbdEstateOutcomeRow
  bbd_net_advantage_vs_sell_path: number
  monte_carlo: BbdMonteCarloSummary | null
}

export interface BbdRunPayload {
  scenario: Record<string, unknown>
  monte_carlo_trials?: number
  monte_carlo_seed?: number
}

/** GET `/api/bbd-projection/default-scenario`. */
export interface BbdDefaultScenarioResponse {
  scenario: Record<string, unknown>
}
