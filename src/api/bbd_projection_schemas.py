"""JSON contracts for `/api/bbd-projection/run`."""

from __future__ import annotations

from dataclasses import asdict
from typing import Any, Literal

from pydantic import BaseModel, Field

from finance.bbd.engine import (
    EstateOutcome,
    PrivateEquity,
    Property,
    Scenario,
    YearState,
    cumulative_depreciation_for_estate_approx,
    estate_at_horizon,
    monte_carlo,
    project,
)

MAX_HORIZON_YEARS = 80
MAX_MONTE_CARLO_TRIALS = 2500


class BbdPropertyIn(BaseModel):
    """Mirrors [`Property`][finance.bbd.engine.Property]."""

    name: str = Field(default="Primary Home", min_length=1, max_length=200)
    purchase_price: float = Field(ge=0)
    purchase_year: int
    current_value: float = Field(ge=0)
    mortgage_balance: float = Field(ge=0)
    mortgage_rate: float = Field(ge=0, le=0.5)
    mortgage_term_years: int = Field(ge=1, le=60)
    mortgage_origination_year: int
    monthly_piti: float = Field(ge=0)
    monthly_market_rent: float = Field(ge=0)
    is_primary: bool = True
    rental_start_year: int | None = None
    appreciation_rate: float = Field(default=0.035, ge=-0.2, le=0.25)
    rent_growth_rate: float = Field(default=0.03, ge=-0.05, le=0.25)
    vacancy_and_mgmt_pct: float = Field(default=0.10, ge=0, le=1)
    annual_maintenance_pct: float = Field(default=0.01, ge=0, le=0.2)
    land_value_pct: float = Field(default=0.20, ge=0, le=1)


class BbdPrivateEquityIn(BaseModel):
    """Mirrors [`PrivateEquity`][finance.bbd.engine.PrivateEquity]."""

    name: str = Field(default="Private equity", min_length=1, max_length=200)
    current_value: float = Field(ge=0)
    cost_basis: float = Field(default=0.0, ge=0)
    expected_growth_rate: float = Field(default=0.15, ge=-0.5, le=2)
    volatility: float = Field(default=0.50, ge=0, le=2)
    annual_failure_prob: float = Field(default=0.05, ge=0, le=1)
    annual_exit_prob: float = Field(default=0.08, ge=0, le=1)
    exit_multiple_mean: float = Field(default=2.0, ge=0.01)
    exit_multiple_vol: float = Field(default=1.0, ge=0.01)


class BbdTimingIn(BaseModel):
    start_year: int = Field(default=2026, ge=2000, le=2120)
    horizon_years: int = Field(default=50, ge=1, le=MAX_HORIZON_YEARS)
    current_age: int = Field(default=35, ge=0, le=110)


class BbdIncomeIn(BaseModel):
    w2_gross_income: float = Field(default=190_000.0, ge=0)
    w2_growth_rate: float = Field(default=0.03, ge=-0.1, le=0.25)
    w2_retire_year_offset: int = Field(default=30, ge=0, le=MAX_HORIZON_YEARS)


class BbdTaxesIn(BaseModel):
    federal_marginal_rate: float = Field(default=0.24, ge=0, le=0.5)
    state_marginal_rate: float = Field(default=0.05, ge=0, le=0.5)
    ltcg_rate: float = Field(default=0.15, ge=0, le=0.5)
    niit_rate: float = Field(default=0.038, ge=0, le=0.05)
    depreciation_recapture_rate: float = Field(default=0.25, ge=0, le=0.35)


class BbdExpensesIn(BaseModel):
    annual_living_expenses: float = Field(default=90_000.0, ge=0)
    expense_inflation: float = Field(default=0.03, ge=0, le=0.2)


class BbdSavingsIn(BaseModel):
    annual_401k_contribution: float = Field(default=23_000.0, ge=0)
    employer_match: float = Field(default=9_500.0, ge=0)
    starting_taxable_portfolio: float = Field(default=0.0, ge=0)
    starting_portfolio_basis: float = Field(default=0.0, ge=0)
    portfolio_nominal_return: float = Field(default=0.085, ge=-0.25, le=0.75)
    portfolio_volatility: float = Field(default=0.16, ge=0, le=2)
    portfolio_dividend_yield: float = Field(default=0.015, ge=0, le=1)
    annual_taxable_savings_override: float | None = None


