"""Chase credit card CSV parser.

Chase export columns:
  Transaction Date, Post Date, Description, Category, Type, Amount, Memo

Amount sign: negative = charge, positive = credit (Chase inverts from intuition).
We normalize to: positive = money out, negative = money in.

See Also: docs/design/services/ingestion-service/overview.md
"""

from decimal import Decimal

from finance.ingestion.parsers.base import RawTransaction, StatementParser


class ChaseParser(StatementParser):

    @property
    def source_name(self) -> str:
        return "Chase"

    @property
    def source_key(self) -> str:
        return "chase"

    def can_parse(self, headers: list[str]) -> bool:
        normalized = self._normalize_headers(headers)
        return "transaction date" in normalized and "post date" in normalized

    def parse_rows(self, rows: list[dict]) -> list[RawTransaction]:
        results = []
        for row in rows:
            raw_date = row.get("Transaction Date", "").strip()
            description = row.get("Description", "").strip()
            raw_amount = row.get("Amount", "").strip()
            category_raw = row.get("Category", "").strip()

            if not raw_date or not description or not raw_amount:
                continue

            parsed_date = self._parse_date(raw_date)
            parsed_amount = self._parse_amount(raw_amount)

            if parsed_date is None or parsed_amount is None:
                continue

            # Chase: negative amount = charge, positive = credit
            # Normalize: positive = money out, negative = money in
            normalized_amount = -parsed_amount

            results.append(
                RawTransaction(
                    transaction_date=parsed_date,
                    description_raw=description,
                    amount=normalized_amount,
                    category_raw=category_raw,
                    source_name=self.source_name,
                )
            )
        return results
