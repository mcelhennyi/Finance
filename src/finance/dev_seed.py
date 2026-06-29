"""Import CSV seed statements from a directory into the configured database.

Also applies the budget allocation seed YAML (see ``finance.seed_budget_allocation_yaml``
and ``data/budget-default-plan.yaml``) when enabled.

Used by ``scripts/dev.sh --seed``. Set ``FINANCE_SEED_DIR`` (default in Docker:
``/seed``) to the directory containing ``*.csv`` files.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import date
from pathlib import Path

from finance.db.session import get_session, init_db
from finance.ingestion.contracts import ingest_income_csv_content, ingest_liability_csv_content
from finance.ingestion.service import ingest_csv_content
from finance.seed_budget_allocation_yaml import try_seed_budget_default_yaml
from finance.seed_merchant_displays import apply_merchant_display_seed, default_seed_path


def _seed_dir_from_env() -> Path:
    raw = os.environ.get("FINANCE_SEED_DIR", "data/seed-statements")
    return Path(raw).expanduser()


def _is_non_statement_seed_csv(path: Path) -> bool:
    """Personal spreadsheets in the seed folder are not bank CSVs — skip ingest."""

    lower = path.name.lower()
    return "rental plan" in lower and "allocation" in lower


def run_seed(directory: Path) -> int:
    """Ingest statement CSVs, merchant displays, and budget default YAML.

    Returns process exit code (0 or 1).
    """
    directory = directory.resolve()
    if not directory.is_dir():
        print(f"Seed directory does not exist: {directory}", file=sys.stderr)
        return 1

    paths = sorted(p for p in directory.iterdir() if p.is_file() and p.suffix.lower() == ".csv")

    init_db()
    errors = 0

    if paths:
        for path in paths:
            if _is_non_statement_seed_csv(path):
                print(
                    f"  • {path.name} … (skipped — not a bank statement CSV)",
                    flush=True,
                )
                continue
            print(f"  • {path.name} …", flush=True)
            try:
                content = path.read_bytes()
            except OSError as exc:
                print(f"    read error: {exc}", file=sys.stderr)
                errors += 1
                continue
            with get_session() as session:
                lowered = path.name.lower()
                if "income" in lowered:
                    result = ingest_income_csv_content(session, content, path.name)
                elif "liability" in lowered:
                    result = ingest_liability_csv_content(session, content, path.name)
                else:
                    result = ingest_csv_content(session, content, path.name, "")
            if result.errors:
                for e in result.errors:
                    print(f"    error: {e}", file=sys.stderr)
                errors += 1
            print(
                f"    parsed={result.records_parsed} inserted={result.records_inserted} "
                f"skipped={result.records_skipped}",
                flush=True,
            )
    else:
        print(f"No .csv files in {directory} — skipping statement ingest.", flush=True)

    seed_merchant_path = default_seed_path()
    try:
        with get_session() as session:
            n = apply_merchant_display_seed(session, seed_merchant_path)
        if n:
            print(
                f"  • merchant displays: applied {n} override(s) from {seed_merchant_path}",
                flush=True,
            )
        elif seed_merchant_path.is_file():
            print(
                f"  • merchant displays: {seed_merchant_path.name} — no overrides to apply (empty or invalid).",
                flush=True,
            )
    except Exception as exc:
        print(f"  • merchant displays: error: {exc}", file=sys.stderr)
        errors += 1

    try:
        with get_session() as session:
            ran, msg = try_seed_budget_default_yaml(session)
        print(f"  • {msg}", flush=True)
        if not ran and "failed" in msg.lower():
            errors += 1
    except Exception as exc:
        print(f"  • budget default seed: error: {exc}", file=sys.stderr)
        errors += 1

    if errors:
        print("Seed finished with errors.", file=sys.stderr)
        return 1
    print("Seed finished.")
    return 0


def _parse_month(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("expected YYYY-MM-DD") from exc


def _export_budget_seed_cli(args: argparse.Namespace) -> int:
    from finance.seed_budget_allocation_yaml import export_budget_seed_file_cli

    return export_budget_seed_file_cli(
        output=args.output,
        plan_id=args.plan_id,
        plan_name=args.plan_name,
        period_month=args.period_month,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest CSV files from a seed directory.")
    parser.add_argument(
        "--directory",
        type=Path,
        default=None,
        help="Override FINANCE_SEED_DIR (default: env or data/seed-statements)",
    )
    parser.add_argument(
        "--export-merchant-displays",
        action="store_true",
        help="Write all DB merchant display overrides to data/seed-merchant-displays.json and exit.",
    )
    parser.add_argument(
        "--export-budget-default",
        action="store_true",
        help="Write a DB allocation plan to data/budget-default-plan.yaml and exit.",
    )
    parser.add_argument(
        "--sync-seeds",
        action="store_true",
        help="Write all DB-backed seed files (merchant displays + budget default) and exit.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Budget seed output path (default: FINANCE_BUDGET_DEFAULT_YAML or data/budget-default-plan.yaml).",
    )
    parser.add_argument(
        "--plan-id",
        type=int,
        default=None,
        help="Allocation plan id to export to the budget seed.",
    )
    parser.add_argument(
        "--plan-name",
        default=None,
        help="Allocation plan name to export when --plan-id is not provided.",
    )
    parser.add_argument(
        "--period-month",
        type=_parse_month,
        default=None,
        help="Planning month to export when --plan-id is not provided (YYYY-MM-DD).",
    )
    args = parser.parse_args()
    if args.sync_seeds:
        from finance.seed_merchant_displays import export_seed_file_cli

        merchant_code = export_seed_file_cli()
        budget_code = _export_budget_seed_cli(args)
        raise SystemExit(0 if merchant_code == 0 and budget_code == 0 else 1)
    if args.export_budget_default:
        raise SystemExit(_export_budget_seed_cli(args))
    if args.export_merchant_displays:
        from finance.seed_merchant_displays import export_seed_file_cli

        raise SystemExit(export_seed_file_cli())
    directory = args.directory if args.directory is not None else _seed_dir_from_env()
    raise SystemExit(run_seed(directory))


if __name__ == "__main__":
    main()
