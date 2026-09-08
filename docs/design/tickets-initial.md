# Tickets — index and global DAG

**Canonical definitions:** Implementation tickets (**`### T-FR-NNNN-xx`**, phases, **Deps:**) live under **`tasks/feature-history/FR-NNNN-<slug>/tickets.md`** — one file per feature line. See **`tasks/feature-history/TICKET-SOURCES.md`** and **`docs/design/documentation-style.md`**.

**This doc (`docs/design/tickets-initial.md`):** registry of **where** tickets live + **global** mermaid (cross-feature when needed) + **`triadDone`** styling for the published DAG. Do **not** duplicate full ticket bodies here; edit the per-feature **`tickets.md`** instead.

**Queue / progress:** **`tasks/ticket-progress.md`**.

**Deps:** `none` means no ticket dependency. A ticket is **eligible** when all **Deps** are **VAL** = `done` in **`ticket-progress.md`**.

**Mermaid triad nodes:** For **`T-FR-NNNN-xx`**, node ids are **`TFR` + `NNNN` + `_` + `xx` + `_` + `TEST|DEV|VAL`**. When a ticket is fully complete, add the corresponding `class … triadDone` line below (union when merging parallel work).

---

## Per-feature ticket files (canonical)

| FR id | Path (repo root) |
|-------|------------------|
| FR-0000 | `tasks/feature-history/FR-0000-bootstrap/tickets.md` |
| FR-0001 | `tasks/feature-history/FR-0001-phase2-goals-unified-view/tickets.md` |
| FR-0002 | `tasks/feature-history/FR-0002-budget-entry-page/tickets.md` |
| FR-0003 | `tasks/feature-history/FR-0003-bbd-projection-ui/tickets.md` |
| FR-0004 | `tasks/feature-history/FR-0004-bbd-projection-experience/tickets.md` |
| FR-0005 | `tasks/feature-history/FR-0005-budget-page-docs-dock/tickets.md` |
| FR-0006 | `tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md` |
| FR-0007 | `tasks/feature-history/FR-0007-business-finance-management/tickets.md` |

---

## DAG Overview (global)

Extend this diagram when new **`FR-NNNN`** lines add tickets that chain to existing work.

