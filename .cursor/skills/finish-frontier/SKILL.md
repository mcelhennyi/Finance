---
name: finish-frontier
description: >-
  Commits and pushes parallel ticket/stage worktrees, rebases each feature branch
  onto origin/main in sequence, merges them into an integration candidate, and
  prepares validated default-branch integration. Any applicable expert gate
  requires a non-default integration branch and pull request. Respects
  per-feature tickets.md and global tickets-initial DAG.
  Use when closing a parallel frontier (multi-ticket worktrees), after handoffs
  like tasks/handoffs/*parallel-frontier*, or when the user says finish frontier.
---

# Finish frontier

Close out **multi-worktree** feature branches that were valid in parallel (see **`tasks/feature-history/**/tickets.md`** **Deps:** and the global DAG in **`docs/design/tickets-initial.md`**).

## Preconditions

- **Integration checkout** on **`main`** (not the per-ticket development worktrees).
- Ordered list of branches to merge (dependency-safe order: shared foundations before dependents).
- Default-branch integration uses PR-time semantic expert mapping and a final approval check; no expert state is a precondition for ticket/stage branch work.
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
5. **Repo-root `CURRENT.md`:** if present after merges, **remove** it on **`main`** (or replace with a single neutral line only if the repo documents that pattern) so **`main`** does not carry stale branch-local state — **`feature-request`** skill **Branch state (`CURRENT.md`)**.
6. Run **`python3 scripts/refresh_ticket_dags.py --root .`** after shared tracker
   and DAG conflict resolution. Review plain-English labels/dependencies,
   preserved ids/edges, lifecycle colors, and each directly-below
   project/feature **Where things stand** explanation; require **`--check`**.
7. Do not push yet.

### Expert-review planning for default integration

Diff the integration candidate against fetched `origin/main`, scan affected
design sections for **`EXPERT-REVIEW`**, and match changed paths against the
merged expert roster. Interpret affected interfaces, invariants, algorithms,
data flows, risks, and acceptance behavior so the review map is more precise
than path-only CODEOWNERS. Record the semantic surface for each expert and
request the mapped reviewers on a default-branch PR. Missing mapping or pending
approval does not block candidate assembly, revalidation, ticket triads, or a
push to a non-default review branch.

## 4 — Post-merge revalidation gate (mandatory)

After the union conflict resolution is complete, run full validation in the integration checkout:

1. Re-run all required verification for the merged state (ticket acceptance checks and project test suite per `docs/ai-context.md`) inside Docker / Docker Compose / Dev Container / CI images where possible; document any host-local exception. Confirm repo-root **`CURRENT.md`** is not left as branch-local prose on **`main`** (see merge step 5 in §3) and the ticket-DAG refresh **`--check`** still passes.
2. If **any validation check fails**:
   - Create a new blocker task as the **primary ticket** (new **`T-FR-NNNN-xx`** id following **`docs/design/documentation-style.md` §Ticket IDs**, e.g. append a repair sequence number for that `FR`) with explicit failing checks/requirements.
   - Update **`tasks/ticket-progress.md`**:
     - `Current focus` → **Active ticket** set to that blocker.
     - **Session status** set to `blocked`.
     - **Next agent should** instruct to fix the blocker before running `develop-frontier` again.
     - Add/update the blocker row in `Progress` with failing VAL details in `Notes`.
   - Commit these tracker updates.
   - Push the integration state to **`broken-main`** (`git push origin HEAD:broken-main`) so broken code never lands on `main`.
   - Stop; do not continue frontier development until the blocker ticket reaches VAL `done`.
3. If validation passes, push the candidate to a non-default integration branch.
   When any applicable expert gate exists, open/update a PR to `main`, `master`,
   or the repository's other default branch; a direct default-branch push is not
   allowed for that candidate. If no expert gate applies, follow the project's
   normal integration policy. Refresh the semantic map and targeted review
   requests after material head changes.
4. For an expert-governed candidate, immediately before the final PR merge,
   re-fetch the base and inspect the current head. Require scoped approval from
   every applicable expert with no applicable changes-requested review, and
   verify user manual validation separately. Pending governance leaves the PR
   open; it does not create a blocker ticket, undo `triadDone`, or prevent more
   non-default-branch work.
5. Expert or repository-owner approval does not authorize the merge. For an
   expert-governed candidate, only when validation and both review gates pass
   **and** the workflow has separate explicit authority may the final PR merge
   proceed. Never infer that authority. With no applicable expert gate, any
   default integration still requires explicit authority under normal project
   policy.

## 5 — After push

- Update **`tasks/ticket-progress.md`** if needed.
- **Branch audit:** Do **not** automatically **`git push origin --delete`** or **`git branch -D`** merged **`feat/*`** branches — they preserve how work evolved; removal requires **explicit human** approval.
- **Local worktrees:** Optionally `git worktree remove` **only** to reclaim disk when the **remote** branch remains and the team no longer needs that path.

## See also

- **`docs/ai-context.md`** (§2c, §2d), **`develop-frontier`**, **`finish-feature`**
