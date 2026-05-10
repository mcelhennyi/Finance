/**
 * Help copy for BBD projection outputs — use with `OutputHoverTip` (no duplicate native `title`).
 */

export const BBD_OUTPUT_TIPS = {
  scheduleIntro:
    'Sampled rows: every fifth simulated year plus final horizon year. Figures are nominal USD from the scenario unless you adjusted inflation assumptions.',
  monteIntro:
    'Uses random draws across trials (portfolio, rates where stochastic, PE events). Bands show dispersion of outcomes, not a forecast distribution.',
  table: {
    year: 'Calendar year summarized by this modeled annual timestep.',
    age: 'Modeled age in completed years at the end of that year.',
    nw: 'Net worth: modeled total assets minus total liabilities.',
    portfolio: 'Taxable portfolio market value; SBLOC is modeled against this collateral.',
    pe: 'Private / illiquid equity mark for the year before modeled exits/write-downs crystallize.',
    re: 'Sum of modeled property appraisals tied to mortgages and rents.',
    sbloc: 'Outstanding securities-backed line of credit balance.',
    draw: 'Annual draw modeled as borrowing-based cash extraction in the borrow phase (nominal USD for that row).',
    incomeYoYDelta:
      'Change vs prior year in modeled nominal cash receipts: W-2 + net rental ops + portfolio dividends modeled as paid + borrowing draws. First modeled year blank.',
    taxesYoYDelta:
      'Change vs prior year in modeled tax outflow (marginal ordinary + modeled dividend/stack taxes, including forced-sale tax if modeled). First year blank.',
    ltv: 'SBLOC borrowing divided by portfolio collateral in the simulation (borrow stress indicator).',
  },
  monte: {
    p10: '10th percentile of final-year net worth: 10 percent of trials finished below this.',
    p50: 'Median final-year net worth across trials.',
    p90: '90th percentile of final NW: most trials landed below this upside tail benchmark.',
    mean: 'Arithmetic mean of final NW (can differ from median if outcomes are skewed).',
    margin: 'Fraction of trials with at least one modeled SBLOC margin-style event.',
    bankrupt: 'Fraction of trials tripping the modeled insolvency / bankrupt heuristic.',
    trialsLabel: 'Number of independent stochastic paths summarized here.',
  },
  estate: {
    card: 'Heuristic liquidation / step-up story at horizon; not individualized estate planning.',
    net: 'After modeled debt payoff and liquidation taxes on that path.',
    debt: 'SBLOC/refi modeled as owing at horizon in that heuristic.',
    cgt:
      'Aggregated modeled capital gains tax on appreciating assets crystallized under that heuristic (see raw API for depreciation recapture split-out).',
    recapture:
      'Depreciation-recapture bite modeled separately from headline long-term gains in terminal tax stack.',
  },
  advantage:
    'Modeled heirs net under BBD-style terminal story minus stylized sell-and-pay-tax story. Interpret as scenario math only.',
  story: {
    nwTrajectory:
      'Net worth is assets minus liabilities each year. The slope shows whether the modeled lifestyle and borrowing path compound wealth or erode it.',
    composition:
      'Portfolio (taxable), private equity marks, and real estate often move on different clocks — one line flattening while another spikes is a clue about where risk sits.',
    leverageDraws:
      'Borrow-based draws and SBLOC balances are the “borrow” leg. Rising LTV or margin flags mean the collateral story is getting tight in this toy model.',
    estateCompare:
      'Two stylized estate snapshots at horizon — not a recommendation. Compare magnitudes to see how the heuristic BBD path differs from a sell-and-pay-taxes path.',
    spatial:
      'Axes: horizontal ≈ time (year), vertical ≈ net worth, depth ≈ SBLOC loan-to-value. Drag to rotate; use the slider to walk through years (time as the fourth dimension you control).',
  },
} as const
