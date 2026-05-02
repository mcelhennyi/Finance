"""Buy, Borrow, Die projection core (scenario, simulation, estate, Monte Carlo).

See Also:
    docs/design/services/analysis-service/overview.md (API surface consumes this package)
"""

from __future__ import annotations

import csv
import random
import statistics
import sys
import tomllib
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any, Optional


# ---------------------------------------------------------------------------
# 1. SCENARIO INPUTS  --- edit these to model your situation
# ---------------------------------------------------------------------------

@dataclass
class Property:
    """A single piece of real estate."""
    name: str
    purchase_price: float          # original purchase price
    purchase_year: int             # calendar year purchased
    current_value: float           # market value at start of simulation
    mortgage_balance: float        # principal remaining at start
    mortgage_rate: float           # APR, e.g. 0.03 for 3%
    mortgage_term_years: int       # original term (e.g. 30)
    mortgage_origination_year: int # year the current mortgage started
    monthly_piti: float            # principal+interest+tax+insurance+PMI all-in
    monthly_market_rent: float     # what it would rent for today
    is_primary: bool = True        # primary residence vs rental
    rental_start_year: Optional[int] = None  # year converted to rental (if applicable)
    appreciation_rate: float = 0.035         # annual home price growth
    rent_growth_rate: float = 0.03           # annual rent growth
    vacancy_and_mgmt_pct: float = 0.10       # % of rent lost to vacancy + management
    annual_maintenance_pct: float = 0.01     # % of value spent on maintenance/year
    land_value_pct: float = 0.20             # % of basis allocated to land (non-depreciable)


@dataclass
class PrivateEquity:
    """An illiquid private startup / private-company equity position.

    Treated very differently from public portfolio:
      - NOT pledgeable for SBLOC (lenders won't accept; some private banks will at very
        deep haircuts but not modeled here)
      - High expected return, very high vol, with a non-trivial probability of going to zero
      - Cost basis usually low (early employee strike price, or founder stock) — meaning
        massive embedded gain that gets WIPED at death under §1014 stepped-up basis.
        This is one of the highest-value BBD plays available.
      - On a liquidity event (acquisition / IPO), it converts to public stock or cash:
        * if cash: realize gain, pay LTCG, proceeds flow into taxable portfolio
        * if stock: model as portfolio addition with carryover basis, often subject to
          lockup. We model the cash case for simplicity, with a "lockup_years" delay.
    """
    name: str
    current_value: float                  # marked value today (409A or last round)
    cost_basis: float = 0.0               # what you paid (strike * shares, etc.)
    expected_growth_rate: float = 0.15    # geometric mean if it survives
    volatility: float = 0.50              # very high
    annual_failure_prob: float = 0.05     # chance of going to $0 each year (Monte Carlo only)
    annual_exit_prob: float = 0.08        # chance of liquidity event each year
    exit_multiple_mean: float = 2.0       # if exit happens, multiple on current value
    exit_multiple_vol: float = 1.0        # vol of that multiple (lognormal-ish)
    has_exited: bool = False              # internal state
    is_zero: bool = False                 # internal state


