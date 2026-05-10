# Buy, Borrow, Die — CLI projection

This folder contains a **standalone** Python workbook for projecting net worth, borrowing, taxes, and a terminal “BBD vs sell” estate heuristic over decades. Nothing here is individualized financial, legal, or tax advice — it is a **transparent sandbox** so you can reason about sensitivities before talking to professionals.

## Files in this directory

The CLI bundle is intentionally self-contained so you can read and run beside one folder.

- **`bbd_projection.py`** — runnable projection script (**Python 3.11+**, stdlib **`tomllib`** only).
- **`README.md`** — this file: **tutorial + CLI cookbook** up front; **strategy / output semantics** afterward in **Strategy appendix** (everything that lived in the old separate hand-off doc has been folded in here).
- **`example-scenario.toml`** — **committed fictional round numbers**. Copy when you learn the CLI: `cp scripts/bbd-projection/example-scenario.toml my-scenario.toml`.
- **`ian.toml`** (**optional**) — workspace copy next to the script for quick iteration; **`git`** ignores this filename so maintainer edits never land in **`main`**. Create yours from **`example-scenario.toml`** or **`python … --emit-default …`**.

## What you run

From the **repository root** (recommended):

```bash
python scripts/bbd-projection/bbd_projection.py --emit-default ./my-scenario.toml
python scripts/bbd-projection/bbd_projection.py ./my-scenario.toml
python scripts/bbd-projection/bbd_projection.py ./my-scenario.toml --montecarlo 500 --mc-seed 42
python scripts/bbd-projection/bbd_projection.py ./my-scenario.toml --csv ./schedule.csv
```

You may use **`python3`** instead of **`python`** if that is how 3.11+ is exposed on your machine.

## Requirements

- **Python 3.11 or newer** — the script parses TOML with the standard library **`tomllib`**.
- **No pip installs required** for the CLI invocation above. *(Finance Hub’s HTTP API lives in **`src/finance/bbd/`** with **`pip install -e .`**, but this script stays dependency-light on purpose.)*

## First-time guided run

Follow these steps once; afterward you iterate by editing TOML and re-running:

1. **Emit a starter file** — produces every section/key the loader expects (typos trigger a loud **`ValueError`** instead of silently ignored keys):

   ```bash
   python scripts/bbd-projection/bbd_projection.py --emit-default starter.toml
   ```

   Or duplicate **`scripts/bbd-projection/example-scenario.toml`** and rename.

2. **Edit your TOML** — adjust timing, wages, expenses, borrowing limits, portfolio assumptions, optional **`[[properties]]`** / **`[[private_equity]]`** arrays. Calibration ideas appear under **Strategy appendix → Calibrate your inputs — checklist**.

3. **Deterministic run** — prints sampled year rows, terminal estate comparison, **solvency narrative** driven by **`[stress_test]`**, then optional Monte Carlo block if requested:

   ```bash
   python scripts/bbd-projection/bbd_projection.py starter.toml
   ```

4. **Optional Monte Carlo** — stochastic returns, stochastic PE exits/failures, random SOFR path; summarizes NW percentiles, margin-call rate, bankrupt rate. Status-flag meanings for the deterministic solvency table are spelled out under **Strategy appendix → Solvency status flags**:

   ```bash
   python scripts/bbd-projection/bbd_projection.py starter.toml --montecarlo 1000 --mc-seed 42
   ```

   Use **`--mc-seed`** when you want **reproducible** stochastic draws (Finance Hub pins **seed 42** when you enable MC in the SPA — match seeds when comparing CLI vs Hub).

5. **Optional CSV export** — same yearly columns the script snapshots internally (portfolio, SBLOC, LTV, **`margin_call`**, etc.):

   ```bash
   python scripts/bbd-projection/bbd_projection.py starter.toml --csv schedule.csv
   ```

## CLI reference

| Flag | Meaning |
|------|---------|
| `CONFIG.toml` | Path to your scenario file (positional). Required unless you only **`--emit-default`**. |
| `--emit-default PATH` | Write the built-in starter template to **`PATH`** and exit. |
| `--montecarlo N` | After the deterministic trace, run **`N`** stochastic trials (**`N > 0`**). |
| `--mc-seed INT` | RNG seed for Monte Carlo (default **42**). |
| `--csv PATH` | Write the full yearly schedule CSV to `PATH`. |

