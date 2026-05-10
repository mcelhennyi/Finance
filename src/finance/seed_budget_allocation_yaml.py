"""Load a purpose-built YAML budget seed into allocation tables.

The schema mirrors fields editors set on the Budget page (plan header + line items).
Optional ``cash_flow_graph`` defines the plan-scoped cash-flow map (nodes and edges)
persisted with the plan; see ``data/budget-default-plan.yaml`` for a full example.

See Also:
    docs/design/budget-plans-roadmap.md
    docs/design/budget-cash-flow-graph.md
    finance.allocation.schemas
    finance.allocation.service
"""

from __future__ import annotations

import os
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from finance.allocation.cadence import normalize_period_month
from finance.allocation.category_catalog import ensure_budget_category_labels_from_strings
from finance.allocation.enums import AllocationCadence, PaymentMethod, PlanIncomeCadence
from finance.allocation.schemas import AllocationItemCreate, AllocationPlanCreate
from finance.allocation.service import (
    create_allocation_item,
    create_allocation_plan,
    delete_allocation_plan,
)
from finance.cash_flow_graph.default_plan_graph import default_seeded_plan_cash_flow_graph
from finance.cash_flow_graph.schemas import CashFlowEdgeSpec, CashFlowGraphDocument, CashFlowNodeSpec
from finance.cash_flow_graph.service import replace_plan_graph
from finance.db.models import AllocationPlan


def default_budget_yaml_path() -> Path:
    """Resolved path to the default YAML seed (override with ``FINANCE_BUDGET_DEFAULT_YAML``)."""

    raw = os.environ.get("FINANCE_BUDGET_DEFAULT_YAML", "").strip()
    if raw:
        return Path(raw).expanduser().resolve()
    return Path("data/budget-default-plan.yaml").resolve()


def period_month_for_budget_seed(yaml_period: date | None) -> date:
    """Effective planning month: YAML ``period_month`` wins, then env, then today."""

    if yaml_period is not None:
        return normalize_period_month(yaml_period)
    raw = os.environ.get("FINANCE_BUDGET_ALLOCATION_PERIOD_MONTH", "").strip()
    if raw:
        return normalize_period_month(date.fromisoformat(raw))
    return normalize_period_month(date.today())


def budget_default_seed_enabled() -> bool:
    """Opt-out when the YAML exists but should not be applied."""

    val = os.environ.get("FINANCE_BUDGET_DEFAULT_SEED_ENABLED", "true").strip().lower()
    return val in ("1", "true", "yes")


class BudgetSeedItemModel(BaseModel):
    """One allocation line — same levers as the Budget UI / ``AllocationItemCreate``."""

    item_name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    planned_amount: Decimal = Field(gt=0)
    cadence: AllocationCadence
    payment_method: PaymentMethod
    due_day: int | None = Field(default=None, ge=1, le=31)
    notes: str = Field(default="", max_length=2000)
    sort_order: int | None = Field(default=None, ge=0)

    def to_create(self, order: int) -> AllocationItemCreate:
        return AllocationItemCreate(
            item_name=self.item_name,
            category=self.category,
            planned_amount=self.planned_amount,
            cadence=self.cadence,
            payment_method=self.payment_method,
            due_day=self.due_day,
            notes=self.notes,
            sort_order=self.sort_order if self.sort_order is not None else order,
        )


class BudgetSeedPlanModel(BaseModel):
    """Plan header — same fields as ``AllocationPlanCreate`` (except ``period_month``)."""

    name: str = Field(min_length=1, max_length=200)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    income_amount: Decimal | None = None
    income_cadence: PlanIncomeCadence | None = None

    @model_validator(mode="after")
    def income_paired(self) -> BudgetSeedPlanModel:
        has_amount = self.income_amount is not None
        has_cadence = self.income_cadence is not None
        if has_amount != has_cadence:
            raise ValueError("plan.income_amount and plan.income_cadence must both be set or both omitted")
        if has_amount and self.income_amount is not None and self.income_amount <= 0:
            raise ValueError("plan.income_amount must be positive when provided")
        return self

    @field_validator("income_amount", mode="before")
    @classmethod
    def coerce_income(cls, v: Any) -> Any:
        if v is None or v == "":
            return None
        return v


