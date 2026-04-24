"""Fuzzy name matching for merchants and descriptions.

Treats variants like ``SAM'S`` and ``SAMS`` as the same by comparing an
alphanumeric-only, case-insensitive fingerprint.
"""

from __future__ import annotations

import re
import unicodedata

from sqlalchemy import String, cast, func
from sqlalchemy.sql.expression import ColumnElement

_NON_ALNUM = re.compile(r"[^A-Z0-9]+")

# Strips common punctuation/spacing in SQL (mirrors fingerprint logic closely).
_SQL_STRIP_CHARS = (
    "'",
    "\u2019",  # right single quotation
    "\u2018",  # left single quotation
    ".",
    "-",
    " ",
    ",",
    "#",
    "*",
    "&",
    "/",
    "\\",
    "(",
    ")",
    "[",
    "]",
    ":",
    ";",
)


def merchant_name_fingerprint(text: str) -> str:
    """Return uppercase letters and digits only (Unicode-aware)."""
    if not text:
        return ""
    n = unicodedata.normalize("NFKC", text)
    n = n.upper()
    return _NON_ALNUM.sub("", n)


def merchant_fingerprint_sql_expr(column: ColumnElement[str]) -> ColumnElement[str]:
    """SQL expression analogous to :func:`merchant_name_fingerprint` for filters."""
    x: ColumnElement[str] = cast(column, String)
    x = func.upper(x)
    for ch in _SQL_STRIP_CHARS:
        x = func.replace(x, ch, "")
    return x