On errors (missing path, argparse issues, unknown TOML keys), the process exits non-zero.

## TOML layout (minimal map)

Sections are flattened into one internal **`Scenario`**; names and keys must match the template **`--emit-default`** emits:

| Section | Role |
|---------|------|
| `[timing]` | Start calendar year, horizon length, labeling age |
| `[income]` | W‑2 trajectory until modeled retirement |
| `[taxes]` | Blended ordinary / LTCG / NIIT / recapture hints |
| `[expenses]` | Living expenses + inflation |
| `[savings]` | 401(k), taxable portfolio sleeve, μ/σ/dividends, optional savings override |
| `[borrowing]` | SBLOC LTV caps, margin line, SOFR + HELOC/refi knobs |
| `[strategy]` | When draws start, target draw size, capitalize vs pay interest, optional primary→rental year, PE exit treatment |
| `[stress_test]` | **`stress_test_crash_pct`** — portfolio crash assumption for printed **solvency** story (see **Strategy appendix → Solvency frontier**). |
| `[[properties]]` | Repeated blocks for financed rentals / primary residence economics |
| `[[private_equity]]` | Optional illiquid positions (Monte Carlo gets failure/exit logic) |

The loader raises **`ValueError: Unknown config keys: {...}`** if you invent keys — intentional guardrail.

### Design behaviors you feel in scenarios

Concrete behaviors match **this** script implementation:

- Mortgage **principal is back-solved** from current balance, note rate, remaining term metadata — you do not re-type original loan principal.
- **Private equity is not SBLOC-collateral**.
- Interest can **capitalize** (classic “pure BBD” feel) or **pay-current** depending on **`capitalize_interest`**.
- **Margin-call path** trims portfolio, realizes proportional gains tax, feeds back into **`YearState.margin_call`** and Monte Carlo rates.

Expanded rationale mirrors **Strategy appendix → Key design decisions in this script**.

## What gets printed vs exported

Stdout is meant for humans; CSV is meant for spreadsheets / charts:

| Output | Contents |
|--------|----------|
| Sampled deterministic schedule | Every fifth simulated year (+ final row) snapshot of balances, draws, SBLOC metrics |
| Terminal estate comparison | Stylized liquidation vs modeled BBD-ish path (**illustrative** — not probate advice) |
| **Solvency analysis** | Yearly status glyphs (`[OK]`, `[~]`, `[!]`, `[X]`) — meanings in **Strategy appendix → Solvency status flags**. Tied to **`[stress_test]`** crash %. |
| **Monte Carlo** (optional) | Final NW bands + margin-call + bankrupt summary rates |
| **`--csv`** | Full annual series with **`margin_call`** column among others |

If you are decades from borrowing but want intuition on **which knobs matter**, read **Strategy appendix → Strategic takeaways (accumulation phase)**.

## Finance Hub UI vs this CLI

| Question | Typical answer |
|----------|----------------|
| Prefer fast iteration with forms + saved browser presets | Use **Finance Hub → BBD** → **`POST /api/bbd-projection/run`** (`src/finance/bbd/engine.py`). |
| Want the printed **solvency prose table** verbatim | Prefer **this CLI** today — the SPA shows schedules/MC/estates but not the expanded solvency narrative block. |

Scenario shapes are kept **parity-aligned in tests**, but **`scripts/bbd-projection/bbd_projection.py`** and **`finance.bbd.engine`** are separate implementations that can drift; treat **`pytest`**, **this README**, and **the packaged engine module** (`src/finance/bbd/engine.py`) as your reconciliation triangle.

---

## Strategy appendix — BBD framing & model intuition

The following merged text is pedagogical framing for what the knobs model and how to read printed diagnostics. **It is not tax, legal, or investment advice.**

### What “Buy, Borrow, Die” represents here

Three coupled moves that — in **idealized** textbook form — can postpone realization of gains and lean on borrowing for cash flow:

