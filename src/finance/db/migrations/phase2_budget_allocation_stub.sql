-- Migration stub for T-FR-0002-01 (budget allocation contracts).
-- Schema is created via SQLAlchemy metadata; keep this aligned with ORM models.

CREATE TABLE IF NOT EXISTS allocation_plans (
  id INTEGER PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  period_month DATE NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  income_amount NUMERIC(12, 2),
  income_cadence VARCHAR(32),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS allocation_items (
  id INTEGER PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES allocation_plans(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  planned_amount NUMERIC(12, 2) NOT NULL,
  cadence VARCHAR(32) NOT NULL,
  monthly_amount NUMERIC(12, 2) NOT NULL,
  allocation_role VARCHAR(32) NOT NULL DEFAULT 'sink',
  from_account_ref VARCHAR(64),
  to_account_ref VARCHAR(64),
  counterparty VARCHAR(200),
  payment_method VARCHAR(32) NOT NULL,
  due_day INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
