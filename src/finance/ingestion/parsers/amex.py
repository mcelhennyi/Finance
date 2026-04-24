"""American Express CSV parser.

Amex export columns (varies by account type):
  Date, Description, Amount, Extended Details, Appears On Your Statement As,
  Address, City/State, Zip Code, Country, Reference, Category

Amount sign: positive = charge, negative = credit/payment.

See Also: docs/design/services/ingestion-service/overview.md
"""

from finance.ingestion.parsers.base import RawTransaction, StatementParser


class AmexParser(StatementParser):

    @property
    def source_name(self) -> str:
        return "American Express"

    @property
    def source_key(self) -> str:
        return "amex"

    def can_parse(self, headers: list[str]) -> bool:
        normalized = self._normalize_headers(headers)
        # Amex has "appears on your statement as" or "extended details"
        return "appears on your statement as" in normalized or "extended details" in normalized

    def parse_rows(self, rows: list[dict]) -> list[RawTransaction]:
        results = []
        for row in rows:
            raw_date = row.get("Date", "").strip()
            description = row.get("Description", "").strip()
            raw_amount = row.get("Amount", "").strip()
            category_raw = row.get("Category", "").strip()

            if not raw_date or not description or not raw_amount:
                continue

            parsed_date = self._parse_date(raw_date)
            parsed_amount = self._parse_amount(raw_amount)

            if parsed_date is None or parsed_amount is None:
                continue

            # Amex: positive = charge, negative = credit — matches our convention
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
