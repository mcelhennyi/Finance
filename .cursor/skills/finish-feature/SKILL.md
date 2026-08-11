---
name: finish-feature
description: >-
  Merges all ticket/stage branches for one FR-NNNN feature into the feature
  integration branch, validates, opens (or updates) a PR to the default branch
  only after the feature-complete gate in docs/ai-context.md §2d, and runs
  mandatory feature closeout (90-closeout.md, REGISTRY, ticket-progress) plus
  explain-feature before a fresh-context update-manual pass for docs/manual. Never deletes remote
  branches automatically. Use when closing a full FR-NNNN implementation on the
  feature branch workflow.
---

# Finish feature (`FR-NNNN`)

Close **implementation** for a **single** product feature that used a **feature integration branch** — all ticket/stage branches **`feat/FR-NNNN-<slug>/...`** should already merge **into** **`feat/FR-NNNN-<slug>`** (not directly to the default branch). This skill finishes that line, runs **mandatory feature closeout** plus an **`/explain-feature`** before/after artifact and manual-docs refresh when the gate passes, and opens a **default-branch PR** for human merge **only when** **`docs/ai-context.md` §2d** **feature-complete gate** is satisfied.

## Preconditions

- **`FR-NNNN`** and **`<slug>`** known; **`tasks/feature-history/FR-NNNN-<slug>/`** exists with **`tickets.md`**, diaries, and **`handoffs/`** as needed.
- **Feature integration branch** exists on the remote, e.g. **`feat/FR-0007-auth-overhaul`**, and is checked out at **`.worktrees/FR-NNNN-<slug>/feature/`** (or an explicit equivalent path). Ticket/stage branches exist and are pushed.
- **Integration policy:** Do **not** push to the **default branch** from this skill — only **PR** (or draft PR) for final human review unless the user explicitly overrides.

## 1 — Ensure ticket work is merged into the feature branch

In the feature worktree checkout of **`feat/FR-NNNN-<slug>`** (normally **`.worktrees/FR-NNNN-<slug>/feature/`**):

1. `git fetch origin`
2. `git checkout feat/FR-NNNN-<slug>` and `git pull --ff-only` (or merge) as appropriate.
3. For each feature-prefixed ticket/stage branch (for example **`feat/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name`**) in **dependency-safe** order, `git merge --no-ff <branch> -m "merge: T-FR-NNNN-xx (finish feature FR-NNNN)"`.
4. Resolve conflicts; prefer preserving both intents. Do **not** delete the source ticket/stage branches locally or on the remote.
5. **CURRENT.md:** consolidate repo-root **`CURRENT.md`** on **`feat/FR-NNNN-<slug>`** so it matches merged reality (resolve conflicts by merging prose, not deleting the file). See **`feature-request`** skill **Branch state (`CURRENT.md`)**.

## 2 — Validation on the feature branch

Run the full verification required for all merged **`T-FR-NNNN-xx`** tickets using Docker / Docker Compose / Dev Container / CI images where possible per **`docs/ai-context.md`**. Host-local validation is an exception and must be documented in the finish handoff. Fix forward on the **feature branch** if issues are small; otherwise stop and leave the branch for human triage.

## 3 — Feature-complete gate (before PR and closeout)

1. Verify every **`### T-FR-NNNN-xx`** in **`tasks/feature-history/FR-NNNN-<slug>/tickets.md`** has **TEST**, **DEV**, and **VAL** = **`done`** in **`tasks/ticket-progress.md`** for that **`FR-NNNN`**.
2. If **not** all **`done`**: `git push -u origin feat/FR-NNNN-<slug>`; append or refresh **`tasks/feature-history/FR-NNNN-<slug>/handoffs/`** with the next frontier — **stop**. Do **not** open a default-branch PR or write **`90-closeout.md`** until the gate passes.
3. If all **`done`**: proceed to **§4** and **§5** (closeout is **required**, not optional).

### Already merged to the default branch

If **`git fetch`** shows the feature integration PR is **already merged** (no open PR; feature branch is ancestor of **`origin/<default>`**):

1. Skip **§4** (no new PR).
2. Still run **§5 — Feature closeout** if **`90-closeout.md`** is missing or stale (idempotent refresh).
3. End with **Executive summary** / **next step** / **options** — do not ask the human to merge an already-merged PR.

## 4 — Push feature branch and open PR to the default branch

Skip this section when **§3** “Already merged” applies.

1. `git push -u origin feat/FR-NNNN-<slug>`
2. Prefer **`gh pr create`** (base = default branch, head **`feat/FR-NNNN-<slug>`**) with a summary linking **`tasks/feature-history/FR-NNNN-<slug>/`**, ticket ids, and a pointer to **`90-closeout.md`** (created in **§5**).
3. If a PR already exists, push branch updates and ensure the PR description lists merged tickets and links **`90-closeout.md`**.
4. PR description must remind the merger to **delete** repo-root **`CURRENT.md`** when the PR lands on the default branch (unless the repo documents otherwise) — **`feature-request`** skill **Branch state (`CURRENT.md`)**.

## 5 — Feature closeout (required when gate passes)

**Do not defer closeout** to the human merger or a later **`/feature-request-continue`** session. When **§3** passes, complete **all** of the following in the same **`/finish-feature`** run (commit on the **feature branch** before push when the PR is still open, or on **`main`** / default branch when integration is already merged — never leave closeout docs only on a stale local branch).

Use **[`closeout-template.md`](closeout-template.md)** for **`90-closeout.md`** structure.

