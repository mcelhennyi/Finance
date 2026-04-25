from datetime import date
from pathlib import Path
import sys
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))

from finance.analysis.service import compute_metrics


def _txn(
    *,
    amount: float,
    category: str,
    merchant: str,
    description_normalized: str = "",
    description_raw: str = "",
):
    return SimpleNamespace(
        amount=amount,
        category=category,
        merchant=merchant,
        description_normalized=description_normalized,
        description_raw=description_raw,
        transaction_date=date(2026, 1, 1),
        to_dict=lambda: {},
    )


def test_compute_metrics_top_merchants_uses_effective_display_names():
    txns = [
        _txn(amount=40.0, category="Food", merchant="MCDONALDS #123"),
        _txn(amount=60.0, category="Food", merchant="MCDONALDS #123"),
        _txn(amount=80.0, category="Food", merchant="WHOLEFDS*04231"),
        _txn(amount=15.0, category="Food", merchant="", description_normalized="STARBUCKS 001"),
    ]

    metrics = compute_metrics(
        txns,
        merchant_display_overrides={"MCDONALDS #123": "McDonald's"},
    )

    assert metrics.top_merchants[0] == ("McDonald's", 100.0)
    assert metrics.top_merchants[1] == ("Wholefds", 80.0)
    assert metrics.top_merchants[2] == ("Starbucks 001", 15.0)
