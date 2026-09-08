"""Additive schema fixes for legacy SQLite databases."""

from sqlalchemy import create_engine, inspect, text

from finance.db.session import (
    apply_additive_schema_fixes,
    apply_cash_flow_nodes_account_metadata_columns,
    apply_cash_flow_nodes_parent_ref_column,
)


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


def test_apply_cash_flow_nodes_parent_ref_adds_column(tmp_path) -> None:
    """Older DBs may lack ``cash_flow_nodes.parent_ref``; startup migration must add it."""

    engine = create_engine(f"sqlite:///{tmp_path / 'legacy_cf.db'}")
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE cash_flow_nodes (
                    id INTEGER PRIMARY KEY,
                    plan_id INTEGER NOT NULL,
                    ref VARCHAR(64) NOT NULL,
                    display_name VARCHAR(200) NOT NULL,
                    kind VARCHAR(32) NOT NULL,
                    institution VARCHAR(200),
                    layout_x FLOAT,
                    layout_y FLOAT,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL
                )
                """
            )
        )

    apply_cash_flow_nodes_parent_ref_column(engine)

    insp = inspect(engine)
    names = {c["name"] for c in insp.get_columns("cash_flow_nodes")}
    assert "parent_ref" in names


def test_apply_cash_flow_nodes_account_metadata_adds_columns(tmp_path) -> None:
    """Older DBs may lack account metadata columns; startup migration must add them."""

    engine = create_engine(f"sqlite:///{tmp_path / 'legacy_cf_metadata.db'}")
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE cash_flow_nodes (
                    id INTEGER PRIMARY KEY,
                    plan_id INTEGER NOT NULL,
                    ref VARCHAR(64) NOT NULL,
                    display_name VARCHAR(200) NOT NULL,
                    kind VARCHAR(32) NOT NULL,
                    institution VARCHAR(200),
                    parent_ref VARCHAR(64),
                    layout_x FLOAT,
                    layout_y FLOAT,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL
                )
                """
            )
        )

    apply_cash_flow_nodes_account_metadata_columns(engine)

    insp = inspect(engine)
    names = {c["name"] for c in insp.get_columns("cash_flow_nodes")}
    assert {
        "currency",
        "current_balance",
        "balance_as_of",
        "account_mask",
        "notes",
        "is_active",
    } <= names