class BbdBorrowingIn(BaseModel):
    sbloc_ltv_cap: float = Field(default=0.50, ge=0, le=1)
    sbloc_margin_call_ltv: float = Field(default=0.70, ge=0, le=2)
    sbloc_spread_over_sofr: float = Field(default=0.025, ge=0, le=0.2)
    sofr_rate: float = Field(default=0.0365, ge=0, le=0.2)
    sofr_long_run: float = Field(default=0.030, ge=0, le=0.2)
    rate_mean_reversion: float = Field(default=0.20, ge=0, le=10)
    heloc_rate_spread_over_prime: float = Field(default=0.005, ge=-0.02, le=0.05)
    cashout_refi_rate: float = Field(default=0.072, ge=0, le=0.25)
    heloc_max_cltv: float = Field(default=0.85, ge=0, le=1.5)
    cashout_refi_max_cltv: float = Field(default=0.75, ge=0, le=1.5)


class BbdStrategyIn(BaseModel):
    drawdown_start_year_offset: int = Field(default=30, ge=0, le=MAX_HORIZON_YEARS)
    target_annual_drawdown: float = Field(default=120_000.0, ge=0)
    capitalize_interest: bool = True
    inflate_drawdown: bool = True
    convert_primary_to_rental_year: int | None = None
    pe_exit_treatment: Literal["cash", "stock", "hold"] = "cash"


class BbdScenarioIn(BaseModel):
    timing: BbdTimingIn = Field(default_factory=BbdTimingIn)
    income: BbdIncomeIn = Field(default_factory=BbdIncomeIn)
    taxes: BbdTaxesIn = Field(default_factory=BbdTaxesIn)
    expenses: BbdExpensesIn = Field(default_factory=BbdExpensesIn)
    savings: BbdSavingsIn = Field(default_factory=BbdSavingsIn)
    borrowing: BbdBorrowingIn = Field(default_factory=BbdBorrowingIn)
    strategy: BbdStrategyIn = Field(default_factory=BbdStrategyIn)
    properties: list[BbdPropertyIn] = Field(default_factory=list)
    private_equity: list[BbdPrivateEquityIn] = Field(default_factory=list)


class BbdDefaultScenarioResponse(BaseModel):
    """GET `/api/bbd-projection/default-scenario` wrapper for hydration in the SPA."""

    scenario: BbdScenarioIn


def _private_equity_api_dict(pe: PrivateEquity) -> dict[str, Any]:
    d = asdict(pe)
    d.pop("has_exited", None)
    d.pop("is_zero", None)
    return d


def scenario_engine_to_nested_mapping(engine: Scenario) -> dict[str, Any]:
    """Build nested dict that validates as [`BbdScenarioIn`][api.bbd_projection_schemas.BbdScenarioIn].

    Used by GET `/api/bbd-projection/default-scenario` so the SPA can hydrate the same
    shape POST accepts.

    Args:
        engine: Resolved engine scenario (YAML/TOML or in-memory).

    Returns:
        JSON-serializable mapping for pydantic validation.
    """
    return {
        "timing": {
            "start_year": engine.start_year,
            "horizon_years": engine.horizon_years,
            "current_age": engine.current_age,
        },
        "income": {
            "w2_gross_income": engine.w2_gross_income,
            "w2_growth_rate": engine.w2_growth_rate,
            "w2_retire_year_offset": engine.w2_retire_year_offset,
        },
        "taxes": {
            "federal_marginal_rate": engine.federal_marginal_rate,
            "state_marginal_rate": engine.state_marginal_rate,
            "ltcg_rate": engine.ltcg_rate,
            "niit_rate": engine.niit_rate,
            "depreciation_recapture_rate": engine.depreciation_recapture_rate,
        },
        "expenses": {
            "annual_living_expenses": engine.annual_living_expenses,
            "expense_inflation": engine.expense_inflation,
        },
        "savings": {
            "annual_401k_contribution": engine.annual_401k_contribution,
            "employer_match": engine.employer_match,
            "starting_taxable_portfolio": engine.starting_taxable_portfolio,
            "starting_portfolio_basis": engine.starting_portfolio_basis,
            "portfolio_nominal_return": engine.portfolio_nominal_return,
            "portfolio_volatility": engine.portfolio_volatility,
            "portfolio_dividend_yield": engine.portfolio_dividend_yield,
            "annual_taxable_savings_override": engine.annual_taxable_savings_override,
        },
        "borrowing": {
            "sbloc_ltv_cap": engine.sbloc_ltv_cap,
            "sbloc_margin_call_ltv": engine.sbloc_margin_call_ltv,
            "sbloc_spread_over_sofr": engine.sbloc_spread_over_sofr,
            "sofr_rate": engine.sofr_rate,
            "sofr_long_run": engine.sofr_long_run,
            "rate_mean_reversion": engine.rate_mean_reversion,
            "heloc_rate_spread_over_prime": engine.heloc_rate_spread_over_prime,
            "cashout_refi_rate": engine.cashout_refi_rate,
            "heloc_max_cltv": engine.heloc_max_cltv,
            "cashout_refi_max_cltv": engine.cashout_refi_max_cltv,
        },
        "strategy": {
            "drawdown_start_year_offset": engine.drawdown_start_year_offset,
            "target_annual_drawdown": engine.target_annual_drawdown,
            "capitalize_interest": engine.capitalize_interest,
            "inflate_drawdown": engine.inflate_drawdown,
            "convert_primary_to_rental_year": engine.convert_primary_to_rental_year,
            "pe_exit_treatment": engine.pe_exit_treatment,
        },
        "properties": [asdict(p) for p in engine.properties],
        "private_equity": [_private_equity_api_dict(pe) for pe in engine.private_equity],
    }


