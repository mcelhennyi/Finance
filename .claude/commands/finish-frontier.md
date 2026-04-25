---
description: >-
  Commits and pushes parallel ticket/stage worktrees, rebases each feature branch onto
  origin/main in sequence, merges them into the integration main checkout, and
  pushes main only after mandatory post-merge revalidation.
---

# /finish-frontier

Use the Cursor project skill **`finish-frontier`** (`.cursor/skills/finish-frontier/SKILL.md`).

Close out **multi-worktree** feature branches that were valid in parallel (see **`tasks/feature-history/**/tickets.md`** **Deps:** and the global DAG in **`docs/design/tickets-initial.md`**). Branches may belong to **different** **`FR-NNNN`** product features — merge order stays **dependency-safe** on ticket ids **`T-FR-NNNN-xx`** (`docs/ai-context.md` §2c).

## Preconditions

- **Integration checkout** on **`main`** (not per-ticket development worktrees).
- Ordered branch list in dependency-safe order (shared foundations before dependents).
- For **heavy** merge/revalidation, delegate per-branch checks via **subagents**; keep the integration thread focused — **`docs/ai-context.md` §1b**.

## 1 — Clean worktrees: commit and push

For each ticket worktree:

1. `git status` and commit if dirty (message scoped to the **`T-FR-NNNN-xx`** ticket).
2. `git push -u origin HEAD`.

Do **not** commit nested `.worktrees/` directories into the integration clone; keep worktree paths handled per **`docs/ai-context.md`**.

## 2 — Rebase each feature branch onto `origin/main` (sequential)

In each feature worktree:

1. `git fetch origin`
2. `git rebase origin/main`
3. `git push --force-with-lease` if history moved.

## 3 — Merge into `main` candidate (integration checkout)

On **`main`**:

1. `git pull --ff-only origin main`
2. For each branch: `git merge --no-ff <branch> -m "merge: <short title> (finish frontier)"`
3. If conflicts touch `docs/design/tickets-initial.md`, keep a **union** of completed **`triadDone`** `class` lines for all completed tickets. If conflicts touch **`tasks/feature-history/**/tickets.md`**, merge without losing **`###`** ticket sections.
4. Resolve other conflicts deliberately (shared config, lockfiles, etc.).
5. Do not push yet.

## 4 — Post-merge revalidation gate (mandatory)

After union conflict resolution, run full integrated validation:

1. Re-run all required verification for the merged state (ticket acceptance checks and project test suite per **`docs/ai-context.md`**) inside Docker / Docker Compose / Dev Container / CI images where possible; document any host-local exception.
2. If **all checks pass**, `git push origin main`.
3. If **any check fails** or a requirement is unmet:
   - Create a blocker task as the **primary ticket** (repair ticket id) with explicit failing checks/requirements.
   - Update **`tasks/ticket-progress.md`**:
     - Set `Current focus` **Active ticket** to the blocker.
     - Set **Session status** to `blocked`.
     - Set **Next agent should** to fix the blocker before running `develop-frontier` again.
     - Add/update blocker `Progress` row with failing VAL details in `Notes`.
   - Commit tracker updates.
   - Push integration state to **`broken-main`** (`git push origin HEAD:broken-main`).
   - Stop; do not continue frontier development until blocker VAL is `done`.

## 5 — After push

- Update **`tasks/ticket-progress.md`** if needed.
- **Remote branches:** do **not** auto-delete **`feat/*`** ticket or feature branches — audit trail; same policy as **`finish-feature`** (**`docs/ai-context.md` §2d**).
- **Local worktrees:** optional remove only when safe and the **remote** branch is retained.

Pass explicit branch names and worktree paths in the user message if they differ from the active frontier handoff.

**When closing one product feature** (ticket/stage branches already target **`feat/FR-NNNN-<slug>`**), prefer **`/finish-feature`** instead of this command.
