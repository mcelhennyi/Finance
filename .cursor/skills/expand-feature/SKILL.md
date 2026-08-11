---
name: expand-feature
description: >-
  Expand an existing FR-NNNN feature with a sub-feature/addendum: resolve the
  current feature, capture a new addition/change/refinement request, deeply
  design it as a natural extension of the existing plan, write a dedicated
  expansion page under the feature-history directory, append/update
  feature tickets and DAG/tracker artifacts, and optionally continue into
  identify-frontier/develop-frontier. Use when the user says /expand-feature,
  expand the current feature, add to an in-progress FR, or change an existing
  feature without allocating a new FR-NNNN.
---

# Expand feature (same FR, addendum to tickets to optional frontier)

Extend an existing **`FR-NNNN`** without registering a new feature id. Treat the
request like a sub-feature of the current plan: capture it in a dedicated
addendum page, deepen the design until a junior engineer can implement it, then
expand the feature's canonical tickets and global ticket graph.

This command composes with **`feature-request`**. Follow
**`.cursor/skills/feature-request/SKILL.md`** for ticket format (**plain-English
ticket writing** required for new/not-yet-started tickets), branch policy,
`CURRENT.md`, diaries, human-readable ticket names, Docker / VAL rules, and the
user-facing close.

## Core contract

- **Scale the process to the ask.** Classify the expansion before ticketing:
  - **Lightweight:** one small UI adjustment or behavior tweak, no API/schema
    contract, no migration, no cross-feature dependency, and one engineer can
    safely finish it in one worktree. Use an isolated worktree/branch and
    focused validation, but do not require canonical ticket/DAG expansion unless
    the user asks for it.
  - **Standard:** a coherent addition that changes multiple artifacts or needs a
    durable handoff, but can be implemented serially. Use the same-FR addendum
    and one or more same-FR tickets.
  - **Frontier:** an addition with separable backend/frontend/docs/data work or
    meaningful parallelism. Use the full addendum, expand tickets, maximize
    parallel-safe splits, then run **`/identify-frontier`** /
    **`/develop-frontier`** when implementing.
- **Do not allocate a new `FR-NNNN`** unless the addition does not naturally fit
  the target feature or the user explicitly asks for a new feature.
- **Write one dedicated addendum page** inside the target feature folder:
  **`tasks/feature-history/FR-NNNN-<slug>/30-expand-YYYY-MM-DD-<short-slug>.md`**.
  If the filename exists, append `-b`, `-c`, etc. For lightweight work, this may
  be a compact note with mock link, branch/worktree, validation, and outcome
  instead of a full ticket plan.
- **Keep the expansion native to the feature.** Explain how the addition extends
  the original feature thesis, which existing flows it modifies, and what stays
  unchanged. Avoid tickets that bolt on a disconnected side path.
- **Ticket ids continue inside the same FR.** If the current feature ends at
  **`T-FR-0006-07`**, the first expansion ticket is **`T-FR-0006-08`**.
- **Do not silently rewrite completed work.** If an existing ticket has any
  phase marked `done`, create a new follow-up ticket for changes to that
  behavior. Edit an existing ticket in place only when it has not started, or
  when the user explicitly accepts reopening/reworking it.
- **Expanded tickets count toward the feature-complete gate.** Do not run
  **`/finish-feature`** until every original and expansion ticket in the
  feature's **`tickets.md`** has TEST / DEV / VAL = `done` in
  **`tasks/ticket-progress.md`**.
- **Lightweight work still uses git isolation.** Create a dedicated child
  worktree under **`.worktrees/FR-NNNN-<slug>/`** from the feature branch, for
  example **`stage-expand-<short-slug>/`** on
  **`feat/FR-NNNN-<slug>/stage-expand-<short-slug>`**, and refresh
  **`CURRENT.md`** if implementation happens there.

## Resolve the target feature

1. If the user names **`FR-NNNN`** or a feature-history path, use that.
2. Else, if the current branch is **`feat/FR-NNNN-<slug>`** or
   **`feat/FR-NNNN-<slug>/...`**, use that feature.
