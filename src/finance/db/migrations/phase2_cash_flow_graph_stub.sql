-- Migration stub for T-FR-0006-02 (cash-flow graph persistence).
-- Schema is created via SQLAlchemy metadata (see finance.db.models.CashFlowNode / CashFlowEdge).

CREATE TABLE IF NOT EXISTS cash_flow_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES allocation_plans(id) ON DELETE CASCADE,
  ref VARCHAR(64) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  kind VARCHAR(32) NOT NULL,
  institution VARCHAR(200),
  layout_x FLOAT,
  layout_y FLOAT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT uq_cash_flow_node_plan_ref UNIQUE (plan_id, ref)
);

CREATE TABLE IF NOT EXISTS cash_flow_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES allocation_plans(id) ON DELETE CASCADE,
  ref VARCHAR(64) NOT NULL,
  from_node_id INTEGER NOT NULL REFERENCES cash_flow_nodes(id) ON DELETE CASCADE,
  to_node_id INTEGER NOT NULL REFERENCES cash_flow_nodes(id) ON DELETE CASCADE,
  label VARCHAR(200) NOT NULL DEFAULT '',
  amount_rule VARCHAR(32) NOT NULL,
  fixed_amount NUMERIC(12, 2),
  percent_of_inflow NUMERIC(6, 3),
  cadence VARCHAR(32) NOT NULL,
  day_of_month INTEGER,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT uq_cash_flow_edge_plan_ref UNIQUE (plan_id, ref)
);
