#!/usr/bin/env python3
"""CLI for Buy, Borrow, Die projections.

Implementation lives in `finance.bbd.engine`. Requires an editable install
(`pip install -e .` from repo root) or PYTHONPATH containing `src/`.

USAGE
-----
    python scripts/bbd_projection.py config.toml
    python scripts/bbd_projection.py config.toml --montecarlo 1000
    python scripts/bbd_projection.py config.toml --csv out.csv
    python scripts/bbd_projection.py --emit-default ian.toml
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from finance.bbd.engine import (
    emit_default_config,
    fmt_money,
    load_scenario_from_config,
    monte_carlo,
    print_estate,
    print_summary,
    project,
    write_csv,
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Buy, Borrow, Die projection (config-file driven)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
examples:
  python scripts/bbd_projection.py --emit-default ian.toml
  python scripts/bbd_projection.py ian.toml
  python scripts/bbd_projection.py ian.toml --montecarlo 1000
  python scripts/bbd_projection.py ian.toml --csv schedule.csv
""",
    )
    parser.add_argument("config", nargs="?", default=None, help="Path to TOML config file")
    parser.add_argument("--emit-default", metavar="PATH", help="Write a starter config file to PATH and exit")
    parser.add_argument(
        "--montecarlo",
        type=int,
        default=0,
        metavar="N",
        help="Run N Monte Carlo trials",
    )
    parser.add_argument("--csv", metavar="PATH", help="Write yearly schedule to CSV file")
    parser.add_argument("--mc-seed", type=int, default=42, help="Random seed for Monte Carlo (default: 42)")
    args = parser.parse_args()

    if args.emit_default:
        emit_default_config(args.emit_default)
        return

    if args.config is None:
        parser.error("config file required (or use --emit-default to generate one)")

    if not Path(args.config).exists():
        parser.error(f"config file not found: {args.config}")

    scenario = load_scenario_from_config(args.config)

    history = project(scenario)
    print_summary(scenario, history)
    print_estate(scenario, history)

    if args.csv:
        write_csv(history, args.csv)

    if args.montecarlo > 0:
        print("=" * 78)
        print(f"MONTE CARLO ({args.montecarlo} trials, return vol={scenario.portfolio_volatility})")
        print("=" * 78)
        mc = monte_carlo(scenario, n_trials=args.montecarlo, seed=args.mc_seed)
        print("  Final net worth distribution:")
        print(f"    P10:  {fmt_money(mc['final_nw_p10']):>12}")
        print(f"    P50:  {fmt_money(mc['final_nw_p50']):>12}")
        print(f"    P90:  {fmt_money(mc['final_nw_p90']):>12}")
        print(f"    Mean: {fmt_money(mc['final_nw_mean']):>12}")
        print(f"  Margin call probability: {mc['margin_call_rate']:.1%}")
        print(f"  Bankruptcy probability:  {mc['bankrupt_rate']:.1%}")
        print()


if __name__ == "__main__":
    main()
