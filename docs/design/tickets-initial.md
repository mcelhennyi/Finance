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

---

## DAG Overview (global)

Extend this diagram when new **`FR-NNNN`** lines add tickets that chain to existing work.

```mermaid
graph LR
  TFR0000_01_TEST[TFR0000_01_TEST] --> TFR0000_01_DEV[TFR0000_01_DEV]
  TFR0000_01_DEV --> TFR0000_01_VAL[TFR0000_01_VAL]

  TFR0001_01_TEST["Define goals and budgets data contracts TEST (T-FR-0001-01)"] --> TFR0001_01_DEV["Define goals and budgets data contracts DEV (T-FR-0001-01)"]
  TFR0001_01_DEV --> TFR0001_01_VAL["Define goals and budgets data contracts VAL (T-FR-0001-01)"]
  TFR0001_01_VAL --> TFR0001_02_TEST["Build goals and budget actuals engine TEST (T-FR-0001-02)"]
  TFR0001_02_TEST --> TFR0001_02_DEV["Build goals and budget actuals engine DEV (T-FR-0001-02)"]
  TFR0001_02_DEV --> TFR0001_02_VAL["Build goals and budget actuals engine VAL (T-FR-0001-02)"]

  TFR0001_01_VAL --> TFR0001_03_TEST["Add income and liabilities ingestion contracts TEST (T-FR-0001-03)"]
  TFR0001_03_TEST --> TFR0001_03_DEV["Add income and liabilities ingestion contracts DEV (T-FR-0001-03)"]
  TFR0001_03_DEV --> TFR0001_03_VAL["Add income and liabilities ingestion contracts VAL (T-FR-0001-03)"]

  TFR0001_02_VAL --> TFR0001_04_TEST["Expose unified monthly financial summary API TEST (T-FR-0001-04)"]
  TFR0001_03_VAL --> TFR0001_04_TEST
  TFR0001_04_TEST --> TFR0001_04_DEV["Expose unified monthly financial summary API DEV (T-FR-0001-04)"]
  TFR0001_04_DEV --> TFR0001_04_VAL["Expose unified monthly financial summary API VAL (T-FR-0001-04)"]

  TFR0001_04_VAL --> TFR0001_05_TEST["Deliver Phase 2 unified dashboard view TEST (T-FR-0001-05)"]
  TFR0001_05_TEST --> TFR0001_05_DEV["Deliver Phase 2 unified dashboard view DEV (T-FR-0001-05)"]
  TFR0001_05_DEV --> TFR0001_05_VAL["Deliver Phase 2 unified dashboard view VAL (T-FR-0001-05)"]

  classDef triadDone fill:#2e7d32,color:#fff
  class TFR0000_01_TEST,TFR0000_01_DEV,TFR0000_01_VAL triadDone
  class TFR0001_01_TEST,TFR0001_01_DEV,TFR0001_01_VAL triadDone
  class TFR0001_03_TEST,TFR0001_03_DEV,TFR0001_03_VAL triadDone
```

When ticket **`T-FR-NNNN-xx`** is fully complete (TEST/DEV/VAL all `done` in **`ticket-progress.md`**), add:

`class TFRNNNN_xx_TEST,TFRNNNN_xx_DEV,TFRNNNN_xx_VAL triadDone`

(Example for `T-FR-0000-01`: `class TFR0000_01_TEST,TFR0000_01_DEV,TFR0000_01_VAL triadDone`.)
