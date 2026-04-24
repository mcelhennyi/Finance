"""Merchant display overrides — JSON seed file and sync with the database.

The file ``data/seed-merchant-displays.json`` (configurable via
``FINANCE_SEED_MERCHANT_DISPLAYS``) is applied during ``python -m finance.dev_seed``
and is rewritten whenever overrides are changed through the API.

See Also: docs/design/services/ingestion-service/overview.md
"""

from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from finance.db.models import MerchantDisplayOverride
from finance.db.session import get_session, init_db

logger = logging.getLogger(__name__)


def default_seed_path() -> Path:
    """Resolve the merchant-display seed JSON path."""
    raw = os.environ.get("FINANCE_SEED_MERCHANT_DISPLAYS", "").strip()
    if raw:
        return Path(raw).expanduser()
    # repo/src/finance/seed_merchant_displays.py → repo root
    root = Path(__file__).resolve().parents[2]
    return root / "data" / "seed-merchant-displays.json"


def read_seed_entries(path: Path) -> list[dict[str, str]]:
    """Load ``[{merchant_key, display_name}, ...]`` from JSON; skip invalid rows."""
    if not path.is_file():
        return []
    try:
        data: Any = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Could not read merchant display seed %s: %s", path, exc)
        return []
    if not isinstance(data, list):
        return []
    out: list[dict[str, str]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        mk = str(item.get("merchant_key", "")).strip()
        dn = str(item.get("display_name", "")).strip()
        if mk and dn:
            out.append({"merchant_key": mk, "display_name": dn})
    return out


def apply_merchant_display_seed(session: Session, path: Path | None = None) -> int:
    """Upsert all entries from the seed file. Returns number of rows applied."""
    path = path or default_seed_path()
    entries = read_seed_entries(path)
    if not entries:
        return 0

    for e in entries:
        key = e["merchant_key"]
        name = e["display_name"]
        row = session.query(MerchantDisplayOverride).filter(MerchantDisplayOverride.merchant_key == key).first()
        if row is None:
            session.add(
                MerchantDisplayOverride(
                    merchant_key=key,
                    display_name=name,
                    updated_at=datetime.utcnow(),
                )
            )
        else:
            row.display_name = name
            row.updated_at = datetime.utcnow()
    session.flush()
    return len(entries)


def sync_merchant_display_seed_file(path: Path | None = None) -> tuple[bool, str | None]:
    """Write every ``MerchantDisplayOverride`` row to the JSON seed file.

    Returns:
        ``(True, None)`` on success, or ``(False, error message)`` if the file
        could not be written (database is unchanged by this function).
    """
    path = path or default_seed_path()
    try:
        with get_session() as session:
            rows = (
                session.query(MerchantDisplayOverride)
                .order_by(MerchantDisplayOverride.merchant_key)
                .all()
            )
            payload = [{"merchant_key": r.merchant_key, "display_name": r.display_name} for r in rows]
        path.parent.mkdir(parents=True, exist_ok=True)
        text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
        path.write_text(text, encoding="utf-8")
    except OSError as exc:
        logger.error("Could not write merchant display seed file %s: %s", path, exc)
        return False, str(exc)
    except (TypeError, ValueError) as exc:
        logger.error("Could not serialize merchant display seed %s: %s", path, exc)
        return False, str(exc)
    except Exception as exc:  # noqa: BLE001 — never fail API after DB commit
        logger.exception("Unexpected error writing merchant display seed %s", path)
        return False, str(exc)
    logger.info("Merchant display seed file updated (%d overrides): %s", len(payload), path)
    return True, None


def export_seed_file_cli() -> int:
    """CLI: dump DB overrides to the default seed path."""
    init_db()
    path = default_seed_path()
    ok, err = sync_merchant_display_seed_file(path)
    if not ok:
        print(f"Export failed: {err}", file=sys.stderr)
        return 1
    try:
        n = len(read_seed_entries(path))
    except OSError:
        n = 0
    print(f"Wrote {n} override(s) to {path}", flush=True)
    return 0
