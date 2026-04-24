"""Flask web application for Finance Hub.

Provides a drag-and-drop interface for uploading statements
and a dashboard for visualizing spending.

See Also: docs/design/services/analysis-service/overview.md
"""

import json
from datetime import date, datetime
from pathlib import Path

from flask import Flask, jsonify, render_template, request

from finance.analysis.service import (
    compute_metrics,
    get_categories,
    get_date_range,
    get_source_types,
    get_transactions,
)
from finance.db.session import get_session, init_db
from finance.ingestion.parsers import ALL_PARSERS
from finance.ingestion.service import ingest_csv_content

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max upload


@app.before_request
def _ensure_db():
    init_db()


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------


@app.get("/")
def index():
    return render_template("index.html")


# ---------------------------------------------------------------------------
# API — Ingestion
# ---------------------------------------------------------------------------


@app.post("/api/ingest")
def api_ingest():
    """Accept a statement file upload and ingest it into the database."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400

    source_hint = request.form.get("source", "").strip().lower()
    content = f.read()

    try:
        with get_session() as session:
            result = ingest_csv_content(
                session=session,
                content=content,
                filename=f.filename,
                source_hint=source_hint,
            )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify(
        {
            "source_file": result.source_file,
            "source_type": result.source_type,
            "records_parsed": result.records_parsed,
            "records_inserted": result.records_inserted,
            "records_skipped": result.records_skipped,
            "errors": result.errors,
            "duration_seconds": round(result.duration_seconds, 3),
        }
    )


# ---------------------------------------------------------------------------
# API — Analysis
# ---------------------------------------------------------------------------


@app.get("/api/transactions")
def api_transactions():
    """Return filtered transactions as JSON."""
    date_from = _parse_date(request.args.get("from"))
    date_to = _parse_date(request.args.get("to"))
    category = request.args.get("category") or None
    merchant = request.args.get("merchant") or None
    source_type = request.args.get("source") or None
    include_credits = request.args.get("include_credits", "true").lower() == "true"
    limit = _parse_int(request.args.get("limit")) or 500

    with get_session() as session:
        transactions = get_transactions(
            session=session,
            date_from=date_from,
            date_to=date_to,
            category=category,
            merchant=merchant,
            source_type=source_type,
            include_credits=include_credits,
            limit=limit,
        )
        return jsonify([t.to_dict() for t in transactions])


@app.get("/api/metrics")
def api_metrics():
    """Return spending metrics (aggregations) as JSON."""
    date_from = _parse_date(request.args.get("from"))
    date_to = _parse_date(request.args.get("to"))
    category = request.args.get("category") or None
    source_type = request.args.get("source") or None

    with get_session() as session:
        transactions = get_transactions(
            session=session,
            date_from=date_from,
            date_to=date_to,
            category=category,
            source_type=source_type,
            include_credits=True,
        )
        metrics = compute_metrics(transactions)

    return jsonify(
        {
            "total_spent": round(metrics.total_spent, 2),
            "total_credits": round(metrics.total_credits, 2),
            "net_spent": round(metrics.net_spent, 2),
            "transaction_count": metrics.transaction_count,
            "avg_per_transaction": round(metrics.avg_per_transaction, 2),
            "by_category": {k: round(v, 2) for k, v in metrics.by_category.items()},
            "by_category_count": metrics.by_category_count,
            "top_merchants": [[m, round(a, 2)] for m, a in metrics.top_merchants],
            "daily_trend": metrics.daily_trend,
        }
    )


@app.get("/api/filters")
def api_filters():
    """Return available filter options (categories, sources, date range)."""
    with get_session() as session:
        categories = get_categories(session)
        sources = get_source_types(session)
        date_min, date_max = get_date_range(session)

    return jsonify(
        {
            "categories": categories,
            "sources": sources,
            "date_min": date_min.isoformat() if date_min else None,
            "date_max": date_max.isoformat() if date_max else None,
        }
    )


@app.get("/api/sources")
def api_sources():
    """Return available parser source keys and names."""
    return jsonify(
        [
            {"key": p.source_key, "name": p.source_name}
            for p in ALL_PARSERS
            if p.source_key != "generic"
        ]
        + [{"key": "auto", "name": "Auto-detect"}]
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _parse_int(value: str | None) -> int | None:
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        return None


def create_app() -> Flask:
    return app


def main() -> None:
    import os
    port = int(os.environ.get("FINANCE_PORT", 3503))
    debug = os.environ.get("FINANCE_DEBUG", "true").lower() == "true"
    print(f"Finance Hub starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)


if __name__ == "__main__":
    main()