@dataclass
class Scenario:
    # --- TIMING -----------------------------------------------------------
    start_year: int = 2026
    horizon_years: int = 50          # how many years to project (e.g. to age ~85)
    current_age: int = 35            # starting age (only used for labels)

    # --- INCOME ----------------------------------------------------------
    w2_gross_income: float = 190_000
    w2_growth_rate: float = 0.03     # annual raise assumption
    w2_retire_year_offset: int = 30  # years from start until W-2 stops

    # Tax assumptions (rough; for more accuracy, run through tax software)
    federal_marginal_rate: float = 0.24
    state_marginal_rate: float = 0.05
    ltcg_rate: float = 0.15          # long-term cap gains rate
    niit_rate: float = 0.038         # net investment income tax (kicks in >$200k MAGI single)
    depreciation_recapture_rate: float = 0.25  # max for §1250

    # --- LIVING EXPENSES -------------------------------------------------
    annual_living_expenses: float = 90_000   # everything except housing
    expense_inflation: float = 0.03

    # --- RETIREMENT/SAVINGS ----------------------------------------------
    annual_401k_contribution: float = 23_000  # pre-tax, doesn't count toward BBD taxable
    employer_match: float = 9_500
    starting_taxable_portfolio: float = 0
    starting_portfolio_basis: float = 0
    portfolio_nominal_return: float = 0.085   # geometric mean expected return
    portfolio_volatility: float = 0.16        # std dev for Monte Carlo
    portfolio_dividend_yield: float = 0.015   # dividends are taxed each year (drag)

    # --- PROPERTIES ------------------------------------------------------
    properties: list[Property] = field(default_factory=list)

    # --- PRIVATE EQUITY (startup stock) ----------------------------------
    private_equity: list[PrivateEquity] = field(default_factory=list)
    # Treatment of private equity exits:
    #   "cash"    = realize, pay LTCG, deposit into taxable portfolio
    #   "stock"   = receive equivalent value of public stock, carryover basis (rare to
    #               model precisely; simplified to cash for now)
    #   "hold"    = assume secondary sale impossible; only matters at death
    pe_exit_treatment: str = "cash"

    # --- BORROWING (the "Borrow" leg) ------------------------------------
    sbloc_ltv_cap: float = 0.50              # max % of portfolio you can borrow
    sbloc_margin_call_ltv: float = 0.70      # forced liquidation threshold
    sbloc_spread_over_sofr: float = 0.025    # 250 bps spread, typical for $100k-$1M
    sofr_rate: float = 0.0365                # current SOFR
    sofr_long_run: float = 0.030             # long-run mean for rate mean-reversion
    rate_mean_reversion: float = 0.20        # speed of reversion per year

    heloc_rate_spread_over_prime: float = 0.005  # HELOC: prime + 0.5%
    cashout_refi_rate: float = 0.072             # current investment property cash-out
    heloc_max_cltv: float = 0.85                 # combined LTV cap on primary
    cashout_refi_max_cltv: float = 0.75          # cap on rental cash-out

    # --- STRATEGY KNOBS --------------------------------------------------
    drawdown_start_year_offset: int = 30     # year to switch from accumulating to borrowing
    target_annual_drawdown: float = 120_000  # how much tax-free cash to pull/year in retirement
    capitalize_interest: bool = True         # if True, interest adds to loan balance (true BBD)
    inflate_drawdown: bool = True            # grow drawdown with inflation
    convert_primary_to_rental_year: Optional[int] = None  # year to convert primary->rental

    # --- SAVINGS RATE OVERRIDE ------------------------------------------
    # If None, savings = (W-2 after tax + rental cash flow) - living expenses - 401k.
    # If set, override with this fixed annual taxable savings figure.
    annual_taxable_savings_override: Optional[float] = None


# ---------------------------------------------------------------------------
# 2. CONFIG FILE I/O
# ---------------------------------------------------------------------------

# Default config emitted by --emit-default. Edit values here to change what a
# fresh starter config looks like.
DEFAULT_CONFIG_TEMPLATE = """\
# Buy, Borrow, Die projection config
# Edit any value and re-run via `scripts/bbd_projection.py <this_file>` or the Hub UI API.
# All currency values are in nominal dollars at simulation start.

[timing]
start_year = 2026
horizon_years = 50          # how many years to project (e.g. 50 -> age 35 to 84)
current_age = 35

[income]
w2_gross_income = 190000
w2_growth_rate = 0.03       # annual raise assumption
w2_retire_year_offset = 30  # years from start until W-2 income stops

[taxes]
federal_marginal_rate = 0.24
state_marginal_rate = 0.05
ltcg_rate = 0.15
niit_rate = 0.038                    # 3.8% net investment income tax (high earners)
depreciation_recapture_rate = 0.25   # max for §1250 unrecaptured

[expenses]
annual_living_expenses = 90000   # everything except housing
expense_inflation = 0.03

[savings]
annual_401k_contribution = 23000
employer_match = 9500
starting_taxable_portfolio = 0
starting_portfolio_basis = 0
portfolio_nominal_return = 0.085   # geometric mean expected total return
portfolio_volatility = 0.16        # std dev for Monte Carlo
portfolio_dividend_yield = 0.015   # taxable each year (drag in non-qualified accounts)
# Optional: override automatic savings calc with a fixed annual figure
# annual_taxable_savings_override = 30000

[borrowing]
# SBLOC = Securities-Backed Line of Credit (against your taxable portfolio)
sbloc_ltv_cap = 0.50              # max % of portfolio you can borrow
sbloc_margin_call_ltv = 0.70      # forced liquidation threshold
sbloc_spread_over_sofr = 0.025    # 250 bps spread, typical for $100k–$1M tier
sofr_rate = 0.0365                # current SOFR (Apr 2026: ~3.63%)
sofr_long_run = 0.030             # long-run mean for rate mean-reversion
rate_mean_reversion = 0.20        # speed of reversion per year

# Real-estate borrowing (HELOC / cash-out refi)
heloc_rate_spread_over_prime = 0.005   # HELOC at prime + 0.5%
cashout_refi_rate = 0.072              # current investment-property cash-out rate
heloc_max_cltv = 0.85                  # combined LTV cap on primary
cashout_refi_max_cltv = 0.75           # cap on rental cash-out

[strategy]
drawdown_start_year_offset = 25     # years until you switch from accumulating to borrowing
target_annual_drawdown = 120000     # tax-free cash to pull/year in retirement
capitalize_interest = true          # true BBD: interest adds to loan balance
inflate_drawdown = true             # grow drawdown with inflation
# convert_primary_to_rental_year = 2027   # uncomment to convert primary to rental
pe_exit_treatment = "cash"          # "cash" | "stock" | "hold"

# ---------------------------------------------------------------------------
# Real estate. Add multiple [[properties]] tables for multiple properties.
# ---------------------------------------------------------------------------
[[properties]]
name = "Primary Home"
purchase_price = 360000
purchase_year = 2021
current_value = 420000
mortgage_balance = 308000           # current principal remaining
mortgage_rate = 0.03
mortgage_term_years = 30
mortgage_origination_year = 2021
monthly_piti = 2500                 # all-in: P+I+tax+insurance+PMI
monthly_market_rent = 2400
is_primary = true
appreciation_rate = 0.035
rent_growth_rate = 0.03
vacancy_and_mgmt_pct = 0.10
annual_maintenance_pct = 0.01
land_value_pct = 0.20

# ---------------------------------------------------------------------------
# Private equity (startup stock). Add multiple [[private_equity]] tables.
# Set to [] or omit entirely if you have none.
# ---------------------------------------------------------------------------
[[private_equity]]
name = "Private Startup Equity"
current_value = 200000
cost_basis = 0                # what you paid (strike × shares for ISOs/NSOs)
expected_growth_rate = 0.15   # if the company survives
volatility = 0.55
annual_failure_prob = 0.06    # ~50% chance of zero over 10y
annual_exit_prob = 0.08       # ~55% chance of an exit over 10y
exit_multiple_mean = 2.5      # if exit, multiple on then-current value
exit_multiple_vol = 1.5
"""


