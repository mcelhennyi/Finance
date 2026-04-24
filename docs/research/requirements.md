# Requirements

## Functional Requirements by Phase

### Phase 1: Ingest, Store, Query

#### FR-1: Statement Ingestion

- **FR-1.1**: The system MUST accept credit card CSV exports and parse them into normalized transactions
- **FR-1.2**: The system MUST support at least one major bank format at launch (Chase); others can be added via format plugins
- **FR-1.3**: The system MUST reject duplicate transactions (same date + amount + description) on re-ingest
- **FR-1.4**: The system MUST support receipt ingestion in PDF format with OCR text extraction
- **FR-1.5**: The system SHOULD support receipt ingestion from image files (JPEG, PNG)
- **FR-1.6**: The system MUST log all ingestion events with source file, timestamp, and record count

#### FR-2: Transaction Storage

- **FR-2.1**: The system MUST store transactions in a relational database with a normalized schema
- **FR-2.2**: Each transaction MUST have: date, description (raw), description (normalized), amount, currency, category, source account, and ingestion timestamp
- **FR-2.3**: The system MUST support SQLite for local single-user use
- **FR-2.4**: The schema MUST be managed with migrations (Alembic) to support schema evolution

#### FR-3: Categorization

- **FR-3.1**: The system MUST auto-categorize transactions using bank-provided category codes
- **FR-3.2**: The system MUST support merchant-level category overrides (e.g., "P. TERRY → Dining")
- **FR-3.3**: Users MUST be able to manually re-categorize any transaction
- **FR-3.4**: Custom categories MUST be supported (beyond the default set)
- **FR-3.5**: Category overrides MUST be stored and reapplied automatically on re-ingest

#### FR-4: Querying

- **FR-4.1**: The system MUST provide a CLI for querying transactions
- **FR-4.2**: Supported filters: date range, category, merchant (substring), amount range, source account
- **FR-4.3**: Supported aggregations: total by category, total by merchant (top N), daily totals
- **FR-4.4**: The system MUST support exporting query results to CSV and JSON

#### FR-5: Reporting

- **FR-5.1**: The system MUST generate an interactive HTML spending report
- **FR-5.2**: The report MUST include: total spent, credits, net, transaction count, by-category breakdown, top merchants, daily trend
- **FR-5.3**: The report MUST be self-contained (no external dependencies except CDN-hosted Chart.js)

---

### Phase 2: Goals, Budgets, Unified View (Planned)

- **FR-6**: Goal definition (monthly spend limit per category)
- **FR-7**: Budget vs. actual tracking with over/under indicators
- **FR-8**: Income tracking and ingestion (salary, freelance, reimbursements)
- **FR-9**: Liability tracking (mortgage principal/interest, student loans)
- **FR-10**: Net cash flow dashboard (inflows − outflows per month)
- **FR-11**: Receipt-to-transaction matching
- **FR-12**: Business expense flagging

---

### Phase 3: Trends, Projections, Scenarios (Planned)

- **FR-13**: Multi-period trend analysis (rolling 3-month, 12-month averages)
- **FR-14**: Year-over-year category comparison
- **FR-15**: Scenario definition engine (income change, new debt, one-time expense)
- **FR-16**: Future projection charts (12–24 month cash flow, net worth)
- **FR-17**: Scenario comparison (side-by-side base vs. modified)
- **FR-18**: Life event annotations on timeline

---

## Non-Functional Requirements

### NFR-1: Privacy & Security

- **NFR-1.1**: All financial data MUST remain local — no cloud sync, no third-party transmission
- **NFR-1.2**: Raw statement files MUST NOT be committed to source control (enforced via .gitignore)
- **NFR-1.3**: Database files MUST NOT be committed to source control
- **NFR-1.4**: The system MUST NOT log sensitive PII (account numbers, SSNs) at any log level

### NFR-2: Performance

- **NFR-2.1**: Ingesting a 1,000-transaction CSV MUST complete in under 5 seconds on commodity hardware
- **NFR-2.2**: Query responses for up to 50,000 transactions MUST return in under 1 second
- **NFR-2.3**: HTML report generation MUST complete in under 3 seconds

### NFR-3: Portability

- **NFR-3.1**: The system MUST run on macOS and Linux
- **NFR-3.2**: All dependencies MUST be installable via `pip` with no compiled system libraries required for Phase 1

### NFR-4: Extensibility

- **NFR-4.1**: New bank statement formats MUST be addable via a parser plugin without modifying core ingestion code
- **NFR-4.2**: New report types MUST be addable without modifying existing report code
- **NFR-4.3**: Category maps and merchant overrides MUST be configurable without code changes (via TOML or JSON config file)

### NFR-5: Observability

- **NFR-5.1**: All ingestion operations MUST emit structured log entries (INFO level by default)
- **NFR-5.2**: Errors MUST include: source file, line number, reason for failure, and suggested resolution
- **NFR-5.3**: The system MUST track an ingestion history (what was ingested when)
