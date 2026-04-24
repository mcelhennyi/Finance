# Analysis Service — Query API

## Commands

### `finance query transactions`

Query and display individual transactions.

```
Usage: finance query transactions [OPTIONS]

Options:
  --from DATE           Start date (YYYY-MM-DD)
  --to DATE             End date (YYYY-MM-DD)
  --category TEXT       Filter by category (exact or partial match)
  --merchant TEXT       Filter by merchant name (substring, case-insensitive)
  --min-amount FLOAT    Minimum transaction amount
  --max-amount FLOAT    Maximum transaction amount
  --account TEXT        Filter by account name
  --include-credits     Include credit/refund transactions
  --limit INT           Maximum number of results (default: 50)
  --output PATH         Write results to file (CSV or JSON based on extension)
  --help                Show this message and exit
```

**Examples**:

```bash
# All transactions in Q1 2025
finance query transactions --from 2025-01-01 --to 2025-03-31

# Dining transactions over $50
finance query transactions --category Dining --min-amount 50

# Search for a merchant
finance query transactions --merchant "H-E-B"

# Export to CSV
finance query transactions --from 2025-01-01 --to 2025-03-31 --output q1_transactions.csv
```

**Output**:

```
┌────────────┬────────────────────────────────┬───────────────────┬──────────┐
│ Date       │ Description                    │ Category          │ Amount   │
├────────────┼────────────────────────────────┼───────────────────┼──────────┤
│ 2025-03-14 │ UCHI RESTAURANT                │ Dining            │   $87.50 │
│ 2025-03-12 │ H-E-B #123                     │ Groceries         │  $134.22 │
│ 2025-03-11 │ SHELL OIL 12345               │ Gas               │   $62.00 │
└────────────┴────────────────────────────────┴───────────────────┴──────────┘

241 transactions  |  Total: $4,823.17
```

---

### `finance query summary`

Show aggregated spending metrics.

```
Usage: finance query summary [OPTIONS]

Options:
  --from DATE           Start date
  --to DATE             End date
  --group-by TEXT       Aggregation: category, merchant, month, week, day
                        Default: category
  --top INT             Number of items to show (for merchant mode)
                        Default: 10
  --account TEXT        Filter by account name
  --output PATH         Write summary to file (CSV or JSON)
  --help                Show this message and exit
```

**Examples**:

```bash
# Category summary for last 3 months
finance query summary --from 2025-01-01 --to 2025-03-31 --group-by category

# Top 10 merchants this year
finance query summary --from 2025-01-01 --group-by merchant --top 10

# Monthly totals
finance query summary --group-by month
```

**Output (category)**:

```
┌──────────────────────────┬────────┬────────────┬───────────┐
│ Category                 │ Count  │ Total      │ % of Spend│
├──────────────────────────┼────────┼────────────┼───────────┤
│ Groceries                │     38 │  $1,204.50 │    24.97% │
│ Dining                   │     51 │    $892.33 │    18.50% │
│ Gas                      │     12 │    $478.00 │     9.91% │
│ Amazon / Online Shopping │     29 │    $421.17 │     8.73% │
│ Healthcare               │      4 │    $310.00 │     6.43% │
└──────────────────────────┴────────┴────────────┴───────────┘

Total Spent:    $4,823.17
Credits:          $142.50
Net Charged:    $4,680.67
```

---

### `finance report spending`

Generate an interactive HTML spending report.

```
Usage: finance report spending [OPTIONS]

Options:
  --from DATE           Start date (default: first day of current month)
  --to DATE             End date (default: today)
  --account TEXT        Filter by account name
  --output PATH         Output HTML file path
                        Default: ./spending_report.html
  --open                Open the report in the default browser after generation
  --help                Show this message and exit
```

**Examples**:

```bash
# Report for current month
finance report spending

# Full year report, auto-open
finance report spending --from 2025-01-01 --to 2025-12-31 --open

# Per-account report
finance report spending --account "Chase Sapphire" --output chase_report.html
```

---

## Python API (Internal)

```python
from finance.analysis.service import AnalysisService
from finance.analysis.models import QueryFilter
from finance.db.session import get_session
from datetime import date

with get_session() as session:
    service = AnalysisService(session=session)

    # Query with filters
    filter = QueryFilter(
        date_from=date(2025, 1, 1),
        date_to=date(2025, 3, 31),
        categories=["Dining", "Coffee & Bars"],
    )
    transactions = service.query(filter)

    # Get aggregated metrics
    metrics = service.summarize(filter)
    print(f"Dining spend: ${metrics.by_category.get('Dining', 0):.2f}")

    # Generate HTML report
    service.generate_report(filter, output=Path("report.html"))

    # Export to CSV
    service.export(filter, output=Path("dining_q1.csv"), fmt="csv")
```