3. Else, read repo-root **`CURRENT.md`** if it exists and names a feature.
4. Else, read **`tasks/ticket-progress.md` -> Current focus** and use the active
   **`FR-NNNN`** / branch when unambiguous.
5. Else, read **`tasks/feature-history/REGISTRY.md`** and choose the only row
   with status `design` or `in-progress`.
6. If more than one target is plausible, ask the user to choose.

If the target feature is `complete`, has a merged integration PR, or its
**`90-closeout.md`** says the feature is finished, do not reopen it silently.
Recommend **`/feature-request`** for a new FR unless the user explicitly wants a
post-closeout expansion recorded against the old feature.

## Read before designing

For the chosen feature, read:

- **`README.md`**, **`00-intake.md`**, every **`10-design-*.md`**,
  **`20-tickets-dag.md`**, **`tickets.md`**, newest **`handoffs/*.md`**,
  **`serial-diary.md`**, and **`parallel/*.md`** / **`DIARY.md`** when present.
- **`tasks/ticket-progress.md`**, **`tasks/feature-history/REGISTRY.md`**,
  **`tasks/feature-history/TICKET-SOURCES.md`**, and
  **`docs/design/tickets-initial.md`**.
- Authoritative **`docs/design/`** pages linked from the feature.
- Relevant code paths or tests when the addition changes already-implemented
  behavior; use subagents for broad surveys per **`docs/ai-context.md` section 1b**.

## Stage 1 - Fit and scope

Write a short decision in the addendum:

- **Raw expansion request:** quote or paraphrase the user's addition/change.
- **Target feature state:** current status, branch/worktree, PR or closeout
  state, and ticket range.
- **Natural fit:** how the request strengthens the feature's original user
  value and system boundary.
- **Existing behavior affected:** pages, APIs, services, data models, docs,
  tests, and tickets that must change.
- **Out of scope:** related ideas intentionally deferred.
- **New FR test:** why this should stay inside the current FR instead of
  becoming its own **`FR-NNNN`**. If it fails this test, stop and recommend
  **`/feature-request`**.

## Stage 2 - Deep addendum design

Create **`30-expand-YYYY-MM-DD-<short-slug>.md`** with enough specificity that a
new engineer can implement without rediscovering the whole feature. For a
lightweight change, keep only the sections that prove fit, mock/example, files
touched, validation, and next step; do not manufacture tickets to make a small
ask look larger.

Use this minimum structure:

```markdown
# FR-NNNN - Expansion: <title>

## Raw request
...

## Target feature context
- Feature folder:
- Current branch / worktree:
- Current ticket range:
- Existing design docs:

## Fit with original plan
...

## User experience / operator flow
- Entry points:
- Happy path:
- Loading / empty / error / permission states:
- Responsive and accessibility notes:

## Public surfaces and contracts
| Surface | Change | Request / response or type sketch | Compatibility |
|---------|--------|------------------------------------|---------------|
| | | | |

## Data model, migrations, and lifecycle
...

## Backend / service behavior
...

## Frontend behavior
...

## Mock / example UI
- Mock file:
- Current UI used as baseline:
- Differences from current UI:

## Existing artifacts to change
| Artifact | Required change | Ticket |
|----------|-----------------|--------|
| | | |

## Test and validation strategy
- Unit / contract:
- Integration:
- UI rendered inspection (when user-visible UI changes):
- Docs build / preview (when docs change):

## Risks, open questions, and deferrals
- ...

## Ticket expansion plan
...
```

Design depth checklist:

- Name concrete files/modules likely touched, but keep final file ownership in
  the tickets when code discovery may change it.
- Define API payloads, DTO fields, enum values, persistence rules, and error
  states when applicable.
- For UI work, describe screen states and controls. When mocking an additional
  UI feature, update the current UI if possible as the example: start from the
  existing rendered route/component/style, show the proposed adjustment in that
  context, and save the HTML mock under **`docs/design/mockups/`**. Link the
  mock from the addendum and from the relevant authoritative design doc when
  one exists.
- For changed authoritative behavior under **`docs/design/`**, update the
  design doc or record an auditable amendment / `DESIGN-GAP` per
  **`docs/ai-context.md`**.
