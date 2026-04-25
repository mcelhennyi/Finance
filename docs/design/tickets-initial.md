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

---

## DAG Overview (global)

Extend this diagram when new **`FR-NNNN`** lines add tickets that chain to existing work.

```mermaid
graph LR
  TFR0000_01_TEST[TFR0000_01_TEST] --> TFR0000_01_DEV[TFR0000_01_DEV]
  TFR0000_01_DEV --> TFR0000_01_VAL[TFR0000_01_VAL]

  classDef triadDone fill:#2e7d32,color:#fff
  class TFR0000_01_TEST,TFR0000_01_DEV,TFR0000_01_VAL triadDone
```

When ticket **`T-FR-NNNN-xx`** is fully complete (TEST/DEV/VAL all `done` in **`ticket-progress.md`**), add:

`class TFRNNNN_xx_TEST,TFRNNNN_xx_DEV,TFRNNNN_xx_VAL triadDone`

(Example for `T-FR-0000-01`: `class TFR0000_01_TEST,TFR0000_01_DEV,TFR0000_01_VAL triadDone`.)
