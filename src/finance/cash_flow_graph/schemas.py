"""Pydantic contracts for persisted cash-flow graphs (per allocation plan).

Graphs are scoped by ``plan_id`` referencing ``allocation_plans.id``. Node and edge
``ref`` values are stable client- or server-assigned string keys used to wire edges
before integer DB ids exist (see T-FR-0006-02).

See Also:
    docs/design/budget-cash-flow-graph.md
    tasks/feature-history/FR-0006-budget-cash-flow-graph/10-design-00-skeleton.md
"""

from __future__ import annotations

import re
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator, model_validator

from finance.cash_flow_graph.enums import CashFlowAmountRule, CashFlowCadence, CashNodeKind

_REF_PATTERN = re.compile(r"^[a-zA-Z][a-zA-Z0-9_-]{0,63}$")


class CashFlowNodeSpec(BaseModel):
    """One node in a plan-scoped cash-flow graph (pre-persistence or API payload)."""

    ref: str = Field(
        min_length=1,
        max_length=64,
        description="Stable id within the graph (not necessarily the DB primary key).",
    )
    display_name: str = Field(min_length=1, max_length=200)
    kind: CashNodeKind
    institution: str | None = Field(default=None, max_length=200)
    parent_ref: str | None = Field(
        default=None,
        max_length=64,
        description="Optional parent account ref within the same plan (e.g. card under a Chase profile).",
    )
    layout_x: float | None = None
    layout_y: float | None = None
    currency: str = Field(default="USD", min_length=3, max_length=3)
    current_balance: Decimal | None = None
    balance_as_of: date | None = None
    account_mask: str | None = Field(default=None, max_length=32)
    notes: str = Field(default="", max_length=2000)
    is_active: bool = True

    @field_validator("ref")
    @classmethod
    def ref_format(cls, value: str) -> str:
        if not _REF_PATTERN.fullmatch(value):
            raise ValueError(
                "ref must start with a letter and contain only letters, digits, underscore, hyphen"
            )
        return value

    @field_validator("parent_ref")
    @classmethod
    def parent_ref_format(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        if not _REF_PATTERN.fullmatch(value):
            raise ValueError(
                "parent_ref must start with a letter and contain only letters, digits, underscore, hyphen"
            )
        return value

    @field_validator("currency")
    @classmethod
    def currency_upper(cls, value: str) -> str:
        return value.upper()

    @field_validator("account_mask")
    @classmethod
    def account_mask_blank_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def balance_date_pair(self) -> CashFlowNodeSpec:
        if self.current_balance is not None and self.balance_as_of is None:
            raise ValueError("balance_as_of is required when current_balance is set")
        return self


class CashFlowEdgeSpec(BaseModel):
    """Directed flow between two nodes, keyed by node ref."""

    ref: str = Field(min_length=1, max_length=64)
    from_ref: str = Field(min_length=1, max_length=64)
    to_ref: str = Field(min_length=1, max_length=64)
    label: str = Field(default="", max_length=200)
    amount_rule: CashFlowAmountRule
    fixed_amount: Decimal | None = Field(
        default=None,
        description="Positive currency amount when amount_rule is fixed.",
    )
    percent_of_inflow: Decimal | None = Field(
        default=None,
        description="0–100 when amount_rule is percent_of_inflow.",
    )
    cadence: CashFlowCadence
    day_of_month: int | None = Field(
        default=None,
        ge=1,
        le=31,
        description="Day of month when cadence is on_date; otherwise must be unset.",
    )

    @field_validator("ref", "from_ref", "to_ref")
    @classmethod
    def endpoint_ref_format(cls, value: str) -> str:
        if not _REF_PATTERN.fullmatch(value):
            raise ValueError(
                "ref must start with a letter and contain only letters, digits, underscore, hyphen"
            )
        return value

    @model_validator(mode="after")
    def amount_rule_fields(self) -> CashFlowEdgeSpec:
        if self.amount_rule == CashFlowAmountRule.FIXED:
            if self.fixed_amount is None or self.fixed_amount <= 0:
                raise ValueError("fixed_amount must be set and positive when amount_rule is fixed")
            if self.percent_of_inflow is not None:
                raise ValueError("percent_of_inflow must be omitted when amount_rule is fixed")
        elif self.amount_rule == CashFlowAmountRule.PERCENT_OF_INFLOW:
            if self.percent_of_inflow is None:
                raise ValueError(
                    "percent_of_inflow must be set when amount_rule is percent_of_inflow"
                )
            if not Decimal("0") <= self.percent_of_inflow <= Decimal("100"):
                raise ValueError("percent_of_inflow must be between 0 and 100")
            if self.fixed_amount is not None:
                raise ValueError(
                    "fixed_amount must be omitted when amount_rule is percent_of_inflow"
                )
        elif self.amount_rule == CashFlowAmountRule.REMAINDER:
            if self.fixed_amount is not None or self.percent_of_inflow is not None:
                raise ValueError("remainder rule must not set fixed_amount or percent_of_inflow")
        else:
            raise ValueError(f"unsupported amount_rule: {self.amount_rule!r}")
        return self

    @model_validator(mode="after")
    def cadence_day(self) -> CashFlowEdgeSpec:
        if self.cadence == CashFlowCadence.ON_DATE and self.day_of_month is None:
            raise ValueError("day_of_month is required when cadence is on_date")
        if self.cadence != CashFlowCadence.ON_DATE and self.day_of_month is not None:
            raise ValueError("day_of_month is only valid when cadence is on_date")
        return self


class CashFlowGraphDocument(BaseModel):
    """Full graph document for one allocation plan (API / service boundary)."""

    plan_id: int = Field(gt=0, description="FK target: allocation_plans.id")
    nodes: list[CashFlowNodeSpec]
    edges: list[CashFlowEdgeSpec]

    @model_validator(mode="after")
    def graph_integrity(self) -> CashFlowGraphDocument:
        node_refs = [n.ref for n in self.nodes]
        if len(set(node_refs)) != len(node_refs):
            raise ValueError("cash-flow node refs must be unique")

        edge_refs = [e.ref for e in self.edges]
        if len(set(edge_refs)) != len(edge_refs):
            raise ValueError("cash-flow edge refs must be unique")

        node_set = set(node_refs)
        for edge in self.edges:
            if edge.from_ref == edge.to_ref:
                raise ValueError(f"edge {edge.ref!r} must not loop from a node to itself")
            if edge.from_ref not in node_set or edge.to_ref not in node_set:
                raise ValueError(
                    f"edge {edge.ref!r} references unknown node ref "
                    f"({edge.from_ref!r} -> {edge.to_ref!r})"
                )

        by_ref = {n.ref: n for n in self.nodes}
        for n in self.nodes:
            if n.parent_ref is None:
                continue
            if n.parent_ref not in node_set:
                raise ValueError(
                    f"cash-flow node {n.ref!r} references unknown parent_ref {n.parent_ref!r}"
                )
            if n.parent_ref == n.ref:
                raise ValueError(f"cash-flow node {n.ref!r} must not use itself as parent_ref")
            visited: set[str] = set()
            cur: str | None = n.ref
            for _ in range(len(self.nodes) + 1):
                node = by_ref.get(cur) if cur else None
                if node is None or node.parent_ref is None:
                    break
                pr = node.parent_ref
                if pr in visited:
                    raise ValueError("cash-flow parent_ref forms a cycle")
                visited.add(cur)
                if pr == n.ref:
                    raise ValueError("cash-flow parent_ref forms a cycle")
                cur = pr
        return self
