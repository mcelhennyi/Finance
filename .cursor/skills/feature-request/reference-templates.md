# Feature request — reference templates

Used by **`.cursor/skills/feature-request/SKILL.md`**. Keep templates in **markdown**; issue trackers (Jira, Asana, Linear) can import the tables as-is or copy-paste.

---

## User-facing session close (chat reply or handoff stub)

Use at the **end** of every reply that stops **`FR-NNNN`** work for the user. Copy the structure into **`handoffs/*.md`** when you also persist a handoff.

```markdown
### Executive summary
- … (outcomes, artifacts, decisions; lead with ticket **titles** + links to `tickets.md`)

### Suggested next step
… (one primary action)

### Options *(omit if only one reasonable path)*
- **A.** …
- **B.** …
```

For **closeout**, fold the same content into **`90-closeout.md`** as sections or lead paragraphs (see **Closeout (`90-closeout.md`)** below).

---

## Closeout (`90-closeout.md`)

Narrative sections for **`90-closeout.md`** should cover the same three ideas in order — **executive summary**, **primary next step for the team**, **optional multiple follow-up paths** — plus links to every artifact in the feature folder.

```markdown
# FR-NNNN — Closeout

## Executive summary
…

## What shipped vs deferred
…

## Artifact index
- … (link every file under `tasks/feature-history/FR-NNNN-<slug>/`)

## Tickets
- … (title + link to each `###` in `tickets.md`)

## Suggested next step
…

## Options / follow-ups *(if applicable)*
- …
```

---

## Intake (append to `00-intake.md`)

```markdown
# FR-NNNN — Intake

| Field | Value |
|------|--------|
| **Title** | |
| **Requester** (optional) | |
| **Target timeline** (optional) | e.g. Q3, 6 weeks, before release X |
| **Constraints** | e.g. offline, no new deps, must reuse module X |
| **Success definition** (1–3 bullets) | |
| **Out of scope** | |
| **Links** | design docs, tickets, mocks |

**Raw details** (prose the user or PM provided):
…
```

---

## Design — skeleton (interfaces only)

```markdown
# FR-NNNN — Design (level 0, skeleton)

## Purpose
One paragraph.

## Actors
- …

## Public surfaces (skeleton)
Only contracts: module boundaries, public types, API routes, event names. No implementation.

| Surface | Kind | Contract (signature / schema sketch) | Owner (logical) |
|---------|------|----------------------------------------|-----------------|
| | | | |

## Data in / out
| Input | Output | Storage |
|-------|--------|---------|
| | | |

## Open questions
- …
```

---

## Design — depth ladder

Add sections **L1, L2, …** only as complexity requires:

- **L1:** sequence diagram (mermaid) for main flow; error paths named.
- **L2:** state for each persistent entity; idempotency and concurrency notes.
- **L3:** performance budget (latency, throughput) if user cited scale or SLOs.
- **L4+:** security, migration, roll-back — if applicable.

```mermaid
sequenceDiagram
  participant U as User
  participant S as System
  U->>S: …
