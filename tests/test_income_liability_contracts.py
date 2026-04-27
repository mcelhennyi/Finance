from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from api.schemas import (
    IncomeAggregateOut,
    IncomeRecordCreate,
    IncomeRecordUpdate,
    LiabilityAggregateOut,
    LiabilityRecordCreate,
    LiabilityRecordUpdate,
)
from finance.db.models import Base
from finance.ingestion.contracts import (
    aggregate_income_liabilities,
    create_income_record,
    create_liability_record,
    ingest_income_csv_content,
    ingest_liability_csv_content,
    soft_delete_income_record,
    soft_delete_liability_record,
    update_income_record,
    update_liability_record,
)


def _make_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    return factory()


@pytest.mark.unit
def test_income_contract_models_require_core_fields() -> None:
    with pytest.raises(ValidationError):
        IncomeRecordCreate(amount=1500.0, income_date=date(2026, 4, 1))

    with pytest.raises(ValidationError):
        IncomeRecordCreate(source_name="Payroll", income_date=date(2026, 4, 1))

    with pytest.raises(ValidationError):
        IncomeRecordUpdate(amount=0)


@pytest.mark.unit
def test_liability_contract_models_require_core_fields() -> None:
    with pytest.raises(ValidationError):
        LiabilityRecordCreate(name="Visa", liability_type="credit_card")

    with pytest.raises(ValidationError):
        LiabilityRecordCreate(
            name="Visa",
            liability_type="credit_card",
            principal_amount=1200.0,
            as_of_date=date(2026, 4, 1),
            minimum_payment=-10.0,
        )

    with pytest.raises(ValidationError):
        LiabilityRecordUpdate(principal_amount=0)


@pytest.mark.integration
def test_income_and_liability_lifecycle_and_aggregate() -> None:
    session = _make_session()
    try:
        income = create_income_record(
            session,
            IncomeRecordCreate(
                source_name="Payroll",
                income_date=date(2026, 4, 5),
                amount=3200.0,
                category="Salary",
            ),
        )
        liability = create_liability_record(
            session,
            LiabilityRecordCreate(
                name="Visa Platinum",
                liability_type="credit_card",
                principal_amount=1100.0,
                as_of_date=date(2026, 4, 5),
                minimum_payment=35.0,
            ),
        )
        session.commit()

        updated_income = update_income_record(session, income.id, IncomeRecordUpdate(amount=3300.0))
        updated_liability = update_liability_record(
            session, liability.id, LiabilityRecordUpdate(principal_amount=1000.0)
        )
        session.commit()

        assert float(updated_income.amount) == 3300.0
        assert float(updated_liability.principal_amount) == 1000.0

        agg = aggregate_income_liabilities(session, from_date=date(2026, 4, 1), to_date=date(2026, 4, 30))
        assert agg.active_income_count == 1
        assert agg.active_liability_count == 1
        assert agg.total_income == 3300.0
        assert agg.total_liabilities == 1000.0

        soft_delete_income_record(session, income.id)
        soft_delete_liability_record(session, liability.id)
        session.commit()

        after_delete = aggregate_income_liabilities(
            session, from_date=date(2026, 4, 1), to_date=date(2026, 4, 30)
        )
        assert after_delete.active_income_count == 0
        assert after_delete.active_liability_count == 0
    finally:
        session.close()


@pytest.mark.integration
def test_csv_contract_ingest_and_parser_hooks() -> None:
    income_csv = (
        "income_date,source_name,amount,category,notes\n"
        "2026-04-01,Payroll,2500.00,Salary,monthly pay\n"
        "2026-04-15,Freelance,800.00,Side Hustle,client invoice\n"
    ).encode("utf-8")
    liability_csv = (
        "as_of_date,name,liability_type,principal_amount,minimum_payment,notes\n"
        "2026-04-01,Visa Platinum,credit_card,1200.00,35.00,statement close\n"
    ).encode("utf-8")

    session = _make_session()
    try:
        income_result = ingest_income_csv_content(session, income_csv, "income-seed.csv")
        liability_result = ingest_liability_csv_content(session, liability_csv, "liability-seed.csv")
        session.commit()

        assert income_result.records_parsed == 2
        assert income_result.records_inserted == 2
        assert not income_result.errors
        assert liability_result.records_parsed == 1
        assert liability_result.records_inserted == 1
        assert not liability_result.errors

        agg = aggregate_income_liabilities(session)
        shaped_income = IncomeAggregateOut(
            total_income=agg.total_income,
            active_income_count=agg.active_income_count,
        )
        shaped_liability = LiabilityAggregateOut(
            total_liabilities=agg.total_liabilities,
            active_liability_count=agg.active_liability_count,
        )
        assert shaped_income.total_income == 3300.0
        assert shaped_liability.total_liabilities == 1200.0
    finally:
        session.close()
