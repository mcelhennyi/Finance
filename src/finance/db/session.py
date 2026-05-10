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


def init_db() -> None:
    """Create all tables if they don't exist; upgrade legacy SQLite schemas additively."""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    apply_additive_schema_fixes(engine)


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
