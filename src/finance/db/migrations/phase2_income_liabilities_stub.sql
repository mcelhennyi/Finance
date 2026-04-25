-- Migration stub for T-FR-0001-03 (income + liabilities ingestion contracts).
-- Schema is currently managed via SQLAlchemy metadata in init_db().

CREATE TABLE IF NOT EXISTS income_records (
  id INTEGER PRIMARY KEY,
  income_date DATE NOT NULL,
  source_name VARCHAR(200) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  category VARCHAR(100) NOT NULL DEFAULT 'Income',
  notes TEXT NOT NULL DEFAULT '',
  source_file VARCHAR(500) NOT NULL DEFAULT '',
  source_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS liability_records (
  id INTEGER PRIMARY KEY,
  as_of_date DATE NOT NULL,
  name VARCHAR(200) NOT NULL,
  liability_type VARCHAR(100) NOT NULL,
  principal_amount NUMERIC(12, 2) NOT NULL,
  minimum_payment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  interest_rate_apr NUMERIC(8, 4) NOT NULL DEFAULT 0.0000,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  notes TEXT NOT NULL DEFAULT '',
  source_file VARCHAR(500) NOT NULL DEFAULT '',
  source_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL
);
