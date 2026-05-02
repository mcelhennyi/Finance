"""Unit tests for BBD projection engine."""

from __future__ import annotations

import pytest

from finance.bbd.engine import Scenario, cumulative_depreciation_for_estate_approx, project


@pytest.mark.unit
def test_project_horizon_length_matches_config() -> None:
    scenario = Scenario(
        start_year=2020,
        horizon_years=7,
        current_age=40,
        w2_retire_year_offset=30,
        drawdown_start_year_offset=30,
        annual_living_expenses=50_000.0,
        properties=[],
        private_equity=[],
        starting_taxable_portfolio=200_000.0,
        starting_portfolio_basis=150_000.0,
    )
    hist = project(scenario)
    assert len(hist) == scenario.horizon_years
    assert hist[0].year == 2020
    assert hist[-1].year == 2020 + scenario.horizon_years - 1


@pytest.mark.unit
def test_projection_accumulates_nominal_when_no_drawdown() -> None:
    """No drawdown phase before retirement offset; taxable portfolio contributes each year."""
    scenario = Scenario(
        start_year=2020,
        horizon_years=5,
        w2_retire_year_offset=10,
        drawdown_start_year_offset=100,
        annual_living_expenses=60_000.0,
        w2_gross_income=100_000.0,
        properties=[],
        private_equity=[],
        portfolio_nominal_return=0.0,
        portfolio_dividend_yield=0.0,
        federal_marginal_rate=0.0,
        state_marginal_rate=0.0,
        niit_rate=0.0,
        ltcg_rate=0.0,
        annual_401k_contribution=0.0,
    )
    hist = project(scenario)
    assert hist[-1].portfolio_value > hist[0].portfolio_value


@pytest.mark.unit
def test_cumulative_depreciation_zero_without_rentals() -> None:
    scenario = Scenario(horizon_years=10, properties=[], private_equity=[])
    assert cumulative_depreciation_for_estate_approx(scenario) == 0.0