def emit_default_config(path: str) -> None:
    """Write a starter config file to the given path."""
    Path(path).write_text(DEFAULT_CONFIG_TEMPLATE)
    print(f"Wrote default config to {path}")
    print(f"Edit it, then run: python {sys.argv[0]} {path}")


def load_scenario_from_config(path: str) -> "Scenario":
    """Parse a TOML config file into a Scenario object."""
    with open(path, "rb") as f:
        cfg = tomllib.load(f)

    def section(name: str) -> dict:
        return cfg.get(name, {})

    # Build Property objects
    properties: list[Property] = []
    for prop_cfg in cfg.get("properties", []):
        properties.append(Property(**prop_cfg))

    # Build PrivateEquity objects
    pe_holdings: list[PrivateEquity] = []
    for pe_cfg in cfg.get("private_equity", []):
        pe_holdings.append(PrivateEquity(**pe_cfg))

    # Flatten config sections into a dict of all Scenario fields
    flat: dict[str, Any] = {}
    for section_name in ("timing", "income", "taxes", "expenses", "savings",
                         "borrowing", "strategy"):
        flat.update(section(section_name))

    flat["properties"] = properties
    flat["private_equity"] = pe_holdings

    # Defensive: drop any keys not in Scenario (typo protection)
    valid_fields = {f.name for f in Scenario.__dataclass_fields__.values()}
    extras = set(flat.keys()) - valid_fields
    if extras:
        raise ValueError(f"Unknown config keys: {extras}. "
                         f"Check section names and key spellings in {path}")

    return Scenario(**flat)


# ---------------------------------------------------------------------------
# 3. AMORTIZATION HELPERS
# ---------------------------------------------------------------------------

def monthly_pi_payment(principal: float, annual_rate: float, term_years: int) -> float:
    if principal <= 0:
        return 0.0
    n = term_years * 12
    r = annual_rate / 12
    if r == 0:
        return principal / n
    return principal * (r * (1 + r) ** n) / ((1 + r) ** n - 1)


def remaining_balance(orig_principal: float, annual_rate: float,
                       term_years: int, months_paid: int) -> float:
    """Standard mortgage balance formula."""
    if months_paid >= term_years * 12:
        return 0.0
    n = term_years * 12
    r = annual_rate / 12
    if r == 0:
        return orig_principal * (1 - months_paid / n)
    pmt = monthly_pi_payment(orig_principal, annual_rate, term_years)
    bal = orig_principal * (1 + r) ** months_paid - pmt * ((1 + r) ** months_paid - 1) / r
    return max(bal, 0.0)


# ---------------------------------------------------------------------------
# 4. SIMULATION
# ---------------------------------------------------------------------------

@dataclass
class YearState:
    year: int
    age: int
    # Income
    w2_income: float
    rental_net_cash_flow: float
    portfolio_dividends: float
    drawdown_borrowed: float  # tax-free cash from BBD borrowing
    taxes_paid: float
    living_expenses: float
    # Balance sheet
    portfolio_value: float
    portfolio_basis: float
    portfolio_unrealized_gain: float
    properties_value: float
    properties_mortgage_balance: float
    pe_value: float
    pe_basis: float
    pe_exited_this_year: bool
    sbloc_balance: float
    heloc_refi_balance: float
    total_assets: float
    total_liabilities: float
    net_worth: float
    # Borrowing capacity
    sbloc_capacity_remaining: float
    sbloc_ltv: float            # current loan / portfolio value
    margin_call: bool
    # Rates
    sofr: float
    sbloc_rate: float