- Identify any migration, backward compatibility, or rollback concern.

Update the feature **`README.md`** contents table with the addendum page.

## Stage 3 - Expand tickets and DAG

Skip this stage only for explicitly lightweight work as defined in **Core
contract**. In that path, record the branch/worktree, mock path, validation, and
outcome in the addendum and diary instead.

1. Determine the next ticket suffix by scanning the target feature's
   **`tickets.md`** headings.
2. Update **`20-tickets-dag.md`** with an **Expansion addendum** section:
   ticket table, dependency notes, and Mermaid DAG nodes labeled with title
   first and id second.
3. Append canonical **`### T-FR-NNNN-xx - <title>`** sections to
   **`tickets.md`**.
4. Add or update rows in **`tasks/ticket-progress.md`** for each new ticket.
5. Update **`docs/design/tickets-initial.md`**: per-feature ticket file row if
   missing, global mermaid nodes/edges, and no `triadDone` class until each new
   ticket is complete.
6. Ensure **`tasks/feature-history/TICKET-SOURCES.md`** lists the feature
   **`tickets.md`** path.
7. Update **`REGISTRY.md`** notes/ticket range when the range changes. Do not
   increment **`next_id`**.
8. If **`tasks/ticket-progress.md -> Current focus`** or the feature handoff says
   "run `/finish-feature`", replace that stale next step with the first
   incomplete expansion ticket or **`/identify-frontier`**.

Each new ticket section must include (plain-English first — same bar as
**feature-request → Plain-English ticket writing**):

- **Title** and **Deps**.
- **In plain English**, **Why this exists**, **Out of scope**, and **Done when
  (plain English)** — link the “why” back to the expansion addendum.
- **Existing changes required**: original tickets, files, or docs whose behavior
  this ticket must modify.
- **Acceptance criteria** (precise/testable) plus **Phases** with concrete
  TEST / DEV / VAL exit criteria.
- **Implementation notes** detailed enough for a junior engineer.
- **Verification notes** naming Docker / Compose commands where known; include
  rendered browser inspection for user-visible UI.

When an existing ticket must change:

- If not started, update its body and add an **Expansion impact** note with a
  link to the addendum.
- If any phase is already `done`, keep the historical ticket intact and create
  a new ticket that revises or extends that behavior. Set **Deps** to the
  completed ticket(s) it relies on.

## Stage 4 - Diary, handoff, and optional implementation

Append **`serial-diary.md`** with the expansion summary: what changed, why the
ticket split fits, which tickets are new, and whether implementation should
start now.

Write **`handoffs/YYYY-MM-DD-expand-<short-slug>.md`** when pausing after design
or ticket expansion. The handoff should include the same **Executive summary**,
**Suggested next step**, and **Options** shape required by the
**`feature-request`** skill.

If the user asked to implement immediately and the tickets now exist:

1. Run **`/identify-frontier`** or follow the skill to recompute eligible
   tickets.
2. Run **`/develop-frontier`** for the expansion tickets that are eligible.
3. Keep work on **`feat/FR-NNNN-<slug>`** and ticket branches under the feature
   worktree.
4. Refresh repo-root **`CURRENT.md`** on active **`feat/*`** branches.

If the user did not explicitly ask to implement now, stop after the addendum
and ticket expansion, then suggest **`/identify-frontier`** or the first ticket
by title.

## Quality checks

- [ ] No new **`FR-NNNN`** allocated, unless explicitly justified.
- [ ] Addendum page exists and captures request, design, existing-artifact
      changes, tests, risks, and ticket plan.
- [ ] Feature **`README.md`** links the addendum.
- [ ] New ticket ids continue the existing **`T-FR-NNNN-xx`** sequence.
- [ ] **`20-tickets-dag.md`**, **`tickets.md`**, **`ticket-progress.md`**,
      **`docs/design/tickets-initial.md`**, and **`REGISTRY.md`** agree.
- [ ] Completed tickets were not rewritten silently.
- [ ] Feature-complete next steps no longer ignore expansion tickets.
- [ ] User-facing response ends with **Executive summary**, **Suggested next
      step**, and **Options** when more than one path is reasonable.
