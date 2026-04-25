---
description: >-
  Identifies the dependency-valid parallel ticket set, launches one subagent per
  ticket to complete TEST→DEV→VAL in separate .worktrees child worktrees, then runs finish-feature
  or finish-frontier per docs/ai-context.md §2d with a mandatory validation gate.
---

# /develop-frontier

Follow the Cursor project skill **`develop-frontier`** (`.cursor/skills/develop-frontier/SKILL.md`).

End-to-end: discover parallel-capable tickets (**global** graph — may span **multiple** **`FR-NNNN`** features per **`docs/ai-context.md` §2c**), run one subagent per ticket in a dedicated child worktree under **`.worktrees/FR-NNNN-<slug>/`**, execute **TEST → DEV → VAL** serially per ticket, then run **`finish-feature`** (feature branch → **PR to `main`**) **or** **`finish-frontier`** (merge into **`main`**) per **`docs/ai-context.md` §2d**.

## Preconditions

- Load **`docs/ai-context.md`** (worktrees, ticket completion rules, **§1b** — parent stays thin; **one subagent per ticket** does the work; **§2d** — PR **base** for completed tickets).
- **Feature-branch workflow:** feature integration branch **`feat/FR-NNNN-<slug>`** exists at **`.worktrees/FR-NNNN-<slug>/feature/`** (or will be created before ticket PRs). **Direct-to-main:** integration checkout on **`main`** is available for **`finish-frontier`**.
- **Development commands:** build/test/lint/package-manager/dev-server/doc-build commands run in Docker / Docker Compose / Dev Container / CI images where possible. Use repo wrappers such as **`./develop run …`** or `docker compose run …`; document host-local exceptions in the ticket diary or handoff.

## 0 — Refresh the frontier

1. Run **`identify-frontier`** or read latest **`tasks/handoffs/*-parallel-frontier.md`**.
2. Build the **eligible ∩ incomplete** ticket set.
3. If empty, stop and report.

## 1 — Orchestrator setup

1. Update **`tasks/ticket-progress.md`** `Current focus` for multi-ticket work:
   - **Session status**: `developing`
   - **Next agent should**: frontier ticket ids, branches, and `.worktrees/FR-NNNN-<slug>/...` paths

## 2 — Launch one subagent per frontier ticket (parallel)

Each subagent must:

- Work on one ticket (**`T-FR-NNNN-xx`**, title from **`tasks/feature-history/**/tickets.md`**).
- Use only its child worktree (for example `.worktrees/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name/`, branch `feat/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name`).
- Execute phases serially: **TEST → DEV → VAL** for that ticket (per its **`tickets.md`** section).
- Run validation per **`docs/ai-context.md`** using Docker / Docker Compose / Dev Container / CI images where possible; document any host-local exception.
- Update only its ticket row in **`tasks/ticket-progress.md`**.
- On VAL done: update DAG, commit, push, and open **PR** per **`docs/ai-context.md` §7** — **base** **`feat/FR-NNNN-<slug>`** when using the feature-branch workflow (**§2d**), otherwise **base** **`main`** — unless publishing is held.

## 3 — Wait and verify

- All frontier tickets have **VAL = done**.
- All feature branches are pushed.

## 4 — Finish integration

- **Default for a single `FR-NNNN` product line:** run **`finish-feature`** — merge ticket/stage branches into **`feat/FR-NNNN-<slug>`**, revalidate there, push the feature branch, open **PR → `main`**. Do **not** push **`main`** from automation.
- **Direct-to-main frontier:** run **`finish-frontier`** — merge into **`main`**, union `triadDone` and shared files, mandatory revalidation, then push **`main`** or **`broken-main`** per that skill.

Do **not** auto-delete remote **`feat/*`** branches (**`docs/ai-context.md` §2d**).

## 5 — After integration is green

- Clear or advance `Current focus`.
- Optionally remove **local** worktree directories only when remotes remain for audit.
