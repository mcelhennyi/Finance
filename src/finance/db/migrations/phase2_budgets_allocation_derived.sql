-- One-time additive migration for existing SQLite DBs created before FR-0002-03.
-- New installs get this column from SQLAlchemy metadata / phase2_goals_budgets_stub.sql.
-- Safe to run once; ignore "duplicate column" if already applied.

ALTER TABLE budgets ADD COLUMN allocation_derived BOOLEAN NOT NULL DEFAULT 0;