class BudgetSeedCashFlowGraphModel(BaseModel):
    """Cash-flow map shipped with the budget YAML seed (same contract as the REST graph API)."""

    nodes: list[CashFlowNodeSpec] = Field(min_length=1)
    edges: list[CashFlowEdgeSpec] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_graph(self) -> BudgetSeedCashFlowGraphModel:
        CashFlowGraphDocument(
            plan_id=1,
            nodes=list(self.nodes),
            edges=list(self.edges),
        )
        return self


class BudgetSeedDocument(BaseModel):
    """Root document for ``data/budget-default-plan.yaml``."""

    version: int = 1
    period_month: date | None = None
    plan: BudgetSeedPlanModel
    items: list[BudgetSeedItemModel] = Field(min_length=1)
    cash_flow_graph: BudgetSeedCashFlowGraphModel | None = None

    @field_validator("period_month", mode="before")
    @classmethod
    def coerce_period(cls, v: Any) -> Any:
        if v is None or v == "":
            return None
        if isinstance(v, date):
            return v
        return date.fromisoformat(str(v))


def parse_budget_seed_yaml(content: str) -> BudgetSeedDocument:
    raw = yaml.safe_load(content)
    if not isinstance(raw, dict):
        raise ValueError("budget seed YAML must be a mapping at the root")
    return BudgetSeedDocument.model_validate(raw)


def load_budget_seed_document(path: Path) -> BudgetSeedDocument:
    return parse_budget_seed_yaml(path.read_text(encoding="utf-8"))


def document_to_creates(
    doc: BudgetSeedDocument,
) -> tuple[AllocationPlanCreate, list[AllocationItemCreate]]:
    """Turn validated YAML into service-layer creates."""

    pm = period_month_for_budget_seed(doc.period_month)
    plan = AllocationPlanCreate(
        name=doc.plan.name,
        period_month=pm,
        currency=doc.plan.currency,
        income_amount=doc.plan.income_amount,
        income_cadence=doc.plan.income_cadence,
    )
    items = [doc.items[i].to_create(i) for i in range(len(doc.items))]
    return plan, items


def _existing_plan_by_name_and_month(
    session: Session, *, name: str, period_month: date
) -> AllocationPlan | None:
    stmt = select(AllocationPlan).where(
        AllocationPlan.name == name,
        AllocationPlan.period_month == period_month,
    )
    return session.scalars(stmt).first()


def apply_budget_seed_yaml(session: Session, yaml_path: Path) -> tuple[int, date]:
    """Replace prior plan with same name/month and insert items. Returns (item_count, period_month)."""

    doc = load_budget_seed_document(yaml_path)
    plan_create, item_creates = document_to_creates(doc)
    pm = plan_create.period_month

    existing = _existing_plan_by_name_and_month(session, name=plan_create.name, period_month=pm)
    if existing is not None:
        delete_allocation_plan(session, existing.id)

    plan_row = create_allocation_plan(session, plan_create)
    for payload in item_creates:
        create_allocation_item(session, plan_row.id, payload)
    ensure_budget_category_labels_from_strings(session, [ic.category for ic in item_creates])
    if doc.cash_flow_graph is not None:
        replace_plan_graph(
            session,
            plan_row.id,
            CashFlowGraphDocument(
                plan_id=plan_row.id,
                nodes=list(doc.cash_flow_graph.nodes),
                edges=list(doc.cash_flow_graph.edges),
            ),
        )
    else:
        replace_plan_graph(session, plan_row.id, default_seeded_plan_cash_flow_graph(plan_row.id))
    return len(item_creates), pm


def try_seed_budget_default_yaml(session: Session) -> tuple[bool, str]:
    """Load ``FINANCE_BUDGET_DEFAULT_YAML`` when enabled and present."""

    if not budget_default_seed_enabled():
        return False, "budget default seed disabled (FINANCE_BUDGET_DEFAULT_SEED_ENABLED)"

    path = default_budget_yaml_path()
    if not path.is_file():
        return False, f"budget default YAML not found: {path}"

    try:
        n, pm = apply_budget_seed_yaml(session, path)
    except (OSError, ValueError, yaml.YAMLError) as exc:
        return False, f"budget default seed failed: {exc}"

    return True, f"budget default seed: {path.name} → {n} line(s), month {pm.isoformat()}"
