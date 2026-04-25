"""Income and liability ingestion contracts (manual/API + CSV)."""

from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from api.schemas import (
    IncomeRecordCreate,
    IncomeRecordUpdate,
    LiabilityRecordCreate,
    LiabilityRecordUpdate,
)
from finance.db.models import IncomeRecord, LiabilityRecord
from finance.ingestion.parsers import ALL_INCOME_PARSERS, ALL_LIABILITY_PARSERS
from finance.ingestion.parsers.contracts import parse_csv_rows


@dataclass
class ContractIngestionResult:
    source_file: str
    source_type: str
    records_parsed: int = 0
    records_inserted: int = 0
    records_skipped: int = 0
    errors: list[str] = field(default_factory=list)
    duration_seconds: float = 0.0


@dataclass
class IncomeLiabilityAggregate:
    total_income: float
    total_liabilities: float
    net_cash_after_liabilities: float
    active_income_count: int
    active_liability_count: int


def create_income_record(session: Session, payload: IncomeRecordCreate) -> IncomeRecord:
    now = datetime.utcnow()
    row = IncomeRecord(
        income_date=payload.income_date,
        source_name=payload.source_name.strip(),
        amount=Decimal(str(payload.amount)),
        currency=payload.currency.upper(),
        category=payload.category.strip(),
        notes=payload.notes,
        source_type="manual",
        updated_at=now,
    )
    session.add(row)
    session.flush()
    return row


def update_income_record(session: Session, record_id: int, payload: IncomeRecordUpdate) -> IncomeRecord:
    row = (
        session.query(IncomeRecord)
        .filter(IncomeRecord.id == record_id, IncomeRecord.deleted_at.is_(None))
        .first()
    )
    if row is None:
        raise ValueError(f"income record {record_id} not found")
    if payload.income_date is not None:
        row.income_date = payload.income_date
    if payload.source_name is not None:
        row.source_name = payload.source_name.strip()
    if payload.amount is not None:
        row.amount = Decimal(str(payload.amount))
    if payload.currency is not None:
        row.currency = payload.currency.upper()
    if payload.category is not None:
        row.category = payload.category.strip()
    if payload.notes is not None:
        row.notes = payload.notes
    row.updated_at = datetime.utcnow()
    session.flush()
    return row


def soft_delete_income_record(session: Session, record_id: int) -> None:
    row = (
        session.query(IncomeRecord)
        .filter(IncomeRecord.id == record_id, IncomeRecord.deleted_at.is_(None))
        .first()
    )
    if row is None:
        raise ValueError(f"income record {record_id} not found")
    now = datetime.utcnow()
    row.deleted_at = now
    row.updated_at = now
    session.flush()


def list_income_records(
    session: Session, from_date: date | None = None, to_date: date | None = None
) -> list[IncomeRecord]:
    q = session.query(IncomeRecord).filter(IncomeRecord.deleted_at.is_(None))
    if from_date is not None:
        q = q.filter(IncomeRecord.income_date >= from_date)
    if to_date is not None:
        q = q.filter(IncomeRecord.income_date <= to_date)
    return q.order_by(IncomeRecord.income_date.desc(), IncomeRecord.id.desc()).all()


def create_liability_record(session: Session, payload: LiabilityRecordCreate) -> LiabilityRecord:
    now = datetime.utcnow()
    row = LiabilityRecord(
        as_of_date=payload.as_of_date,
        name=payload.name.strip(),
        liability_type=payload.liability_type.strip(),
        principal_amount=Decimal(str(payload.principal_amount)),
        minimum_payment=Decimal(str(payload.minimum_payment)),
        interest_rate_apr=Decimal(str(payload.interest_rate_apr)),
        currency=payload.currency.upper(),
        notes=payload.notes,
        source_type="manual",
        updated_at=now,
    )
    session.add(row)
    session.flush()
    return row


def update_liability_record(
    session: Session, record_id: int, payload: LiabilityRecordUpdate
) -> LiabilityRecord:
    row = (
        session.query(LiabilityRecord)
        .filter(LiabilityRecord.id == record_id, LiabilityRecord.deleted_at.is_(None))
        .first()
    )
    if row is None:
        raise ValueError(f"liability record {record_id} not found")
    if payload.as_of_date is not None:
        row.as_of_date = payload.as_of_date
    if payload.name is not None:
        row.name = payload.name.strip()
    if payload.liability_type is not None:
        row.liability_type = payload.liability_type.strip()
    if payload.principal_amount is not None:
        row.principal_amount = Decimal(str(payload.principal_amount))
    if payload.minimum_payment is not None:
        row.minimum_payment = Decimal(str(payload.minimum_payment))
    if payload.interest_rate_apr is not None:
        row.interest_rate_apr = Decimal(str(payload.interest_rate_apr))
    if payload.currency is not None:
        row.currency = payload.currency.upper()
    if payload.notes is not None:
        row.notes = payload.notes
    row.updated_at = datetime.utcnow()
    session.flush()
    return row


