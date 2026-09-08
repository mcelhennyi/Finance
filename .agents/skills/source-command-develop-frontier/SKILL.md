---
name: "source-command-develop-frontier"
description: "Before every wave refreshes project remote-default authority, then checks the skeleton hash and syncs only when changed; launches one subagent per ticket for TEST→DEV→VAL, including continuous per-bug lanes, and integrates per feature-complete policy."
---

# source-command-develop-frontier

Use this skill when the user asks to run the migrated source command `develop-frontier`.

## Command Template

# /develop-frontier

Follow the Cursor project skill **`develop-frontier`** (`.cursor/skills/develop-frontier/SKILL.md`).

End-to-end: before every wave or bug micro-wave, fetch the project remote default, make the clean integration worktree HEAD equal that fetched tip, merge absent updates into affected features, re-read changed authority/docs, and validate the impact; then compare pinned/remote skeleton hashes and sync/land only a real skeleton update. Keep each feature's canonical Mermaid DAG at the top of **`20-tickets-dag.md`** and run **`python3 scripts/refresh_ticket_dags.py --root .`** before/after every wave: visible labels/dependencies remain plain English with stable ids preserved, completed is green, in-development yellow, outstanding red, and a generated project/feature explanation of no more than three sentences sits directly below the graph; require **`--check`** before commit/dispatch. Discover parallel-capable tickets (**global** graph), run one subagent per ticket in a child worktree, and execute **TEST → DEV → VAL** serially per ticket. Each operator bug keeps its own lane; one named integration owner serializes and advances shared id/DAG allocation while dependency-safe ticket workers can run in parallel. Merge ticket work into **`feat/FR-NNNN-<slug>`**, validate, and push that feature branch. Run **`finish-feature`** only when **§2d** passes.

## Preconditions

- Load **`docs/ai-context.md`** (worktrees, ticket completion rules, **§1b** — parent stays thin; **one subagent per ticket** does the work; **§2d** — default-branch PR only after feature-complete gate).
- **Feature-branch workflow:** feature integration branch **`feat/FR-NNNN-<slug>`** exists at **`.worktrees/FR-NNNN-<slug>/feature/`** (or will be created before ticket branches). **Direct-to-main:** integration checkout on the default branch is available for **`finish-frontier`**.
- **Development commands:** build/test/lint/package-manager/dev-server/doc-build commands run in Docker / Docker Compose / Dev Container / CI images where possible. Use repo wrappers such as **`./develop run …`** or `docker compose run …`; document host-local exceptions in the ticket diary or handoff.
- **Web UI validation:** any frontier ticket that creates or changes user-visible web UI must satisfy **`docs/ai-context.md` → Web UI validation** before **VAL** is marked `done`: scripted frontend checks plus rendered browser inspection using the project’s documented commands, local URL, browser-capable tool, and route/state matrix.

## 0 — Refresh project authority, then check the skeleton hash

Before the first wave and every later wave or bug micro-wave:

1. Resolve and fetch the project remote default from a clean integration
   worktree. Create/fast-forward that clean worktree so `HEAD` equals the
   freshly fetched tip; never compare a stale `HEAD:.skeleton`. Merge its newest
   absent commit into each affected feature without rebasing shared history;
   resolve conflicts, re-read changed authority/docs, and validate impacted
   behavior. Stop if this cannot complete.
2. From the refreshed clean integration worktree, initialize `.skeleton` only
   if its checkout is missing. Read its
   tracking branch from `.gitmodules`, fetch only that submodule remote ref,
   using `git -C .skeleton fetch origin <tracking-branch>`, and compare
   recorded old pin `git rev-parse HEAD:.skeleton` with
   `git -C .skeleton rev-parse FETCH_HEAD`.
   Stop instead of assuming no update when the branch or either hash cannot be
   resolved.
3. Equal hashes are a no-op: do **not** run `sync-skeleton`, apply its
   deprecations/copies, read its changelog, stage, commit, push, or refresh
   feature branches for a nonexistent update. Continue to frontier discovery.
4. Different hashes require **`./sync-skeleton`** (or the script under
   `.skeleton/scripts/`), changelog reconciliation, validation, commit, and push
   to the remote default branch using project policy. Review `CHANGELOG.md`
   exactly over old-pin..new-integrated SHA plus crossed release tags, applying
   only introduced/changed Consumer manual and Deprecation instructions.
5. Only after an actual sync, ensure every affected
   `feat/FR-NNNN-<slug>` branch contains the landed sync commit before child
   worktrees launch, then re-read the refreshed canonical skill.
6. Run
   **`identify-frontier`** or read the latest frontier handoff.
7. Build the **eligible ∩ incomplete** ticket set. If empty, stop and report.

## 1 — Orchestrator setup

1. Update **`tasks/ticket-progress.md`** `Current focus` for multi-ticket work:
   - **Session status**: `developing`
   - **Next agent should**: frontier ticket ids, branches, and `.worktrees/FR-NNNN-<slug>/...` paths
2. Run the ticket-DAG refresh command, review every affected top DAG and its
   directly-below **Where things stand** explanation, then require **`--check`**
   to pass before dispatch.

## 2 — Launch one subagent per frontier ticket (parallel)

Immediately before child-worktree creation, refetch the project remote default.
If it differs from the controller tip used for the completed gates, dispatch
nothing and restart the project merge/reread/validation plus skeleton gate.

Each subagent must:

- Work on one ticket (**`T-FR-NNNN-xx`**, title from **`tasks/feature-history/**/tickets.md`**).
- Use only its child worktree (for example `.worktrees/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name/`, branch `feat/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name`).
- Execute phases serially: **TEST → DEV → VAL** for that ticket (per its **`tickets.md`** section).
- Run validation per **`docs/ai-context.md`** using Docker / Docker Compose / Dev Container / CI images where possible; for web UI tickets, include required scripted frontend checks plus rendered browser inspection. Document any host-local or browser-tool exception.
- Update only its ticket row in **`tasks/ticket-progress.md`**.
- On VAL done: update DAG, commit, push, and open **PR** per **`docs/ai-context.md` §7** — **base** **`feat/FR-NNNN-<slug>`** when using the feature-branch workflow (**§2d**), otherwise **base** default branch — unless publishing is held.

New operator bugs do not wait for the current wave barrier: after serialized
planning integration and this pre-wave gate, dispatch each dependency-safe
solving ticket when capacity permits.

## 3 — Wait and verify

- All frontier tickets have **VAL = done**.
- All feature branches are pushed.
- Run the ticket-DAG refresh command again at the wave barrier, review the
  generated labels/dependencies, colors, and project/feature explanation, and
  require **`--check`** before the next wave.

## 4 — Finish integration

- **Default for a single `FR-NNNN` product line:** merge ticket/stage branches into **`feat/FR-NNNN-<slug>`**, revalidate, push the feature branch. Run **`finish-feature`** **only** when **§2d** **feature-complete gate** is met (then PR to default branch). **Do not** open that PR for partial delivery. **Do not** push the default branch from automation.
- **Direct-to-main frontier:** run **`finish-frontier`** — merge into the default branch, union `triadDone` and shared files, mandatory revalidation, then push per that skill.

Do **not** auto-delete remote **`feat/*`** branches (**`docs/ai-context.md` §2d**).

## 5 — After integration is green

- Clear or advance `Current focus`.
- Optionally remove **local** worktree directories only when remotes remain for audit.