def scenario_engine_to_bbdscenario_in(engine: Scenario) -> BbdScenarioIn:
    """Validate engine output through the HTTP contract model."""
    return BbdScenarioIn.model_validate(scenario_engine_to_nested_mapping(engine))


class BbdRunRequest(BaseModel):
    scenario: BbdScenarioIn
    monte_carlo_trials: int = Field(default=0, ge=0, le=MAX_MONTE_CARLO_TRIALS)
    monte_carlo_seed: int = Field(default=42)


class YearStateRow(BaseModel):
    year: int
    age: int
    w2_income: float
    rental_net_cash_flow: float
    portfolio_dividends: float
    drawdown_borrowed: float
    taxes_paid: float
    living_expenses: float
    gross_cash_income: float = Field(
        ...,
        description="Modeled nominal cash receipts: W-2 + rental net cash flow + dividends + draws.",
    )
    taxes_delta_yoy: float | None = Field(
        None,
        description="Change in taxes_paid vs prior modeled year (null first year).",
    )
    gross_income_delta_yoy: float | None = Field(
        None,
        description="Change in gross_cash_income vs prior year (null first year).",
    )
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
    sbloc_capacity_remaining: float
    sbloc_ltv: float
    margin_call: bool
    sofr: float
    sbloc_rate: float


class EstateOutcomeRow(BaseModel):
    label: str
    gross_estate: float
    debt_to_repay: float
    cap_gains_tax: float
    depreciation_recapture_tax: float
    net_to_heirs: float


class MonteCarloSummary(BaseModel):
    n_trials: int
    final_nw_p10: float
    final_nw_p50: float
    final_nw_p90: float
    final_nw_mean: float
    margin_call_rate: float
    bankrupt_rate: float


class BbdRunResponse(BaseModel):
    schedule: list[YearStateRow]
    estate_sell_path: EstateOutcomeRow
    estate_bbd_path: EstateOutcomeRow
    bbd_net_advantage_vs_sell_path: float
    monte_carlo: MonteCarloSummary | None = None


