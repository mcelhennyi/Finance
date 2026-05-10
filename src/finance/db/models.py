"""SQLAlchemy ORM models for the Finance Hub database.

See Also: docs/design/services/ingestion-service/uml.md
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
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
    account_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("accounts.id"), nullable=True
    )
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
    allocation_derived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
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


class IncomeRecord(Base):
    """Income contract record for manual/API and CSV ingestion paths."""

    __tablename__ = "income_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    income_date: Mapped[date] = mapped_column(nullable=False)
    source_name: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="Income")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    source_file: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    source_type: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class LiabilityRecord(Base):
    """Liability contract record for debt obligations and balances."""

    __tablename__ = "liability_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    as_of_date: Mapped[date] = mapped_column(nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    liability_type: Mapped[str] = mapped_column(String(100), nullable=False)
    principal_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    minimum_payment: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    interest_rate_apr: Mapped[Decimal] = mapped_column(
        Numeric(8, 4), nullable=False, default=Decimal("0.00")
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    source_file: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    source_type: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class MerchantDisplayOverride(Base):
    """User-defined display label for a stored merchant string (exact key match)."""

    __tablename__ = "merchant_display_overrides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_key: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class BudgetCategoryLabel(Base):
    """User-saved category name for the budget allocation category picker.

    Merged at read time with distinct ``Transaction.category`` and ``AllocationItem.category``
    values so pickers stay aligned with ingested data and existing lines.

    See Also: finance.allocation.category_catalog
    """

    __tablename__ = "budget_category_labels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    label: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


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


class AllocationPlan(Base):
    """Manual budget allocation plan for a single planning month.

    See Also: tasks/feature-history/FR-0002-budget-entry-page/10-design-01-allocation-model.md
    """

    __tablename__ = "allocation_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    period_month: Mapped[date] = mapped_column(nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    income_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    income_cadence: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    items: Mapped[list["AllocationItem"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="AllocationItem.sort_order",
    )
    cash_flow_nodes: Mapped[list["CashFlowNode"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
    )
    cash_flow_edges: Mapped[list["CashFlowEdge"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
    )


class AllocationItem(Base):
    """Planned recurring allocation row within a plan."""

    __tablename__ = "allocation_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("allocation_plans.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    planned_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    cadence: Mapped[str] = mapped_column(String(32), nullable=False)
    monthly_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(32), nullable=False)
    due_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    plan: Mapped["AllocationPlan"] = relationship(back_populates="items")


class CashFlowNode(Base):
    """Persisted node in a plan-scoped cash-flow graph (see ``CashFlowNodeSpec``).

    See Also:
        docs/design/budget-cash-flow-graph.md
        src/finance/cash_flow_graph/schemas.py
    """

    __tablename__ = "cash_flow_nodes"
    __table_args__ = (UniqueConstraint("plan_id", "ref", name="uq_cash_flow_node_plan_ref"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plan_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("allocation_plans.id", ondelete="CASCADE"), nullable=False
    )
    ref: Mapped[str] = mapped_column(String(64), nullable=False)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    institution: Mapped[str | None] = mapped_column(String(200), nullable=True)
    parent_ref: Mapped[str | None] = mapped_column(String(64), nullable=True)
    layout_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    layout_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    current_balance: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    balance_as_of: Mapped[date | None] = mapped_column(nullable=True)
    account_mask: Mapped[str | None] = mapped_column(String(32), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    plan: Mapped["AllocationPlan"] = relationship(back_populates="cash_flow_nodes")
    out_edges: Mapped[list["CashFlowEdge"]] = relationship(
        back_populates="from_node",
        foreign_keys="CashFlowEdge.from_node_id",
    )
    in_edges: Mapped[list["CashFlowEdge"]] = relationship(
        back_populates="to_node",
        foreign_keys="CashFlowEdge.to_node_id",
    )


class CashFlowEdge(Base):
    """Directed cash-flow edge between two nodes in the same plan.

    See Also:
        docs/design/budget-cash-flow-graph.md
        src/finance/cash_flow_graph/schemas.py
    """

    __tablename__ = "cash_flow_edges"
    __table_args__ = (UniqueConstraint("plan_id", "ref", name="uq_cash_flow_edge_plan_ref"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plan_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("allocation_plans.id", ondelete="CASCADE"), nullable=False
    )
    ref: Mapped[str] = mapped_column(String(64), nullable=False)
    from_node_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cash_flow_nodes.id", ondelete="CASCADE"), nullable=False
    )
    to_node_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cash_flow_nodes.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    amount_rule: Mapped[str] = mapped_column(String(32), nullable=False)
    fixed_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    percent_of_inflow: Mapped[Decimal | None] = mapped_column(Numeric(6, 3), nullable=True)
    cadence: Mapped[str] = mapped_column(String(32), nullable=False)
    day_of_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    plan: Mapped["AllocationPlan"] = relationship(back_populates="cash_flow_edges")
    from_node: Mapped["CashFlowNode"] = relationship(
        back_populates="out_edges",
        foreign_keys=[from_node_id],
    )
    to_node: Mapped["CashFlowNode"] = relationship(
        back_populates="in_edges",
        foreign_keys=[to_node_id],
    )
