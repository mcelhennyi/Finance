# Technology Decisions

This document records the key technology choices for Finance Hub and the rationale behind each. These decisions are binding for the current phase; each can be revisited at phase boundaries with proper documentation.

---

## TD-001: Python as Primary Language

**Decision**: Python 3.11+

**Rationale**:

- Excellent CSV, PDF, and OCR library ecosystem (`csv`, `pdfminer`, `pytesseract`, `pandas`)
- SQLAlchemy ORM is mature and battle-tested
- Rich data analysis ecosystem for Phase 3 (pandas, numpy)
- Single-language stack avoids context-switching for a solo project

**Alternatives Considered**:

- **Go**: Faster, but weaker data/ML ecosystem; no clear advantage for Phase 1 scope
- **TypeScript/Node**: Strong for web, but data processing libraries are less mature

**Constraints**:

- Python >= 3.11 required (uses `tomllib`, improved typing)

---

## TD-002: SQLite as Phase 1 Database

**Decision**: SQLite via SQLAlchemy, with Alembic migrations

**Rationale**:

- Zero-config local deployment — no server to run
- Sufficient for personal finance data volumes (tens of thousands of transactions)
- SQLAlchemy makes upgrading to PostgreSQL a configuration change, not a code rewrite
- Alembic migrations ensure schema evolution is tracked

**Alternatives Considered**:

- **PostgreSQL from day one**: Operational overhead not justified for personal use
- **DuckDB**: Excellent for analytics, but less mature ORM support and less standard
- **JSON files**: Simple but no relational integrity, hard to query

**Migration Path**: Set `FINANCE_DB_URL=postgresql://...` in Phase 2 to switch databases without code changes.

---

## TD-003: Alembic for Schema Migrations

**Decision**: Alembic

**Rationale**:

- Industry standard for SQLAlchemy-based projects
- Migration history is version-controlled alongside code
- Supports both auto-generation and hand-written migrations
- Enables safe schema evolution as features are added in later phases

---

## TD-004: Pydantic v2 for Data Validation

**Decision**: Pydantic v2

**Rationale**:

- Strongly typed parsed transaction models catch data quality issues at ingest time
- Excellent error messages pinpoint exactly which field failed validation and why
- Pydantic Settings for configuration management (env vars, .env files)
- v2 is significantly faster than v1 for validation-heavy workloads

---

## TD-005: Click + Rich for CLI

**Decision**: Click for argument parsing, Rich for terminal output

**Rationale**:

- Click is the de facto Python CLI standard — declarative, testable, composable
- Rich provides beautiful tables, progress bars, and colored output for data-heavy CLI tools
- The combination produces a professional-grade CLI with minimal boilerplate

**Alternatives Considered**:

- **argparse**: Lower-level, more boilerplate, less testable
- **Typer**: Click wrapper — adds dependency for minimal benefit at this scale

---

## TD-006: Parser Plugin Architecture

**Decision**: Abstract base class with bank-specific plugin classes

**Rationale**:

- Multiple credit card issuers export CSVs with different column names and formats
- New banks must be addable without modifying core ingestion code (NFR-4.1)
- Plugin pattern is the right level of abstraction — not a registry, just subclassing

**Plugin Interface**:

```python
class StatementParser(ABC):
    @property
    @abstractmethod
    def source_name(self) -> str: ...

    @abstractmethod
    def can_parse(self, file_path: Path) -> bool: ...

    @abstractmethod
    def parse(self, file_path: Path) -> list[RawTransaction]: ...
```

**Phase 1 Implementations**:

- `ChaseCSVParser` — Chase credit card activity export
- `GenericCSVParser` — Auto-detect columns by name matching

---

## TD-007: pytesseract + pdfminer for Receipt Ingestion

**Decision**: `pdfminer.six` for PDF text extraction, `pytesseract` for image OCR

**Rationale**:

- `pdfminer` handles text-layer PDFs (most modern receipts) without needing Tesseract
- `pytesseract` + Pillow handles scanned/photo receipts where PDF has no text layer
- Both are open-source, local — no receipt data sent to any external service

**Alternatives Considered**:

- **Google Vision API**: Excellent accuracy but sends financial data to Google — violates NFR-1.1
- **AWS Textract**: Same privacy concern
- **PyMuPDF**: Better than pdfminer for complex PDFs; can be added in Phase 2 if needed

**Constraints**: `pytesseract` requires `tesseract` system binary to be installed separately (`brew install tesseract` on macOS).

---

## TD-008: Chart.js for HTML Reports

**Decision**: Chart.js 4.x loaded from CDN, rendered into self-contained HTML

**Rationale**:

- Zero server dependency — reports are static HTML files openable in any browser
- Chart.js is the most widely used JavaScript charting library; excellent documentation
- Doughnut, bar, and line charts cover all Phase 1 visualization needs
- Self-contained output means reports are shareable without running a server

**Alternatives Considered**:

- **D3.js**: More flexible but vastly more complex for standard chart types
- **Plotly**: Excellent for data science but heavy dependency for a self-contained report
- **Server-side rendering**: Adds operational complexity with no Phase 1 benefit

---

## TD-009: MkDocs Material for Documentation

**Decision**: MkDocs with Material theme

**Rationale**:

- Markdown-native — documentation lives alongside code in version control
- Material theme provides professional navigation, search, and dark mode
- Mermaid diagram support via `pymdownx.superfences`
- Static site output deployable to GitHub Pages with no server

---

## TD-010: Configuration via Environment Variables + TOML

**Decision**: Pydantic Settings reads from environment variables; user-facing config (category maps, merchant overrides) in `~/.finance/config.toml`

**Rationale**:

- Environment variables are the standard for runtime configuration (12-factor app)
- TOML is human-readable and natively supported in Python 3.11+ (`tomllib`)
- Separates system configuration (DB URL, log level) from user configuration (category rules)
- Category maps in TOML are editable without touching code (NFR-4.3)

**Config Hierarchy**:

1. `~/.finance/config.toml` — user-level category maps and merchant overrides
2. Environment variables — runtime settings (DB URL, log level)
3. `src/finance/common/defaults.py` — compile-time defaults
