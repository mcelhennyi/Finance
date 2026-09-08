---
name: develop-frontier
description: >-
  Identifies the dependency-valid parallel ticket set, launches one subagent per
  ticket to complete TEST→DEV→VAL in separate worktrees, merges ticket work into
  feat/FR-NNNN-slug, refreshes project remote-default authority and checks the
  skeleton hash before every wave, syncing only when it changed, then runs
  finish-feature only when docs/ai-context.md §2d feature-complete gate is met
  (otherwise finish-frontier per policy).
  Use when the user says develop the frontier,
  implement the parallel frontier, or full parallel ticket implementation plus
  integration.
---

# Develop frontier

End-to-end: **discover** parallel-capable tickets, ensure each owning feature has a feature worktree, then run **one subagent per ticket** (separate child git worktree + feature-prefixed branch), **TEST → DEV → VAL** serially inside each ticket, then merge ticket work into each **`feat/FR-NNNN-<slug>`**, validate, and push **those feature branches**. Run **`finish-feature`** (feature branch → PR to the default branch + **mandatory closeout**) **only** when **`docs/ai-context.md` §2d** **feature-complete gate** is met for that **`FR-NNNN`**; otherwise continue with **`/identify-frontier`** / the next wave. Use **`finish-frontier`** only when merging straight to the default branch per policy.

## Preconditions

- Load **`docs/ai-context.md`** (worktrees, ticket completion, **§1b subagents ahead of large work**).
- Integration checkout on **`main`** available for merges.
- For feature-branch work, each owning feature branch **`feat/FR-NNNN-<slug>`** exists in **`.worktrees/FR-NNNN-<slug>/feature/`** (create it from `main` before launching ticket branches if needed).
- **Parent session:** stay thin — **one subagent per ticket** (**`T-FR-NNNN-xx`**) implements it; the orchestrator merges to **`feat/FR-NNNN-<slug>`** and runs **`finish-feature`** (default-branch PR) **only** when **§2d** **feature-complete gate** is met, or runs **`finish-frontier`** when integrating straight to the default branch, per **`docs/ai-context.md` §1b**, **§2**, and **§2d**.
- **Continuous bugs:** every distinct operator bug gets its own subagent lane
  and solving ticket. The parent keeps accepting new reports while workers run;
  shared id/DAG planning integrates serially, while dependency-safe,
  file-disjoint TEST→DEV→VAL lanes may run in parallel.
- **Integration owner:** name one owner (normally the parent) for shared
  BUG/T-FR/DAG/tracker allocation. Bug lanes may draft/push planning branches;
  only that owner verifies/merges the allocation, advances canonical next ids,
  and releases the next allocator.
- **Development commands:** inside each ticket worktree, run build/test/lint/package-manager/dev-server/doc-build commands through Docker / Docker Compose / Dev Container / CI images where possible (for example **`./develop run …`**, `docker compose run …`, or the configured Dev Container). Host-local commands are exceptions and must be noted in the ticket diary or handoff.
- **Web UI validation:** any frontier ticket that creates or changes user-visible web UI must satisfy **`docs/ai-context.md` → Web UI validation** before **VAL** is marked `done`: scripted frontend checks plus rendered browser inspection using the project’s documented commands, local URL, browser-capable tool, and route/state matrix.

## 0 — Refresh project authority, then check the skeleton hash

Run this read-first gate before the first wave and repeat it before every later
wave or bug micro-wave. A running wave does not exempt a new dispatch. Do not
run `sync-skeleton` unless the remote skeleton hash differs from the consumer's
pinned `.skeleton` gitlink hash.

1. From a clean integration worktree, resolve the project's remote default
   branch (prefer `refs/remotes/origin/HEAD`; otherwise use configured project
   policy) and fetch it. Create or fast-forward the clean integration worktree
   to that freshly fetched tip (or create a new detached clean worktree there)
   and verify its `HEAD` equals the fetched remote-default commit. Stop if it
   cannot be resolved, fetched, or made exact; never compare a stale
   `HEAD:.skeleton`.
2. For every feature that may own a ticket in this dispatch, test whether the
   feature head contains the fetched remote-default commit. If not, merge the
   remote default into the feature branch **before** creating or refreshing
   child worktrees. Never rebase or force-push shared feature history.
