export function GeneralSettingsOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Use the tree-structured menu on the left to move between settings areas. Transaction-related options live
          under{' '}
          <span className="font-medium text-slate-700">Transactions</span>, including merchant display names that
          control how stored strings appear in lists and reports.
        </p>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-5 py-4 text-sm text-slate-600 max-w-2xl">
        <p className="font-medium text-slate-800 mb-2">Quick map</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <span className="font-medium text-slate-700">Merchant display → Outstanding</span> — names flagged for
            review.
          </li>
          <li>
            <span className="font-medium text-slate-700">Merchant display → All merchants</span> — full list sorted by
            volume.
          </li>
        </ul>
      </div>
    </div>
  )
}
