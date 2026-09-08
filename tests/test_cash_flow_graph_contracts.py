"""Contract tests for cash-flow graph Pydantic models (FR-0006)."""

from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from finance.cash_flow_graph import (
    CashFlowAmountRule,
    CashFlowCadence,
    CashFlowEdgeSpec,
    CashFlowGraphDocument,
    CashFlowNodeSpec,
    CashNodeKind,
)


def _sample_nodes():
    return [
        CashFlowNodeSpec(ref="payroll", display_name="Payroll", kind=CashNodeKind.INCOME_SOURCE),
        CashFlowNodeSpec(ref="chk", display_name="Checking", kind=CashNodeKind.CHECKING),
        CashFlowNodeSpec(ref="save", display_name="Savings", kind=CashNodeKind.SAVINGS),
    ]


def test_cash_flow_graph_document_round_trip() -> None:
    doc = CashFlowGraphDocument(
        plan_id=1,
        nodes=_sample_nodes(),
        edges=[
            CashFlowEdgeSpec(
                ref="e1",
                from_ref="payroll",
                to_ref="chk",
                amount_rule=CashFlowAmountRule.FIXED,
                fixed_amount=Decimal("5000.00"),
                cadence=CashFlowCadence.MONTHLY,
            ),
            CashFlowEdgeSpec(
                ref="e2",
                from_ref="chk",
                to_ref="save",
                label="Sweep",
                amount_rule=CashFlowAmountRule.PERCENT_OF_INFLOW,
                percent_of_inflow=Decimal("20"),
                cadence=CashFlowCadence.ON_DATE,
                day_of_month=15,
            ),
        ],
    )
    assert doc.plan_id == 1
    assert len(doc.edges) == 2


def test_cash_flow_node_account_metadata() -> None:
    node = CashFlowNodeSpec(
        ref="brokerage",
        display_name="Brokerage Cash",
        kind=CashNodeKind.BROKERAGE_CASH,
        institution="Fidelity",
        currency="usd",
        current_balance=Decimal("1250.50"),
        balance_as_of=date(2026, 5, 10),
        account_mask=" 1234 ",
        notes="Taxable sweep account",
        is_active=False,
    )

    assert node.currency == "USD"
    assert node.current_balance == Decimal("1250.50")
    assert node.balance_as_of == date(2026, 5, 10)
    assert node.account_mask == "1234"
    assert node.notes == "Taxable sweep account"
    assert node.is_active is False


def test_rejects_balance_without_as_of_date() -> None:
    with pytest.raises(ValidationError, match="balance_as_of"):
        CashFlowNodeSpec(
            ref="checking",
            display_name="Checking",
            kind=CashNodeKind.CHECKING,
            current_balance=Decimal("500.00"),
        )


def test_rejects_duplicate_node_refs() -> None:
    with pytest.raises(ValidationError, match="unique"):
        CashFlowGraphDocument(
            plan_id=1,
            nodes=[
                CashFlowNodeSpec(ref="a", display_name="A", kind=CashNodeKind.OTHER),
                CashFlowNodeSpec(ref="a", display_name="B", kind=CashNodeKind.OTHER),
            ],
            edges=[],
        )


def test_rejects_missing_edge_endpoint() -> None:
    with pytest.raises(ValidationError, match="unknown node ref"):
        CashFlowGraphDocument(
            plan_id=1,
            nodes=[CashFlowNodeSpec(ref="a", display_name="A", kind=CashNodeKind.OTHER)],
            edges=[
                CashFlowEdgeSpec(
                    ref="e1",
                    from_ref="a",
                    to_ref="missing",
                    amount_rule=CashFlowAmountRule.REMAINDER,
                    cadence=CashFlowCadence.MONTHLY,
                )
            ],
        )


def test_rejects_self_loop_edge() -> None:
    with pytest.raises(ValidationError, match="loop"):
        CashFlowGraphDocument(
            plan_id=1,
            nodes=[CashFlowNodeSpec(ref="a", display_name="A", kind=CashNodeKind.OTHER)],
            edges=[
                CashFlowEdgeSpec(
                    ref="e1",
                    from_ref="a",
                    to_ref="a",
                    amount_rule=CashFlowAmountRule.REMAINDER,
                    cadence=CashFlowCadence.MONTHLY,
                )
            ],
        )


def test_edge_amount_rule_validation() -> None:
    with pytest.raises(ValidationError):
        CashFlowEdgeSpec(
            ref="e1",
            from_ref="a",
            to_ref="b",
            amount_rule=CashFlowAmountRule.FIXED,
            fixed_amount=None,
            cadence=CashFlowCadence.MONTHLY,
        )


def test_invalid_ref_pattern() -> None:
    with pytest.raises(ValidationError):
        CashFlowNodeSpec(ref="9bad", display_name="X", kind=CashNodeKind.OTHER)


def test_rejects_unknown_parent_ref() -> None:
    with pytest.raises(ValidationError, match="unknown parent_ref"):
        CashFlowGraphDocument(
            plan_id=1,
            nodes=[
                CashFlowNodeSpec(ref="a", display_name="A", kind=CashNodeKind.OTHER),
                CashFlowNodeSpec(
                    ref="b",
                    display_name="B",
                    kind=CashNodeKind.OTHER,
                    parent_ref="missing",
                ),
            ],
            edges=[],
        )


def test_rejects_parent_ref_cycle() -> None:
    with pytest.raises(ValidationError, match="cycle"):
        CashFlowGraphDocument(
            plan_id=1,
            nodes=[
                CashFlowNodeSpec(ref="a", display_name="A", kind=CashNodeKind.OTHER, parent_ref="b"),
                CashFlowNodeSpec(ref="b", display_name="B", kind=CashNodeKind.OTHER, parent_ref="a"),
            ],
            edges=[],
        )