def _schedule_rows(history: list[YearState]) -> list[YearStateRow]:
    """Flatten engine history plus year-over-year tax and receipts deltas."""
    rows: list[YearStateRow] = []
    for i, h in enumerate(history):
        gross_cash_income = (
            h.w2_income + h.rental_net_cash_flow + h.portfolio_dividends + h.drawdown_borrowed
        )
        prev = history[i - 1] if i > 0 else None
        prev_gross: float | None = None
        if prev is not None:
            prev_gross = (
                prev.w2_income
                + prev.rental_net_cash_flow
                + prev.portfolio_dividends
                + prev.drawdown_borrowed
            )
        taxes_delta_yoy = None if prev is None else h.taxes_paid - prev.taxes_paid
        gross_income_delta_yoy = None if prev_gross is None else gross_cash_income - prev_gross

        rows.append(
            YearStateRow(
                year=h.year,
                age=h.age,
                w2_income=h.w2_income,
                rental_net_cash_flow=h.rental_net_cash_flow,
                portfolio_dividends=h.portfolio_dividends,
                drawdown_borrowed=h.drawdown_borrowed,
                taxes_paid=h.taxes_paid,
                living_expenses=h.living_expenses,
                gross_cash_income=gross_cash_income,
                taxes_delta_yoy=taxes_delta_yoy,
                gross_income_delta_yoy=gross_income_delta_yoy,
                portfolio_value=h.portfolio_value,
                portfolio_basis=h.portfolio_basis,
                portfolio_unrealized_gain=h.portfolio_unrealized_gain,
                properties_value=h.properties_value,
                properties_mortgage_balance=h.properties_mortgage_balance,
                pe_value=h.pe_value,
                pe_basis=h.pe_basis,
                pe_exited_this_year=h.pe_exited_this_year,
                sbloc_balance=h.sbloc_balance,
                heloc_refi_balance=h.heloc_refi_balance,
                total_assets=h.total_assets,
                total_liabilities=h.total_liabilities,
                net_worth=h.net_worth,
                sbloc_capacity_remaining=h.sbloc_capacity_remaining,
                sbloc_ltv=h.sbloc_ltv,
                margin_call=h.margin_call,
                sofr=h.sofr,
                sbloc_rate=h.sbloc_rate,
            )
        )
    return rows


def _estate_row(o: EstateOutcome) -> EstateOutcomeRow:
    return EstateOutcomeRow(
        label=o.label,
        gross_estate=o.gross_estate,
        debt_to_repay=o.debt_to_repay,
        cap_gains_tax=o.cap_gains_tax,
        depreciation_recapture_tax=o.depreciation_recapture_tax,
        net_to_heirs=o.net_to_heirs,
    )


def scenario_from_payload(body: BbdScenarioIn) -> Scenario:
    t = body.timing.model_dump()
    i = body.income.model_dump()
    tax = body.taxes.model_dump()
    exp = body.expenses.model_dump()
    sav = body.savings.model_dump()
    bor = body.borrowing.model_dump()
    strat = body.strategy.model_dump()

    props = [Property(**p.model_dump()) for p in body.properties]
    pe = [PrivateEquity(**x.model_dump()) for x in body.private_equity]

    merged: dict[str, object] = {}
    merged.update(t)
    merged.update(i)
    merged.update(tax)
    merged.update(exp)
    merged.update(sav)
    merged.update(bor)
    merged.update(strat)
    merged["properties"] = props
    merged["private_equity"] = pe
    return Scenario(**merged)


def run_bbd_from_request(payload: BbdRunRequest) -> BbdRunResponse:
    scenario = scenario_from_payload(payload.scenario)

    history = project(scenario)
    final = history[-1]
    cum_dep = cumulative_depreciation_for_estate_approx(scenario)
    sell_path, bbd_path = estate_at_horizon(scenario, final, cum_dep)

    delta = bbd_path.net_to_heirs - sell_path.net_to_heirs

    mc_summary: MonteCarloSummary | None = None
    if payload.monte_carlo_trials > 0:
        raw_mc = monte_carlo(
            scenario, n_trials=payload.monte_carlo_trials, seed=payload.monte_carlo_seed
        )
        mc_summary = MonteCarloSummary(
            n_trials=int(raw_mc["n_trials"]),
            final_nw_p10=float(raw_mc["final_nw_p10"]),
            final_nw_p50=float(raw_mc["final_nw_p50"]),
            final_nw_p90=float(raw_mc["final_nw_p90"]),
            final_nw_mean=float(raw_mc["final_nw_mean"]),
            margin_call_rate=float(raw_mc["margin_call_rate"]),
            bankrupt_rate=float(raw_mc["bankrupt_rate"]),
        )

    return BbdRunResponse(
        schedule=_schedule_rows(history),
        estate_sell_path=_estate_row(sell_path),
        estate_bbd_path=_estate_row(bbd_path),
        bbd_net_advantage_vs_sell_path=delta,
        monte_carlo=mc_summary,
    )
