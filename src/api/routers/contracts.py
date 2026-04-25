"""Income and liability contract endpoints."""

from datetime import date

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from api.schemas import (
    IncomeLiabilityAggregateOut,
    IncomeListResponse,
    IncomeRecordCreate,
    IncomeRecordOut,
    IncomeRecordUpdate,
    IngestionResponse,
    LiabilityListResponse,
    LiabilityRecordCreate,
    LiabilityRecordOut,
    LiabilityRecordUpdate,
)
from finance.db.session import get_session
from finance.ingestion.contracts import (
    aggregate_income_liabilities,
    create_income_record,
    create_liability_record,
    ingest_income_csv_content,
    ingest_liability_csv_content,
    list_income_records,
    list_liability_records,
    soft_delete_income_record,
    soft_delete_liability_record,
    update_income_record,
    update_liability_record,
)

router = APIRouter(tags=["contracts"])


def _income_out(row) -> IncomeRecordOut:
    return IncomeRecordOut(
        id=row.id,
        income_date=row.income_date,
        source_name=row.source_name,
        amount=float(row.amount),
        currency=row.currency,
        category=row.category,
        notes=row.notes,
        source_file=row.source_file,
        source_type=row.source_type,
        created_at=row.created_at,
        updated_at=row.updated_at,
        deleted_at=row.deleted_at,
    )


def _liability_out(row) -> LiabilityRecordOut:
    return LiabilityRecordOut(
        id=row.id,
        as_of_date=row.as_of_date,
        name=row.name,
        liability_type=row.liability_type,
        principal_amount=float(row.principal_amount),
        minimum_payment=float(row.minimum_payment),
        interest_rate_apr=float(row.interest_rate_apr),
        currency=row.currency,
        notes=row.notes,
        source_file=row.source_file,
        source_type=row.source_type,
        created_at=row.created_at,
        updated_at=row.updated_at,
        deleted_at=row.deleted_at,
    )


@router.post("/contracts/income", response_model=IncomeRecordOut)
def create_income(payload: IncomeRecordCreate) -> IncomeRecordOut:
    with get_session() as session:
        row = create_income_record(session, payload)
        return _income_out(row)


@router.put("/contracts/income/{record_id}", response_model=IncomeRecordOut)
def update_income(record_id: int, payload: IncomeRecordUpdate) -> IncomeRecordOut:
    with get_session() as session:
        try:
            row = update_income_record(session, record_id, payload)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return _income_out(row)


@router.delete("/contracts/income/{record_id}")
def delete_income(record_id: int) -> dict[str, bool]:
    with get_session() as session:
        try:
            soft_delete_income_record(session, record_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return {"deleted": True}


@router.get("/contracts/income", response_model=IncomeListResponse)
def list_income(
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
) -> IncomeListResponse:
    with get_session() as session:
        rows = list_income_records(session, from_date=from_date, to_date=to_date)
        return IncomeListResponse(items=[_income_out(r) for r in rows])


@router.post("/contracts/liabilities", response_model=LiabilityRecordOut)
def create_liability(payload: LiabilityRecordCreate) -> LiabilityRecordOut:
    with get_session() as session:
        row = create_liability_record(session, payload)
        return _liability_out(row)


@router.put("/contracts/liabilities/{record_id}", response_model=LiabilityRecordOut)
def update_liability(record_id: int, payload: LiabilityRecordUpdate) -> LiabilityRecordOut:
    with get_session() as session:
        try:
            row = update_liability_record(session, record_id, payload)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return _liability_out(row)


@router.delete("/contracts/liabilities/{record_id}")
def delete_liability(record_id: int) -> dict[str, bool]:
    with get_session() as session:
        try:
            soft_delete_liability_record(session, record_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return {"deleted": True}


@router.get("/contracts/liabilities", response_model=LiabilityListResponse)
def list_liabilities(
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
) -> LiabilityListResponse:
    with get_session() as session:
        rows = list_liability_records(session, from_date=from_date, to_date=to_date)
        return LiabilityListResponse(items=[_liability_out(r) for r in rows])


@router.post("/contracts/income/ingest", response_model=IngestionResponse)
async def ingest_income(file: UploadFile = File(...)) -> IngestionResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty filename")
    content = await file.read()
    with get_session() as session:
        result = ingest_income_csv_content(session, content, file.filename)
    return IngestionResponse(
        source_file=result.source_file,
        source_type=result.source_type,
        records_parsed=result.records_parsed,
        records_inserted=result.records_inserted,
        records_skipped=result.records_skipped,
        errors=result.errors,
        duration_seconds=round(result.duration_seconds, 3),
    )


@router.post("/contracts/liabilities/ingest", response_model=IngestionResponse)
async def ingest_liabilities(file: UploadFile = File(...)) -> IngestionResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty filename")
    content = await file.read()
    with get_session() as session:
        result = ingest_liability_csv_content(session, content, file.filename)
    return IngestionResponse(
        source_file=result.source_file,
        source_type=result.source_type,
        records_parsed=result.records_parsed,
        records_inserted=result.records_inserted,
        records_skipped=result.records_skipped,
        errors=result.errors,
        duration_seconds=round(result.duration_seconds, 3),
    )


@router.get("/contracts/aggregate", response_model=IncomeLiabilityAggregateOut)
def get_contracts_aggregate(
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
) -> IncomeLiabilityAggregateOut:
    with get_session() as session:
        agg = aggregate_income_liabilities(session, from_date=from_date, to_date=to_date)
    return IncomeLiabilityAggregateOut(
        total_income=agg.total_income,
        total_liabilities=agg.total_liabilities,
        net_cash_after_liabilities=agg.net_cash_after_liabilities,
        active_income_count=agg.active_income_count,
        active_liability_count=agg.active_liability_count,
    )