def project(scenario: Scenario, return_path: Optional[list[float]] = None,
            sofr_path: Optional[list[float]] = None) -> list[YearState]:
    """Run one path of the simulation. If return_path/sofr_path are None,
    deterministic means are used."""
    s = scenario
    history: list[YearState] = []

    # Deep-copy properties so we don't mutate the input
    properties = [replace(p) for p in s.properties]
    pe_holdings = [replace(pe) for pe in s.private_equity]

    # Back-solve original principal for each property ONCE, before the simulation loop.
    # This avoids the bug where the back-solve reads the mutating mortgage_balance.
    original_principal_by_name: dict[str, float] = {}
    for p in properties:
        elapsed_months_at_start = max(0, (s.start_year - p.mortgage_origination_year) * 12)
        original_principal_by_name[p.name] = _back_solve_original_principal(
            p.mortgage_balance, p.mortgage_rate, p.mortgage_term_years, elapsed_months_at_start
        )

    portfolio = s.starting_taxable_portfolio
    portfolio_basis = s.starting_portfolio_basis
    sbloc_balance = 0.0
    heloc_refi_balance = 0.0  # combined real-estate junior debt drawn for BBD
    accumulated_depreciation_by_prop: dict[str, float] = {p.name: 0.0 for p in properties}
    sofr = s.sofr_rate
    margin_call_triggered = False
    # Track PE basis separately at portfolio level — when PE exits to cash, the proceeds
    # flow into the public portfolio and we need to keep track of its basis there.

    living_expenses = s.annual_living_expenses
    w2 = s.w2_gross_income

    for t in range(s.horizon_years):
        year = s.start_year + t
        age = s.current_age + t

        # ---- 4a. Stochastic shocks ----
        if return_path is not None:
            r_portfolio = return_path[t]
        else:
            r_portfolio = s.portfolio_nominal_return

        if sofr_path is not None:
            sofr = sofr_path[t]
        else:
            # mean-revert SOFR toward long-run rate
            sofr = sofr + s.rate_mean_reversion * (s.sofr_long_run - sofr)

        sbloc_rate = sofr + s.sbloc_spread_over_sofr

        # ---- 4b. Property conversion logic (primary -> rental) ----
        if s.convert_primary_to_rental_year is not None:
            for p in properties:
                if p.is_primary and year >= s.convert_primary_to_rental_year and p.rental_start_year is None:
                    p.is_primary = False
                    p.rental_start_year = year

        # ---- 4c. Walk each property forward one year ----
        rental_net = 0.0
        depreciation_deduction_total = 0.0
        for p in properties:
            # Appreciation
            p.current_value *= (1 + p.appreciation_rate)
            # Mortgage paydown (one year of payments)
            elapsed_months_before = max(0, (year + 1 - p.mortgage_origination_year) * 12)
            new_balance = remaining_balance(
                original_principal_by_name[p.name],
                p.mortgage_rate, p.mortgage_term_years,
                elapsed_months_before,
            )
            p.mortgage_balance = new_balance

            if not p.is_primary and p.rental_start_year is not None and year >= p.rental_start_year:
                # Rental year: collect rent, pay expenses, take depreciation
                annual_rent = p.monthly_market_rent * 12
                effective_rent = annual_rent * (1 - p.vacancy_and_mgmt_pct)
                # PITI converts roughly: subtract out the property tax/insurance portion
                # We'll just use monthly_piti as the cash housing cost.
                housing_cost = p.monthly_piti * 12
                maintenance = p.current_value * p.annual_maintenance_pct
                cash_flow_before_tax = effective_rent - housing_cost - maintenance
                rental_net += cash_flow_before_tax

                # Depreciation (27.5yr SL on building portion)
                depreciable_basis = p.purchase_price * (1 - p.land_value_pct)
                annual_dep = depreciable_basis / 27.5
                accumulated_depreciation_by_prop[p.name] += annual_dep
                depreciation_deduction_total += annual_dep

                # Grow rent for next year
                p.monthly_market_rent *= (1 + p.rent_growth_rate)

        # ---- 4c.5. Private equity evolution ----
        # Each PE position can: (a) go to zero, (b) exit (liquidity event), or (c) appreciate.
        # We use stochastic shocks ONLY when return_path is provided (Monte Carlo mode).
        # In deterministic mode we just apply the expected growth rate and skip exits/failures.
        pe_exit_proceeds_after_tax = 0.0
        pe_exited_this_year = False
        deterministic_mode = (return_path is None)
        for pe in pe_holdings:
            if pe.is_zero or pe.has_exited:
                continue
            if deterministic_mode:
                # Just compound at expected growth rate; the lottery-ticket nature is
                # better explored via Monte Carlo.
                pe.current_value *= (1 + pe.expected_growth_rate)
                continue
            # --- Stochastic mode ---
            # 1) Failure?
            if random.random() < pe.annual_failure_prob:
                pe.is_zero = True
                pe.current_value = 0.0
                continue
            # 2) Exit?
            if random.random() < pe.annual_exit_prob:
                # Lognormal-ish multiple
                mult = max(0.1, random.gauss(pe.exit_multiple_mean, pe.exit_multiple_vol))
                exit_value = pe.current_value * mult
                gain = max(0, exit_value - pe.cost_basis)
                if s.pe_exit_treatment == "cash":
                    tax = gain * (s.ltcg_rate + s.niit_rate)
                    pe_exit_proceeds_after_tax += exit_value - tax
                    # Proceeds drop into taxable portfolio with full basis (we just paid tax)
                    portfolio += exit_value - tax
                    portfolio_basis += exit_value - tax
                else:  # stock or hold
                    portfolio += exit_value
                    portfolio_basis += pe.cost_basis  # carryover
                pe.has_exited = True
                pe.current_value = 0.0
                pe_exited_this_year = True
                continue
            # 3) Otherwise compound with vol shock
            shock = random.gauss(pe.expected_growth_rate, pe.volatility)
            pe.current_value *= max(0.05, 1 + shock)  # floor to avoid negative

        # ---- 4d. W-2 and tax calculation ----
        if t >= s.w2_retire_year_offset:
            w2 = 0.0
        else:
            if t > 0:
                w2 *= (1 + s.w2_growth_rate)

        # Portfolio dividends (taxable each year, drag on returns)
        dividends = portfolio * s.portfolio_dividend_yield
        # Total return includes dividends; we don't double-count: r_portfolio is total return.
        # Dividends are realized for tax purposes, the rest is unrealized appreciation.

        # Taxable income (rough)
        taxable_w2 = max(0, w2 - s.annual_401k_contribution)
        # Rental income is offset by depreciation; if negative, passive loss limits may apply
        # but for high earners ($190k) most passive losses are suspended. We model neither
        # the suspension nor the eventual release; net rental for tax = rental_net - depreciation
        # but bound at zero (assumes losses suspended, which is conservative).
        taxable_rental = max(0, rental_net - depreciation_deduction_total)
        taxable_div = dividends  # qualified dividends taxed at LTCG rate, simplified
        ordinary_taxable = taxable_w2 + taxable_rental
        federal_tax = ordinary_taxable * s.federal_marginal_rate
        state_tax = ordinary_taxable * s.state_marginal_rate
        ltcg_tax = taxable_div * (s.ltcg_rate + s.niit_rate)
        taxes_paid = federal_tax + state_tax + ltcg_tax

        # ---- 4e. Borrowing engine (BBD drawdown) ----
        in_drawdown = t >= s.drawdown_start_year_offset
        drawdown_this_year = 0.0
        if in_drawdown:
            inflation_factor = (1 + s.expense_inflation) ** (t - s.drawdown_start_year_offset) \
                if s.inflate_drawdown else 1.0
            drawdown_this_year = s.target_annual_drawdown * inflation_factor

        # Decide where to borrow from. Priority: SBLOC up to LTV cap, then HELOC/refi.
        sbloc_cap = portfolio * s.sbloc_ltv_cap
        sbloc_room = max(0, sbloc_cap - sbloc_balance)
        from_sbloc = min(drawdown_this_year, sbloc_room)
        from_re = drawdown_this_year - from_sbloc

        # Real-estate borrowing capacity: total tappable equity
        re_value = sum(p.current_value for p in properties)
        re_mortgage = sum(p.mortgage_balance for p in properties)
        # Combined LTV cap is approximate (mix of primary/rental rules)
        re_borrow_cap = re_value * 0.75 - re_mortgage  # conservative
        re_room = max(0, re_borrow_cap - heloc_refi_balance)
        from_re = min(from_re, re_room)

        sbloc_balance += from_sbloc
        heloc_refi_balance += from_re
        actual_drawdown = from_sbloc + from_re

        # ---- 4f. Interest accrual ----
        sbloc_interest = sbloc_balance * sbloc_rate
        re_interest = heloc_refi_balance * s.cashout_refi_rate

        if s.capitalize_interest:
            # Pure BBD: interest capitalizes onto loan balance
            sbloc_balance += sbloc_interest
            heloc_refi_balance += re_interest
            interest_paid_cash = 0.0
        else:
            interest_paid_cash = sbloc_interest + re_interest

        # ---- 4g. Cash flow & savings ----
        net_w2_after_tax = w2 - taxes_paid - s.annual_401k_contribution
        rental_after_tax_cash = rental_net - taxable_rental * (s.federal_marginal_rate + s.state_marginal_rate)

        cash_in = net_w2_after_tax + rental_after_tax_cash + actual_drawdown + dividends
        cash_out = living_expenses + interest_paid_cash
        savings = cash_in - cash_out

        if s.annual_taxable_savings_override is not None:
            savings = s.annual_taxable_savings_override

        # In drawdown phase, savings can be negative -> pull from portfolio? No — pure BBD
        # means we keep portfolio invested and only borrow. So we don't reduce portfolio.
        # If savings < 0 in accumulation phase, that's a red flag.
        contributions_to_portfolio = max(0, savings) if not in_drawdown else 0

        # ---- 4h. Portfolio growth ----
        portfolio_growth = portfolio * r_portfolio
        portfolio += portfolio_growth + contributions_to_portfolio
        portfolio_basis += contributions_to_portfolio
        # Dividends were paid out (taxed); we re-invest the after-tax amount? Simplification:
        # we treat r_portfolio as total return INCLUDING dividends, so dividends are already in
        # the growth figure. The tax on them is already paid above.

        # ---- 4i. Margin call check ----
        ltv_now = sbloc_balance / portfolio if portfolio > 0 else 0
        if ltv_now >= s.sbloc_margin_call_ltv:
            margin_call_triggered = True
            # Forced sale: sell enough to bring LTV back to target
            target_balance = portfolio * s.sbloc_ltv_cap
            forced_sale = sbloc_balance - target_balance
            if forced_sale > 0:
                # Realize gains pro-rata
                gain_fraction = max(0, 1 - portfolio_basis / portfolio) if portfolio > 0 else 0
                realized_gain = forced_sale * gain_fraction
                forced_tax = realized_gain * (s.ltcg_rate + s.niit_rate)
                portfolio -= forced_sale
                portfolio_basis -= forced_sale * (1 - gain_fraction)
                sbloc_balance -= (forced_sale - forced_tax)
                taxes_paid += forced_tax

        # ---- 4j. Inflate expenses ----
        living_expenses *= (1 + s.expense_inflation)

        # ---- 4k. Snapshot ----
        unreal_gain = portfolio - portfolio_basis
        pe_value = sum(pe.current_value for pe in pe_holdings)
        pe_basis = sum(pe.cost_basis for pe in pe_holdings if not pe.has_exited and not pe.is_zero)
        total_assets = portfolio + pe_value + sum(p.current_value for p in properties)
        total_liabilities = sbloc_balance + heloc_refi_balance + sum(p.mortgage_balance for p in properties)
        history.append(YearState(
            year=year, age=age, w2_income=w2,
            rental_net_cash_flow=rental_net,
            portfolio_dividends=dividends,
            drawdown_borrowed=actual_drawdown,
            taxes_paid=taxes_paid,
            living_expenses=living_expenses / (1 + s.expense_inflation),  # show this year's
            portfolio_value=portfolio,
            portfolio_basis=portfolio_basis,
            portfolio_unrealized_gain=unreal_gain,
            properties_value=sum(p.current_value for p in properties),
            properties_mortgage_balance=sum(p.mortgage_balance for p in properties),
            pe_value=pe_value,
            pe_basis=pe_basis,
            pe_exited_this_year=pe_exited_this_year,
            sbloc_balance=sbloc_balance,
            heloc_refi_balance=heloc_refi_balance,
            total_assets=total_assets,
            total_liabilities=total_liabilities,
            net_worth=total_assets - total_liabilities,
            sbloc_capacity_remaining=max(0, portfolio * s.sbloc_ltv_cap - sbloc_balance),
            sbloc_ltv=ltv_now,
            margin_call=margin_call_triggered,
            sofr=sofr,
            sbloc_rate=sbloc_rate,
        ))

    return history


