"""SQLAlchemy ORM models for the Finance Hub database.

See Also: docs/design/services/ingestion-service/uml.md
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Account(Base):
    """A financial account (credit card, checking, etc.)."""

    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    institution: Mapped[str] = mapped_column(String(200), nullable=False)
    account_type: Mapped[str] = mapped_column(String(50), nullable=False, default="credit")
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="account")

    def __repr__(self) -> str:
        return f"<Account {self.name!r}>"


class Transaction(Base):
    """A normalized financial transaction.

    Amount sign convention:
      Positive = money out (charge/debit)
      Negative = money in (credit/refund/payment)
    """

    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("accounts.id"), nullable=True)
    transaction_date: Mapped[date] = mapped_column(nullable=False)
    description_raw: Mapped[str] = mapped_column(Text, nullable=False)
    description_normalized: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="Uncategorized")
    category_raw: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    merchant: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    source_file: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    source_type: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    ingested_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    is_credit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_flagged_business: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")

    account: Mapped[Account | None] = relationship(back_populates="transactions")

    def __repr__(self) -> str:
        return f"<Transaction {self.transaction_date} {self.amount} {self.description_raw[:30]!r}>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "date": self.transaction_date.isoformat(),
            "description": self.description_normalized or self.description_raw,
            "amount": float(self.amount),
            "category": self.category,
            "merchant": self.merchant,
            "is_credit": self.is_credit,
            "source_type": self.source_type,
        }


class Budget(Base):
    """Monthly category budget contract for the goals service."""

    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    period_month: Mapped[date] = mapped_column(nullable=False)
    amount_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class Goal(Base):
    """Monthly financial goal contract for the goals service."""

    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    goal_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    period_month: Mapped[date] = mapped_column(nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class MerchantDisplayOverride(Base):
    """User-defined display label for a stored merchant string (exact key match)."""

    __tablename__ = "merchant_display_overrides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_key: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class CategoryOverride(Base):
    """Merchant-pattern-based category override rule."""

    __tablename__ = "category_overrides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_pattern: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    is_regex: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class IngestionLog(Base):
    """Record of each statement ingestion run."""

    __tablename__ = "ingestion_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_file: Mapped[str] = mapped_column(String(500), nullable=False)
    source_file_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    records_parsed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    records_inserted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    records_skipped: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ingested_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ok")
    error_details: Mapped[str] = mapped_column(Text, nullable=False, default="")
