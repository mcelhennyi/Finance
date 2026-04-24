"""PNC Bank CSV parser.

PNC checking/savings export columns:
  Date, Description, Withdrawals, Deposits, Balance

PNC credit card export columns:
  Transaction Date, Posted Date, Description, Amount, Type

Amount sign: Withdrawals = money out (positive),
             Deposits = money in (negative).
For credit card: positive Amount = charge, negative = credit.

See Also: docs/design/services/ingestion-service/overview.md
"""

from finance.ingestion.parsers.base import RawTransaction, StatementParser


class PNCParser(StatementParser):

    @property
    def source_name(self) -> str:
        return "PNC"

    @property
    def source_key(self) -> str:
        return "pnc"

    def can_parse(self, headers: list[str]) -> bool:
        normalized = self._normalize_headers(headers)
        return "withdrawals" in normalized and "deposits" in normalized

    def parse_rows(self, rows: list[dict]) -> list[RawTransaction]:
        results = []
        for row in rows:
            raw_date = row.get("Date", "").strip()
            description = row.get("Description", "").strip()
            raw_withdrawal = row.get("Withdrawals", "").strip()
            raw_deposit = row.get("Deposits", "").strip()

            if not raw_date or not description:
                continue

            parsed_date = self._parse_date(raw_date)
            if parsed_date is None:
                continue

            if raw_withdrawal:
                amount = self._parse_amount(raw_withdrawal)
                if amount is not None:
                    amount = abs(amount)  # money out = positive
            elif raw_deposit:
                amount = self._parse_amount(raw_deposit)
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
