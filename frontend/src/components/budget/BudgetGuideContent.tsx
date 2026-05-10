import { BUDGET_DOC_SECTION_IDS } from './budgetDocAnchors'

/**
 * In-app guide for the Budget allocation page — sections pair with contextual links in the UI.
 */

export function BudgetGuideContent() {
  const sectionTitle =
    'scroll-mt-20 text-base font-semibold text-slate-800 tracking-tight border-b border-slate-100 pb-2 mb-3'
  const card =
    'rounded-xl border border-slate-100 bg-slate-50/40 p-6 shadow-none space-y-3 text-sm text-slate-700 leading-relaxed'

  return (
    <article className="space-y-5 pb-4">
      <section id={BUDGET_DOC_SECTION_IDS.intro} className={card}>
        <h2 className={sectionTitle}>What this page does</h2>
        <p>
          <strong className="font-medium text-slate-800">Budget allocation</strong> is where you define recurring planned
          amounts by category for a single calendar month. Each <em>plan</em> holds a set of <em>lines</em>: item name,
          category, amount, cadence, payment method, optional due day, and notes.
        </p>
        <p>
          Totals roll into KPI cards (cash vs credit, remaining income). Saved lines sync category totals into the Phase 2{' '}
          <strong className="font-medium text-slate-800">unified view</strong> so your dashboard budgets reflect what you
          entered here.
        </p>
      </section>

      <section id={BUDGET_DOC_SECTION_IDS.monthAndPlans} className={card}>
        <h2 className={sectionTitle}>Month and plans</h2>
        <p>
          Pick a <strong className="font-medium text-slate-800">month</strong> with the date control at the top. The API
          stores one or more allocation plans per month. Use the <strong className="font-medium text-slate-800">Budget</strong>{' '}
          dropdown to switch plans — your choice is remembered for the next visit (same browser). Use{' '}
          <strong className="font-medium text-slate-800">Add another plan</strong> when you want a second draft for the same month
          (for example “baseline” vs “tight month”).
        </p>
        <p>
          Use <strong className="font-medium text-slate-800">Create plan</strong> when no plan exists yet for that month.
          Each plan has its own lines — duplicate months are useful if you want alternative drafts (for example “baseline”
          vs “tight month”).
        </p>
        <p>
          When the server has <strong className="font-medium text-slate-800">automatic starter template</strong> enabled,
          loading an empty month may insert a named starter plan with illustrative lines you can edit or delete — see{' '}
          <code className="text-[11px] font-mono bg-slate-100 px-1 rounded">docs/design/budget-plans-roadmap.md</code>.
        </p>
      </section>

      <section id={BUDGET_DOC_SECTION_IDS.cashFlowMap} className={card}>
        <h2 className={sectionTitle}>Cash flow visualization</h2>
        <p>
          The old <em>timing cutoff</em> approximated “when pay hits” in a spreadsheet. The replacement is modeling{' '}
          <strong className="font-medium text-slate-800">money movement</strong>: accounts as <strong>nodes</strong>, and
          payroll, transfers, sweeps, and bill payments as <strong>edges</strong> (for example paycheck → checking →
          long-term savings at another institution while another slice covers bills).
        </p>
        <p>
          There is <strong className="font-medium text-slate-800">no static flow-chart</strong> baked into the page.
          Planned implementation uses <strong className="font-medium text-slate-800">React Flow</strong> to render a graph
          from <strong>persisted</strong> node/edge data you enter — same design thread as linking rich budget plans to other
          tools (including BBD projections). See{' '}
          <code className="text-[11px] font-mono bg-slate-100 px-1 rounded">docs/design/budget-cash-flow-graph.md</code> and{' '}
          <code className="text-[11px] font-mono bg-slate-100 px-1 rounded">docs/design/budget-plans-roadmap.md</code>.
        </p>
      </section>

      <section id={BUDGET_DOC_SECTION_IDS.planDetails} className={card}>
        <h2 className={sectionTitle}>Plan details</h2>
        <p>
          <strong className="font-medium text-slate-800">Name</strong> is for your reference. <strong>Income</strong> and{' '}
          <strong>income cadence</strong> are optional: when both are set, the summary can show <em>remaining income</em>{' '}
          (income minus total allocated). Clear both to ignore income for this plan.
        </p>
        <p>
          <strong className="font-medium text-slate-800">Save plan</strong> persists name and income fields.{' '}
          <strong className="font-medium text-slate-800">Delete plan</strong> removes the plan and all its lines — use only
          when you intend to discard that draft.
        </p>
      </section>

      <section id={BUDGET_DOC_SECTION_IDS.summary} className={card}>
        <h2 className={sectionTitle}>Monthly summary KPIs</h2>
        <p>
          <strong className="font-medium text-slate-800">Total allocated</strong> is the sum of normalized monthly amounts.
          <strong className="font-medium text-slate-800"> Cash</strong> and <strong className="font-medium text-slate-800">
            Credit
          </strong>{' '}
          split that total by payment method. <strong className="font-medium text-slate-800">Remaining income</strong>{' '}
          appears when plan income is configured.
        </p>
      </section>

      <section id={BUDGET_DOC_SECTION_IDS.allocationLines} className={card}>
        <h2 className={sectionTitle}>Allocation lines table</h2>
        <p>
          Each row is one recurring budget item. <strong className="font-medium text-slate-800">Planned</strong> is the raw
          amount at the chosen cadence; <strong className="font-medium text-slate-800">Monthly</strong> is the equivalent
          normalized monthly value used everywhere else.
        </p>
        <p>
          Use <strong className="font-medium text-slate-800">Edit</strong> to change a line in place;{' '}
          <strong className="font-medium text-slate-800">Delete</strong> removes it. Category strings should match how you
          want rollup in the unified view.
        </p>
      </section>

      <section id={BUDGET_DOC_SECTION_IDS.addLine} className={card}>
        <h2 className={sectionTitle}>Add line</h2>
        <p>
          Fill the row at the bottom and choose <strong className="font-medium text-slate-800">Add</strong>. Validation
          requires a positive planned amount and consistent optional fields (for example due day within 1–31 when
          provided).
        </p>
      </section>

      <section id={BUDGET_DOC_SECTION_IDS.unifiedSync} className={card}>
        <h2 className={sectionTitle}>Unified view sync</h2>
        <p>
          Saving allocation data updates backend totals that feed the unified monthly summary and category budgets. If you
          change categories or amounts, refresh the unified view to see those budgets catch up.
        </p>
      </section>
    </article>
  )
}
