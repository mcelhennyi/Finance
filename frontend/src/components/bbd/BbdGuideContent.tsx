import { BBD_DOC_SECTION_IDS } from './bbdDocAnchors'

/**
 * Long-form BBD projection guide — anchored sections for contextual deep-links from the modal.
 */

export function BbdGuideContent() {
  const mono = 'text-[11px] font-mono bg-slate-100 px-1 rounded'
  const sectionTitle = 'scroll-mt-20 text-base font-semibold text-slate-800 tracking-tight border-b border-slate-100 pb-2 mb-3'
  const card =
    'rounded-xl border border-slate-100 bg-slate-50/40 p-6 shadow-none space-y-3 text-sm text-slate-700 leading-relaxed'

  return (
    <article className="space-y-5 pb-4">
      <section id={BBD_DOC_SECTION_IDS.intro} className={card}>
        <h2 className={sectionTitle}>What this tool is for</h2>
        <p>
          The planner runs a coarse <strong className="font-medium text-slate-800">Buy·Borrow·Die</strong>-style workbook:
          you describe wages, portfolios, mortgages, taxable savings, tax percentages, borrowing caps, draws, rentals, and PE;
          each simulated year aggregates cash, updates balances, and—when borrowing is active—prioritizes SBLOC/heuristic CRE
          cash-outs versus selling equities for spending.
        </p>
        <p>
          For the <strong className="font-medium text-slate-800">strategy narrative</strong> (what Borrow means for tax optics,
          stepped-up basis at death, where interest and margin-call risk bite, crash-survivable debt ceilings versus lender LTV caps),
          read the{' '}
          <strong>Strategy appendix</strong> in{' '}
          <code className={mono}>scripts/bbd-projection/README.md</code>. The same file also has the guided CLI cookbook (exact commands from repo root). Neither is legal or tax advice — they mirror the runnable script beside that file.
        </p>
        <p>
          Use it when you already understand that this is illustrative math—not credit approval, underwriting, legal
          structuring, or personalized bracket planning—and you want repeatable scenario comparison against a stylized sell
          heuristic at the horizon.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.timing} className={card}>
        <h2 className={sectionTitle}>Timing controls — how each input moves outcomes</h2>
        <p>
          <strong>Start year</strong> establishes the Gregorian anchor for amortization lookups, conversions, rentals, PE
          events, SOFR resets, etc. Sliding it preserves relative offsets elsewhere but shifts which calendar depreciation or
          rent windows apply.
        </p>
        <p>
          <strong>Horizon</strong> is the count of forward annual snapshots. Longer horizons push debt compounding farther,
          widen Monte Carlo divergence, delay terminal estate liquidation, but also mean more stochastic draws can hit tails.
        </p>
        <p>
          <strong>Starting age</strong> annotates schedules only; downstream tax ladders or NIIT breakpoints are{' '}
          <em>not</em> fidelity-modeled per age—it is not used to reshape brackets today.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.income} className={card}>
        <h2 className={sectionTitle}>Income — modeled cash and tax wedges</h2>
        <p>
          Gross W‑2 anchors ordinary-income tax wedges before elective deferrals, drives savings capacity pre-drawdown,
          disappears after your configured retire-offset year, and lifts portfolio contributions when modeled savings stay
          positive.
        </p>
        <p>
          Annual raise compounds wages each eligible year—it ratchets both tax drag and discretionary savings unless you chop
          the horizon or shorten the working window.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.expenses} className={card}>
        <h2 className={sectionTitle}>Living expenses vs portfolio burn</h2>
        <p>
          <strong>Annual living expenses</strong> approximate cash outflows unrelated to modeled P+I lines (tracked under
          property PITI). They compete with wages, dividends net of tax, borrowing draws, and savings—creating stress when
          inflows fall short unless draws increase.
        </p>
        <p>
          <strong>Expense inflation</strong> inflates nominal spending yearly. Without matching wage bumps or escalating
          borrowing targets, widening gaps pull harder on SBLOC envelopes and can amplify margin scenarios.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.savings} className={card}>
        <h2 className={sectionTitle}>Savings &amp; taxable portfolio sleeves</h2>
        <p>
          401(k) deferrals and employer credits reduce modeled ordinary taxable wages but still affect cash availability in
          the simplified ledger. Portfolio start mark + basis set SBLOC headline room, crystallized-loss heuristics, and
          dividend tax drag scaled by modeled yield.
        </p>
        <p>
          When <strong>fixed taxable savings override</strong> fires, deterministic contributions replace free-cash netting—
          masking whether the scenario realistically funds those deposits.
        </p>
        <p>
          Portfolio return μ and volatility govern deterministic glide paths versus stochastic Monte Carlo perturbations—
          higher σ blows out NW bands and interacts with SBLOC-trigger events.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.taxes} className={card}>
        <h2 className={sectionTitle}>Tax knobs — blunt instruments with big directional impact</h2>
        <p>
          Ordinary federal/state slices stack on taxed wage remnants, taxed rental receipts (after depreciation guardrails),
          and analogous flows. Dividend-heavy sleeves pay through the modeled LTCG + NIIT stack each year, shaping spendable
          cash and reinforcing borrow-first incentives when rates spike.
        </p>
        <p>
          Depreciation recapture inputs matter when flipping rentals or terminating estate liquidation—too low and you{' '}
          overstate heirs cash; too high and sell paths look punitive versus BBD liquidation heuristics.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.borrowing} className={card}>
        <h2 className={sectionTitle}>Borrowing &amp; benchmark rates — supply of “tax-light” liquidity</h2>
        <p>
          SBLOC LTV ceilings cap how fast uncollateralized equities can liquefy borrowing before the solver falls through to
          cash-out refi envelopes. Margin-call thresholds force modeled sales that realize taxable gains—instantiating why crash
          and solvency framing matter (<code className={mono}>scripts/bbd-projection/README.md</code>, Strategy appendix —
          costs / risks / solvency frontier).
        </p>
        <p>
          HELOC/refi knobs govern cost and capacity on property collateral; SOFR + spreads feed interest capitalization,
          which ratchets debt balances silently when capitalization mode is enabled.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.strategy} className={card}>
        <h2 className={sectionTitle}>Drawdown strategy — sequencing borrow vs repay</h2>
        <p>
          <strong>Years until borrow phase</strong> delays leveraged draws — extending pure accumulation lengthens amortization paydown but defers taxable sale alternatives.
        </p>
        <p>
          <strong>Annual draw targets</strong> set nominal cash goals serviced by modeled SBLOC/RE borrowing; inflate-with-expense CPI ties lifestyle drift into debt ramp.
        </p>
        <p>
          <strong>Capitalize interest</strong> accelerates liabilities while preserving cash—classic BBD feel—whereas servicing interest drains surplus that might otherwise bolster portfolios.
        </p>
        <p>
          <strong>Primary→rental conversion</strong> flips depreciation and NOI math; mistimed relative to mortgage payoff can swing both annual taxes and liquidation stories.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.properties} className={card}>
        <h2 className={sectionTitle}>Property rows — amortization plus rental economics</h2>
        <p>
          Loans back-solved from balances + terms amortize downward each year—feeding liability totals and refinancing room.
          Appreciation, rent growth, vacancy, maintenance, and land-vs-structure splits ripple through depreciation, modeled
          cash flow, taxes, and net worth composites.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.privateEquity} className={card}>
        <h2 className={sectionTitle}>Private equity sleeves — lumps &amp; risk</h2>
        <p>
          Illiquid valuations compound (deterministic path) unless Monte Carlo stochastic modules sample failures/exits—with
          treatment enums deciding whether hypothetical liquidity lands as taxed cash rolled into taxable marks or deferred.
        </p>
        <p>
          Exit multiples and dispersion widen tail outcomes materially; unrealistic growth + vanishing volatility can falsely
          anchor wealth expectations.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.engine} className={card}>
        <h2 className={sectionTitle}>Integrated engine storyline</h2>
        <p>
          The bundled README summarizes <strong className="font-medium text-slate-800">five coupled engines</strong>: real estate
          (mortgages, rents, depreciation, CRE leverage), taxable portfolio (+ basis), private equity illiquidity,
          borrowing (SBLOC + HELOC / cash-out), and{' '}
          <strong className="font-medium text-slate-800">terminal estate</strong> comparisons (BBD vs sell-as-you-go). Finance Hub runs
          the packaged Python core under{' '}
          <code className={mono}>src/finance/bbd/engine.py</code> wired through the API — same scenario shape as the{' '}
          <code className={mono}>scripts/bbd-projection/bbd_projection.py</code> TOML/JSON payloads for parity-oriented tests, although the two code
          paths can drift over time — open the bundled CLI README when you need every printed diagnostic (especially solvency), and this UI for fast
          iteration.
        </p>
        <p>
          Each timestep walks properties, evolves PE shocks, adjusts wages, computes simplified taxes (including incidental
          forced-sale taxes from margin remediation), allocates draws, grows/mark-to-market taxable sleeves, optionally flags
          margin breaches, snapshots balance sheets, then rolls forward inflation on living expenses — see authoritative code{' '}
          under <code className={mono}>src/finance/bbd/engine.py</code>.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.workflow} className={card}>
        <h2 className={sectionTitle}>Using Finance Hub presets &amp; APIs</h2>
        <p>
          Defaults load from <span className={mono}>GET /api/bbd-projection/default-scenario</span> (YAML seed on server).
          Scenario JSON under <strong>Advanced</strong> mirrors the POST body verbatim—great when diffing scripted versus UI
          entries.
        </p>
        <p>
          Presets stash named scenarios purely in-browser localStorage—they never sync across devices unless you paste JSON manually.
          For reproducible scripted runs, follow <code className={mono}>scripts/bbd-projection/README.md</code> —
          starter file via{' '}
          <code className={mono}>python scripts/bbd-projection/bbd_projection.py --emit-default starter.toml</code>,
          deterministic run{' '}
          <code className={mono}>python scripts/bbd-projection/bbd_projection.py starter.toml</code>, optional{' '}
          <code className={mono}>--montecarlo N</code>, <code className={mono}>--mc-seed 42</code> (parity with Hub’s seeded MC when you match seed and trial count),{' '}
          <code className={mono}>--csv schedule.csv</code>. Set <code className={mono}>[stress_test]</code> in TOML for the crash magnitude behind the CLI-only{' '}
          <strong>solvency narrative</strong> (README Strategy appendix — not surfaced as a prose block in this SPA yet).
          Committed fictional numbers live in{' '}
          <code className={mono}>scripts/bbd-projection/example-scenario.toml</code>; keep a gitignored workspace copy beside the script if you like.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.monteCarlo} className={card}>
        <h2 className={sectionTitle}>Monte Carlo trials — what changes when trials &gt; 0</h2>
        <p>
          Zero trials = single deterministic glide using mean returns/peaceful PE trajectory. Positive trials rerun the engine
          with draws on portfolio shocks, stochastic PE exits/failures, random SOFR paths, etc.—surface NW percentiles plus
          event counts like margin-trigger frequency.
        </p>
        <p>
          Interpreting bands requires humility: calibrated σ and exit probabilities dominate spread; doubling trials refines Monte-Carlo estimation noise but cannot invent data you did not encode.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.outputs} className={card}>
        <h2 className={sectionTitle}>Outputs &amp; how to interpret them responsibly</h2>
        <p>
          Monte cards summarize dispersion of final NW plus stress indicators (margin/bankruptcy rates). Tables sample every fifth
          year + terminal row —
          Δ Income reflects modeled cash-receipt deltas (wages + net rental dividends + draws); Δ Taxes compares combined
          federal/state/dividend/forced-sale stack year over year—first horizon row intentionally blank for deltas. LTV and any
          margin markers in the sampled grid are abbreviated borrow-stress cues.
        </p>
        <p>
          For the <strong>year-by-year solvency frontier table</strong> with status glyphs ({' '}
          <strong>[OK]</strong> free-option, <strong>[~]</strong> peak-safe only, <strong>[!]</strong> crash-vulnerable,{' '}
          <strong>[X]</strong> margin call) described in{' '}
          <code className={mono}>scripts/bbd-projection/README.md</code> (Strategy appendix — solvency status flags), run{' '}
          <code className={mono}>scripts/bbd-projection/bbd_projection.py</code>; this page does not
          yet echo that verbatim narrative (parity focus here is schedules + Monte + terminal estates).
        </p>
        <p>
          Estate tiles juxtapose liquidation heuristics; the advantage line expresses modeled heirs-net difference between pathways,
          useful only alongside the disclaimers—not as a prophecy of gifting outcomes.
        </p>
      </section>

      <section id={BBD_DOC_SECTION_IDS.limitations} className={card}>
        <h2 className={sectionTitle}>When outputs mislead fastest</h2>
        <p>
          Omitting refinancing constraints, underwriting haircuts, state-specific passive-loss rules, or trust/probate choreography
          can each swing realized cash more than modeled here. Validation belongs with professionals when dollars get real—the UI
          is for steering intuition and testing hypotheses against transparent JSON + Python source. IRC / Form references at the bottom of{' '}
          <code className={mono}>scripts/bbd-projection/README.md</code> (References) summarize external reading only; nothing here is individualized tax guidance.
        </p>
      </section>
    </article>
  )
}
