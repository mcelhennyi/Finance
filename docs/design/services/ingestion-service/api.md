# Ingestion Service — CLI API

## Commands

### `finance ingest statement`

Ingest a credit card statement file into the database.

```
Usage: finance ingest statement [OPTIONS]

Options:
  --file PATH           Path to the statement file (CSV or PDF)  [required]
  --source TEXT         Source hint: chase, wells-fargo, frost, amex, pnc, generic
                        Default: auto-detect
  --account TEXT        Account name to associate transactions with
                        Default: derived from source name
  --dry-run             Parse and normalize but do not write to DB
  --verbose             Show each transaction as it is processed
  --help                Show this message and exit
```

**Examples**:

```bash
# Ingest a Chase CSV statement
finance ingest statement --file ~/Downloads/activity.csv --source chase

# Ingest with dry-run to preview what would be inserted
finance ingest statement --file ~/Downloads/activity.csv --source chase --dry-run

# Auto-detect source format
finance ingest statement --file ~/Downloads/statement.csv

# Ingest with a named account
finance ingest statement --file ~/Downloads/chase_jan.csv --source chase --account "Chase Sapphire"
```

**Output**:

```
Ingesting: /Users/ian/Downloads/activity.csv (source: chase)
Parsing... 247 transactions found
Normalizing...
  Filtering 6 payment transactions
  Applying category overrides...
Deduplicating against existing records...
  3 duplicates skipped

✓ Ingestion complete
  Inserted:  238
  Skipped:    9  (6 payments + 3 duplicates)
  Errors:     0
  Duration:  0.4s
```

---

### `finance ingest receipt`

Ingest a receipt (PDF or image) and attempt to extract transaction data via OCR.

```
Usage: finance ingest receipt [OPTIONS]

Options:
  --file PATH           Path to the receipt file (PDF, JPEG, PNG)  [required]
  --match-transaction   Attempt to match to an existing transaction by amount + date
  --account TEXT        Account the receipt belongs to
  --help                Show this message and exit
```

**Examples**:

```bash
# Ingest a receipt PDF
finance ingest receipt --file ~/Downloads/receipt_heb.pdf --match-transaction

# Ingest a receipt image
finance ingest receipt --file ~/Pictures/receipts/walmart_jan15.jpg
```

---

### `finance ingest history`

Show the ingestion log.

```
Usage: finance ingest history [OPTIONS]

Options:
  --limit INT           Number of records to show (default: 20)
  --source TEXT         Filter by source type
  --help                Show this message and exit
```

**Output**:

```
┌─────────────────────────┬──────────────┬────────────┬──────────┬─────────┐
│ Ingested At             │ Source       │ File       │ Inserted │ Skipped │
├─────────────────────────┼──────────────┼────────────┼──────────┼─────────┤
│ 2025-03-15 09:14:02     │ chase        │ activity.. │      238 │       9 │
│ 2025-03-14 22:01:15     │ amex         │ activity.. │      112 │       3 │
│ 2025-03-10 11:45:33     │ wells-fargo  │ checking.. │       89 │       1 │
└─────────────────────────┴──────────────┴────────────┴──────────┴─────────┘
```

---

## Python API (Internal)

The `IngestionService` class is also usable programmatically:

```python
from finance.ingestion.service import IngestionService
from finance.db.session import get_session

with get_session() as session:
    service = IngestionService(session=session)
    result = service.ingest(
        file_path=Path("activity.csv"),
        source_hint="chase",
    )
    print(f"Inserted {result.records_inserted} transactions")
```

## Configuration

Category maps and merchant overrides are configured in `~/.finance/config.toml`:

```toml
[categories]
# Map bank category codes to friendly names
"Restaurant-Restaurant" = "Dining"
"Restaurant-Bar & Café" = "Coffee & Bars"
"Merchandise & Supplies-Groceries" = "Groceries"
"Transportation-Fuel" = "Gas"

[merchant_overrides]
# Merchant substring → category (case-insensitive substring match)
"P. TERRY" = "Dining"
"WHATABURGER" = "Dining"
"H-E-B" = "Groceries"
"COSTCO" = "Groceries"

[payments]
# Keywords that identify payment transactions to exclude
keywords = ["AUTOPAY PAYMENT", "MOBILE PAYMENT", "PAYMENT - THANK YOU", "ONLINE PAYMENT"]
```
