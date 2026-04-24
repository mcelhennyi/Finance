"""Generic CSV parser with auto-detection of column names.

Attempts to map common column name variants to the canonical fields.
Used as a fallback when no bank-specific parser matches.

See Also: docs/design/services/ingestion-service/overview.md
"""

import re

from finance.ingestion.parsers.base import RawTransaction, StatementParser

_DATE_COLUMNS = ["date", "transaction date", "posted date", "trans date", "trans. date"]
_DESC_COLUMNS = ["description", "merchant", "payee", "name", "memo", "narrative"]
_AMOUNT_COLUMNS = ["amount", "transaction amount", "net amount"]
_CATEGORY_COLUMNS = ["category", "type"]


def _find_column(headers_lower: list[str], candidates: list[str]) -> str | None:
    for candidate in candidates:
        if candidate in headers_lower:
            return candidate
    # Partial match fallback
    for candidate in candidates:
        for h in headers_lower:
            if candidate in h:
                return h
    return None


class GenericCSVParser(StatementParser):
    """Fallback parser that auto-detects column names by common patterns."""

    @property
    def source_name(self) -> str:
        return "Generic"

    @property
    def source_key(self) -> str:
        return "generic"

    def can_parse(self, headers: list[str]) -> bool:
        normalized = self._normalize_headers(headers)
        has_date = _find_column(normalized, _DATE_COLUMNS) is not None
        has_amount = _find_column(normalized, _AMOUNT_COLUMNS) is not None
        has_desc = _find_column(normalized, _DESC_COLUMNS) is not None
        return has_date and has_amount and has_desc

    def parse_rows(self, rows: list[dict]) -> list[RawTransaction]:
        if not rows:
            return []

        headers_lower = self._normalize_headers(list(rows[0].keys()))
        original_headers = list(rows[0].keys())

        def col(candidates: list[str]) -> str | None:
            match = _find_column(headers_lower, candidates)
            if match is None:
                return None
            # Map back to original-cased header
            idx = headers_lower.index(match)
            return original_headers[idx]

        date_col = col(_DATE_COLUMNS)
        desc_col = col(_DESC_COLUMNS)
        amount_col = col(_AMOUNT_COLUMNS)
        cat_col = col(_CATEGORY_COLUMNS)

        if not date_col or not desc_col or not amount_col:
            return []

        results = []
        for row in rows:
            raw_date = row.get(date_col, "").strip()
            description = row.get(desc_col, "").strip()
            raw_amount = row.get(amount_col, "").strip()
            category_raw = row.get(cat_col, "").strip() if cat_col else ""

            if not raw_date or not description or not raw_amount:
                continue

            parsed_date = self._parse_date(raw_date)
            parsed_amount = self._parse_amount(raw_amount)

            if parsed_date is None or parsed_amount is None:
                continue

            results.append(
                RawTransaction(
                    transaction_date=parsed_date,
                    description_raw=description,
                    amount=parsed_amount,
                    category_raw=category_raw,
                    source_name=self.source_name,
                )
            )
        return results
