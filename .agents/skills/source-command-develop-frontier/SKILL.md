---
name: "source-command-develop-frontier"
description: "Identifies the dependency-valid parallel ticket set, launches one subagent per ticket to complete TEST→DEV→VAL in separate .worktrees child worktrees, merges to feat/FR-NNNN-slug, then runs finish-feature only when §2d gate is met (else finish-frontier per policy) with a mandatory validation gate."
---

# source-command-develop-frontier

Use this skill when the user asks to run the migrated source command `develop-frontier`.

## Command Template

# /develop-frontier

Follow the Cursor project skill **`develop-frontier`** (`.cursor/skills/develop-frontier/SKILL.md`).

End-to-end: discover parallel-capable tickets (**global** graph — may span **multiple** **`FR-NNNN`** features per **`docs/ai-context.md` §2c**), run one subagent per ticket in a dedicated child worktree under **`.worktrees/FR-NNNN-<slug>/`**, execute **TEST → DEV → VAL** serially per ticket, merge ticket work into **`feat/FR-NNNN-<slug>`**, validate, and push **that feature branch**. Run **`finish-feature`** (PR to the default branch) **only** when **`docs/ai-context.md` §2d** **feature-complete gate** is met; otherwise run **`/identify-frontier`** for the next wave. Use **`finish-frontier`** when integrating straight into the default branch per **`docs/ai-context.md` §2d**.

## Preconditions

- Load **`docs/ai-context.md`** (worktrees, ticket completion rules, **§1b** — parent stays thin; **one subagent per ticket** does the work; **§2d** — default-branch PR only after feature-complete gate).
- **Feature-branch workflow:** feature integration branch **`feat/FR-NNNN-<slug>`** exists at **`.worktrees/FR-NNNN-<slug>/feature/`** (or will be created before ticket branches). **Direct-to-main:** integration checkout on the default branch is available for **`finish-frontier`**.
- **Development commands:** build/test/lint/package-manager/dev-server/doc-build commands run in Docker / Docker Compose / Dev Container / CI images where possible. Use repo wrappers such as **`./develop run …`** or `docker compose run …`; document host-local exceptions in the ticket diary or handoff.
- **Web UI validation:** any frontier ticket that creates or changes user-visible web UI must satisfy **`docs/ai-context.md` → Web UI validation** before **VAL** is marked `done`: scripted frontend checks plus rendered browser inspection using the project’s documented commands, local URL, browser-capable tool, and route/state matrix.

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
- Run validation per **`docs/ai-context.md`** using Docker / Docker Compose / Dev Container / CI images where possible; for web UI tickets, include required scripted frontend checks plus rendered browser inspection. Document any host-local or browser-tool exception.
- Update only its ticket row in **`tasks/ticket-progress.md`**.
- On VAL done: update DAG, commit, push, and open **PR** per **`docs/ai-context.md` §7** — **base** **`feat/FR-NNNN-<slug>`** when using the feature-branch workflow (**§2d**), otherwise **base** default branch — unless publishing is held.

## 3 — Wait and verify

- All frontier tickets have **VAL = done**.
- All feature branches are pushed.

## 4 — Finish integration

- **Default for a single `FR-NNNN` product line:** merge ticket/stage branches into **`feat/FR-NNNN-<slug>`**, revalidate, push the feature branch. Run **`finish-feature`** **only** when **§2d** **feature-complete gate** is met (then PR to default branch). **Do not** open that PR for partial delivery. **Do not** push the default branch from automation.
- **Direct-to-main frontier:** run **`finish-frontier`** — merge into the default branch, union `triadDone` and shared files, mandatory revalidation, then push per that skill.

Do **not** auto-delete remote **`feat/*`** branches (**`docs/ai-context.md` §2d**).

## 5 — After integration is green

- Clear or advance `Current focus`.
- Optionally remove **local** worktree directories only when remotes remain for audit.
