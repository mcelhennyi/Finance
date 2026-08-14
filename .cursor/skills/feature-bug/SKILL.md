---
name: feature-bug
description: >-
  Record a manual-test or operator bug against an existing FR-NNNN in
  tasks/feature-history/FR-NNNN-<slug>/bugs/ with enough detail to ticket later.
  Use when the user says /feature-bug, feature bug, log a bug, report a bug
  against this feature, or files issues found in pre-PR manual testing.
---

# Feature bug (log, do not ticket yet)

Capture one or more bugs against an existing **`FR-NNNN`** so they can later
become same-feature tickets. **Do not** allocate a new **`FR-NNNN`**, **do not**
append **`T-FR-NNNN-xx`** yet, and **do not** start a fix in this command.

## Standard flow (verbatim)

Feature request, develop the feature to completion, then manual test ahead of PR merge. If there are issues, Feature-bug report and once all bugs are reported and ingested then we will feature-expand to bug fix all outstanding bugs.

Once feature expand addresses all bugs it shall update the bug report to point to the ticket that solves this bug. This whole process shall also ensure that the docs are updated if they conflict with the bug and its fix such that they are truthful wrt the new fix.

Compose: **`/feature-request`** → **`/develop-frontier`** (to completion) →
**manual test before the default-branch PR** → **`/feature-bug`** (repeat until
every issue is ingested) → **`/expand-feature`** to ticket and fix outstanding
bugs → **`/identify-frontier`** / **`/develop-frontier`** as usual.

## Resolve the target feature

1. If the user names **`FR-NNNN`** or a feature-history path, use that.
2. Else, if the current branch is **`feat/FR-NNNN-<slug>`** or
   **`feat/FR-NNNN-<slug>/...`**, or the cwd is under
   **`.worktrees/FR-NNNN-<slug>/`**, use that feature.
3. Else, read repo-root **`CURRENT.md`** if it exists and names a feature.
4. Else, read **`tasks/ticket-progress.md` → Current focus**.
5. Else, read **`tasks/feature-history/REGISTRY.md`** and use the only
   `design` / `in-progress` row.
6. If more than one target is plausible, **ask** — do not guess.

## Classify each report

Read the feature **`README.md`**, **`00-intake.md`**, **`10-design-*.md`**, and
linked **`docs/design/`** pages before writing. For each issue:

| Kind | When | Later fix path |
|------|------|----------------|
| **`code-defect`** | Behavior fails a **correct** design | Ticket fixes code; do not silently edit design |
| **`layout`** | Visual inset/spacing/overflow against the mock or Phase surface language | Ticket + mock/CSS; update design only if the mock was wrong |
| **`design-conflict`** | The spec itself is wrong or incomplete (`DESIGN-FLAW` / `DESIGN-GAP`) | **`/expand-feature`** must **amend design first**, then ticket |
| **`product-follow-up`** | Operator wants different behavior than the current spec (the spec is still the truth) | Not a CODE-DEFECT. Expand-feature amends design (or a new FR) before any code that would contradict the docs |

Correct the operator when the “bug” is specified behavior. Still log it when they
want a change — mark **`product-follow-up`**, quote the spec, and do not pretend
it is a miss.

## Write the report

Directory: **`tasks/feature-history/FR-NNNN-<slug>/bugs/`**.

1. Create **`bugs/README.md`** if missing (see
   **[report-template.md](report-template.md)**).
2. Allocate the next **`BUG-FR-NNNN-xx`** from that README **`next_id`**
   (feature-local; **not** a `TAG-REGISTRY` family). Bump **`next_id`**.
3. Write **one file per distinct issue**:
   **`bugs/BUG-FR-NNNN-xx-<short-slug>.md`** using the template.
4. Add a row to **`bugs/README.md`**.
5. Link **`bugs/`** from the feature **`README.md`** artifacts list if missing.
6. Fill every template field that can be known from the session (repro, surface,
   expected vs actual, design notes, likely files, environment, evidence). Ask
   only for facts that would block a later ticket (missing repro or expected
   result).

**`BUG-FR-NNNN-xx`** is enough for later ticketing. Do **not** reserve a
**`T-FR-NNNN-xx`** here.

## Persist

On a **`feat/FR-NNNN-<slug>`** (or child) branch: **commit** the bug files and
**push** that feature branch when it tracks a remote, unless the user forbade
commits. Do not include unrelated dirty work. If the working tree is not the
feature branch, still write the files and say which branch they landed on.

## Required user-facing close

Lead with **where the report landed** so the operator can open it:

```text
Bug report landed at:
`<repo-relative-path>`
Id: BUG-FR-NNNN-xx
Feature: FR-NNNN (<slug>)
Kind: code-defect | layout | design-conflict | product-follow-up
```

If several issues were logged, list **every** path. Then:

- **Executive summary** — what was recorded vs corrected as spec-as-designed.
- **Suggested next step** — more **`/feature-bug`** if testing continues;
  **`/expand-feature`** only when the operator says all outstanding bugs are
  ingested.
- **Options** when more than one path is reasonable.

Do **not** start **`/expand-feature`** from this command unless the user
explicitly asked to ticket/fix now after ingesting.

## Compose (do not fork)

| Need | Use |
|------|-----|
| Log a pre-PR / manual-test issue | **`/feature-bug`** (this skill) |
| Ticket and fix outstanding **`bugs/`** | **`/expand-feature`** (bug-fix expansion) |
| New product feature | **`/feature-request`** |
| Lightweight non-feature chore | **`/add-todo`** |