def _back_solve_original_principal(current_balance: float, rate: float,
                                    term_years: int, months_paid: int) -> float:
    """Back-solve the original loan principal given the current balance and elapsed months.

    Uses the standard mortgage balance formula:
       balance(t) = P * (1+r)^t - PMT * ((1+r)^t - 1) / r
    where PMT = P * (r(1+r)^N) / ((1+r)^N - 1).

    Solving algebraically gives:
       balance(t) = P * [ (1+r)^N - (1+r)^t ] / [ (1+r)^N - 1 ]
    so:
       P = balance(t) * [ (1+r)^N - 1 ] / [ (1+r)^N - (1+r)^t ]
    """
    if current_balance <= 0:
        return 0.0
    if months_paid <= 0:
        return current_balance  # original = current if no time has passed
    n = term_years * 12
    r = rate / 12
    if r == 0:
        return current_balance / (1 - months_paid / n)
    return current_balance * ((1 + r) ** n - 1) / ((1 + r) ** n - (1 + r) ** months_paid)


# ---------------------------------------------------------------------------
# 5. TERMINAL "DIE" ANALYSIS
# ---------------------------------------------------------------------------

@dataclass
class EstateOutcome:
    label: str
    gross_estate: float
    debt_to_repay: float
    cap_gains_tax: float
    depreciation_recapture_tax: float
    net_to_heirs: float


