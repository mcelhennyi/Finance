"""Database session management.

See Also: docs/design/technology-decisions.md — TD-002, TD-003
"""

import os
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from finance.db.models import Base

_DEFAULT_DB_DIR = Path.home() / ".finance"
_DEFAULT_DB_PATH = _DEFAULT_DB_DIR / "finance.db"


def get_db_url() -> str:
    url = os.environ.get("FINANCE_DB_URL")
    if url:
        return url
    _DEFAULT_DB_DIR.mkdir(exist_ok=True)
    return f"sqlite:///{_DEFAULT_DB_PATH}"


def _make_engine():
    url = get_db_url()
    connect_args = {}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return create_engine(url, connect_args=connect_args, echo=False)


_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = _make_engine()
    return _engine


def get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(bind=get_engine(), autocommit=False, autoflush=False)
    return _SessionLocal


def apply_additive_schema_fixes(engine: Engine) -> None:
    """Apply ALTERs needed when an on-disk DB predates newer ORM columns.

    SQLAlchemy ``create_all`` does not add columns to existing tables. SQLite (and
    other) volumes created before FR-0002 budget sync shipped without
    ``budgets.allocation_derived``, which breaks unified summary and allocation paths.

    See Also:
        src/finance/db/migrations/phase2_budgets_allocation_derived.sql
    """

    insp = inspect(engine)
    if not insp.has_table("budgets"):
        return
    cols = {c["name"] for c in insp.get_columns("budgets")}
    if "allocation_derived" in cols:
        return
    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE budgets ADD COLUMN allocation_derived "
                "BOOLEAN NOT NULL DEFAULT 0"
            )
        )


def apply_cash_flow_nodes_parent_ref_column(engine: Engine) -> None:
    """Add ``parent_ref`` to ``cash_flow_nodes`` when missing (SQLite / legacy volumes)."""

    insp = inspect(engine)
    if not insp.has_table("cash_flow_nodes"):
        return
    cols = {c["name"] for c in insp.get_columns("cash_flow_nodes")}
    if "parent_ref" in cols:
        return
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE cash_flow_nodes ADD COLUMN parent_ref VARCHAR(64)"))


def apply_cash_flow_nodes_account_metadata_columns(engine: Engine) -> None:
    """Add account metadata columns to ``cash_flow_nodes`` when missing."""

    insp = inspect(engine)
    if not insp.has_table("cash_flow_nodes"):
        return
    cols = {c["name"] for c in insp.get_columns("cash_flow_nodes")}
    alters = [
        ("currency", "ALTER TABLE cash_flow_nodes ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD'"),
        ("current_balance", "ALTER TABLE cash_flow_nodes ADD COLUMN current_balance NUMERIC(12, 2)"),
        ("balance_as_of", "ALTER TABLE cash_flow_nodes ADD COLUMN balance_as_of DATE"),
        ("account_mask", "ALTER TABLE cash_flow_nodes ADD COLUMN account_mask VARCHAR(32)"),
        ("notes", "ALTER TABLE cash_flow_nodes ADD COLUMN notes TEXT NOT NULL DEFAULT ''"),
        ("is_active", "ALTER TABLE cash_flow_nodes ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"),
    ]
    missing = [sql for col, sql in alters if col not in cols]
    if not missing:
        return
    with engine.begin() as conn:
        for sql in missing:
            conn.execute(text(sql))


def apply_allocation_item_primitive_columns(engine: Engine) -> None:
    """Add source/sink allocation primitive columns to legacy ``allocation_items`` tables."""

    insp = inspect(engine)
    if not insp.has_table("allocation_items"):
        return
    cols = {c["name"] for c in insp.get_columns("allocation_items")}
    alters = [
        (
            "allocation_role",
            "ALTER TABLE allocation_items ADD COLUMN "
            "allocation_role VARCHAR(32) NOT NULL DEFAULT 'sink'",
        ),
        ("from_account_ref", "ALTER TABLE allocation_items ADD COLUMN from_account_ref VARCHAR(64)"),
        ("to_account_ref", "ALTER TABLE allocation_items ADD COLUMN to_account_ref VARCHAR(64)"),
        ("counterparty", "ALTER TABLE allocation_items ADD COLUMN counterparty VARCHAR(200)"),
    ]
    missing = [sql for col, sql in alters if col not in cols]
    if not missing:
        return
    with engine.begin() as conn:
        for sql in missing:
            conn.execute(text(sql))


def init_db() -> None:
    """Create all tables if they don't exist; upgrade legacy SQLite schemas additively."""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    apply_additive_schema_fixes(engine)
    apply_cash_flow_nodes_parent_ref_column(engine)
    apply_cash_flow_nodes_account_metadata_columns(engine)
    apply_allocation_item_primitive_columns(engine)


@contextmanager
def get_session() -> Generator[Session, None, None]:
    factory = get_session_factory()
    session: Session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