3. Resolve conflicts by preserving both intents. Re-read every changed
   authority/process/design artifact (including `AGENTS.md`,
   `docs/ai-context*.md`, rules, skills, and handoffs) and validate behavior or
   docs affected by the merge. Stop dispatch on unresolved conflicts or failed
   validation. Notify already-running lanes of the controller commit; at their
   next TEST/DEV/VAL boundary they merge the refreshed feature, re-read changed
   authority, and validate before continuing. Pause immediately if the new
   direction invalidates current scope.
4. From the refreshed clean integration worktree,
   initialize `.skeleton` only when its checkout is missing. Read the configured
   `.skeleton` tracking branch from `.gitmodules`, fetch only that submodule
   remote ref with `git -C .skeleton fetch origin <tracking-branch>`, and compare:
   - old pinned consumer hash: `git rev-parse HEAD:.skeleton` (record it)
   - fetched remote hash: `git -C .skeleton rev-parse FETCH_HEAD`
   Never overwrite a dirty checkout; use a separate clean worktree or stop.
   If the tracking branch or either hash cannot be resolved, stop; do not guess
   that the skeleton is current.
5. If the hashes are equal, record the no-op and **do not run**
   `sync-skeleton`, apply deprecations, copy manifest paths, read the changelog,
   stage files, create a sync commit, push, or refresh feature branches for a
   nonexistent update. Continue directly to frontier discovery.
6. If the hashes differ, run **`./sync-skeleton`** (or
   **`bash .skeleton/scripts/sync-skeleton.sh`** when the wrapper is absent).
   Record the new integrated skeleton SHA and review
   **`.skeleton/CHANGELOG.md`** mechanically over `old..new` (for example
   `git -C .skeleton diff <old>..<new> -- CHANGELOG.md`). Also list tags crossed
   by the range (`git -C .skeleton tag --merged <new> --no-merged <old>`) and
   review their release sections. Apply only Consumer manual and Deprecation
   instructions introduced or changed by this range; do not replay unrelated
   older Unreleased actions. Review and validate every staged change, then
   commit and push the sync to the remote default branch using project policy.
7. Only after an actual sync, ensure every feature integration branch that may
   own a ticket in this wave contains the landed skeleton-sync commit before
   creating child ticket worktrees. Prefer merging the updated default branch;
   do not rewrite shared feature history unless project policy explicitly
   allows it. Re-read this skill from the refreshed project files.
8. Follow
   **`identify-frontier`** or read the latest
   **`tasks/handoffs/*-parallel-frontier.md`**.
9. If the parallel set is **empty**, stop and report.
10. Remember the set is **global** across all tickets — it may span **multiple
   `FR-NNNN`** features. Each subagent still owns **one ticket** and **one child
   worktree** under its owning feature folder, so mixed-feature batches stay
   clear (`docs/ai-context.md` §2c).

If the project-default refresh, authority reread, hash check, or an actual
skeleton update, changelog reconciliation, validation, commit, push, or
feature-branch refresh cannot complete cleanly, record it as the current
blocker and stop before launching the wave.

## 1 — Orchestrator setup

1. Set **`tasks/ticket-progress.md` → Current focus** so multi-ticket work is visible (**Session status** `developing`, **Next agent should** lists frontier tickets, branches, and **`.worktrees/FR-NNNN-<slug>/...`** paths).
2. In each affected feature's **`20-tickets-dag.md`**, keep the canonical
   Mermaid DAG at the top. Run **`python3 scripts/refresh_ticket_dags.py --root
   .`** before dispatch, then review that labels/dependencies are plain English,
   stable ids/edges are unchanged, TEST/DEV/VAL-complete tickets are green, this
   wave's in-development tickets are yellow, outstanding/dependency-waiting
   tickets are red, and the no-more-than-three-sentence **Where things stand**
   project/feature explanation is directly below the DAG. Verify with the same
   command plus **`--check`**. The integration owner commits/pushes this shared
   status; ticket workers do not race it.

## 2 — Launch one subagent per frontier ticket (parallel)

Immediately before creating any child worktree, refetch the project remote
default and compare it with the controller tip used for §0 (or the landed sync
tip after an actual update). If it differs, create no worktree and dispatch no
agent: restart §0 project merge/reread/validation plus the skeleton gate against
the new tip.

