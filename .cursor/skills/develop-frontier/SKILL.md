---
name: develop-frontier
description: >-
  Identifies the dependency-valid parallel ticket set, launches one subagent per
  ticket to complete TEST→DEV→VAL in separate worktrees, then runs finish-frontier
  or finish-feature per workflow. Use when the user says develop the frontier,
  implement the parallel frontier, or full parallel ticket implementation plus
  integration.
---

# Develop frontier

End-to-end: **discover** parallel-capable tickets, ensure each owning feature has a feature worktree, then run **one subagent per ticket** (separate child git worktree + feature-prefixed branch), **TEST → DEV → VAL** serially inside each ticket, then **`finish-feature`** (feature integration branch → PR to `main`) **or** **`finish-frontier`** (merge to `main` integration checkout) per **`docs/ai-context.md` §2d**.

## Preconditions

- Load **`docs/ai-context.md`** (worktrees, ticket completion, **§1b subagents ahead of large work**).
- Integration checkout on **`main`** available for merges.
- For feature-branch work, each owning feature branch **`feat/FR-NNNN-<slug>`** exists in **`.worktrees/FR-NNNN-<slug>/feature/`** (create it from `main` before launching ticket branches if needed).
- **Parent session:** stay thin — **one subagent per ticket** (**`T-FR-NNNN-xx`**) implements it; the orchestrator runs **`finish-feature`** or **`finish-frontier`**, per **`docs/ai-context.md` §1b**, **§2**, and **§2d**.
- **Development commands:** inside each ticket worktree, run build/test/lint/package-manager/dev-server/doc-build commands through Docker / Docker Compose / Dev Container / CI images where possible (for example **`./develop run …`**, `docker compose run …`, or the configured Dev Container). Host-local commands are exceptions and must be noted in the ticket diary or handoff.

## 0 — Refresh the frontier

1. Follow **`identify-frontier`** or read the latest **`tasks/handoffs/*-parallel-frontier.md`**.
2. If the parallel set is **empty**, stop and report.
3. Remember the set is **global** across all tickets — it may span **multiple `FR-NNNN`** features. Each subagent still owns **one ticket** and **one child worktree** under its owning feature folder, so mixed-feature batches stay clear (`docs/ai-context.md` §2c).

## 1 — Orchestrator setup

1. Set **`tasks/ticket-progress.md` → Current focus** so multi-ticket work is visible (**Session status** `developing`, **Next agent should** lists frontier tickets, branches, and **`.worktrees/FR-NNNN-<slug>/...`** paths).

## 2 — Launch one subagent per frontier ticket (parallel)

Each subagent prompt must include:

| Requirement | Detail |
|-------------|--------|
| **Ticket** | **`T-FR-NNNN-xx`**, title from the owning **`tasks/feature-history/FR-NNNN-<slug>/tickets.md`**. |
| **Worktree** | Feature branch at **`.worktrees/FR-NNNN-<slug>/feature/`**. Ticket/stage work in **`.worktrees/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name/`**, branch e.g. **`feat/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name`**, created from the feature branch. All phases **only** here. |
| **Phase order** | **TEST → DEV → VAL** serially for that ticket (per section in that ticket’s **`tickets.md`**). |
| **Validation** | Run ticket verification per **`docs/ai-context.md`** using Docker / Docker Compose / Dev Container / CI images where possible; document any host-local exception. |
| **Progress** | Update **only** that ticket’s row in **`tasks/ticket-progress.md`**. |
| **Completion** | VAL done → update DAG in **`docs/design/tickets-initial.md`** → commit → push → open **PR** whose **base** is **`feat/FR-NNNN-<slug>`** when using the **feature-branch workflow** (§2d), otherwise base **`main`** per **`docs/ai-context.md` §7**. |
| **Branch state** | Create or refresh repo-root **`CURRENT.md`** on the ticket branch at stream start, after each phase (**TEST / DEV / VAL**), and before push/PR; parent updates **`feat/FR-NNNN-<slug>`**’s **`CURRENT.md`** after merges — **`feature-request`** skill **Branch state (`CURRENT.md`)**. |

## 3 — Wait and verify

All frontier tickets **VAL** = `done`, branches **pushed**.

## 4 — Finish integration

- **Feature-branch workflow (preferred for `FR-NNNN` work):** follow **`finish-feature`** — merges ticket/stage branches into **`feat/FR-NNNN-<slug>`**, validates, opens **PR → `main`** for human review. **No** automatic push to **`main`**.
- **Direct-to-main frontier:** follow **`finish-frontier`** when integrating parallel tickets straight into **`main`** per existing policy.

Important gate from **`finish-frontier`**: after merge conflict resolution (including `triadDone` union), integration must revalidate all requirements/tests before any push to `main`.

- If revalidation passes, continue normally.
- If revalidation fails, create/update a blocker as the **primary ticket** in `tasks/ticket-progress.md`, set `Session status` to `blocked`, push integration state to `broken-main`, and stop. Do not run `develop-frontier` again until that blocker ticket reaches VAL `done`.

## 5 — After integration is green

- Clear or advance **Current focus**.
- **Remote branches:** do **not** auto-delete **`feat/*`** ticket or feature branches — audit trail (**`finish-frontier`** / **`finish-feature`**).
- **Local worktrees:** optional remove only when remotes remain and paths are obsolete.
- **User-facing response:** the orchestrator’s reply to the user ends with **Executive summary**, **Suggested next step**, and **Options** if several paths are reasonable — **`feature-request`** skill **User-facing close (required)**.

## See also

- **`identify-frontier`**, **`finish-feature`**, **`finish-frontier`**, **`docs/ai-context.md`**