1. **Buy** appreciating assets (stocks, real estate, private equity) and avoid selling purely for liquidity.
2. **Borrow** against those assets via SBLOCs, HELOCs, cash-out refis, or margin-like facilities. Borrowed proceeds are modeled as funding spend without an immediate modeled **realization** gain in the borrowing leg (actual tax characterization of interest, acquisition, pledging, etc. is beyond this toy ledger).
3. **Die** holding the position. The **terminal comparison** sketches stepped-up basis as an estate mechanic versus a stylized sell-as-you-go baseline — illustrative only versus real probate/IRD rules.

### Mechanics in plain English

The cash isn’t magically free — modeled behavior depends on assumed **borrow rate**, **capitalization**, and **asset growth** versus draw size.

Borrow-first liquidity can postpone selling because you are not modeled as trimming cost basis unless you liquidate OR are forced via margin remediation.

Rough intuition for modeled “borrow vs sell” wedges:

1. Deferred gains on appreciating sleeves (scenario-dependent).
2. Tax you avoid in years you would otherwise have trimmed positions to fund expenses (rates you enter are blunt).
3. Spread between modeled asset return path and modeled borrow cost paths when you capitalize positively.

Mortgage-style amortization behaves differently than SBLOC: BBD-interest debt modeled against the portfolio is **not income** in this simplified workbook, but compound interest raises the payoff stack at horizon.

### Where cost and risk hide

Nothing is modeled as “free leverage.” Typical stress channels to watch in outputs:

#### Cost 1 — compounding debt

Balances grow when **`capitalize_interest`** is **`true`**; long horizons amplify the gap between peak assets and residual estate after payoff.

#### Cost 2 — margin-style forced sales

Portfolio drawdown vs SBLOC **`sbloc_margin_call_ltv`** can force liquidation, realize proportional gains taxes in the workbook, and spike **`margin_call`** flags across trials.

#### Cost 3 — loss of reversal at scale

Heavy deferred gains make “just simplify my life later” costly in the workbook’s stylized liquidation block.

#### Cost 4 — behavioral + policy uncertainty

Rates, underwriting, tax law horizons, and survivor behavior interact over multi-decade runs — scenarios are guesses, not promises.

### Solvency frontier (conceptual workbook framing)

Think in terms of thresholds between **painful taxable unwind** and **terminal insolvency**.

**1 — Naïve LTV ceiling (lender-like margin boundary)**

```text
D_naive ≈ portfolio_value × margin_call_fraction
```

**2 — Peak-portfolio liquidation ceiling**

```text
D_peak ≈ V × (1 − τ_eff) + τ_eff × basis
```

**3 — Crash-survivable ceiling**

```text
D_safe ≈ V × (1 − crash_fraction) × (1 − τ_eff) + τ_eff × basis_after_modeled_events
```

The script’s printable solvency table colors years using **`stress_test_crash_pct`** versus modeled debt/asset paths — see **Solvency status flags** below.

Historical drawdown benchmarks people cite for **`stress_test_crash_pct`** (not predictions):

- COVID 2020: ~34 % peak-to-trough  
- Dotcom 2000–02: ~49 %  
- GFC 2008: ~57 %

Two distinct failure motifs in workbook terms:

1. **Strategy unwind** — you pay modeled taxes you hoped to defer, but heirs still inherit positive residual modeled estate.
2. **Insolvency path** — debt stack vs after-tax asset recovery after shocks paints negative residual under the scripted liquidation toy.

Staying **conceptually below** crash-survivable debt at peak modeled SBLOC dependence is why many operators target **borrow utilization well under** the naive **maximum** pledged line.

### Tax reference snapshots (education only)

This section is shorthand for IRC concepts the workbook only approximates:

- Federal **estate tax** thresholds and portability change with law — your scenario does not replace Form 706 workflows.
- **Stepped-up basis** at death (**IRC §1014**) is modeled only in coarse terminal liquidation blocks; gifting / carryover basis (**§1015**) is not fidelity-modeled.
- **Traditional IRD** retirement accounts defer ordinary income characterization — QSBS (**§1202**), depreciation recapture (**§1250**), NIIT overlays, and state quirks are knobs or absent.
- Titling matters in real life; this script has no marital / trust / jurisdictional fidelity.

Treat every dollar printout as directional unless a professional signs off on assumptions.

### What this projection stack models

Five coupled engines simulated year-by-year for **`horizon_years`** steps:

