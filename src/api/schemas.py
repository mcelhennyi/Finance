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
