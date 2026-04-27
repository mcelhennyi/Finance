"""Pydantic schemas for the Finance Hub API."""

from datetime import date, datetime
from pydantic import BaseModel, Field


class IngestionResponse(BaseModel):
    source_file: str
    source_type: str
    records_parsed: int
    records_inserted: int
    records_skipped: int
    errors: list[str]
    duration_seconds: float


class TransactionOut(BaseModel):
    id: int
    date: str
    description: str
    amount: float
    category: str
    merchant: str
    merchant_display: str
    is_credit: bool
    source_type: str


class MetricsResponse(BaseModel):
    total_spent: float
    total_credits: float
    net_spent: float
    transaction_count: int
    avg_per_transaction: float
    by_category: dict[str, float]
    by_category_count: dict[str, int]
    top_merchants: list[list]
    daily_trend: list[list]
    category_weekly_trend: dict[str, list[list]]
    category_monthly_trend: dict[str, list[list]]


class FiltersResponse(BaseModel):
    categories: list[str]
    sources: list[str]
    date_min: str | None
    date_max: str | None


class SourceOption(BaseModel):
    key: str
    name: str


class BudgetCreate(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    period_month: date
    amount_limit: float = Field(gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)


class BudgetOut(BaseModel):
    id: int
    category: str
    period_month: date
    amount_limit: float
    currency: str
    created_at: datetime


class BudgetListResponse(BaseModel):
    items: list[BudgetOut]


class GoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    goal_type: str = Field(min_length=1, max_length=50)
    target_amount: float = Field(gt=0)
    period_month: date
    currency: str = Field(default="USD", min_length=3, max_length=3)


class GoalOut(BaseModel):
    id: int
    name: str
    goal_type: str
    target_amount: float
    period_month: date
    currency: str
    created_at: datetime


class GoalListResponse(BaseModel):
    items: list[GoalOut]


class IncomeRecordCreate(BaseModel):
    income_date: date
    source_name: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    category: str = Field(default="Income", min_length=1, max_length=100)
    notes: str = Field(default="", max_length=1000)


class IncomeRecordUpdate(BaseModel):
    income_date: date | None = None
    source_name: str | None = Field(default=None, min_length=1, max_length=200)
    amount: float | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    notes: str | None = Field(default=None, max_length=1000)


class IncomeRecordOut(BaseModel):
    id: int
    income_date: date
    source_name: str
    amount: float
    currency: str
    category: str
    notes: str
    source_file: str
    source_type: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None


class IncomeListResponse(BaseModel):
    items: list[IncomeRecordOut]


class LiabilityRecordCreate(BaseModel):
    as_of_date: date
    name: str = Field(min_length=1, max_length=200)
    liability_type: str = Field(min_length=1, max_length=100)
    principal_amount: float = Field(gt=0)
    minimum_payment: float = Field(default=0.0, ge=0)
    interest_rate_apr: float = Field(default=0.0, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    notes: str = Field(default="", max_length=1000)


class LiabilityRecordUpdate(BaseModel):
    as_of_date: date | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    liability_type: str | None = Field(default=None, min_length=1, max_length=100)
    principal_amount: float | None = Field(default=None, gt=0)
    minimum_payment: float | None = Field(default=None, ge=0)
    interest_rate_apr: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    notes: str | None = Field(default=None, max_length=1000)


class LiabilityRecordOut(BaseModel):
    id: int
    as_of_date: date
    name: str
    liability_type: str
    principal_amount: float
    minimum_payment: float
    interest_rate_apr: float
    currency: str
    notes: str
    source_file: str
    source_type: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None


class LiabilityListResponse(BaseModel):
    items: list[LiabilityRecordOut]


class IncomeAggregateOut(BaseModel):
    total_income: float
    active_income_count: int


class LiabilityAggregateOut(BaseModel):
    total_liabilities: float
    active_liability_count: int


class IncomeLiabilityAggregateOut(BaseModel):
    total_income: float
    total_liabilities: float
    net_cash_after_liabilities: float
    active_income_count: int
    active_liability_count: int


# --- Unified monthly view (T-FR-0001-04) — stable for Phase 2 dashboard ---


class BudgetSummaryRowOut(BaseModel):
    budget_id: int
    category: str
    period_month: date
    budget_amount: float
    actual: float
    variance: float
    is_over_budget: bool
    is_incomplete_month: bool
    trending_over_budget: bool


class GoalSummaryRowOut(BaseModel):
    goal_id: int
    name: str
    goal_type: str
    period_month: date
    target: float
    actual: float
    remaining: float
    progress_ratio: float
    is_complete: bool


class CardCashFlowOut(BaseModel):
    total_charges: float
    total_credits: float
    net_spent: float
    transaction_count: int
    by_category: dict[str, float]


class ContractAggregateOut(BaseModel):
    total_income: float
    total_liabilities: float
    net_cash_after_liabilities: float
    active_income_count: int
    active_liability_count: int


class LiabilityLineItemOut(BaseModel):
    id: int
    name: str
    liability_type: str
    principal_amount: float
    as_of_date: date
    currency: str


class NetWorthBreakdownOut(BaseModel):
    assets_total: float
    assets_tracked: bool
    liabilities_total: float
    net_worth: float
    liability_line_items: list[LiabilityLineItemOut]


class ReconciliationOut(BaseModel):
    unified_operating_net: float
    independent_operating_net: float
    discrepancy: float
    within_tolerance: bool
    income_aggregate_vs_line_items: float
    within_tolerance_income: bool


class UnifiedViewSummaryOut(BaseModel):
    period_month: date
    as_of: date
    currency: str = "USD"
    budgets: list[BudgetSummaryRowOut]
    goals: list[GoalSummaryRowOut]
    card_cash_flow: CardCashFlowOut
    contracts: ContractAggregateOut
    net_worth: NetWorthBreakdownOut
    reconciliation: ReconciliationOut
