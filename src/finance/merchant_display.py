"""Heuristic pretty-printing and persistence for merchant display names.

See Also: docs/design/services/ingestion-service/overview.md
"""

from __future__ import annotations

import re
import unicodedata

# Strip these prefixes repeatedly from the left (statement noise).
_LEAD_NOISE = re.compile(
    r"^(?:"
    r"POS\s*(?:DEBIT|CREDIT|PURCHASE|TRANSACTION)?|"
    r"DEBIT\s*(?:CARD)?|"
    r"CREDIT\s*(?:CARD)?|"
    r"PURCHASE|"
    r"CHECK\s*CARD|"
    r"PAYMENT\s*(?:TO|FROM)?|"
    r"ONLINE|"
    r"ACH\s*(?:DEBIT|CREDIT)?|"
    r"RECURRING|"
    r"TST\*|"
    r"SQ\s*\*"
    r")\s*[#:/\-]*\s*",
    re.IGNORECASE,
)


def _nfkc(s: str) -> str:
    return unicodedata.normalize("NFKC", s or "")


def auto_pretty_merchant(raw: str) -> str:
    """Best-effort readable label from a stored merchant / descriptor fragment.

    Does not call external services. Short acronyms stay uppercase; the rest
    is title-cased. Leading POS/debit-style tokens are stripped.
    """
    s = _nfkc(raw).strip()
    s = re.sub(r"\s{2,}", " ", s)
    if not s:
        return ""

    prev = None
    while prev != s:
        prev = s
        s = _LEAD_NOISE.sub("", s).strip()

    # Prefer the longest *-delimited chunk (often the merchant vs. ref codes).
    if "*" in s:
        chunks = [c.strip() for c in s.split("*") if c.strip()]
        if chunks:
            s = max(chunks, key=len)

    s = re.sub(r"\s{2,}", " ", s).strip()
    if not s:
        return ""

    tokens = re.findall(r"[A-Za-z0-9]+(?:'[A-Za-z]+)?", s)
    if not tokens:
        return s[:80].strip()

    out: list[str] = []
    for tok in tokens:
        letters = sum(1 for c in tok if c.isalpha())
        if tok.isupper() and 2 <= len(tok) <= 5 and letters == len(tok):
            out.append(tok)
        elif tok.isdigit():
            out.append(tok)
        else:
            out.append(tok[:1].upper() + tok[1:].lower())

    return " ".join(out)


def needs_handwritten_pretty_name(raw: str, auto_pretty: str, has_override: bool) -> bool:
    """True when the row should appear in the \"needs a hand-written name\" list."""
    if has_override:
        return False
    s = _nfkc(raw).strip()
    if not s:
        return False
    if s == auto_pretty and len(s) <= 18 and s.isalpha() and not s.isupper():
        return False
    if len(s) > 38:
        return True
    if "*" in s or "#" in s:
        return True
    if sum(1 for c in s if c.isdigit()) >= 4:
        return True
    if s.isupper() and len(s) >= 14:
        return True
    if s.count(" ") >= 5:
        return True
    if s != auto_pretty and any(c in s for c in "*#0123456789"):
        return True
    # Still messy after auto: lots of punctuation
    punct = sum(1 for c in s if not c.isalnum() and not c.isspace())
    if punct >= 3 and len(s) > 12:
        return True
    return False


def effective_display_name(raw: str, override: str | None) -> str:
    if override is not None and override.strip():
        return override.strip()
    return auto_pretty_merchant(raw)
