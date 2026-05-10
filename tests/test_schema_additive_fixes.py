"""Additive schema fixes for legacy SQLite databases."""

from sqlalchemy import create_engine, inspect, text

from finance.db.session import apply_additive_schema_fixes


def test_apply_additive_schema_fixes_adds_budgets_allocation_derived(tmp_path) -> None:
    """Older DBs may lack ``budgets.allocation_derived``; startup migration must add it."""

    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE budgets (
                    id INTEGER PRIMARY KEY,
                    category VARCHAR(100) NOT NULL,
                    period_month DATE NOT NULL,
                    amount_limit NUMERIC(12, 2) NOT NULL,
                    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
                    created_at DATETIME NOT NULL
                )
                """
            )
        )

    apply_additive_schema_fixes(engine)

    insp = inspect(engine)
    names = {c["name"] for c in insp.get_columns("budgets")}
    assert "allocation_derived" in names