| Artifact | Action |
|----------|--------|
| **`90-closeout.md`** | Create or refresh at **`tasks/feature-history/FR-NNNN-<slug>/90-closeout.md`**: executive summary, delivered surfaces, tickets table, validation, deferred items, suggested next step, options, audit (PR link + merge SHA when known). If PR not merged yet, mark **PR pending** and refresh the merge line after merge. |
| **`REGISTRY.md`** | Set this **`FR-NNNN`** row **Status** to **`done`** (or team **`complete`** alias). Notes: PR link, merge date/SHA when known, link to **`90-closeout.md`**. |
| **`README.md`** (feature folder) | **Status** `done`; link **PR** and **`90-closeout.md`**. |
| **`tasks/ticket-progress.md`** | Remove this feature from **`### Parallel streams`** (or mark **done on `main`** with PR link). Update **Progress** notes for its tickets if needed. If no other active work, point **Current focus** at the next open ticket (or state explicitly that focus is clear). |
| **`explain-feature-YYYY-MM-DD.html`** | Run **§6 — Feature explanation artifact**. Link the generated before/after HTML in **`90-closeout.md`** and the finish-feature handoff. |
| **`docs/manual/`** | Run **§7 — Manual update subagent**. Link changed manual pages or record "no manual content changes" in **`90-closeout.md`** and the finish-feature handoff. |
| **`handoffs/YYYY-MM-DD-finish-feature.md`** | Same narrative as **`90-closeout.md`** plus merged branch names/SHAs, validation summary, explain-feature result, and manual update result — **Executive summary**, **Suggested next step**, **Options**. |
| **`handoffs/YYYY-MM-DD-merged-to-main.md`** | When PR is **already merged** during this run, add this file (post-merge bookkeeping) and confirm repo-root **`CURRENT.md`** is absent on **`main`**. |

Optional in the same run: **`DIARY.md`** consolidation per **`feature-request`** skill (newest-first stack from **`serial-diary.md`** / **`parallel/`**).

## 6 — Feature explanation artifact (required when gate passes)

After **§3** passes and before the manual update, run **`/explain-feature`** for
this feature.

1. Generate
   **`tasks/feature-history/FR-NNNN-<slug>/explain-feature-YYYY-MM-DD.html`**
   using **`.cursor/skills/explain-feature/SKILL.md`**.
2. The artifact must explain before/after system shape, include diagrams across
   relevant layers, link claims back to code/tests/docs, prove ticket/design
   acceptance criteria, and list validation evidence.
3. Link the generated HTML from **`90-closeout.md`**, the feature
   **`README.md`** when refreshing it, and
   **`handoffs/YYYY-MM-DD-finish-feature.md`**.
4. If the artifact cannot be generated, stop closeout and document the blocker;
   do not open or refresh the default-branch PR as feature-complete.

## 7 — Manual update subagent (required when gate passes)

After **§3** passes and before considering closeout complete, run
**`/update-manual`** against the feature code changes.

1. Prefer a fresh subagent / delegated task when available. Use a prompt shaped
   like:

   ```text
   In <feature worktree>, run /update-manual for FR-NNNN <slug>.
   Compare docs/manual/update-log.html last reviewed hash to HEAD, read the
   changed code, tests, design docs, and existing manual pages, then update the
   static HTML manual site under docs/manual. Update update-log.html hash and
   changelog even if no manual page content changes are needed. Return changed
   pages, no-change rationale if applicable, and validation performed.
   ```

2. If subagents are unavailable, run **`/update-manual`** inline and record the
   exception in **`90-closeout.md`** and the finish-feature handoff.
3. The manual update result must be committed with the closeout docs on the
   feature branch when the PR is still open, or on the default branch when the
   feature was already merged and this run is closeout-only.
4. Do not skip this stage because the feature "seems obvious"; a no-op manual
   result still updates **`docs/manual/update-log.html`** with the reviewed code
   hash and a reason.

## 8 — Feature history bookkeeping (integration audit)

1. Ensure **§5** artifacts exist before considering **`/finish-feature`** complete.
2. Ensure **§6** explain-feature and **§7** manual-update results are linked or
   summarized in closeout artifacts.
3. Run **diary consolidation** (**`DIARY.md`**) if not already done for this milestone.

## 9 — Branch hygiene (audit)

- **Never** automatically **`git push origin --delete`** or **`git branch -D`** ticket/stage or feature branches used in this workflow — they are the **audit trail** of how work evolved.
- **Optional:** remove only **local** worktree directories to free disk, after confirming the **remote** branch still exists and the team does not need the local path.

## User-facing close (required)

End the **`/finish-feature`** reply with **Executive summary**, **Suggested next step**, and **Options** (merge PR vs. request changes vs. resume next FR), whether or not the default-branch PR is already merged.

## Relationship to **`finish-frontier`**

| Skill | When |
|-------|------|
| **`finish-feature`** | One **`FR-NNNN`**: ticket/stage branches → **`feat/FR-NNNN-<slug>`** → **mandatory closeout + explain-feature + update-manual** → **PR to default branch** for human merge **only after** **§2d** **feature-complete gate** (or closeout-only if already merged). |
| **`finish-frontier`** | Multi-ticket integration that merges **directly** into the default branch (integration checkout) per existing policy — still **do not delete remote audit branches** unless a human explicitly asks. |

## See also

- **`feature-request`**, **`feature-request-continue`**, **`develop-frontier`**, **`finish-frontier`**
- **`docs/ai-context.md`** §2d (feature branch workflow)
- **[`closeout-template.md`](closeout-template.md)**
