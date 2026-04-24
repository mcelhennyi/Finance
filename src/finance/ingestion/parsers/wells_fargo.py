"""Wells Fargo CSV parser.

Wells Fargo checking/savings export (no header row in some formats):
  "MM/DD/YYYY", Amount, *, *, "Description"

Wells Fargo credit card export may have headers:
  Date, Description, Credits, Charges, Balance (or similar)

We handle both cases.

Amount sign: negative = debit/charge, positive = credit/deposit (WF convention).
Normalize: positive = money out, negative = money in.

See Also: docs/design/services/ingestion-service/overview.md
"""

from finance.ingestion.parsers.base import RawTransaction, StatementParser


class WellsFargoParser(StatementParser):

    @property
    def source_name(self) -> str:
        return "Wells Fargo"

    @property
    def source_key(self) -> str:
        return "wells-fargo"

    def can_parse(self, headers: list[str]) -> bool:
        normalized = self._normalize_headers(headers)
        # WF checking often has no meaningful headers or "date,amount,*,*,description"
        # WF credit card may have "charges" column
        return "charges" in normalized or (
            len(headers) >= 4
            and all(h.startswith("*") or not h.strip() for h in headers[2:4])
        )

    def parse_rows(self, rows: list[dict]) -> list[RawTransaction]:
        results = []
        keys = list(rows[0].keys()) if rows else []

        # Detect format based on headers
        has_charges = any("charge" in k.lower() for k in keys)

        for row in rows:
            if has_charges:
                raw_date = row.get("Date", "").strip()
                description = row.get("Description", "").strip()
                raw_charge = row.get("Charges", "").strip()
                raw_credit = row.get("Credits", "").strip()
                category_raw = ""

                if not raw_date or not description:
                    continue

                parsed_date = self._parse_date(raw_date)
                if parsed_date is None:
                    continue

                if raw_charge:
                    amount = self._parse_amount(raw_charge)
                    if amount is not None:
                        amount = abs(amount)  # positive = money out
                elif raw_credit:
                    amount = self._parse_amount(raw_credit)
                    if amount is not None:
                        amount = -abs(amount)  # negative = money in
                else:
                    continue
            else:
                # headerless format: date, amount, *, *, description
                vals = list(row.values())
                if len(vals) < 5:
                    continue
                raw_date, raw_amount, _, _, description = vals[0], vals[1], vals[2], vals[3], vals[4]
                description = str(description).strip()
                raw_date = str(raw_date).strip()
                category_raw = ""

                parsed_date = self._parse_date(raw_date)
                raw_parsed = self._parse_amount(str(raw_amount))
                if parsed_date is None or raw_parsed is None:
                    continue

                # WF: negative = debit → normalize to positive
                amount = -raw_parsed if raw_parsed < 0 else raw_parsed

            if amount is None:
                continue

            results.append(
                RawTransaction(
                    transaction_date=parsed_date,
                    description_raw=description,
                    amount=amount,
                    category_raw=category_raw,
                    source_name=self.source_name,
                )
            )
        return results
