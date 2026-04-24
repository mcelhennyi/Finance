"""Database session management.

See Also: docs/design/technology-decisions.md — TD-002, TD-003
"""

import os
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
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


def init_db() -> None:
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=get_engine())


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
