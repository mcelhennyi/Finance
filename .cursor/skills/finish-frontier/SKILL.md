---
name: finish-frontier
description: >-
  Commits and pushes parallel ticket/stage worktrees, rebases each feature branch
  onto origin/main in sequence, merges them into the integration main checkout,
  and pushes main. Respects per-feature tickets.md and global tickets-initial DAG.
  Use when closing a parallel frontier (multi-ticket worktrees), after handoffs
  like tasks/handoffs/*parallel-frontier*, or when the user says finish frontier.
---

# Finish frontier

Close out **multi-worktree** feature branches that were valid in parallel (see **`tasks/feature-history/**/tickets.md`** **Deps:** and the global DAG in **`docs/design/tickets-initial.md`**).

## Preconditions

- **Integration checkout** on **`main`** (not the per-ticket development worktrees).
- Ordered list of branches to merge (dependency-safe order: shared foundations before dependents).
- If merge + revalidation is **large**, follow **`docs/ai-context.md` §1b**: delegate per-branch sanity checks to subagents; keep the integration session focused on conflict resolution and the final gate.

## 1 — Clean worktrees: commit and push

For each ticket worktree:

1. `git status` — commit if dirty; message scoped to the **`T-FR-NNNN-xx`** ticket.
2. `git push -u origin HEAD`.

Do **not** commit nested worktree directories into the integration clone; keep **`.worktrees/`** gitignored per **`docs/ai-context.md`**.

## 2 — Rebase each feature branch onto `origin/main` (sequential)

In each feature worktree:

1. `git fetch origin`
2. `git rebase origin/main`
3. `git push --force-with-lease` if history moved.

## 3 — Merge into `main` candidate (integration checkout)

On **`main`**:

1. `git pull --ff-only origin main`
2. For each branch: `git merge --no-ff <branch> -m "merge: <short title> (finish frontier)"` — branches may come from **different** product features (`FR-NNNN`); merge order is still **dependency-safe** over ticket ids **`T-FR-NNNN-xx`**, not per-feature isolation (`docs/ai-context.md` §2c).
3. **Conflicts in `docs/design/tickets-initial.md`** (global DAG / **`triadDone`**): keep a **union** of completed **`triadDone`** `class` lines for all finished tickets. If conflicts touch a feature’s **`tasks/feature-history/.../tickets.md`**, resolve without dropping **`###`** sections — prefer merging both sides’ intent.
4. Resolve any other conflicts (shared config, lockfiles) deliberately — prefer mainline + both features’ intent.
5. Do not push yet.

## 4 — Post-merge revalidation gate (mandatory)

After the union conflict resolution is complete, run full validation in the integration checkout:

1. Re-run all required verification for the merged state (ticket acceptance checks and project test suite per `docs/ai-context.md`).
2. If **all checks pass**, `git push origin main`.
3. If **any check fails** or a requirement is unmet:
   - Create a new blocker task as the **primary ticket** (new **`T-FR-NNNN-xx`** id following **`docs/design/documentation-style.md` §Ticket IDs**, e.g. append a repair sequence number for that `FR`) with explicit failing checks/requirements.
   - Update **`tasks/ticket-progress.md`**:
     - `Current focus` → **Active ticket** set to that blocker.
     - **Session status** set to `blocked`.
     - **Next agent should** instruct to fix the blocker before running `develop-frontier` again.
     - Add/update the blocker row in `Progress` with failing VAL details in `Notes`.
   - Commit these tracker updates.
   - Push the integration state to **`broken-main`** (`git push origin HEAD:broken-main`) so broken code never lands on `main`.
   - Stop; do not continue frontier development until the blocker ticket reaches VAL `done`.

## 5 — After push

- Update **`tasks/ticket-progress.md`** if needed.
- **Branch audit:** Do **not** automatically **`git push origin --delete`** or **`git branch -D`** merged **`feat/*`** branches — they preserve how work evolved; removal requires **explicit human** approval.
- **Local worktrees:** Optionally `git worktree remove` **only** to reclaim disk when the **remote** branch remains and the team no longer needs that path.

## See also

- **`docs/ai-context.md`** (§2c, §2d), **`develop-frontier`**, **`finish-feature`**
