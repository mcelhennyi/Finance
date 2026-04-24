"""Import CSV seed statements from a directory into the configured database.

Used by ``scripts/dev.sh --seed``. Set ``FINANCE_SEED_DIR`` (default in Docker:
``/seed``) to the directory containing ``*.csv`` files.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from finance.db.session import get_session, init_db
from finance.ingestion.service import ingest_csv_content
from finance.seed_merchant_displays import apply_merchant_display_seed, default_seed_path


def _seed_dir_from_env() -> Path:
    raw = os.environ.get("FINANCE_SEED_DIR", "data/seed-statements")
    return Path(raw).expanduser()


def run_seed(directory: Path) -> int:
    """Ingest every ``*.csv`` in ``directory``, then apply merchant display JSON.

    Returns process exit code (0 or 1).
    """
    directory = directory.resolve()
    if not directory.is_dir():
        print(f"Seed directory does not exist: {directory}", file=sys.stderr)
        return 1

    paths = sorted(
        p for p in directory.iterdir() if p.is_file() and p.suffix.lower() == ".csv"
    )

    init_db()
    errors = 0

    if paths:
        for path in paths:
            print(f"  • {path.name} …", flush=True)
            try:
                content = path.read_bytes()
            except OSError as exc:
                print(f"    read error: {exc}", file=sys.stderr)
                errors += 1
                continue
            with get_session() as session:
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
            print(f"  • merchant displays: applied {n} override(s) from {seed_merchant_path}", flush=True)
        elif seed_merchant_path.is_file():
            print(
                f"  • merchant displays: {seed_merchant_path.name} — no overrides to apply (empty or invalid).",
                flush=True,
            )
    except Exception as exc:
        print(f"  • merchant displays: error: {exc}", file=sys.stderr)
        errors += 1

    if errors:
        print("Seed finished with errors.", file=sys.stderr)
        return 1
    print("Seed finished.")
    return 0


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
    args = parser.parse_args()
    if args.export_merchant_displays:
        from finance.seed_merchant_displays import export_seed_file_cli

        raise SystemExit(export_seed_file_cli())
    directory = args.directory if args.directory is not None else _seed_dir_from_env()
    raise SystemExit(run_seed(directory))


if __name__ == "__main__":
    main()