def estate_at_horizon(scenario: Scenario, final: YearState,
                       cumulative_depreciation: float) -> tuple[EstateOutcome, EstateOutcome]:
    """Compare two paths:
       Path A (SELL DURING LIFE): you would have sold assets along the way to fund
              drawdowns, paying capital gains.
       Path B (BBD): you held everything, borrowed; at death heirs get stepped-up basis.
    """
    s = scenario
    gross = final.total_assets
    debt = final.total_liabilities

    # --- Path B: Buy, Borrow, Die ---
    # Heirs inherit at stepped-up basis. They sell, pay off debt, no cap gains.
    # Depreciation recapture is ALSO wiped out at death under §1014 (this is a real benefit).
    bbd = EstateOutcome(
        label="Buy, Borrow, Die (hold to death)",
        gross_estate=gross,
        debt_to_repay=debt,
        cap_gains_tax=0.0,
        depreciation_recapture_tax=0.0,
        net_to_heirs=gross - debt,
    )

    # --- Path A: Sell-as-you-go counterfactual ---
    # Approximate by assuming you would have realized the unrealized gain to fund the same
    # consumption. Tax = unrealized_gain * (LTCG + NIIT). For real estate, gain over basis +
    # depreciation recapture.
    portfolio_gain = max(0, final.portfolio_value - final.portfolio_basis)
    portfolio_tax = portfolio_gain * (s.ltcg_rate + s.niit_rate)

    # Real estate gain = current value - original purchase price (rough)
    re_purchase_total = sum(p.purchase_price for p in s.properties)
    re_gain = max(0, final.properties_value - re_purchase_total)
    re_cg_tax = re_gain * (s.ltcg_rate + s.niit_rate)
    recapture_tax = cumulative_depreciation * s.depreciation_recapture_rate

    # Private equity gain — typically near-zero basis, so this is the highest-leverage
    # BBD play. Under sell-as-you-go, you'd pay LTCG+NIIT on the entire mark-to-market.
    # Note: §1202 QSBS could exclude up to $10M of gain on qualifying small business stock,
    # but we don't model that here — adjust ltcg_rate or set pe gain manually if applicable.
    pe_gain = max(0, final.pe_value - final.pe_basis)
    pe_cg_tax = pe_gain * (s.ltcg_rate + s.niit_rate)

    sell_path = EstateOutcome(
        label="Sell-as-you-go (no BBD)",
        gross_estate=gross,
        debt_to_repay=debt,
        cap_gains_tax=portfolio_tax + re_cg_tax + pe_cg_tax,
        depreciation_recapture_tax=recapture_tax,
        net_to_heirs=gross - debt - portfolio_tax - re_cg_tax - pe_cg_tax - recapture_tax,
    )
    return sell_path, bbd