```mermaid
graph LR
  TFR0000_01_TEST["Choose stack and scaffold repository — Write the checks (T-FR-0000-01, TEST)"] --> TFR0000_01_DEV["Choose stack and scaffold repository — Build the change (T-FR-0000-01, DEV)"]
  TFR0000_01_DEV --> TFR0000_01_VAL["Choose stack and scaffold repository — Verify it works (T-FR-0000-01, VAL)"]

  TFR0001_01_TEST["Define goals and budgets data contracts — Write the checks (T-FR-0001-01, TEST)"] --> TFR0001_01_DEV["Define goals and budgets data contracts — Build the change (T-FR-0001-01, DEV)"]
  TFR0001_01_DEV --> TFR0001_01_VAL["Define goals and budgets data contracts — Verify it works (T-FR-0001-01, VAL)"]
  TFR0001_01_VAL --> TFR0001_02_TEST["Build goals and budget actuals engine — Write the checks (T-FR-0001-02, TEST)"]
  TFR0001_02_TEST --> TFR0001_02_DEV["Build goals and budget actuals engine — Build the change (T-FR-0001-02, DEV)"]
  TFR0001_02_DEV --> TFR0001_02_VAL["Build goals and budget actuals engine — Verify it works (T-FR-0001-02, VAL)"]

  TFR0001_01_VAL --> TFR0001_03_TEST["Add income and liabilities ingestion contracts — Write the checks (T-FR-0001-03, TEST)"]
  TFR0001_03_TEST --> TFR0001_03_DEV["Add income and liabilities ingestion contracts — Build the change (T-FR-0001-03, DEV)"]
  TFR0001_03_DEV --> TFR0001_03_VAL["Add income and liabilities ingestion contracts — Verify it works (T-FR-0001-03, VAL)"]

  TFR0001_02_VAL --> TFR0001_04_TEST["Expose unified monthly financial summary API — Write the checks (T-FR-0001-04, TEST)"]
  TFR0001_03_VAL --> TFR0001_04_TEST
  TFR0001_04_TEST --> TFR0001_04_DEV["Expose unified monthly financial summary API — Build the change (T-FR-0001-04, DEV)"]
  TFR0001_04_DEV --> TFR0001_04_VAL["Expose unified monthly financial summary API — Verify it works (T-FR-0001-04, VAL)"]

  TFR0001_04_VAL --> TFR0001_05_TEST["Deliver Phase 2 unified dashboard view — Write the checks (T-FR-0001-05, TEST)"]
  TFR0001_05_TEST --> TFR0001_05_DEV["Deliver Phase 2 unified dashboard view — Build the change (T-FR-0001-05, DEV)"]
  TFR0001_05_DEV --> TFR0001_05_VAL["Deliver Phase 2 unified dashboard view — Verify it works (T-FR-0001-05, VAL)"]

  TFR0001_05_VAL --> TFR0002_01_TEST["Define budget allocation contracts — Write the checks (T-FR-0002-01, TEST)"]
  TFR0002_01_TEST --> TFR0002_01_DEV["Define budget allocation contracts — Build the change (T-FR-0002-01, DEV)"]
  TFR0002_01_DEV --> TFR0002_01_VAL["Define budget allocation contracts — Verify it works (T-FR-0002-01, VAL)"]

  TFR0002_01_VAL --> TFR0002_02_TEST["Expose budget allocation API — Write the checks (T-FR-0002-02, TEST)"]
  TFR0002_02_TEST --> TFR0002_02_DEV["Expose budget allocation API — Build the change (T-FR-0002-02, DEV)"]
  TFR0002_02_DEV --> TFR0002_02_VAL["Expose budget allocation API — Verify it works (T-FR-0002-02, VAL)"]

  TFR0002_02_VAL --> TFR0002_03_TEST["Sync allocation totals into unified budgets — Write the checks (T-FR-0002-03, TEST)"]
  TFR0002_03_TEST --> TFR0002_03_DEV["Sync allocation totals into unified budgets — Build the change (T-FR-0002-03, DEV)"]
  TFR0002_03_DEV --> TFR0002_03_VAL["Sync allocation totals into unified budgets — Verify it works (T-FR-0002-03, VAL)"]

  TFR0002_02_VAL --> TFR0002_04_TEST["Deliver budget entry page — Write the checks (T-FR-0002-04, TEST)"]
  TFR0002_04_TEST --> TFR0002_04_DEV["Deliver budget entry page — Build the change (T-FR-0002-04, DEV)"]
  TFR0002_04_DEV --> TFR0002_04_VAL["Deliver budget entry page — Verify it works (T-FR-0002-04, VAL)"]

  TFR0002_03_VAL --> TFR0002_05_TEST["Validate and document budget entry workflow — Write the checks (T-FR-0002-05, TEST)"]
  TFR0002_04_VAL --> TFR0002_05_TEST
  TFR0002_05_TEST --> TFR0002_05_DEV["Validate and document budget entry workflow — Build the change (T-FR-0002-05, DEV)"]
  TFR0002_05_DEV --> TFR0002_05_VAL["Validate and document budget entry workflow — Verify it works (T-FR-0002-05, VAL)"]

  TFR0003_01_TEST["Extract BBD projection as importable module — Write the checks (T-FR-0003-01, TEST)"] --> TFR0003_01_DEV["Extract BBD projection as importable module — Build the change (T-FR-0003-01, DEV)"]
  TFR0003_01_DEV --> TFR0003_01_VAL["Extract BBD projection as importable module — Verify it works (T-FR-0003-01, VAL)"]

  TFR0003_01_VAL --> TFR0003_02_TEST["Add BBD projection REST API — Write the checks (T-FR-0003-02, TEST)"]
  TFR0003_02_TEST --> TFR0003_02_DEV["Add BBD projection REST API — Build the change (T-FR-0003-02, DEV)"]
  TFR0003_02_DEV --> TFR0003_02_VAL["Add BBD projection REST API — Verify it works (T-FR-0003-02, VAL)"]

  TFR0003_02_VAL --> TFR0003_03_TEST["Deliver BBD projection page — Write the checks (T-FR-0003-03, TEST)"]
  TFR0003_03_TEST --> TFR0003_03_DEV["Deliver BBD projection page — Build the change (T-FR-0003-03, DEV)"]
  TFR0003_03_DEV --> TFR0003_03_VAL["Deliver BBD projection page — Verify it works (T-FR-0003-03, VAL)"]

  TFR0003_02_VAL --> TFR0003_04_TEST["Validate BBD UX and document operator workflow — Write the checks (T-FR-0003-04, TEST)"]
  TFR0003_03_VAL --> TFR0003_04_TEST
  TFR0003_04_TEST --> TFR0003_04_DEV["Validate BBD UX and document operator workflow — Build the change (T-FR-0003-04, DEV)"]
  TFR0003_04_DEV --> TFR0003_04_VAL["Validate BBD UX and document operator workflow — Verify it works (T-FR-0003-04, VAL)"]

  TFR0004_01_TEST["BBD bottom control dock and relocated actions — Write the checks (T-FR-0004-01, TEST)"] --> TFR0004_01_DEV["BBD bottom control dock and relocated actions — Build the change (T-FR-0004-01, DEV)"]
  TFR0004_01_DEV --> TFR0004_01_VAL["BBD bottom control dock and relocated actions — Verify it works (T-FR-0004-01, VAL)"]

  TFR0004_02_TEST["BBD visualization view-model and chart-ready series — Write the checks (T-FR-0004-02, TEST)"] --> TFR0004_02_DEV["BBD visualization view-model and chart-ready series — Build the change (T-FR-0004-02, DEV)"]
  TFR0004_02_DEV --> TFR0004_02_VAL["BBD visualization view-model and chart-ready series — Verify it works (T-FR-0004-02, VAL)"]

  TFR0004_01_VAL --> TFR0004_03_TEST["BBD 2D story dashboard and educational callouts — Write the checks (T-FR-0004-03, TEST)"]
  TFR0004_02_VAL --> TFR0004_03_TEST
  TFR0004_03_TEST --> TFR0004_03_DEV["BBD 2D story dashboard and educational callouts — Build the change (T-FR-0004-03, DEV)"]
  TFR0004_03_DEV --> TFR0004_03_VAL["BBD 2D story dashboard and educational callouts — Verify it works (T-FR-0004-03, VAL)"]

  TFR0004_02_VAL --> TFR0004_04_TEST["BBD spatial / 3D–time experience (lazy WebGL) — Write the checks (T-FR-0004-04, TEST)"]
  TFR0004_03_VAL --> TFR0004_04_TEST
  TFR0004_04_TEST --> TFR0004_04_DEV["BBD spatial / 3D–time experience (lazy WebGL) — Build the change (T-FR-0004-04, DEV)"]
  TFR0004_04_DEV --> TFR0004_04_VAL["BBD spatial / 3D–time experience (lazy WebGL) — Verify it works (T-FR-0004-04, VAL)"]

  TFR0004_04_VAL --> TFR0004_05_TEST["BBD experience integration VAL and operator docs — Write the checks (T-FR-0004-05, TEST)"]
  TFR0004_05_TEST --> TFR0004_05_DEV["BBD experience integration VAL and operator docs — Build the change (T-FR-0004-05, DEV)"]
  TFR0004_05_DEV --> TFR0004_05_VAL["BBD experience integration VAL and operator docs — Verify it works (T-FR-0004-05, VAL)"]

  TFR0005_01_TEST["Budget page in-app guide, field annotations, and floating dock — Write the checks (T-FR-0005-01, TEST)"] --> TFR0005_01_DEV["Budget page in-app guide, field annotations, and floating dock — Build the change (T-FR-0005-01, DEV)"]
  TFR0005_01_DEV --> TFR0005_01_VAL["Budget page in-app guide, field annotations, and floating dock — Verify it works (T-FR-0005-01, VAL)"]

  TFR0002_02_VAL --> TFR0006_01_TEST["Define cash-flow graph persistence contracts — Write the checks (T-FR-0006-01, TEST)"]
  TFR0006_01_TEST --> TFR0006_01_DEV["Define cash-flow graph persistence contracts — Build the change (T-FR-0006-01, DEV)"]
  TFR0006_01_DEV --> TFR0006_01_VAL["Define cash-flow graph persistence contracts — Verify it works (T-FR-0006-01, VAL)"]

  TFR0006_01_VAL --> TFR0006_02_TEST["Add cash-flow graph migration and ORM models — Write the checks (T-FR-0006-02, TEST)"]
  TFR0006_02_TEST --> TFR0006_02_DEV["Add cash-flow graph migration and ORM models — Build the change (T-FR-0006-02, DEV)"]
  TFR0006_02_DEV --> TFR0006_02_VAL["Add cash-flow graph migration and ORM models — Verify it works (T-FR-0006-02, VAL)"]

  TFR0006_02_VAL --> TFR0006_03_TEST["Expose cash-flow graph CRUD API — Write the checks (T-FR-0006-03, TEST)"]
  TFR0006_03_TEST --> TFR0006_03_DEV["Expose cash-flow graph CRUD API — Build the change (T-FR-0006-03, DEV)"]
  TFR0006_03_DEV --> TFR0006_03_VAL["Expose cash-flow graph CRUD API — Verify it works (T-FR-0006-03, VAL)"]

  TFR0006_03_VAL --> TFR0006_04_TEST["Budget React Flow panel wired to graph API — Write the checks (T-FR-0006-04, TEST)"]
  TFR0006_04_TEST --> TFR0006_04_DEV["Budget React Flow panel wired to graph API — Build the change (T-FR-0006-04, DEV)"]
  TFR0006_04_DEV --> TFR0006_04_VAL["Budget React Flow panel wired to graph API — Verify it works (T-FR-0006-04, VAL)"]

  TFR0006_04_VAL --> TFR0006_05_TEST["Cash-flow time scrub and aggregated views — Write the checks (T-FR-0006-05, TEST)"]
  TFR0006_05_TEST --> TFR0006_05_DEV["Cash-flow time scrub and aggregated views — Build the change (T-FR-0006-05, DEV)"]
  TFR0006_05_DEV --> TFR0006_05_VAL["Cash-flow time scrub and aggregated views — Verify it works (T-FR-0006-05, VAL)"]

  TFR0003_02_VAL --> TFR0006_06_TEST["BBD-suggested cash-flow edges — Write the checks (T-FR-0006-06, TEST)"]
  TFR0006_04_VAL --> TFR0006_06_TEST
  TFR0006_06_TEST --> TFR0006_06_DEV["BBD-suggested cash-flow edges — Build the change (T-FR-0006-06, DEV)"]
  TFR0006_06_DEV --> TFR0006_06_VAL["BBD-suggested cash-flow edges — Verify it works (T-FR-0006-06, VAL)"]

  TFR0006_07_TEST["Compose default for allocation auto-template — Write the checks (T-FR-0006-07, TEST)"] --> TFR0006_07_DEV["Compose default for allocation auto-template — Build the change (T-FR-0006-07, DEV)"]
  TFR0006_07_DEV --> TFR0006_07_VAL["Compose default for allocation auto-template — Verify it works (T-FR-0006-07, VAL)"]

  TFR0007_01_TEST["Define workspace, ledger, and audit contracts — Write the checks (T-FR-0007-01, TEST)"] --> TFR0007_01_DEV["Define workspace, ledger, and audit contracts — Build the change (T-FR-0007-01, DEV)"]
  TFR0007_01_DEV --> TFR0007_01_VAL["Define workspace, ledger, and audit contracts — Verify it works (T-FR-0007-01, VAL)"]

  TFR0007_01_VAL --> TFR0007_02_TEST["Install migrations and backfill the Personal workspace — Write the checks (T-FR-0007-02, TEST)"]
  TFR0007_02_TEST --> TFR0007_02_DEV["Install migrations and backfill the Personal workspace — Build the change (T-FR-0007-02, DEV)"]
  TFR0007_02_DEV --> TFR0007_02_VAL["Install migrations and backfill the Personal workspace — Verify it works (T-FR-0007-02, VAL)"]

  TFR0007_02_VAL --> TFR0007_03_TEST["Enforce workspace isolation across existing finance surfaces — Write the checks (T-FR-0007-03, TEST)"]
  TFR0007_03_TEST --> TFR0007_03_DEV["Enforce workspace isolation across existing finance surfaces — Build the change (T-FR-0007-03, DEV)"]
  TFR0007_03_DEV --> TFR0007_03_VAL["Enforce workspace isolation across existing finance surfaces — Verify it works (T-FR-0007-03, VAL)"]

  TFR0007_03_VAL --> TFR0007_04_TEST["Import and reconcile business accounts and cards — Write the checks (T-FR-0007-04, TEST)"]
  TFR0007_04_TEST --> TFR0007_04_DEV["Import and reconcile business accounts and cards — Build the change (T-FR-0007-04, DEV)"]
  TFR0007_04_DEV --> TFR0007_04_VAL["Import and reconcile business accounts and cards — Verify it works (T-FR-0007-04, VAL)"]

  TFR0007_04_VAL --> TFR0007_05_TEST["Classify business income, expenses, and owner activity — Write the checks (T-FR-0007-05, TEST)"]
  TFR0007_05_TEST --> TFR0007_05_DEV["Classify business income, expenses, and owner activity — Build the change (T-FR-0007-05, DEV)"]
  TFR0007_05_DEV --> TFR0007_05_VAL["Classify business income, expenses, and owner activity — Verify it works (T-FR-0007-05, VAL)"]

  TFR0007_05_VAL --> TFR0007_06_TEST["Store receipts and review deduction candidates — Write the checks (T-FR-0007-06, TEST)"]
  TFR0007_06_TEST --> TFR0007_06_DEV["Store receipts and review deduction candidates — Build the change (T-FR-0007-06, DEV)"]
  TFR0007_06_DEV --> TFR0007_06_VAL["Store receipts and review deduction candidates — Verify it works (T-FR-0007-06, VAL)"]

  TFR0007_05_VAL --> TFR0007_07_TEST["Plan tax obligations and reserve targets — Write the checks (T-FR-0007-07, TEST)"]
  TFR0007_07_TEST --> TFR0007_07_DEV["Plan tax obligations and reserve targets — Build the change (T-FR-0007-07, DEV)"]
  TFR0007_07_DEV --> TFR0007_07_VAL["Plan tax obligations and reserve targets — Verify it works (T-FR-0007-07, VAL)"]

  TFR0007_04_VAL --> TFR0007_08_TEST["Track reserved cash and tax payments — Write the checks (T-FR-0007-08, TEST)"]
  TFR0007_07_VAL --> TFR0007_08_TEST
  TFR0007_08_TEST --> TFR0007_08_DEV["Track reserved cash and tax payments — Build the change (T-FR-0007-08, DEV)"]
  TFR0007_08_DEV --> TFR0007_08_VAL["Track reserved cash and tax payments — Verify it works (T-FR-0007-08, VAL)"]

  TFR0007_05_VAL --> TFR0007_09_TEST["Expose business summaries, reports, and exports — Write the checks (T-FR-0007-09, TEST)"]
  TFR0007_06_VAL --> TFR0007_09_TEST
  TFR0007_08_VAL --> TFR0007_09_TEST
  TFR0007_09_TEST --> TFR0007_09_DEV["Expose business summaries, reports, and exports — Build the change (T-FR-0007-09, DEV)"]
  TFR0007_09_DEV --> TFR0007_09_VAL["Expose business summaries, reports, and exports — Verify it works (T-FR-0007-09, VAL)"]

  TFR0007_03_VAL --> TFR0007_10_TEST["Deliver the addressable Business workspace shell — Write the checks (T-FR-0007-10, TEST)"]
  TFR0007_10_TEST --> TFR0007_10_DEV["Deliver the addressable Business workspace shell — Build the change (T-FR-0007-10, DEV)"]
  TFR0007_10_DEV --> TFR0007_10_VAL["Deliver the addressable Business workspace shell — Verify it works (T-FR-0007-10, VAL)"]

  TFR0007_05_VAL --> TFR0007_11_TEST["Deliver business books and deduction workflows — Write the checks (T-FR-0007-11, TEST)"]
  TFR0007_06_VAL --> TFR0007_11_TEST
  TFR0007_10_VAL --> TFR0007_11_TEST
  TFR0007_11_TEST --> TFR0007_11_DEV["Deliver business books and deduction workflows — Build the change (T-FR-0007-11, DEV)"]
  TFR0007_11_DEV --> TFR0007_11_VAL["Deliver business books and deduction workflows — Verify it works (T-FR-0007-11, VAL)"]

  TFR0007_08_VAL --> TFR0007_12_TEST["Deliver Tax Center and reports workflows — Write the checks (T-FR-0007-12, TEST)"]
  TFR0007_09_VAL --> TFR0007_12_TEST
  TFR0007_10_VAL --> TFR0007_12_TEST
  TFR0007_12_TEST --> TFR0007_12_DEV["Deliver Tax Center and reports workflows — Build the change (T-FR-0007-12, DEV)"]
  TFR0007_12_DEV --> TFR0007_12_VAL["Deliver Tax Center and reports workflows — Verify it works (T-FR-0007-12, VAL)"]

  TFR0007_11_VAL --> TFR0007_13_TEST["Validate the business-finance lifecycle and operator guidance — Write the checks (T-FR-0007-13, TEST)"]
  TFR0007_12_VAL --> TFR0007_13_TEST
  TFR0007_13_TEST --> TFR0007_13_DEV["Validate the business-finance lifecycle and operator guidance — Build the change (T-FR-0007-13, DEV)"]
  TFR0007_13_DEV --> TFR0007_13_VAL["Validate the business-finance lifecycle and operator guidance — Verify it works (T-FR-0007-13, VAL)"]

  TFR0006_03_VAL --> TFR0006_08_TEST["Unified source/sink allocation primitive contracts — Write the checks (T-FR-0006-08, TEST)"]
  TFR0006_08_TEST --> TFR0006_08_DEV["Unified source/sink allocation primitive contracts — Build the change (T-FR-0006-08, DEV)"]
  TFR0006_08_DEV --> TFR0006_08_VAL["Unified source/sink allocation primitive contracts — Verify it works (T-FR-0006-08, VAL)"]

  TFR0006_04_VAL --> TFR0006_09_TEST["Directional account handles and double-click linking — Write the checks (T-FR-0006-09, TEST)"]
  TFR0006_09_TEST --> TFR0006_09_DEV["Directional account handles and double-click linking — Build the change (T-FR-0006-09, DEV)"]
  TFR0006_09_DEV --> TFR0006_09_VAL["Directional account handles and double-click linking — Verify it works (T-FR-0006-09, VAL)"]

  TFR0006_09_VAL --> TFR0006_10_TEST["Orthogonal routing and obstacle-aware relayout — Write the checks (T-FR-0006-10, TEST)"]
  TFR0006_10_TEST --> TFR0006_10_DEV["Orthogonal routing and obstacle-aware relayout — Build the change (T-FR-0006-10, DEV)"]
  TFR0006_10_DEV --> TFR0006_10_VAL["Orthogonal routing and obstacle-aware relayout — Verify it works (T-FR-0006-10, VAL)"]

  TFR0006_08_VAL --> TFR0006_11_TEST["Expandable allocation clusters with filters and counts — Write the checks (T-FR-0006-11, TEST)"]
  TFR0006_10_VAL --> TFR0006_11_TEST
  TFR0006_11_TEST --> TFR0006_11_DEV["Expandable allocation clusters with filters and counts — Build the change (T-FR-0006-11, DEV)"]
  TFR0006_11_DEV --> TFR0006_11_VAL["Expandable allocation clusters with filters and counts — Verify it works (T-FR-0006-11, VAL)"]

  TFR0006_10_VAL --> TFR0006_12_TEST["Edge and label deconfliction — Write the checks (T-FR-0006-12, TEST)"]
  TFR0006_11_VAL --> TFR0006_12_TEST
  TFR0006_12_TEST --> TFR0006_12_DEV["Edge and label deconfliction — Build the change (T-FR-0006-12, DEV)"]
  TFR0006_12_DEV --> TFR0006_12_VAL["Edge and label deconfliction — Verify it works (T-FR-0006-12, VAL)"]

  TFR0006_12_VAL --> TFR0006_13_TEST["Allocation controls and graph layout cleanup — Write the checks (T-FR-0006-13, TEST)"]
  TFR0006_13_TEST --> TFR0006_13_DEV["Allocation controls and graph layout cleanup — Build the change (T-FR-0006-13, DEV)"]
  TFR0006_13_DEV --> TFR0006_13_VAL["Allocation controls and graph layout cleanup — Verify it works (T-FR-0006-13, VAL)"]

  TFR0006_13_VAL --> TFR0006_14_TEST["Responsive Budget tables and full-screen edit forms — Write the checks (T-FR-0006-14, TEST)"]
  TFR0006_14_TEST --> TFR0006_14_DEV["Responsive Budget tables and full-screen edit forms — Build the change (T-FR-0006-14, DEV)"]
  TFR0006_14_DEV --> TFR0006_14_VAL["Responsive Budget tables and full-screen edit forms — Verify it works (T-FR-0006-14, VAL)"]

  classDef triadDone fill:#2e7d32,color:#fff
  class TFR0000_01_TEST,TFR0000_01_DEV,TFR0000_01_VAL triadDone
  class TFR0001_01_TEST,TFR0001_01_DEV,TFR0001_01_VAL triadDone
  class TFR0001_03_TEST,TFR0001_03_DEV,TFR0001_03_VAL triadDone
  class TFR0001_02_TEST,TFR0001_02_DEV,TFR0001_02_VAL triadDone
  class TFR0001_04_TEST,TFR0001_04_DEV,TFR0001_04_VAL triadDone
  class TFR0001_05_TEST,TFR0001_05_DEV,TFR0001_05_VAL triadDone

  class TFR0003_01_TEST,TFR0003_01_DEV,TFR0003_01_VAL,TFR0003_02_TEST,TFR0003_02_DEV,TFR0003_02_VAL,TFR0003_03_TEST,TFR0003_03_DEV,TFR0003_03_VAL,TFR0003_04_TEST,TFR0003_04_DEV,TFR0003_04_VAL triadDone

  class TFR0004_01_TEST,TFR0004_01_DEV,TFR0004_01_VAL,TFR0004_02_TEST,TFR0004_02_DEV,TFR0004_02_VAL,TFR0004_03_TEST,TFR0004_03_DEV,TFR0004_03_VAL,TFR0004_04_TEST,TFR0004_04_DEV,TFR0004_04_VAL,TFR0004_05_TEST,TFR0004_05_DEV,TFR0004_05_VAL triadDone

  class TFR0005_01_TEST,TFR0005_01_DEV,TFR0005_01_VAL triadDone
  class TFR0006_01_TEST,TFR0006_01_DEV,TFR0006_01_VAL,TFR0006_02_TEST,TFR0006_02_DEV,TFR0006_02_VAL,TFR0006_03_TEST,TFR0006_03_DEV,TFR0006_03_VAL,TFR0006_04_TEST,TFR0006_04_DEV,TFR0006_04_VAL,TFR0006_05_TEST,TFR0006_05_DEV,TFR0006_05_VAL,TFR0006_06_TEST,TFR0006_06_DEV,TFR0006_06_VAL,TFR0006_07_TEST,TFR0006_07_DEV,TFR0006_07_VAL triadDone
  class TFR0006_08_TEST,TFR0006_08_DEV,TFR0006_08_VAL,TFR0006_09_TEST,TFR0006_09_DEV,TFR0006_09_VAL,TFR0006_10_TEST,TFR0006_10_DEV,TFR0006_10_VAL,TFR0006_11_TEST,TFR0006_11_DEV,TFR0006_11_VAL triadDone
  class TFR0006_12_TEST,TFR0006_12_DEV,TFR0006_12_VAL,TFR0006_13_TEST,TFR0006_13_DEV,TFR0006_13_VAL,TFR0006_14_TEST,TFR0006_14_DEV,TFR0006_14_VAL triadDone
```

<!-- ticket-dag-status:start -->
**Where things stand:** Across the project, 35 of 48 defined tickets are fully verified; 13 remain open or are not yet recorded as complete. Budget cash flow graph (FR-0006) is complete: all 14 tickets are fully verified.
<!-- ticket-dag-status:end -->

When ticket **`T-FR-NNNN-xx`** is fully complete (TEST/DEV/VAL all `done` in **`ticket-progress.md`**), add:

`class TFRNNNN_xx_TEST,TFRNNNN_xx_DEV,TFRNNNN_xx_VAL triadDone`

(Example for `T-FR-0000-01`: `class TFR0000_01_TEST,TFR0000_01_DEV,TFR0000_01_VAL triadDone`.)
