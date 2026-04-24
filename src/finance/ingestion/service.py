"""Ingestion service — orchestrates the full ingest pipeline.

See Also: docs/design/services/ingestion-service/overview.md
"""

import csv
import hashlib
import io
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

from finance.db.models import Account, IngestionLog, Transaction
from finance.ingestion.parsers import ALL_PARSERS
from finance.matching import merchant_name_fingerprint
from finance.ingestion.parsers.base import RawTransaction, StatementParser

# Default category maps (overridable via config.toml)
DEFAULT_CATEGORY_MAP: dict[str, str] = {
    "Restaurant-Restaurant": "Dining",
    "Restaurant-Bar & Café": "Coffee & Bars",
    "Merchandise & Supplies-Groceries": "Groceries",
    "Merchandise & Supplies-Internet Purchase": "Online Shopping",
    "Merchandise & Supplies-General Retail": "General Retail",
    "Merchandise & Supplies-Wholesale Stores": "Groceries",
    "Merchandise & Supplies-Hardware Supplies": "Home Improvement",
    "Transportation-Fuel": "Gas",
    "Transportation-Parking Charges": "Parking",
    "Business Services-Health Care Services": "Healthcare",
    "Business Services-Contracting Services": "Home Services",
    "Business Services-Other Services": "Other Services",
    "Business Services-Banking Services": "Professional Services",
    "Entertainment-Associations": "Fitness & Entertainment",
    "Travel-Airline": "Travel",
    "Fees & Adjustments-Fees & Adjustments": "Fees & Interest",
    "Food & Drink": "Dining",
    "Groceries": "Groceries",
    "Gas": "Gas",
    "Health & Wellness": "Healthcare",
    "Shopping": "General Retail",
    "Travel": "Travel",
    "Entertainment": "Fitness & Entertainment",
    "Personal": "Personal",
    "Home": "Home Improvement",
    "Education": "Education",
    "Automotive": "Auto",
    "Utilities": "Utilities",
    "Insurance": "Insurance",
}

DEFAULT_MERCHANT_OVERRIDES: dict[str, str] = {
    "P. TERRY": "Dining",
    "WHATABURGER": "Dining",
    "IN-N-OUT": "Dining",
    "MCDONALD": "Dining",
    "CHICK-FIL-A": "Dining",
    "STARBUCKS": "Coffee & Bars",
    "H-E-B": "Groceries",
    "HEB": "Groceries",
    "COSTCO": "Groceries",
    "WALMART": "Groceries",
    "TARGET": "General Retail",
    "AMAZON": "Online Shopping",
    "NETFLIX": "Subscriptions",
    "SPOTIFY": "Subscriptions",
    "APPLE.COM": "Subscriptions",
    "GOOGLE": "Subscriptions",
}


@dataclass
class IngestionResult:
    source_file: str
    source_type: str
    records_parsed: int = 0
    records_inserted: int = 0
    records_skipped: int = 0
    errors: list[str] = field(default_factory=list)
    duration_seconds: float = 0.0


def _resolve_category(category_raw: str, description: str) -> str:
    desc_fp = merchant_name_fingerprint(description)
    for merchant, cat in DEFAULT_MERCHANT_OVERRIDES.items():
        needle = merchant_name_fingerprint(merchant)
        if needle and needle in desc_fp:
            return cat
    if category_raw:
        if category_raw in DEFAULT_CATEGORY_MAP:
            return DEFAULT_CATEGORY_MAP[category_raw]
        # Try partial match
        for key, val in DEFAULT_CATEGORY_MAP.items():
            if key.lower() in category_raw.lower():
                return val
        return category_raw
    return "Uncategorized"


def _normalize_description(raw: str) -> str:
    cleaned = re.sub(r"\s{2,}", " ", raw).strip()
    return cleaned[:100]


def _extract_merchant(description: str) -> str:
    cleaned = re.sub(r"\s{2,}", " ", description).strip()
    return cleaned[:50]


def _file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()[:16]


def _is_duplicate(session: Session, tx: RawTransaction) -> bool:
    from decimal import Decimal
    existing = (
        session.query(Transaction)
        .filter(
            Transaction.transaction_date == tx.transaction_date,
            Transaction.amount == tx.amount,
            Transaction.description_raw == tx.description_raw,
        )
        .first()
    )
    return existing is not None


def _get_or_create_account(session: Session, source_name: str) -> Account:
    account = session.query(Account).filter(Account.name == source_name).first()
    if account is None:
        account = Account(
            name=source_name,
            institution=source_name,
            account_type="credit",
        )
        session.add(account)
        session.flush()
    return account


def _select_parser(headers: list[str], source_hint: str) -> StatementParser | None:
    """Select parser by hint first, then by header detection."""
    if source_hint:
        for parser in ALL_PARSERS:
            if parser.source_key == source_hint:
                return parser
    for parser in ALL_PARSERS:
        if parser.can_parse(headers):
            return parser
    return None


def ingest_csv_content(
    session: Session,
    content: bytes,
    filename: str,
    source_hint: str = "",
) -> IngestionResult:
    """Ingest a CSV file given its raw bytes content.

    See Also: docs/design/services/ingestion-service/overview.md
    """
    start = datetime.utcnow()
    result = IngestionResult(source_file=filename, source_type=source_hint or "auto")

    try:
        text = content.decode("utf-8-sig", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        headers = reader.fieldnames or []
        rows = list(reader)
    except Exception as exc:
        result.errors.append(f"CSV parse error: {exc}")
        return result

    parser = _select_parser(list(headers), source_hint)
    if parser is None:
        result.errors.append(
            "Could not detect statement format. Try specifying --source explicitly."
        )
        return result

    result.source_type = parser.source_name

    try:
        raw_transactions = parser.parse_rows(rows)
    except Exception as exc:
        result.errors.append(f"Parser error: {exc}")
        return result

    result.records_parsed = len(raw_transactions)
    account = _get_or_create_account(session, parser.source_name)

    for raw_tx in raw_transactions:
        if raw_tx.is_payment():
            result.records_skipped += 1
            continue

        if _is_duplicate(session, raw_tx):
            result.records_skipped += 1
            continue

        category = _resolve_category(raw_tx.category_raw, raw_tx.description_raw)
        is_credit = raw_tx.amount < 0

        tx = Transaction(
            account_id=account.id,
            transaction_date=raw_tx.transaction_date,
            description_raw=raw_tx.description_raw,
            description_normalized=_normalize_description(raw_tx.description_raw),
            amount=raw_tx.amount,
            currency=raw_tx.currency,
            category=category,
            category_raw=raw_tx.category_raw,
            merchant=_extract_merchant(raw_tx.description_raw),
            source_file=filename,
            source_type=parser.source_name,
            is_credit=is_credit,
        )
        session.add(tx)
        result.records_inserted += 1

    log = IngestionLog(
        source_file=filename,
        source_file_hash=_file_hash(content),
        source_type=parser.source_name,
        records_parsed=result.records_parsed,
        records_inserted=result.records_inserted,
        records_skipped=result.records_skipped,
        status="ok" if not result.errors else "error",
        error_details="; ".join(result.errors),
    )
    session.add(log)
    session.flush()

    result.duration_seconds = (datetime.utcnow() - start).total_seconds()
    return result