# ---------------------------------------------------------------------------
# 6. MONTE CARLO
# ---------------------------------------------------------------------------

def monte_carlo(scenario: Scenario, n_trials: int = 1000, seed: int = 42) -> dict:
    rng = random.Random(seed)
    s = scenario

    final_net_worths = []
    final_drawdown_capacities = []
    margin_call_count = 0
    bankrupt_count = 0  # ran out of borrowing capacity during drawdown

    for _ in range(n_trials):
        # Generate return path: lognormal-ish, simple normal approximation for speed
        returns = [rng.gauss(s.portfolio_nominal_return, s.portfolio_volatility)
                   for _ in range(s.horizon_years)]
        # SOFR path: AR(1)-style around long-run mean, with shocks
        sofr_path = []
        sofr = s.sofr_rate
        for _ in range(s.horizon_years):
            shock = rng.gauss(0, 0.01)
            sofr = sofr + s.rate_mean_reversion * (s.sofr_long_run - sofr) + shock
            sofr = max(0.001, sofr)
            sofr_path.append(sofr)

        history = project(s, return_path=returns, sofr_path=sofr_path)
        final = history[-1]
        final_net_worths.append(final.net_worth)
        final_drawdown_capacities.append(final.sbloc_capacity_remaining)
        if final.margin_call:
            margin_call_count += 1
        # Bankrupt = net worth went negative at any point
        if any(h.net_worth < 0 for h in history):
            bankrupt_count += 1

    final_net_worths.sort()
    return {
        "n_trials": n_trials,
        "final_nw_p10": final_net_worths[int(0.10 * n_trials)],
        "final_nw_p50": statistics.median(final_net_worths),
        "final_nw_p90": final_net_worths[int(0.90 * n_trials)],
        "final_nw_mean": statistics.mean(final_net_worths),
        "margin_call_rate": margin_call_count / n_trials,
        "bankrupt_rate": bankrupt_count / n_trials,
    }


# ---------------------------------------------------------------------------
# 7. REPORTING
# ---------------------------------------------------------------------------

def fmt_money(x: float) -> str:
    if abs(x) >= 1e6:
        return f"${x/1e6:,.2f}M"
    if abs(x) >= 1e3:
        return f"${x/1e3:,.0f}k"
    return f"${x:,.0f}"


