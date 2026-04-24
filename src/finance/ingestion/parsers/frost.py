"""Frost Bank CSV parser.

Frost Bank export columns (credit card):
  Date, Description, Amount (or Debit/Credit separate columns)

Frost Bank export (checking/savings):
  Date, Description, Debit, Credit, Balance

Amount sign: Debit column = money out (positive in our schema),
             Credit column = money in (negative in our schema).

See Also: docs/design/services/ingestion-service/overview.md
"""

from finance.ingestion.parsers.base import RawTransaction, StatementParser


class FrostParser(StatementParser):

    @property
    def source_name(self) -> str:
        return "Frost Bank"

    @property
    def source_key(self) -> str:
        return "frost"

    def can_parse(self, headers: list[str]) -> bool:
        normalized = self._normalize_headers(headers)
        return "debit" in normalized and "credit" in normalized and "balance" in normalized

    def parse_rows(self, rows: list[dict]) -> list[RawTransaction]:
        results = []
        for row in rows:
            raw_date = row.get("Date", "").strip()
            description = row.get("Description", "").strip()
            raw_debit = row.get("Debit", "").strip()
            raw_credit = row.get("Credit", "").strip()

            if not raw_date or not description:
                continue

            parsed_date = self._parse_date(raw_date)
            if parsed_date is None:
                continue

            if raw_debit:
                amount = self._parse_amount(raw_debit)
                if amount is not None:
                    amount = abs(amount)  # money out = positive
            elif raw_credit:
                amount = self._parse_amount(raw_credit)
                if amount is not None:
                    amount = -abs(amount)  # money in = negative
            else:
                continue

            if amount is None:
                continue

            results.append(
                RawTransaction(
                    transaction_date=parsed_date,
                    description_raw=description,
                    amount=amount,
                    source_name=self.source_name,
                )
            )
        return results
