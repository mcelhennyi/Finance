"""Abstract base class for all statement parsers.

See Also: docs/design/services/ingestion-service/overview.md#parser-plugin-interface
"""

import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path


PAYMENT_KEYWORDS = [
    "AUTOPAY PAYMENT",
    "MOBILE PAYMENT",
    "PAYMENT - THANK YOU",
    "ONLINE PAYMENT",
    "ACH PAYMENT",
    "ELECTRONIC PAYMENT",
    "THANK YOU FOR PAYMENT",
]


@dataclass
class RawTransaction:
    """A parsed but not yet normalized transaction record."""

    transaction_date: date
    description_raw: str
    amount: Decimal
    currency: str = "USD"
    category_raw: str = ""
    source_name: str = ""

    def is_payment(self) -> bool:
        desc_upper = self.description_raw.upper()
        return any(kw in desc_upper for kw in PAYMENT_KEYWORDS)


class StatementParser(ABC):
    """Abstract base for all bank statement parsers.

    See Also: docs/design/services/ingestion-service/overview.md
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Human-readable bank/source name, e.g. 'Chase'."""

    @property
    @abstractmethod
    def source_key(self) -> str:
        """Short machine key used as --source hint, e.g. 'chase'."""

    @abstractmethod
    def can_parse(self, headers: list[str]) -> bool:
        """Return True if this parser can handle a CSV with these headers."""

    @abstractmethod
    def parse_rows(self, rows: list[dict]) -> list[RawTransaction]:
        """Parse DictReader rows into RawTransaction records."""

    def _parse_amount(self, value: str) -> Decimal | None:
        cleaned = re.sub(r"[,$]", "", value.strip())
        if not cleaned:
            return None
        try:
            return Decimal(cleaned)
        except InvalidOperation:
            return None

    def _parse_date(self, value: str) -> date | None:
        from dateutil import parser as dateparser
        try:
            return dateparser.parse(value.strip()).date()
        except Exception:
            return None

    def _normalize_headers(self, headers: list[str]) -> list[str]:
        return [h.strip().lower() for h in headers]
