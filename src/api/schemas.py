"""Pydantic response schemas for the Finance Hub API."""

from datetime import date
from pydantic import BaseModel


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


class FiltersResponse(BaseModel):
    categories: list[str]
    sources: list[str]
    date_min: str | None
    date_max: str | None


class SourceOption(BaseModel):
    key: str
    name: str
