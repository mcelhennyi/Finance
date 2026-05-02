/**
 * Hover documentation for `/api/bbd-projection/run` scenario form fields.
 * Kept centralized so wording stays aligned with coarse engine assumptions (not individualized tax/legal advice).
 */

export const BBD_FIELD_TIPS = {
  timing: {
    startYear:
      'First calendar year simulated. Each step advances one Gregorian year until the horizon count is exhausted—used everywhere the engine references “calendar year”.',
    horizonYears:
      'How many discrete one-year timesteps run after the start year. Larger horizons push terminal estate/heir math farther out.',
    startingAge:
      'Your modeled age during the start year; shown on schedule rows for readability only—it does not change tax/bracket mechanics by itself.',
  },
  income: {
    w2GrossAnnual:
      'Annual pre-tax modeled W‑2 wages (nominal USD) before deductions. Seeds ordinary-income tax stacks and participates in modeled cash surplus before draws.',
    w2GrowthRate:
      'Compounded uplift applied once per modeled year while W‑2 continues. Stops applying after the retirement offset kicks in.',
    w2YearsUntilEnds:
      'Number of simulated years counting from horizon start until modeled wage income goes to zero. Not a calendar retirement date—you still set timing via start year.',
  },
  expenses: {
    annualLivingExpenses:
      'Rough annual cash need for modeled lifestyle (excluding property P+I/taxes bundled separately in Monthly PITI). Competes against after-tax surplus and draws.',
    expenseInflation:
      'Growth rate applied yearly to modeled living-expense withdrawals so nominal spending keeps pace after inflation.',
  },
  savings401kDeferrals:
    'Elective deferrals pulled from modeled W‑2 wages before taxing ordinary slice; reduces modeled taxable wages (not individualized plan limits beyond that).',
  savingsEmployerMatch:
    'Employer deposits credited nominally each year alongside wages; boosts surplus before portfolio contributions when savings are modeled normally.',
  savingsStartingTaxablePortfolio:
    'Liquid investable taxable balance at horizon start—the SBLOC-collateral sleeve that grows/dividends.',
  savingsStartingBasis:
    'Portfolio cost basis paired with taxable principal; drives unrealized gains and liquidation tax heuristics when shares are forcibly trimmed.',
  savingsPortfolioNominalReturn:
      'Annual total return heuristic on modeled taxable portfolio outside Monte Carlo stochastic paths.',
  savingsPortfolioVolatility:
      'Return dispersion used when stochastic paths/shocks are sampled (Monte Carlo and internal noise). Higher σ widens outcome bands.',
  savingsDividendYield:
      'Portion of portfolio value taxed as dividend income yearly (qualification vs ordinary is loosely merged into LTCG+NIIT style stack). Also reduces reinvestible growth per engine notes.',
  savingsOverrideToggle:
      'When enabled, skips the modeled cash-flow derivation and forces taxable brokerage contributions to exactly the dollar amount you enter.',
  savingsOverrideAmount:
    'Annual nominal USD skimmed straight into modeled taxable holdings while override is checked; replaces income/expense netting logic.',
  taxesFederalMarginal:
      'Blended heuristic rate applied to modeled ordinary taxable income (wages minus deferrals slice, rental taxed slice, etc.). Not IRS bracket-by-bracket fidelity.',
  taxesStateMarginal:
      'Additional ordinary-income layer for modeled state levy on the same ordinary slice as federal.',
  taxesLtcg:
      'Applied when taxing modeled long-term crystallized gains—including dividend stack and modeled forced-sales gains—not detailed holding-period rules.',
  taxesNiit:
      'Investment-income surcharge modeled atop qualifying flows (stacked loosely with dividends/LTCG in this simplification).',
  taxesDepreciationRecapture:
      'Marginal haircut when modeled residential depreciation reverses—used in rental and terminal estate liquidation steps.',
  borrowSblocMaxLtv:
      'Loan balance allowed as fraction of flagged taxable portfolio earmarked SBLOC collateral. Caps annual draw sizing before modeled RE leverage.',
  borrowSblocMarginLtv:
      'Engine triggers heuristic margin/for-sale response when modeled SBLOC balance divided by pledged portfolio rises to this leverage.',
  borrowSblocSpreadOverSofr:
      'Floating SBLOC APR margin added to modeled annual SOFR before interest accrual/capitalization.',
  borrowSofrStarting:
      'Initial benchmark nominal rate yearly for floating legs on the deterministic path.',
  borrowSofrLongRunMean:
      'Anchor SOFR drifts toward this level each year proportional to mean-reversion speed.',
  borrowRateMeanReversion:
      'Scalar speed pushing SOFR from current toward long-run each simulated year—not an interest percentage itself.',
  borrowHelocSpreadOverPrime:
      'Additive margin modeled on CRE cash-out borrowing once SBLOC sleeves are tapped—pairs with modeled prime heuristic.',
  borrowCashOutRefiRate:
      'Fixed-ish annual note modeled on leveraged real-estate withdrawals after SBLOC exhaustion.',
  borrowHelocMaxCltv:
      'Upper bound modeled on combined lien-to-value stacking for SBLOC-follow-on RE leverage.',
  borrowCashOutMaxCltv:
      'Similar limit but scoped to refinance cash-outs on investment properties.',
  strategyDrawdownLagYears:
      'Full accumulating years modeled before borrowing-based annual draws begin counted from horizon start.',
  strategyTargetAnnualDrawdown:
      'Nominal goal for tax-light cash receipts via SBLOC/RE borrowing each modeled draw year (subject to collateral caps).',
  strategyPeExitTreatment:
      'API enum steer for private-equity disposal: modeled cash liquidation with tax, rollover into taxed stock sleeve, or hold until stochastic exit resolves.',
  strategyCapitalizeInterest:
      'Interest accrues onto debt balances rather than draining cash surplus—central to classic BBD path behavior.',
  strategyInflateDrawdown:
      'Once draw phase begins, ramps nominal draw amounts using modeled expense inflation as a CPI proxy.',
  strategyConvertPrimary:
      'Enables scripted flip of primary-flag property after the calendar conversion year—rent assumptions then feed rental cash flow stacks.',
  strategyConvertYear:
      'Calendar year modeled for swapping primary occupancy to leased rental income while retaining mortgage amortization mechanics.',
  propertyDisplayName:
      'Friendly label persisted with the scenario JSON for UI tables only—never reconciled automatically with bank ledger names.',
  propertyPrimaryResidence:
      'Marks whether modeled tax treatment defaults to homeowner-style cash flows versus rental depreciation/rent comps.',
  propertyPurchasePrice:
      'Acquisition cost modeled for amortization/recapture—not automatically updated unless you revise it alongside appraisal fields.',
  propertyPurchaseYear:
      'Acquisition calendar year anchored for appreciation and mortgage timing lookups.',
  propertyCurrentValue:
      'Nominal modeled appraisal/mark at horizon start—the balance-sheet driver before annual appreciation ramps.',
  propertyMortgageBalance:
      'Outstanding principal at horizon start seeded into amort schedule back-solves with term/rate/origination year.',
  propertyMortgageApr:
      'Annual amortizing lien rate powering remaining balance walk-forward each simulated year.',
  propertyMortgageTermYears:
      'Original amort horizon for standard mortgage math—even if payoff occurs earlier modeled via extra rules.',
  propertyMortgageStartYear:
      'Calendar note origination for elapsed-month calculations each simulated year.',
  propertyMonthlyPiti:
      'Bundled modeled housing obligation (principal+interest+taxes+insurance) used for rental-vs-cost math when leased.',
  propertyMonthlyMarketRent:
      'Comparable rent starting point for leased years—grows per rent-growth knob before vacancy haircut.',
  propertyRentalStartYear:
      'Calendar year leased income ramps; unset with 0 when still owner-occupied/not yet reporting rental economics.',
  propertyAppreciation:
      'Compounded uplift on modeled property valuation each simulated year excluding explicit shock series.',
  propertyRentGrowth:
      'Growth rate applied yearly to modeled market rent comps once leased.',
  propertyVacancyMgmt:
      'Haircut modeled as fraction of gross rent lost to vacancy and property management drag.',
  propertyMaintenanceVsValue:
      'Annual capex/repairs modeled as share of contemporaneous modeled appraisal—not actual invoices.',
  propertyLandBasisPct:
      'Non-depreciable land fraction of modeled purchase basis—it caps annual straight-line depreciation on structure slice.',
  peDisplayName:
      'Label for each illiquid holding—carries through JSON export and duplicated cards but not synced to brokerage APIs.',
  peCurrentMark:
      'Nominal modeled fair-value before stochastic PE shocks deterministic path uses expected drift.',
  peCostBasis:
      'Capital gains reference for modeled exits/dividends; treated coarsely for carry/over basis swaps.',
  peExpectedGrowthRate:
      'Deterministic compounded uplift when Monte Carlo stochastic shock path is inactive.',
  peVolatilityAnnual:
      'σ on annual shocks when stochastic PE evolution is sampled—pairs with exits/failure draws.',
  peAnnualFailureProbability:
      'Each simulated stochastic year modeled chance stake goes to absolute zero before exit.',
  peAnnualExitProbability:
      'Modeled liquidity-event trigger frequency used with random exit multiples when stochastic exits run.',
  peExitMultipleMean:
      'Central tendency (unitless) scaling modeled exit proceeds vs contemporaneous intrinsic value draws.',
  peExitMultipleVol:
      'Spread on lognormal-ish multiples around the mean modeled per exit event draws.',
}

/** Controls on Buy·Borrow·Die page outside the structured scenario grid. */

export const BBD_PAGE_HELP = {
  monteCarloTrials:
    'Runs that many stochastic paths with the same baseline scenario (portfolio vol, stochastic PE exits, SOFR shocks). Zero keeps a single deterministic mean path only—faster but no dispersion bands.',
} as const
