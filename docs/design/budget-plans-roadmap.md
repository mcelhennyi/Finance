# Budget plans — roadmap (multi-plan, BBD linkage, starter template)

**Status:** Product roadmap + implemented baseline (**starter template** via env). Interactive cash-flow graph UI is **not** shipped yet.

**See also:** [`budget-cash-flow-graph.md`](budget-cash-flow-graph.md), [`tasks/feature-history/FR-0002-budget-entry-page/operator-budget-allocation.md`](../../tasks/feature-history/FR-0002-budget-entry-page/operator-budget-allocation.md).

---

## Budget plans as first-class objects

The app already supports **multiple allocation plans per calendar month** (each plan has its own lines and summary). Operators select which plan is active for editing via the **Plan** dropdown when more than one exists.

Future enhancements:

- **Named roles:** Tag plans as `baseline`, `stress test`, `BBD-aligned draft`, etc.
- **Pinned default:** Remember last-selected plan per month in client storage or server-side preference.

---

## Linking a budget plan to BBD projection

**Goal:** A budget plan can be **associated** with a BBD scenario or timeline so that:

- Category totals and income assumptions from the plan inform **starting conditions** or **recurring flow hints** in a BBD run.
- A BBD output (draw schedule, dividend cadence, borrowing envelopes) can suggest **edges** in the cash-flow graph (future).

**Not implemented.** Sketch for a later ticket:

- Optional **`bbd_projection_anchor`** (or FK to a saved BBD preset/run id) on **`allocation_plans`** or a join table.
- API to **push** plan aggregates into BBD default scenario fields (behind explicit user action).
- UI entry: “Extend this plan to BBD…” opening BBD with bridged parameters.

Privacy and reproducibility: linkage must be **explicit** (no silent sharing of personal scenario YAML).

---

## Starter template (`FINANCE_ALLOCATION_AUTO_TEMPLATE`)

When **`FINANCE_ALLOCATION_AUTO_TEMPLATE`** is `true`/`1`/`yes`, listing plans for a **specific month** with **no rows yet** inserts **`Starter cash-flow template`** plus illustrative allocation lines (generic payroll→spending/savings split).

Operators rename lines or delete the plan like any other data. Set the env var to **`false`** in production if you prefer an empty month until the user clicks **Create plan**. Local **`docker-compose.yml`** uses **`false`** by default; set **`true`** on the API service when you want the starter template to appear automatically for empty months.

Implementation: `finance.allocation.default_template`, triggered from `list_allocation_plans` when filtered by month.

---

## Cash-flow visualization (React Flow)

Static SVG placeholders are **removed**. The target UX is **[@xyflow/react](https://reactflow.dev/)** (or equivalent) rendering **nodes and edges from persisted user data** — not hard-coded diagrams.

Persisted graph schema and editor milestones live in **`budget-cash-flow-graph.md`**.
