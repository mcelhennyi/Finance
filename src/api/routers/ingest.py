"""Ingestion endpoints.

See Also: docs/design/services/ingestion-service/api.md
"""

from fastapi import APIRouter, HTTPException, UploadFile, Form
from fastapi.responses import JSONResponse

from api.schemas import IngestionResponse
from finance.db.session import get_session
from finance.ingestion.service import ingest_csv_content

router = APIRouter(tags=["ingestion"])


@router.post("/ingest", response_model=IngestionResponse)
async def ingest_statement(
    file: UploadFile,
    source: str = Form(default=""),
) -> IngestionResponse:
    """Accept a statement file upload and ingest into the database."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty filename")

    content = await file.read()

    try:
        with get_session() as session:
            result = ingest_csv_content(
                session=session,
                content=content,
                filename=file.filename,
                source_hint=source.strip().lower(),
            )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return IngestionResponse(
        source_file=result.source_file,
        source_type=result.source_type,
        records_parsed=result.records_parsed,
        records_inserted=result.records_inserted,
        records_skipped=result.records_skipped,
        errors=result.errors,
        duration_seconds=round(result.duration_seconds, 3),
    )
