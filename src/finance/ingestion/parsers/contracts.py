"""CSV parser hooks for income and liability contract ingestion."""

import csv
import io
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation


@dataclass
class RawIncomeRecord:
    income_date: date
    source_name: str
    amount: Decimal
    currency: str = "USD"
    category: str = "Income"
    notes: str = ""


@dataclass
class RawLiabilityRecord:
    as_of_date: date
    name: str
    liability_type: str
    principal_amount: Decimal
    minimum_payment: Decimal = Decimal("0.00")
    interest_rate_apr: Decimal = Decimal("0.00")
    currency: str = "USD"
    notes: str = ""


class ContractCSVParserBase:
    source_name: str = "generic"
    source_key: str = "generic"

    def can_parse(self, headers: list[str]) -> bool:
        raise NotImplementedError


class IncomeCSVParser(ContractCSVParserBase):
    source_name = "income_csv"
    source_key = "income"
    required_headers = {"income_date", "source_name", "amount"}

    def can_parse(self, headers: list[str]) -> bool:
        normalized = {h.strip().lower() for h in headers}
        return self.required_headers.issubset(normalized)

    def parse_rows(self, rows: list[dict[str, str]]) -> list[RawIncomeRecord]:
        out: list[RawIncomeRecord] = []
        for row in rows:
            out.append(
                RawIncomeRecord(
                    income_date=_parse_date(row.get("income_date", "")),
                    source_name=row.get("source_name", "").strip(),
                    amount=_parse_decimal(row.get("amount", "")),
                    currency=(row.get("currency", "USD") or "USD").strip().upper(),
                    category=(row.get("category", "Income") or "Income").strip(),
                    notes=(row.get("notes", "") or "").strip(),
                )
            )
        return out


class LiabilityCSVParser(ContractCSVParserBase):
    source_name = "liability_csv"
    source_key = "liability"
    required_headers = {"as_of_date", "name", "liability_type", "principal_amount"}

    def can_parse(self, headers: list[str]) -> bool:
        normalized = {h.strip().lower() for h in headers}
        return self.required_headers.issubset(normalized)

    def parse_rows(self, rows: list[dict[str, str]]) -> list[RawLiabilityRecord]:
        out: list[RawLiabilityRecord] = []
        for row in rows:
            out.append(
                RawLiabilityRecord(
                    as_of_date=_parse_date(row.get("as_of_date", "")),
                    name=row.get("name", "").strip(),
                    liability_type=row.get("liability_type", "").strip(),
                    principal_amount=_parse_decimal(row.get("principal_amount", "")),
                    minimum_payment=_parse_decimal(row.get("minimum_payment", "0")),
                    interest_rate_apr=_parse_decimal(row.get("interest_rate_apr", "0")),
                    currency=(row.get("currency", "USD") or "USD").strip().upper(),
                    notes=(row.get("notes", "") or "").strip(),
                )
            )
        return out


ALL_INCOME_PARSERS = [IncomeCSVParser()]
ALL_LIABILITY_PARSERS = [LiabilityCSVParser()]


def parse_csv_rows(content: bytes) -> tuple[list[str], list[dict[str, str]]]:
    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    return (reader.fieldnames or []), list(reader)


def _parse_date(value: str) -> date:
    raw = (value or "").strip()
    if not raw:
        raise ValueError("missing date")
    return date.fromisoformat(raw)


def _parse_decimal(value: str) -> Decimal:
    raw = (value or "").strip().replace(",", "")
    if not raw:
        raise ValueError("missing decimal value")
    try:
        return Decimal(raw)
    except InvalidOperation as exc:
        raise ValueError(f"invalid decimal: {value}") from exc