1. **Real estate** — multiple properties; mortgage amortization linkage; rents; depreciation placeholder effects in terminal estate heuristic; HELOC/cash-out envelopes.
2. **Taxable portfolio** — deterministic return glide or stochastic shocks when Monte Carlo trials run.
3. **Private equity** — illiquid compartment; stochastic failure/exits optional; not SBLOC-pledged.
4. **Borrowing** — SBLOC with margin remediation; capitalize vs pay-interest toggles for BBD-ish debt stacks.
5. **Terminal comparison** — BBD liquidation sketch vs modeled sell-through taxes at horizon boundary.

Stdout blocks:

1. Year grid sample (**every fifth** year + terminal).
2. **Terminal estate comparison** deltas.
3. **Solvency analysis** keyed to **`stress_test`**.
4. Monte Carlo rollup when **`--montecarlo N > 0`**.

### Solvency status flags

Rows use compact glyphs summarizing workbook solvency heuristics for that modeled year relative to **`stress_test_crash_pct`**:

| Flag | Intended reading |
|------|---------------------|
| **`[OK] free option`** | Debt modeled below crash-survivable envelope — worst scripted case tends toward paying deferred gains, not zero crossing. |
| **`[~] peak-safe only`** | Surviving peak marks but flagged vulnerable if crash fraction hits concurrently. |
| **`[!] insolvent if crash`** | Would fail solvency if shock hits while debt stack is modeled here. |
| **`[X] MARGIN CALL`** | Hits / breaches modeled forced-liquidation policy on SBLOC sleeves. |

### Key design decisions in this script

- **Mortgage principal is back-solved** from **`mortgage_balance`**, **`mortgage_rate`**, remaining term inferred from **`mortgage_term_years`** + **`mortgage_origination_year`** so you rarely re-enter original principal.
- **Private equity sleeves are isolated** — no SBLOC collateral share; stochastic modules govern MC trials.
- **BBD-vs-structural split** inside solvency logic treats amortizing purchase debt differently from modeled SBLOC / cash-out paper when printing crash narratives.
- **Interest capitalization toggle** cleanly separates textbook BBD stacking vs servicing interest annually from modeled cash surplus.
- **Margin remediation** trims portfolio chunks, allocates proportional taxable gain recognition, persists **`margin_call`** onto **`YearState`**, feeds Monte Carlo event tallies.

### Strategic takeaways (accumulation-phase readers)

1. Borrowing knobs stay dormant until sizable pledgeable taxable marks exist — horizon early years are accumulation physics.
2. Treat modeled realizations as **irreversible** in the workbook — sensitivities amplify with low basis fractions.
3. Wrapper mix matters versus pure stepped-up-taxable fantasies — pre-tax buckets carry IRD optics this toy barely touches.
4. Primary residence equity + hypothetical startup marks are modeled as future leverage sources only if assumptions say so — still subject to underwriting reality not simulated.
5. Cash drag at death wastes stepped-up optics in **textbook pure BBD** stories; brokerage liquidity lines replace giant idle cash piles in narratives (not modeled bank fees / covenants).
6. Scenario optionality beats religious commitment — this engine is sensitivity lab, not a life plan validator.
7. Target SBLOC reliance **meaningfully inside** naive max lines — margin pathways dominate tail risk.
8. Watch modeled estate deltas vs thresholds — inflate decades forward and illustrative terminal blocks blow past static exemption memories fast.

### Calibrate your inputs — checklist

1. Taxable brokerage + tax-deferred balances (defaults may read zero-heavy).
2. True annual savings slipping into taxable after retirement plan wiring.
3. Real living-expense envelopes (baseline drives stress).
4. State of residence (estate + ordinary overlays).
5. Filing-status analog (single vs joint thresholds).
6. Actual retirement-age intent + inflation-linked spend targets.
7. Property capex cadence vs placeholder maintenance % knobs.
8. Startup marks: QSBS-ish flags?, basis, liquidity timing — MC distributions need honest failure rates.

### References (outside reading)

- IRC §1014 — stepped-up basis at death  
- IRC §1015 — carryover basis on gifts  
- IRC §121 — primary residence exclusion shorthand  
- IRC §1250 — depreciation recapture ceiling notes  
- IRC §1202 — QSBS carve-out awareness  
- Form 706 — estate compliance entry point  

---

## Where to go next

- **Broader scripts index:** [../README.md](../README.md)
