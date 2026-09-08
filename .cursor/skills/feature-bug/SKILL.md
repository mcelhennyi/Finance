---
name: feature-bug
description: >-
  Ingest and continuously develop a manual-test or operator bug against an
  existing FR-NNNN through a dedicated subagent lane: report, same-FR
  addendum/ticket/DAG planning, and TEST→DEV→VAL in an isolated worktree.
  Use when the user says /feature-bug, feature bug, log a bug, report a bug
  against this feature, or files issues found in pre-PR manual testing.
---

# Feature bug (continuous report-to-fix lane)

Capture each bug against an existing **`FR-NNNN`** and immediately route it to
its own same-feature fixing lane. **Do not** allocate a new **`FR-NNNN`**.
Do not stop at report-only unless the user explicitly asks to log without
implementation.

## Orchestrator dispatch first

- The parent orchestrator creates or queues **one subagent lane per distinct
  operator report** and stays available for more intake. The lane owns the
  report, one bug-specific same-FR solving ticket, and serial
  **TEST → DEV → VAL** in its ticket worktree.
- Serialize bug-id, ticket-id, addendum, DAG, and tracker integration on the
  feature branch so concurrent lanes cannot allocate the same id. After that
  planning commit lands, dependency-safe, file-disjoint ticket lanes may run in
  parallel. A running wave does not block new bug intake or planning.
- Name one feature integration owner (normally the parent). The lane may draft,
  commit, and push its report/addendum/ticket branch; only that owner verifies
  and merges shared allocation, advances the canonical BUG/T-FR next ids, and
  releases the next allocator.
- Preserve one report, solving ticket, and lane per bug. When bugs share a root
  cause, model a shared enabling dependency if needed; do not collapse their
  ownership or acceptance criteria.
- Before each implementation dispatch, apply **`develop-frontier`**'s project
  remote-default refresh and skeleton hash gates.

## Standard flow

Compose continuously: **manual test** → **`/feature-bug`** dedicated lane →
bug-specific **`/expand-feature`** planning → **`/develop-frontier`**
TEST→DEV→VAL. Repeat while other lanes run; do not wait for a final ingest
batch. The lane updates the report with its solving ticket and keeps design,
mocks, manual, and code truthful about the fix.

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

## Write the report and reserve its solving work

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
7. In the same dedicated lane, follow **`/expand-feature` → Continuous bug-fix
   lanes** to write the bug-specific addendum, reserve the next
   **`T-FR-NNNN-xx`**, update the canonical DAG/tracker, and set **Solving
   ticket** on the report. Integrate this shared planning commit serially before
   implementation begins.
8. Unless the user requested log-only, run the ticket through
   **`/develop-frontier`** in its isolated child worktree and set the report to
   `done` only after VAL is green.

## Persist

Commit and push the lane's report/planning work without unrelated changes. The
named integration owner alone verifies and merges that commit into
**`feat/FR-NNNN-<slug>`**, advances canonical ids, and releases the next
allocator. Implement only from the refreshed feature branch in the bug ticket's
child worktree. Keep remote branches as the audit trail.

## Required user-facing close

Lead with **where the report landed** so the operator can open it:

```text
Bug report landed at:
`<repo-relative-path>`
Id: BUG-FR-NNNN-xx
Feature: FR-NNNN (<slug>)
Kind: code-defect | layout | design-conflict | product-follow-up
Solving ticket: T-FR-NNNN-xx
Lane: <branch and worktree>
```

If several issues were logged, list **every** path. Then:

- **Executive summary** — what was recorded vs corrected as spec-as-designed.
- **Suggested next step** — continue testing and submit more
  **`/feature-bug`** reports while this lane runs; report the lane's current
  TEST / DEV / VAL state.
- **Options** when more than one path is reasonable.

Do not wait for the operator to declare bug intake complete before ticketing or
fixing. Only an explicit log-only request suppresses implementation.

## Compose (do not fork)

| Need | Use |
|------|-----|
| Report and continuously fix a pre-PR / manual-test issue | **`/feature-bug`** (this skill) |
| Ticket/fix an existing backlog of **`bugs/`** | **`/expand-feature`** (one lane per bug) |
| New product feature | **`/feature-request`** |
| Lightweight non-feature chore | **`/add-todo`** |