For operator bugs, treat each newly integrated solving ticket as a micro-wave:
dispatch it when dependencies and capacity permit without waiting for unrelated
running workers. Continue to serialize shared feature-branch planning and
integration commits.

Each subagent prompt must include:

| Requirement | Detail |
|-------------|--------|
| **Ticket** | **`T-FR-NNNN-xx`**, title from the owning **`tasks/feature-history/FR-NNNN-<slug>/tickets.md`**. |
| **Worktree** | Feature branch at **`.worktrees/FR-NNNN-<slug>/feature/`**. Ticket/stage work in **`.worktrees/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name/`**, branch e.g. **`feat/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name`**, created from the feature branch. All phases **only** here. |
| **Phase order** | **TEST → DEV → VAL** serially for that ticket (per section in that ticket’s **`tickets.md`**). |
| **Validation** | Run ticket verification per **`docs/ai-context.md`** using Docker / Docker Compose / Dev Container / CI images where possible; for web UI tickets, include required scripted frontend checks plus rendered browser inspection. Document any host-local or browser-tool exception. |
| **Progress** | Update **only** that ticket’s row in **`tasks/ticket-progress.md`**. |
| **Completion** | VAL done → update DAG in **`docs/design/tickets-initial.md`** → commit → push → open **PR** whose **base** is **`feat/FR-NNNN-<slug>`** when using the **feature-branch workflow** (§2d), otherwise base **`main`** per **`docs/ai-context.md` §7**. |
| **Branch state** | Create or refresh repo-root **`CURRENT.md`** on the ticket branch at stream start, after each phase (**TEST / DEV / VAL**), and before push/PR; parent updates **`feat/FR-NNNN-<slug>`**’s **`CURRENT.md`** after merges — **`feature-request`** skill **Branch state (`CURRENT.md`)**. |

## 3 — Wait and verify

All frontier tickets **VAL** = `done`, branches **pushed**.

At the wave barrier, reconcile every affected feature's top DAG again from the
verified tracker/branch evidence: completed nodes green, unfinished active nodes
yellow, and remaining outstanding nodes red. Run the refresh command, review the
updated plain-English labels/dependencies and project/feature explanation, and
require **`--check`** to pass. Commit the DAG transition with the feature
controller before dispatching the next wave.

## 4 — Finish integration

- **Feature-branch workflow (preferred for `FR-NNNN` work):** merge completed ticket/stage branches into **`feat/FR-NNNN-<slug>`**, revalidate, push **that feature branch**. Call **`finish-feature`** only when **§2d** **feature-complete gate** is met (then open a PR from **`feat/FR-NNNN-<slug>`** to the default branch and run **closeout** per **`finish-feature`** skill §5). **Do not** open that PR for partial feature delivery. **No** automatic push to the default branch.
- **Direct-to-main frontier:** follow **`finish-frontier`** when integrating parallel tickets straight into the default branch per existing policy.

Important gate from **`finish-frontier`**: after merge conflict resolution (including `triadDone` union), integration must revalidate all requirements/tests before any push to `main`.

- If revalidation passes, continue normally.
- If revalidation fails, create/update a blocker as the **primary ticket** in `tasks/ticket-progress.md`, set `Session status` to `blocked`, push integration state to `broken-main`, and stop. Do not run `develop-frontier` again until that blocker ticket reaches VAL `done`.

## 5 — After integration is green

- Clear or advance **Current focus**.
- Confirm each affected feature's top DAG reflects the completed wave and the
  next dispatch state using green/yellow/red lifecycle classes, plain-English
  labels/dependencies, and a current project/feature explanation directly below
  the graph; require the refresh tool's **`--check`** to pass.
- **Remote branches:** do **not** auto-delete **`feat/*`** ticket or feature branches — audit trail (**`finish-frontier`** / **`finish-feature`**).
- **Local worktrees:** optional remove only when remotes remain and paths are obsolete.
- **User-facing response:** the orchestrator’s reply to the user ends with **Executive summary**, **Suggested next step**, and **Options** if several paths are reasonable — **`feature-request`** skill **User-facing close (required)**.

## See also

- **`identify-frontier`**, **`finish-feature`**, **`finish-frontier`**, **`docs/ai-context.md`**