```

## Actor profile doc

Use when a feature creates or changes seeded users, personas, role fixtures, demo accounts, E2E actors, stakeholders, antagonists, guiding figures, or outside-force actors. Prefer a project-level doc such as **`docs/design/seed-actor-profiles.md`** so multiple features can share actors. Use **`docs/design/actor-driven-development.md`** for the reusable theory, story graph, guiding-figure, app-readable graph, and validation process; use **`docs/design/profile-server-app.md`** when planning the generic `./develop profiles` viewer.

````markdown
# Seed actor profiles

## Seed coverage contract

Every seeded user-like record must have a profile before the owning ticket reaches VAL.

## App-readable graph contract

Machine-readable actor/story graph data lives under `docs/design/actors/`: `actors/*.md`, `stories/*.md`, `edges.jsonl`, `index.json`, and `actor-graph.json`. Rebuild the index after profile/story/edge edits and fail validation if the generated files are stale.

## Source inventory

| Source | Actors covered |
|--------|----------------|
| | |

## Outside-force and guiding-figure inventory

| Actor or figure | Class | Force / principle | Related roled actors |
|-----------------|-------|-------------------|----------------------|
| | Stakeholder / antagonist / guiding figure | | |

## Actor story relationship graph

```mermaid
flowchart LR
  AStory["Actor A: source story<br/>story/a/source-flow"]
  BStory["Actor B: handler story<br/>story/b/handler-flow"]
  AStory -->|"handled by story/b/handler-flow"| BStory
```

## Story-edge table

| Origin story | Affected actor | Handler story | Coverage note |
|--------------|----------------|---------------|---------------|
| `story/a/source-flow` | Actor B | `story/b/handler-flow` | |

## Profile: <Actor Name>

**Seed anchors:** `<token>`, `<user_id>`, `<member_id>`, `<fixture id>`

**Role:** …

**Personality:** …

**Job and life context:** …

**Routine:** …

| Story key | Trigger | Expected flow | UI surfaces | Backend/data surfaces | Time and persistence |
|-----------|---------|---------------|-------------|-----------------------|----------------------|
| `story/<actor>/<flow>` | | | | | |

**Security boundaries:** …

**Test duties:** …

**Growth-dream candidates:** …

## Guiding figure: <Name or Archetype>

**Anchor:** `guide/<slug>`

**Principle lens:** …

**Decision bias:** …

**Affected actors:** …

**Story pressure:** …

**Guardrails:** …
````

---

## Tickets + dependency DAG (Jira/Asana-ready)

**Human-facing rule:** The **Title** column is the primary name in prompts, diaries, and handoffs. Use **ID** for deps, branches, and `ticket-progress.md`. When talking to the user, pair **title + linked id** to `tickets.md` (see **`.cursor/skills/feature-request/SKILL.md` → Human-readable names vs ticket ids**).

**Plain-English rule:** Titles, DAG **Summary of change**, and every new/not-yet-started ticket body must pass a cold-read test — see **`.cursor/skills/feature-request/SKILL.md` → Plain-English ticket writing**. Prefer a little clear context over dense jargon.

```markdown
# FR-NNNN — Work breakdown and DAG

## Ticket table

| ID | Title (required — human-facing name) | Type | Deps (ticket IDs) | Summary of change (plain English, 1–2 lines) | Suggested order group | Link (optional) |
|----|----------------------------------------|------|---------------------|----------------------------------------------|------------------------|-----------------|
| T-FR-0007-01 | Contract: public API surface | Story/Task | none | Lock the shared request/response shapes so UI and backend agree before either side builds. | P0 foundation | [details](tickets.md#anchor-after-promote) |
| T-FR-0007-02 | Implement batch ingest path | Story/Task | T-FR-0007-01 | Accept a batch of records, store them safely, and return clear success/failure per item. | P1 | [details](tickets.md#…) |

**Parallelization rule:** Any two tickets with **disjoint** transitive file/code ownership and **all deps in earlier VAL-done** can run in parallel (same rule as `identify-frontier`).

## DAG (Mermaid)

Use a **second** code fence in the real doc (nesting is invalid inside one template block). **Label nodes with title, then id in parentheses** (ids stay unique as Mermaid node ids):

    flowchart TB
      T01["Contract: public API surface (T-FR-0007-01)"]
      T02["Implement batch ingest path (T-FR-0007-02)"]
      T01 --> T02

## Map to feature **`tickets.md`** + global index

- For each **`T-FR-NNNN-xx`**: add **`###`** sections to **`tasks/feature-history/FR-NNNN-<slug>/tickets.md`** using the **Canonical ticket body** below, with **Deps:** matching the DAG and **Phases** tables.
- Register the feature path in **`tasks/feature-history/TICKET-SOURCES.md`**.
- Extend **`docs/design/tickets-initial.md`**: feature table row + **global mermaid** edges / **`triadDone`** as needed.
- Add rows to **`tasks/ticket-progress.md`**.

## Suggested `identify-frontier` check

After tickets land, run **`/identify-frontier`** and confirm the **parallel-capable** set matches the DAG (eligible ∩ incomplete).
```

---

## Canonical ticket body (plain English first)

Use this shape for every **new** ticket and when refreshing a **not-yet-started** ticket (no phase `done` or `in progress`). Do **not** rewrite completed or in-flight tickets unless the user asks.

```markdown
### T-FR-NNNN-xx — <verb-led title>

**Title:** <same as heading>
**Type:** Story/Task/…
**Deps:** none | T-FR-NNNN-yy, …
**Order group:** P0 / P1 / …

**In plain English:**
<2–4 short sentences. Who benefits, what changes, what “done” looks like.
Everyday words first; define any necessary term once.>

**Why this exists:**
<One sentence: unlocks … / closes … / removes …>

**Out of scope:**
- <what this ticket must not do>

**Done when (plain English):**
- <observable outcome a cold reader can check>
- …

**Primary files:**

- `path/…`

**Acceptance criteria:**

- <precise, testable bullets for implementers; may stay technical>

**Phases:**

| Phase | Status | Notes |
|---|---|---|
| TEST | — | … |
| DEV | — | … |
| VAL | — | … |
```

---

## User prompts (copy-paste)

**After design + tickets are written:** name work by **title**, with ticket id linked to **`tickets.md`** for detail (example pattern):

1. "Ready to start implementation: run **`/develop-frontier`** for the current parallel-capable set — e.g. **Contract: public API surface** ([`T-FR-0007-01`](tasks/feature-history/FR-NNNN-<slug>/tickets.md)), **Implement batch ingest path** ([`T-FR-0007-02`](tasks/feature-history/FR-NNNN-<slug>/tickets.md)) — or implement one stream serially if you prefer."
2. "Continue: proceed to the next items by **title** in dependency order (links in **`tickets.md`**), or re-run **`/identify-frontier`** if the queue changed."
3. "Close this feature’s implementation: when **`docs/ai-context.md` §2d** **feature-complete gate** is met, run **`/finish-feature`** (merge ticket/stage branches into **`feat/FR-NNNN-<slug>`**, validate, **PR → default branch**) — or **`/finish-frontier`** if integrating ticket/stage branches straight into the default branch. Until the gate is met, keep work on **`feat/FR-NNNN-<slug>`** only."

---

## Serial diary (append one block per session)

```markdown
## YYYY-MM-DD (session) — <agent or human>

**Stage:** e.g. design L1 / tickets / post-merge

**Recap (plain English):** What we did, what is blocked, what is next. When referencing tickets, use **title + [id](tickets.md#…)** not bare ids.
```

## Parallel agent diary (one file per stream)

`parallel/<T-FR-NNNN-xx>-<short-title-slug>.md` — same format as serial; include the ticket id for uniqueness and a **title slug** so filenames stay human-readable; do not clobber other agents’ files.

---

## Feature handoff (`handoffs/YYYY-MM-DD-continue.md`)

```markdown
# FR-NNNN — Continue handoff (YYYY-MM-DD)

**Git:** branch(es) `feat/…`, last known SHAs: …

**Done since last handoff:** …

**Next agent should:** …

**Risks / blockers:** …

**Links:** `serial-diary.md`, `parallel/…`, PRs, `tasks/handoffs/…` (if any)
```

---

## Merged diary stack (`DIARY.md`)

Newest block at **top**. Each block keeps the **raw** sources (**`serial-diary.md`**, **`parallel/foo.md`**) — do **not** delete those files when adding **`DIARY.md`**.

```markdown
# FR-NNNN — Merged diary (stack: newest first)

## YYYY-MM-DD — from `parallel/T-FR-0007-02-batch-ingest.md` @ `abc1234`

**Recap:** … (cite tickets as **title** + link to `tickets.md` in the body)

---

## YYYY-MM-DD — from `serial-diary.md` @ `def5678`

**Recap:** …
```

---

## Branch state (repo-root `CURRENT.md`)

Use on **`feat/FR-NNNN-<slug>`** and **`feat/FR-NNNN-<slug>/T-…`** branches only; see **`.cursor/skills/feature-request/SKILL.md` → Branch state (`CURRENT.md`)** for **`main`** policy. Replace placeholders; keep under ~40 lines.

```markdown
# Current branch state

| Field | Value |
|------|--------|
| **FR** | FR-NNNN |
| **Feature folder** | `tasks/feature-history/FR-NNNN-<slug>/` |
| **This branch** | `…` (feature integration or ticket) |
| **Parent branch** | `feat/FR-NNNN-<slug>` (if this is a ticket branch) |
| **Last meaningful update** | YYYY-MM-DD |

## What is on this branch

- …

## In flight / blockers

- …

## Next

1. … (e.g. run VAL, merge to feature branch, open PR — link `tasks/ticket-progress.md` and `handoffs/` as needed)
```

---

## Dev environment (MkDocs / Docker)

Repositories that ship **`./develop`**, **`compose.yaml`**, and **`scripts/serve-docs.sh`**: run development-specific commands in Docker / Docker Compose / Dev Container where possible. During design or before doc **VAL**, run **`./develop up`**; for a static build in Docker, **`./develop build`**. Use **`./develop local`** only as a documented host fallback. See **`.cursor/skills/feature-request/SKILL.md`** (local dev section) and root **`README.md`**.
