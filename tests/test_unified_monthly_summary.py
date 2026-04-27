from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from api.schemas import (
    IncomeRecordCreate,
    LiabilityRecordCreate,
    UnifiedViewSummaryOut,
)
from finance.db.models import Base, Budget, Goal, Transaction
from finance.ingestion.contracts import create_income_record, create_liability_record
from finance.unified import build_unified_monthly_summary
from finance.unified.monthly import normalize_period_month


def _make_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    return factory()


def _add_txn(
    session: Session, *, d: date, amount: str, category: str, is_credit: bool = False
) -> None:
    session.add(
        Transaction(
            transaction_date=d,
            description_raw="x",
            description_normalized="x",
            amount=Decimal(amount),
            category=category,
            category_raw=category,
            merchant="m",
            source_file="s",
            source_type="csv",
            is_credit=is_credit,
            is_flagged_business=False,
            notes="",
        )
    )


@pytest.mark.unit
def test_normalize_period_month() -> None:
    assert normalize_period_month(date(2026, 4, 20)) == date(2026, 4, 1)


@pytest.mark.integration
def test_unified_summary_reconciles_and_composes() -> None:
    """VAL-style: operating line vs independent re-sum within USD 10; includes budgets/goals/flows."""
    period = date(2026, 4, 1)
    s = _make_session()
    try:
        _add_txn(s, d=date(2026, 4, 5), amount="100.00", category="Dining")
        _add_txn(s, d=date(2026, 4, 6), amount="-10.00", category="Dining", is_credit=True)
        s.add(
            Budget(
                category="Dining",
                period_month=period,
                amount_limit=Decimal("200.00"),
            )
        )
        s.add(
            Goal(
                name="Save",
                goal_type="savings",
                target_amount=Decimal("500.00"),
                period_month=period,
            )
        )
        create_income_record(
            s,
            IncomeRecordCreate(
                source_name="Job",
                income_date=date(2026, 4, 1),
                amount=3000.0,
            ),
        )
        create_liability_record(
            s,
            LiabilityRecordCreate(
                name="Card",
                liability_type="credit_card",
                as_of_date=date(2026, 4, 10),
                principal_amount=500.0,
            ),
        )
        s.commit()

        summary = build_unified_monthly_summary(s, period, as_of=date(2026, 4, 15))

        assert summary.contracts.active_income_count == 1
        assert summary.contracts.active_liability_count == 1
        assert summary.card_cash_flow.total_charges == 100.0
        assert summary.card_cash_flow.total_credits == 10.0
        assert len(summary.budgets) == 1
        assert summary.budgets[0].variance < 0  # under budget
        assert len(summary.goals) == 1
        liab_principals = sum(x.principal_amount for x in summary.net_worth.liability_line_items)
        assert liab_principals == summary.contracts.total_liabilities
        assert abs(summary.reconciliation.discrepancy) < 0.01
        assert summary.reconciliation.within_tolerance
        assert abs(summary.reconciliation.income_aggregate_vs_line_items) < 0.01
        assert summary.reconciliation.within_tolerance_income
        u = round(3000.0 + 10.0 - 100.0, 2)
        assert summary.reconciliation.unified_operating_net == u
    finally:
        s.close()


@pytest.mark.unit
def test_unified_view_summary_out_schema_stability() -> None:
    sample = {
        "period_month": "2026-04-01",
        "as_of": "2026-04-15",
        "currency": "USD",
        "budgets": [],
        "goals": [],
        "card_cash_flow": {
            "total_charges": 0.0,
            "total_credits": 0.0,
            "net_spent": 0.0,
            "transaction_count": 0,
            "by_category": {},
        },
        "contracts": {
            "total_income": 0.0,
            "total_liabilities": 0.0,
            "net_cash_after_liabilities": 0.0,
            "active_income_count": 0,
            "active_liability_count": 0,
        },
        "net_worth": {
            "assets_total": 0.0,
            "assets_tracked": False,
            "liabilities_total": 0.0,
            "net_worth": 0.0,
            "liability_line_items": [],
        },
        "reconciliation": {
            "unified_operating_net": 0.0,
            "independent_operating_net": 0.0,
            "discrepancy": 0.0,
            "within_tolerance": True,
            "income_aggregate_vs_line_items": 0.0,
            "within_tolerance_income": True,
        },
    }
    m = UnifiedViewSummaryOut.model_validate(sample)
    assert m.period_month == date(2026, 4, 1)