def print_summary(scenario: Scenario, history: list[YearState]) -> None:
    print("=" * 78)
    print("BUY, BORROW, DIE PROJECTION")
    print("=" * 78)
    print(f"Horizon: {scenario.horizon_years} years "
          f"(year {scenario.start_year} -> {scenario.start_year + scenario.horizon_years - 1}, "
          f"age {scenario.current_age} -> {scenario.current_age + scenario.horizon_years - 1})")
    print(f"Drawdown begins: year {scenario.start_year + scenario.drawdown_start_year_offset} "
          f"(age {scenario.current_age + scenario.drawdown_start_year_offset})")
    print(f"Target annual drawdown: {fmt_money(scenario.target_annual_drawdown)} "
          f"({'inflation-adjusted' if scenario.inflate_drawdown else 'nominal'})")
    if scenario.private_equity:
        print()
        print("  ⚠  Deterministic mode shows PE compounding at expected growth rate with NO")
        print("     failure probability. Run with --montecarlo to see realistic distribution.")
    print()

    print(f"{'Year':>5} {'Age':>3} {'NW':>10} {'Portfolio':>10} {'PE':>8} "
          f"{'RE Value':>10} {'Mtg':>10} {'SBLOC':>10} {'RE Debt':>10} "
          f"{'Drawdown':>10} {'LTV':>5}")
    print("-" * 116)

    # Show every 5th year + last
    for i, h in enumerate(history):
        if i % 5 == 0 or i == len(history) - 1:
            flag = " *MC*" if h.margin_call else ""
            exit_flag = " *EXIT*" if h.pe_exited_this_year else ""
            print(f"{h.year:>5} {h.age:>3} {fmt_money(h.net_worth):>10} "
                  f"{fmt_money(h.portfolio_value):>10} {fmt_money(h.pe_value):>8} "
                  f"{fmt_money(h.properties_value):>10} {fmt_money(h.properties_mortgage_balance):>10} "
                  f"{fmt_money(h.sbloc_balance):>10} {fmt_money(h.heloc_refi_balance):>10} "
                  f"{fmt_money(h.drawdown_borrowed):>10} {h.sbloc_ltv:>5.1%}{flag}{exit_flag}")
    print()


def cumulative_depreciation_for_estate_approx(scenario: Scenario) -> float:
    """Approximate cumulative depreciation for terminal estate comparisons."""
    cumulative_dep = 0.0
    for p in scenario.properties:
        if not p.is_primary and p.rental_start_year is not None:
            years_rented = scenario.start_year + scenario.horizon_years - p.rental_start_year
        elif scenario.convert_primary_to_rental_year:
            years_rented = scenario.start_year + scenario.horizon_years - scenario.convert_primary_to_rental_year
        else:
            years_rented = 0
        cumulative_dep += min(years_rented, 27.5) * p.purchase_price * (1 - p.land_value_pct) / 27.5
    return cumulative_dep


def print_estate(scenario: Scenario, history: list[YearState]) -> None:
    final = history[-1]
    cumulative_dep = cumulative_depreciation_for_estate_approx(scenario)

    sell_path, bbd = estate_at_horizon(scenario, final, cumulative_dep)
    print("=" * 78)
    print("TERMINAL ESTATE ANALYSIS — what happens at horizon end")
    print("=" * 78)
    for outcome in (sell_path, bbd):
        print(f"\n  {outcome.label}")
        print(f"    Gross estate value:            {fmt_money(outcome.gross_estate):>12}")
        print(f"    Debt to repay:                 {fmt_money(outcome.debt_to_repay):>12}")
        print(f"    Capital gains tax:             {fmt_money(outcome.cap_gains_tax):>12}")
        print(f"    Depreciation recapture tax:    {fmt_money(outcome.depreciation_recapture_tax):>12}")
        print(f"    NET TO HEIRS:                  {fmt_money(outcome.net_to_heirs):>12}")

    delta = bbd.net_to_heirs - sell_path.net_to_heirs
    print(f"\n  >>> BBD advantage: {fmt_money(delta)} "
          f"({delta / sell_path.net_to_heirs * 100 if sell_path.net_to_heirs else 0:.1f}% more to heirs)")
    print()


def write_csv(history: list[YearState], path: str) -> None:
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["year", "age", "net_worth", "portfolio", "basis",
                    "pe_value", "pe_basis", "pe_exit",
                    "re_value", "re_mortgage", "sbloc", "re_debt", "drawdown",
                    "rental_cf", "ltv", "margin_call", "sbloc_rate"])
        for h in history:
            w.writerow([h.year, h.age, round(h.net_worth, 0),
                        round(h.portfolio_value, 0), round(h.portfolio_basis, 0),
                        round(h.pe_value, 0), round(h.pe_basis, 0),
                        h.pe_exited_this_year,
                        round(h.properties_value, 0), round(h.properties_mortgage_balance, 0),
                        round(h.sbloc_balance, 0), round(h.heloc_refi_balance, 0),
                        round(h.drawdown_borrowed, 0),
                        round(h.rental_net_cash_flow, 0),
                        round(h.sbloc_ltv, 4), h.margin_call,
                        round(h.sbloc_rate, 4)])
    print(f"Wrote yearly schedule to {path}")