def soft_delete_liability_record(session: Session, record_id: int) -> None:
    row = (
        session.query(LiabilityRecord)
        .filter(LiabilityRecord.id == record_id, LiabilityRecord.deleted_at.is_(None))
        .first()
    )
    if row is None:
        raise ValueError(f"liability record {record_id} not found")
    now = datetime.utcnow()
    row.deleted_at = now
    row.updated_at = now
    session.flush()


def list_liability_records(
    session: Session, from_date: date | None = None, to_date: date | None = None
) -> list[LiabilityRecord]:
    q = session.query(LiabilityRecord).filter(LiabilityRecord.deleted_at.is_(None))
    if from_date is not None:
        q = q.filter(LiabilityRecord.as_of_date >= from_date)
    if to_date is not None:
        q = q.filter(LiabilityRecord.as_of_date <= to_date)
    return q.order_by(LiabilityRecord.as_of_date.desc(), LiabilityRecord.id.desc()).all()


def ingest_income_csv_content(session: Session, content: bytes, filename: str) -> ContractIngestionResult:
    start = datetime.utcnow()
    result = ContractIngestionResult(source_file=filename, source_type="income_csv")
    try:
        headers, rows = parse_csv_rows(content)
    except Exception as exc:
        result.errors.append(f"CSV parse error: {exc}")
        return result
    parser = next((p for p in ALL_INCOME_PARSERS if p.can_parse(headers)), None)
    if parser is None:
        result.errors.append("No income parser could parse CSV headers.")
        return result
    result.source_type = parser.source_name
    for raw in parser.parse_rows(rows):
        result.records_parsed += 1
        if raw.amount <= 0:
            result.records_skipped += 1
            continue
        session.add(
            IncomeRecord(
                income_date=raw.income_date,
                source_name=raw.source_name,
                amount=raw.amount,
                currency=raw.currency,
                category=raw.category,
                notes=raw.notes,
                source_file=filename,
                source_type=parser.source_name,
                updated_at=datetime.utcnow(),
            )
        )
        result.records_inserted += 1
    session.flush()
    result.duration_seconds = (datetime.utcnow() - start).total_seconds()
    return result


def ingest_liability_csv_content(
    session: Session, content: bytes, filename: str
) -> ContractIngestionResult:
    start = datetime.utcnow()
    result = ContractIngestionResult(source_file=filename, source_type="liability_csv")
    try:
        headers, rows = parse_csv_rows(content)
    except Exception as exc:
        result.errors.append(f"CSV parse error: {exc}")
        return result
    parser = next((p for p in ALL_LIABILITY_PARSERS if p.can_parse(headers)), None)
    if parser is None:
        result.errors.append("No liability parser could parse CSV headers.")
        return result
    result.source_type = parser.source_name
    for raw in parser.parse_rows(rows):
        result.records_parsed += 1
        if raw.principal_amount <= 0:
            result.records_skipped += 1
            continue
        session.add(
            LiabilityRecord(
                as_of_date=raw.as_of_date,
                name=raw.name,
                liability_type=raw.liability_type,
                principal_amount=raw.principal_amount,
                minimum_payment=raw.minimum_payment,
                interest_rate_apr=raw.interest_rate_apr,
                currency=raw.currency,
                notes=raw.notes,
                source_file=filename,
                source_type=parser.source_name,
                updated_at=datetime.utcnow(),
            )
        )
        result.records_inserted += 1
    session.flush()
    result.duration_seconds = (datetime.utcnow() - start).total_seconds()
    return result


def aggregate_income_liabilities(
    session: Session, from_date: date | None = None, to_date: date | None = None
) -> IncomeLiabilityAggregate:
    income_q = session.query(IncomeRecord).filter(IncomeRecord.deleted_at.is_(None))
    liability_q = session.query(LiabilityRecord).filter(LiabilityRecord.deleted_at.is_(None))
    if from_date is not None:
        income_q = income_q.filter(IncomeRecord.income_date >= from_date)
        liability_q = liability_q.filter(LiabilityRecord.as_of_date >= from_date)
    if to_date is not None:
        income_q = income_q.filter(IncomeRecord.income_date <= to_date)
        liability_q = liability_q.filter(LiabilityRecord.as_of_date <= to_date)
    income_total = income_q.with_entities(func.coalesce(func.sum(IncomeRecord.amount), 0)).scalar()
    liability_total = liability_q.with_entities(
        func.coalesce(func.sum(LiabilityRecord.principal_amount), 0)
    ).scalar()
    income_count = income_q.count()
    liability_count = liability_q.count()
    income = float(income_total or 0)
    liabilities = float(liability_total or 0)
    return IncomeLiabilityAggregate(
        total_income=round(income, 2),
        total_liabilities=round(liabilities, 2),
        net_cash_after_liabilities=round(income - liabilities, 2),
        active_income_count=income_count,
        active_liability_count=liability_count,
    )
