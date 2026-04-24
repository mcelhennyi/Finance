"""Merchant display names — list, auto-pretty, and user overrides.

See Also: docs/design/services/analysis-service/overview.md
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func

from finance.db.models import MerchantDisplayOverride, Transaction
from finance.db.session import get_session
from finance.seed_merchant_displays import sync_merchant_display_seed_file
from finance.merchant_display import (
    auto_pretty_merchant,
    effective_display_name,
    needs_handwritten_pretty_name,
)

router = APIRouter(tags=["merchant-names"])


class MerchantNameRow(BaseModel):
    merchant_key: str
    transaction_count: int
    auto_pretty: str
    override_display: str | None = None
    effective_display: str
    needs_review: bool


class MerchantNameListResponse(BaseModel):
    rows: list[MerchantNameRow]


class MerchantOverrideSaveOut(MerchantNameRow):
    """PUT response: row plus whether ``data/seed-merchant-displays.json`` was updated."""

    seed_file_synced: bool
    seed_file_error: str | None = None


class MerchantDeleteOut(BaseModel):
    ok: bool = True
    merchant_key: str
    seed_file_synced: bool
    seed_file_error: str | None = None


class MerchantOverrideUpsert(BaseModel):
    merchant_key: str = Field(..., max_length=200)
    display_name: str = Field(..., max_length=200)


@router.get("/merchant-names", response_model=MerchantNameListResponse)
def list_merchant_names() -> MerchantNameListResponse:
    with get_session() as session:
        counts = (
            session.query(Transaction.merchant, func.count(Transaction.id))
            .filter(func.trim(Transaction.merchant) != "")
            .group_by(Transaction.merchant)
            .order_by(func.count(Transaction.id).desc())
            .all()
        )
        overrides = {
            o.merchant_key: o.display_name
            for o in session.query(MerchantDisplayOverride).all()
        }

    rows: list[MerchantNameRow] = []
    for merchant_key, txn_count in counts:
        key = merchant_key or ""
        ov = overrides.get(key)
        auto = auto_pretty_merchant(key)
        eff = effective_display_name(key, ov)
        rows.append(
            MerchantNameRow(
                merchant_key=key,
                transaction_count=int(txn_count),
                auto_pretty=auto,
                override_display=ov,
                effective_display=eff,
                needs_review=needs_handwritten_pretty_name(key, auto, ov is not None and ov.strip() != ""),
            )
        )
    return MerchantNameListResponse(rows=rows)


@router.put("/merchant-names", response_model=MerchantOverrideSaveOut)
def upsert_merchant_override(body: MerchantOverrideUpsert) -> MerchantOverrideSaveOut:
    key = body.merchant_key.strip()
    name = body.display_name.strip()
    if not key:
        raise HTTPException(status_code=400, detail="merchant_key is required")
    if not name:
        raise HTTPException(status_code=400, detail="display_name is required")

    with get_session() as session:
        row = session.query(MerchantDisplayOverride).filter(MerchantDisplayOverride.merchant_key == key).first()
        if row is None:
            row = MerchantDisplayOverride(merchant_key=key, display_name=name, updated_at=datetime.utcnow())
            session.add(row)
        else:
            row.display_name = name
            row.updated_at = datetime.utcnow()
        session.flush()

        txn_count = (
            session.query(func.count(Transaction.id)).filter(Transaction.merchant == key).scalar() or 0
        )

    synced, sync_err = sync_merchant_display_seed_file()

    auto = auto_pretty_merchant(key)
    return MerchantOverrideSaveOut(
        merchant_key=key,
        transaction_count=int(txn_count),
        auto_pretty=auto,
        override_display=name,
        effective_display=name,
        needs_review=False,
        seed_file_synced=synced,
        seed_file_error=sync_err,
    )


@router.delete("/merchant-names", response_model=MerchantDeleteOut)
def delete_merchant_override(merchant_key: str = Query(..., min_length=1, max_length=200)) -> MerchantDeleteOut:
    with get_session() as session:
        row = (
            session.query(MerchantDisplayOverride)
            .filter(MerchantDisplayOverride.merchant_key == merchant_key)
            .first()
        )
        if row is None:
            raise HTTPException(status_code=404, detail="No override for this merchant_key")
        session.delete(row)

    synced, sync_err = sync_merchant_display_seed_file()

    return MerchantDeleteOut(
        ok=True,
        merchant_key=merchant_key,
        seed_file_synced=synced,
        seed_file_error=sync_err,
    )
