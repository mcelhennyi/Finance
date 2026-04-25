-- Migration stub for T-FR-0001-01 (Phase 2 goals service contracts).
-- This project currently initializes schema via SQLAlchemy metadata.
-- Keep this stub aligned with ORM models until Alembic env is introduced.

-- budgets
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  period_month DATE NOT NULL,
  amount_limit NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  created_at DATETIME NOT NULL
);

-- goals
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  goal_type VARCHAR(50) NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  period_month DATE NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  created_at DATETIME NOT NULL
);
