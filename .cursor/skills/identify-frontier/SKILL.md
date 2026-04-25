---
name: identify-frontier
description: >-
  Derives the current parallel-work frontier from tasks/ticket-progress.md and
  all tasks/feature-history/**/tickets.md (plus docs/design/tickets-initial.md
  for DAG), and writes a handoff-style markdown doc (or prints the same). Use
  for parallel frontier / identify frontier / next-step handoff.
---

# Identify frontier

Produce a **next-step parallel frontier** handoff: queue snapshot, **dependency-eligible** tickets, **parallel-capable** set, blocked examples, process note, cross-cutting items, concrete steps, related files.

## Inputs (read in order)

1. `docs/ai-context.md` — VAL-DONE, worktree policy, session status labels, **§1b** (subagents ahead of large work — use a subagent to read or summarize many **`tickets.md`** files when the tree is large).
2. `tasks/ticket-progress.md` — **Current focus** table; **Progress table** rows (ticket id **`T-FR-NNNN-xx`**, **TEST** / **DEV** / **VAL** cells, **Notes**).
3. **All** **`tasks/feature-history/**/tickets.md`** — For every ticket heading **`### T-FR-NNNN-xx`**, read **`**Deps:**`** (comma-separated full ticket ids, `none`, or e.g. `T-FR-0007-01, T-FR-0007-02`). Use **`tasks/feature-history/TICKET-SOURCES.md`** as a checklist; **glob** for any new feature dirs not listed yet.
4. `docs/design/tickets-initial.md` — **Global DAG** and **`triadDone`** lines only (no **`###`** ticket bodies); use for visualization and merge conflict hints.
5. Optionally skim **`tasks/lessons.md`** for cross-cutting bullets.

## Definitions

- **VAL-DONE (ticket):** That ticket’s **VAL** column is **`done`** (case-insensitive).
- **Triad complete:** TEST, DEV, and VAL are all **`done`**.
- **Eligible for new work:** Every ticket listed in **Deps:** is **VAL-DONE**. **`Deps: none`** → always eligible.
- **Incomplete:** Any of TEST/DEV/VAL is `—`, `wip`, or not `done`.
- **Current parallel-capable set:** All tickets that are **eligible** and **incomplete**.

**Parallel features:** The graph is **global** — tickets from **different** product features (`FR-NNNN`) live in **separate** **`tickets.md`** files under **`tasks/feature-history/`**. The parallel-capable table may therefore mix **`T-FR-NNNN-xx`** from multiple features; that is expected when **Deps** allow (`docs/ai-context.md` §2c). Call it out in the handoff when helpful.

## Output

**Default:** Write `tasks/handoffs/YYYY-MM-DD-parallel-frontier.md` (today’s date from the session). If the file exists, append `-b` or similar.

**User-facing response:** when the handoff is also delivered in chat, end with **Executive summary**, **Suggested next step**, and **Options** (parallel tickets often qualify) per **`feature-request`** skill **User-facing close (required)**.

### Document template (fill every section)

```markdown
# Next-step handoff — parallel frontier (YYYY-MM-DD)

**Audience:** Next agent or maintainer picking up work from `main`.
**Authority:** `tasks/feature-history/**/tickets.md`, `tasks/ticket-progress.md`, `docs/design/tickets-initial.md` (DAG), `docs/ai-context.md`.

---

## Snapshot: queue beacon (`tasks/ticket-progress.md`)

| Field | Value (as of this handoff) |
|------|----------------------------|
| **Active ticket** | … |
| **Active phase** | … |
| **Branch / worktree** | … |
| **Session status** | … |
| **Next agent should** | … |

**Triad-complete (summary):** …

**Still incomplete (summary):** …

---

## Snapshot: what the dependency graph allows in parallel

**Eligibility rule:** Every ticket in **Deps:** has **VAL** = `done` in `tasks/ticket-progress.md`.

With {list VAL-DONE deps}, these tickets are eligible and mutually non-blocking:

| Ticket | Title | Deps |
|--------|-------|------|
| … | … | … |

So **up to N parallel streams** are dependency-valid: `feat/FR-NNNN-<slug>/T-FR-NNNN-xx-…` per ticket, each under `.worktrees/FR-NNNN-<slug>/...`.

**Examples of what stays blocked until more VAL-done rows exist:**

- …

Full **Deps:** edges: scan all **`tasks/feature-history/**/tickets.md`**; global mermaid in `docs/design/tickets-initial.md`.

---

## Process note (queue vs graph)

…

---

## Cross-cutting work (parallel to tickets)

- …

---

## First concrete steps (primary next ticket)

1. …
2. …
3. …
4. If **`feat/*`** implementation branches are in scope, refresh repo-root **`CURRENT.md`** on each affected **`feat/FR-NNNN-<slug>`** so the parallel set and next actions match this handoff (**`feature-request`** skill **Branch state (`CURRENT.md`)**).

---

## Related files

- `tasks/ticket-progress.md`
- `tasks/feature-history/**/tickets.md`
- `tasks/feature-history/TICKET-SOURCES.md`
- `docs/design/tickets-initial.md` (global DAG + triadDone)
```

## Quality checks

- [ ] Every ticket in the **parallel table** was verified **eligible** and **incomplete**.
- [ ] **Deps** column matches **`**Deps:**`** in the owning feature’s **`tickets.md`** for each ticket row.
- [ ] **N** equals the parallel table row count unless exclusions are explained.
- [ ] If the table mixes tickets from **different product features**, the handoff **says so** (or maps each **`T-FR-NNNN-xx`** to **`FR-NNNN`** — trivially parsed from the id) so implementers see **§2c** context.
- [ ] When implementation worktrees exist, **`CURRENT.md`** on relevant **`feat/FR-NNNN-<slug>`** branches is updated or explicitly deferred with reason (**`feature-request`** skill).

## See also

- `.cursor/skills/develop-frontier/SKILL.md`
- `.cursor/skills/finish-frontier/SKILL.md`
