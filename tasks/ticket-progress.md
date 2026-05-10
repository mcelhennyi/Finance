# Ticket progress

## Current focus

| Field | Value |
|-------|--------|
| **Active ticket** | **Define budget allocation contracts** (`T-FR-0002-01`) |
| **Active phase** | `starting` |
| **Branch / worktree** | `feat/FR-0002-budget-entry-page` at `.worktrees/FR-0002-budget-entry-page/feature/`; ticket worktree pending |
| **Session status** | `developing` |
| **Next agent should** | Start **Define budget allocation contracts** (`T-FR-0002-01`) in `.worktrees/FR-0002-budget-entry-page/T-FR-0002-01-define-budget-allocation-contracts/`, branch `feat/FR-0002-budget-entry-page/T-FR-0002-01-define-budget-allocation-contracts`, then complete TEST → DEV → VAL. |

### Parallel streams (optional)

Use when **more than one** ticket id or **`FR-NNNN`** is actively developed in parallel. Each stream: own `.worktrees/FR-NNNN-<slug>/...` worktree and feature-prefixed branch; update **only** your **Progress** row for your ticket.

| Stream label | Ticket(s) | `FR-NNNN` (if any) | Branch / worktree | Owner / note |
|----------------|------------|--------------------|-------------------|--------------|
| Budget allocation contracts | `T-FR-0002-01` | `FR-0002` | `feat/FR-0002-budget-entry-page/T-FR-0002-01-define-budget-allocation-contracts` / `.worktrees/FR-0002-budget-entry-page/T-FR-0002-01-define-budget-allocation-contracts/` | Frontier stream ready to launch |

**Completed features** (`REGISTRY.md` → **`complete`**) are **not** listed in **Parallel streams** — they are closed out with **`90-closeout.md`** in **`tasks/feature-history/FR-NNNN-<slug>/`** (see **`.cursor/skills/feature-request/SKILL.md`** → **Closeout**). **`FR-0003`** closeout: [`FR-0003-bbd-projection-ui/90-closeout.md`](feature-history/FR-0003-bbd-projection-ui/90-closeout.md). **`FR-0004`** closeout: [`FR-0004-bbd-projection-experience/90-closeout.md`](feature-history/FR-0004-bbd-projection-experience/90-closeout.md).

---

## Progress

| Ticket | Title | TEST | DEV | VAL | Notes |
|--------|-------|------|-----|-----|-------|
| T-FR-0000-01 | Choose stack and scaffold repository | done | done | done | `FR-0000` (manually completed outside ticket workflow) |
| T-FR-0001-01 | Define goals and budgets data contracts | done | done | done | `FR-0001` |
| T-FR-0001-02 | Build goals and budget actuals engine | done | done | done | `FR-0001` (Dockerized test/validation; seeded-month reconciliation covered by integration fixture) |
| T-FR-0001-03 | Add income and liabilities ingestion contracts | done | done | done | `FR-0001` (Dockerized test/validation; seeded CSV ingest + aggregate verification complete) |
| T-FR-0001-04 | Expose unified monthly financial summary API | done | done | done | `FR-0001` (GET `/api/unified-view/summary`; `finance.unified.monthly`; tests + USD 10 reconciliation block) |
| T-FR-0001-05 | Deliver Phase 2 unified dashboard view | done | done | done | `FR-0001` (Unified view page, vitest: alerts + month + contract shape) |
| T-FR-0002-01 | Define budget allocation contracts | todo | todo | todo | `FR-0002`; first eligible implementation ticket; depends on completed `T-FR-0001-05` |
| T-FR-0002-02 | Expose budget allocation API | todo | todo | todo | `FR-0002`; depends on `T-FR-0002-01` |
| T-FR-0002-03 | Sync allocation totals into unified budgets | todo | todo | todo | `FR-0002`; depends on `T-FR-0002-02` |
| T-FR-0002-04 | Deliver budget entry page | todo | todo | todo | `FR-0002`; depends on `T-FR-0002-02` |
| T-FR-0002-05 | Validate and document budget entry workflow | todo | todo | todo | `FR-0002`; depends on `T-FR-0002-03` and `T-FR-0002-04` |
| T-FR-0003-01 | Extract BBD projection as importable module | done | done | done | `FR-0003`; `src/finance/bbd/engine.py` + tests |
| T-FR-0003-02 | Add BBD projection REST API | done | done | done | `FR-0003`; `POST /api/bbd-projection/run` |
| T-FR-0003-03 | Deliver BBD projection page | done | done | done | `FR-0003`; **BBD** nav — `frontend/src/pages/BbdProjectionPage.tsx` |
| T-FR-0003-04 | Validate BBD UX and document operator workflow | done | done | done | `FR-0003`; `scripts/README.md` + pytest / host notes |
| T-FR-0004-01 | BBD bottom control dock and relocated actions | done | done | done | `FR-0004`; dock chrome + Docs label (implemented prior + refined) |
| T-FR-0004-02 | BBD visualization view-model and chart-ready series | done | done | done | `FR-0004`; `frontend/src/lib/bbdVizModel.ts` + vitest |
| T-FR-0004-03 | BBD 2D story dashboard and educational callouts | done | done | done | `FR-0004`; `BbdStoryDashboard.tsx` |
| T-FR-0004-04 | BBD spatial / 3D–time experience (lazy WebGL) | done | done | done | `FR-0004`; `BbdSpatialPanel.tsx`, lazy + reduced-motion |
| T-FR-0004-05 | BBD experience integration VAL and operator docs | done | done | done | `FR-0004`; Docker lint/test, `scripts/README.md` |

---

## How to choose next work

1. Prefer the **smallest incomplete ticket** whose **Deps** are all **VAL** = `done`.
2. If **Session status** is `blocked`, resolve the blocker before starting new parallel batches.
