# FR-0006 — Intake

| Field | Value |
|------|--------|
| **Title** | Budget cash-flow graph — persistence, API, React Flow, and roadmap phases |
| **Target timeline** | — |
| **Constraints** | Visualization targets **React Flow** (`@xyflow/react`); no static placeholder flow diagrams in product UI; follow PII/logging rules for institution labels |
| **Success definition** | (1) Operators can **persist** nodes and edges scoped to a **budget plan / month** (exact FK rule in contracts ticket). (2) **REST CRUD** serves the SPA. (3) **Budget** page includes a **React Flow** panel fed by that API. (4) Later tickets add **time scrub**, **BBD suggestions**, and optional **Compose** default tweak per roadmap/handoff. |
| **Out of scope (initial)** | Silent BBD↔plan sync; full “explain mode” narrative before graph core ships; replacing allocation spreadsheet import |

**Raw details**

Session handoff [`tasks/handoffs/2026-05-10-budget-cash-flow-session-handoff.md`](../../../handoffs/2026-05-10-budget-cash-flow-session-handoff.md) retired static SVG, documented **React Flow**, added **starter template** env behavior, and pointed **P1** at persisted **`CashNode` / `CashFlowEdge`** + **CRUD** + SPA. Design roadmaps: [`docs/design/budget-cash-flow-graph.md`](../../../docs/design/budget-cash-flow-graph.md), [`docs/design/budget-plans-roadmap.md`](../../../docs/design/budget-plans-roadmap.md).

**Already delivered (not tickets here)**

- Static cash-flow placeholder removed from Budget SPA.
- Design docs + **MkDocs** nav for graph and plans roadmap.
- **`FINANCE_ALLOCATION_AUTO_TEMPLATE`** + **Starter cash-flow template** (optional **Compose** default review is **T-FR-0006-07**).
