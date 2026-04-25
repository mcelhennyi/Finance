---
name: feature-request
description: >-
  End-to-end feature request lifecycle: intake, layered interface-first design,
  ticket breakdown with a parallelizable DAG, integration with
  identify/develop/finish frontier, feature-history diaries, and a numbered
  closeout handoff. Use when the user asks for a feature request, spec design
  with tickets, or FR-/FR-NNNN workflow.
---

# Feature request (design → tickets → optional frontier)

Orchestrates a **markdown-first** feature lifecycle that feeds the repo’s
**parallel ticket frontier** tools. Composes with existing project commands —
does **not** replace them.

## User-facing close (required)

Every time work on this workflow **pauses for the human**—after a **stage**, a **checkpoint**, **ticket or design work**, **develop / finish** steps, **`/feature-request-continue`**, or **closeout**—end the reply with a compact block (template in **`reference-templates.md` → User-facing session close**):

1. **Executive summary** — what happened (decisions, files and tickets touched, branch or registry state). Use **ticket titles** with linked **`T-FR-NNNN-xx`** ids per **Human-readable names vs ticket ids** below.
2. **Suggested next step** — one primary recommendation (concrete command, ticket to open, or owner action).
3. **Options (when applicable)** — if more than one reasonable path exists, list them (**A**, **B**, …) with a short differentiator ( deps, risk, or time). If only one path is sensible, state that briefly or omit this part.

**Repo alignment:** when you write **`handoffs/`**, **`serial-diary.md`**, **`parallel/…`**, or **`90-closeout.md`**, include the same three elements so the **chat** and the **tree** do not disagree.

**Scope:** skip the full block only for **non-FR** one-offs (e.g. a one-line fix unrelated to the feature); any work under **`FR-NNNN`** still gets at least a one-line summary + next step.

## Related local commands (compose, do not fork)

| Step | Command / skill | Role |
|------|------------------|------|
| Parallel handoff for **tickets** (`T-FR-NNNN-xx`) | `identify-frontier` / `/identify-frontier` | Recomputes who can run in parallel from **`tasks/feature-history/**/tickets.md`** + **`ticket-progress.md`** (DAG hints in **`tickets-initial.md`**). |
| Implement parallel set | `develop-frontier` / `/develop-frontier` | One child worktree per ticket under **`.worktrees/FR-NNNN-<slug>/`**; **TEST→DEV→VAL** per ticket. |
| Merge tickets → feature branch → PR | `finish-feature` / `/finish-feature` | Merges feature-prefixed ticket/stage branches into **`feat/FR-NNNN-<slug>`**, validates, **PR to `main`** for human review; **never** auto-deletes remote branches. |
| Merge to `main` (integration) | `finish-frontier` / `/finish-frontier` | Direct integration of parallel ticket/stage branches into **`main`** when not using the feature-branch line. |
| Commits (optional) | `commit-with-ai-metrics` / `/commit-with-metrics` | Conventional commit + optional metrics footer. |
| Doc site (MkDocs) — preview / static build | **`./develop`** (`./develop help`) | When **`docs/`** or **`mkdocs.yml`** change: use **`./develop up`** (Docker Compose, bind-mounted repo, live reload) or **`./develop local`** (host venv via **`./scripts/serve-docs.sh`**). Run **`./develop build`** for a containerized static build before closeout or as doc **VAL** when tickets touch docs. Set **`DEVELOP_*`** in optional **`develop.conf`** (from **`develop.conf.example`**) if service names or ports differ. **Aligns** with **Docker for VAL** in **`docs/ai-context.md`**. |

**Naming disambiguation:** The words **“identify”** in *identify, prompt, develop* refer to **FR intake + registering `FR-NNNN`**, not to **`/identify-frontier`**. Use **`/identify-frontier`** only **after** tickets exist in the tracker and you want a **parallel work** handoff.

### Human-readable names vs ticket ids (user-facing text)

**Stable ids** (`T-FR-NNNN-xx`, branch names, **`ticket-progress.md`**) stay as-is for tools and git. In **anything a human reads first** — prompts to the user, **`serial-diary.md`** / **`handoffs/`** recaps, **`README.md`** bullets, **`90-closeout.md`** narrative, global **`tasks/handoffs/`** pointers — use this order:

1. **Lead with the ticket title** (the **Title:** field in **`tickets.md`**, or the short phrase after **`—`** in the **`### T-FR-NNNN-xx — …`** heading). That is the primary name.
2. **Then** the ticket id, ideally as a **markdown link** to the canonical section so readers can open details:  
   `[T-FR-NNNN-xx](tasks/feature-history/FR-NNNN-<slug>/tickets.md#…)`  
   Use the heading anchor your host generates (GitHub/GitLab slugify the full **`###`** line; if the fragment is uncertain, link to **`tickets.md`** without a fragment and name the ticket id once in the same sentence).
3. **Mermaid DAGs** in **`20-tickets-dag.md`** / **`tickets-initial.md`:** label nodes with **title first**, id second (e.g. `T01["Scaffold Electron shell (T-FR-0002-02)"]`) so graphs stay scannable; keep **Deps** as real ids.

**Filenames** under **`parallel/`** may stay id-prefixed for uniqueness (`parallel/T-FR-0002-02-electron-shell.md`) or use a short title slug plus id; do not drop the id from machine-oriented paths if ambiguity would break parallel streams.

**Template note:** Keep **`.cursor/skills/`** and **`.claude/commands/`** aligned when you change this workflow — follow **`.cursor/rules/cursor-claude-doc-sync.mdc`**.

**Context:** For **large** `FR-NNNN` efforts (many subsystems, big ticket DAG, wide codebase impact), **spawn subagents early** for discovery or per-area design drafts, then consolidate into **`serial-diary.md`** or **`parallel/*.md`** per **`docs/ai-context.md` §1b**.

### Local dev: `./develop` and Docker (when this repo has MkDocs / Compose)

- **`./develop` is the supported entrypoint** (not a parallel to **`/identify-frontier`**) for running the **documentation** stack: **`help`**, **`up`**, **`down`**, **`build`**, **`local`**, shell/run helpers. See the root **`README.md`**.
- **During design (Stages 1..N):** if the feature adds or rewrites **design or product docs** under **`docs/`**, run **`./develop up`** or **`./develop local`** to verify navigation, links, Mermaid, and formatting before you treat a design stage as done.
- **During implementation and VAL:** if a **ticket** changes **`docs/`** or site config, include **`./develop build`** (or the ticket’s own Docker-based doc check) in **VAL** or note the equivalent verification in **`parallel/…` / `tickets.md`** so **`docs/ai-context.md`** (Docker for verification) is satisfied. If the project has no **`./develop`** or Compose yet, use **`/develop-frontier`**-assigned worktrees and document **VAL** criteria per ticket.

---

## Registry: `FR-NNNN` (stable id)

- Open **`tasks/feature-history/REGISTRY.md`**. Assign the next **`FR-NNNN`** (four digits, monotonic, **never reuse** a number for a different feature). Increment **`next_id`**.
- **Deconflict parallel features:** As soon as the id is written (and the minimal folder stub exists — see Stage 0), **`git pull`** then **`commit` + `push` to `origin/main`** for that change. Other streams rely on **`main`** to see reserved numbers and avoid duplicate **`FR-NNNN`** / **`next_id`** collisions. If push fails, **pull/rebase or merge**, fix conflicts in **`REGISTRY.md`** manually, then push again before assuming the id is yours.
- **Link** to implementation tickets: `FR-0007` may map to **`T-FR-0007-01`**, **`T-FR-0007-02`**, …; keep that mapping in the feature directory and the closeout handoff.
- **Parallel features:** **`REGISTRY.md`** may list **several** features in **`design`** or **`in-progress`** at once. Each feature’s artifacts stay under its own **`FR-NNNN-<slug>/`** directory so parallel design agents do not share one diary file unless intentionally serial.

---

## Parallel features vs one frontier batch

- **`FR-NNNN`** tracks **design and history** per product feature.
- **`/identify-frontier`** / **`/develop-frontier`** operate on the **single global** ticket graph (**`T-FR-NNNN-xx`**) whose **definitions** live in **`tasks/feature-history/**/tickets.md`**, with **`docs/design/tickets-initial.md`** holding the **combined DAG** only. A parallel-capable batch may therefore include tickets from **Feature A and Feature B** in the same wave if **Deps** allow — see **`docs/ai-context.md` §2c**.
- When landing tickets from **`20-tickets-dag.md`**, ensure **Deps** across the whole graph stay acyclic; avoid accidental **cross-feature cycles** unless intentional.

---

## Directory layout (required)

For feature **`FR-NNNN`**, with short slug `<slug>` (kebab-case):

```text
tasks/feature-history/FR-NNNN-<slug>/
  README.md                 # one-screen index; update as stages complete
  00-intake.md              # goals, timeline, raw request
  10-design-00-skeleton.md  # L0: interfaces and boundaries only
  10-design-01-*.md         # L1+ deepening (add files as needed)
  20-tickets-dag.md         # draft: Jira/Asana-ready table + mermaid + file mapping (promote into tickets.md)
  tickets.md                # **canonical** `### T-FR-NNNN-xx` sections + phases + Deps for this FR only
  serial-diary.md           # one append-only file for **serial** agents (or human run)
  parallel/                 # one diary file per **parallel** agent stream
  handoffs/                 # **primary** continue / milestone / finish notes for this feature (dated `*.md`)
  DIARY.md                  # merged **stack** diary (newest entries at top); see **Diary consolidation** below
  90-closeout.md            # final synopsis + **links to every artifact** in this folder
```

- **Serial runs:** append stages to **`serial-diary.md`** (and/or per-stage files). One narrative chain.
- **Parallel design or implementation subagents:** each stream writes **`parallel/<stream>.md`** (e.g. `parallel/T-FR-0007-01-scaffold-api.md` — include a **title slug** from the ticket so folder listings stay human-readable). Do **not** overwrite **`serial-diary.md`** from parallel streams.
- **Continue / resume handoffs:** write under **`handoffs/`** (e.g. **`handoffs/2026-04-25-continue.md`**) — this is the **canonical** place for “what the next agent should do” **for this `FR-NNNN`**. A short pointer in **`tasks/handoffs/`** is optional, not a substitute.
- **Git (implementation):** create **`feat/FR-NNNN-<slug>`** from **`main`** when starting build-out and check it out at **`.worktrees/FR-NNNN-<slug>/feature/`**. Create every ticket/stage branch from that feature branch, name it with both feature and ticket/stage (for example **`feat/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name`**), place its worktree under **`.worktrees/FR-NNNN-<slug>/<ticket-or-stage-slug>/`**, merge it **into** the feature branch, then use **`/finish-feature`** to open the **PR → `main`** for human review. Maintain repo-root **`CURRENT.md`** on those **`feat/*`** branches per **Branch state (`CURRENT.md`)** below.

If you need a one-off “prompt log”, add `prompts/prompts-log.md` and link it from the README.

### Diary consolidation (`DIARY.md`)

At meaningful milestones or **closeout**:

1. **Read** `serial-diary.md` and every **`parallel/*.md`** (newest activity first if you can infer timestamps from git or file order).
2. **Write** **`DIARY.md`** as a **single merged log** with **most recent entry at the top** (stack order). Each block must include: **date**, **source path** (`serial-diary.md` / `parallel/foo.md`), optional **branch or SHA**, and the **body** of the recap (keep enough context for audit).
3. **Preserve** `serial-diary.md` and **`parallel/`** unchanged as the append-only originals — **`DIARY.md`** is an additional merged view for humans and git archaeology, not a replacement that deletes history.
4. **Commit** `DIARY.md` (and handoffs) on the same feature or integration branch so the merge history stays linked.

---

## Branch state (`CURRENT.md`)

**Repo-root** **`CURRENT.md`** answers: *on **this git branch**, what is true right now, and what happens next?* It complements **`tasks/feature-history/FR-NNNN-<slug>/`** (deep history) with a **branch-local** beacon at the checkout root.

### When the file exists

| Situation | Policy |
|-----------|--------|
| **`feat/FR-NNNN-<slug>`** (feature integration branch) | **Required** once the branch exists: add **`CURRENT.md`** on the first meaningful commit (template in **`reference-templates.md` → Branch state**). **Keep it updated** through merges, identify/develop cycles, and blockers until the **PR to `main`** is merged or abandoned. |
| **`feat/FR-NNNN-<slug>/T-…`** (ticket/stage branches) | **Required:** each ticket branch carries **`CURRENT.md`** scoped to that ticket; refresh after **TEST / DEV / VAL** transitions and before pushing or opening PRs **into the feature branch**. |
| **`main`** (intake / design / registry only) | **Do not** use a long-lived repo-root **`CURRENT.md`** for per-feature state when **several** **`FR-NNNN`** streams may touch **`main`** in parallel (one file would collide). Use **`tasks/feature-history/FR-NNNN-<slug>/README.md`** and **`handoffs/`** until **`feat/FR-NNNN-<slug>`** exists. A single-stream team *may* add a short root pointer—prefer updating the feature **`README.md`**. |
| **`main`** after feature or frontier integration | **Delete** **`CURRENT.md`** in the merge to **`main`** (or in the next commit) so **`main`** does not keep stale branch-local prose, unless the repo documents a repo-wide **`CURRENT.md`** convention. |

### What to write (keep it short)

- **`FR-NNNN`**, **`<slug>`**, **this branch name** and role (feature integration vs ticket).
- **What landed** on this branch (ticket ids optional), **what is in flight**, **blockers**.
- **Next action** (command or human step), links to **`tasks/ticket-progress.md`**, **`tasks/feature-history/FR-NNNN-<slug>/handoffs/`**, and **`tickets.md`**.

### When to refresh (minimum)

- First commit on **`feat/FR-NNNN-<slug>`**; creating each ticket branch; after every **merge** into the feature branch (on **`CURRENT.md`** conflicts, **consolidate** one truthful rollup on **`feat/FR-NNNN-<slug>`**).
- After **`/identify-frontier`** changes the parallel set — orchestrator updates **`CURRENT.md`** on each affected **`feat/FR-NNNN-<slug>`** when implementation is in scope.
- End of each **TEST / DEV / VAL** phase on a ticket branch; before **`/finish-feature`** push and PR; on **block** / **unblock**; when resuming implementation via **`/feature-request-continue`**.

### Rollup vs ticket scope

The **feature** branch **`CURRENT.md`** is the **integrated** picture after ticket merges. Each **ticket** branch file may stay narrower until merge; the merger updates the feature branch file.

---

## Stage 0 — Intake

1. Allocate **`FR-NNNN`** in **`REGISTRY.md`**; create the directory tree; add **`README.md`** stub. **Immediately** commit and **push to `main`** (registry + stub) so concurrent feature work can deconflict on the shared **`REGISTRY.md`**.
2. Fill **`00-intake.md`** from **`reference-templates.md`** (title, timeline, success criteria, out of scope, raw prose).
3. Append **`serial-diary.md`**: one paragraph recap of intake.
4. **Branch state:** while work stays on **`main`** for intake, follow **`CURRENT.md`** policy (**do not** add a per-feature competing root file unless the single-stream exception in **Branch state (`CURRENT.md`)** applies); keep **`README.md`** in the feature folder current.

**Stop and ask** only if the request is empty or success criteria are impossible to state.

---

## Stages 1..N — Design (skeleton first, then deepen)

1. **L0 — Skeleton (`10-design-00-skeleton.md`):** public surfaces only: APIs, types, events, data contracts. **No** implementation, **no** internal class diagrams unless they are the public API. Use tables from **`reference-templates.md`**.
2. **L1+:** Add more files or sections **only as needed** (complexity, risk, number of subsystems, regulatory/security, scale):
   - small feature: L0 + short risks may suffice;
   - large feature: sequence diagrams, data lifecycle, idempotency, error taxonomy, SLO/throughput.
3. Each stage ends with a **plain-English summary** in **`serial-diary.md`** (or the relevant **`parallel/…`** file).
4. If the stage touched **`docs/`**, use **`./develop up`** or **`./develop local`** to preview where **`./develop`** is available; note any build warnings in the diary.

Tag unknowns with **`DESIGN-GAP`** per **`docs/ai-context.md`**.

---

## Stage — Tickets, DAG, mapping to the repo tracker

1. Author **`20-tickets-dag.md`** (draft / planning):
   - Table: ticket id (**`T-FR-NNNN-xx`**), **title** (required; this is the human-facing name everywhere below), type, **deps** (other full ticket ids or `none`), one-line **summary of change**, optional **order group** (P0, P1). Optional **Link** column: relative URL to **`tickets.md#…`** after sections exist, or “promote first”.
   - **Mermaid** `flowchart` or `graph` DAG with **edges = dependency** (A must be VAL-done before B starts if `A --> B`). **Node labels:** readable title + id in parentheses (see **Human-readable names vs ticket ids** above); dependency arrows still reference node ids you define.
   - **Maximize parallel width:** split by module boundary and shared files; use shared “facade + interfaces” tickets to unblock parallel work (same spirit as `identify-frontier` eligibility).
2. **Promote to canonical feature tickets** — in **`tasks/feature-history/FR-NNNN-<slug>/tickets.md`**:
   - Add every **`### T-FR-NNNN-xx`** section with **Deps:** and **Phases** tables (this file is the **source of truth** for that feature’s ticket bodies).
3. **Register and graph:**
   - Add a row for this feature to **`tasks/feature-history/TICKET-SOURCES.md`** if not already listed.
   - Extend **`docs/design/tickets-initial.md`**: add the feature row to **Per-feature ticket files**, and extend the **global mermaid** (and any cross-feature edges) so the published DAG matches all **Deps:**.
4. **Progress:** add or update rows in **`tasks/ticket-progress.md`** for each new ticket id.
5. Append **`serial-diary`**: what was split, what was intentionally serialized, and **why**.

If the user forbids direct repo edits, keep a “Proposed patch” section under **`20-tickets-dag.md`** instead, but the **target** layout above is still the contract.

---

## Stage — Prompt: develop or not?

1. Present a short **summary** of the design and ticket count. List tickets as **title + linked id** (per **Human-readable names vs ticket ids**), not ids alone.
2. **Ask the user:** “Do you want to start implementation now (parallel frontier) or stop after design?”
3. If **no** → finalize **`90-closeout.md`**, handoff, done (design-only delivery).
4. If **yes** → continue to **develop**.
5. **User-facing close** — end with **Executive summary**, **Suggested next step**, and **Options** (implement vs design-only is an options case) per **User-facing close (required)** above.

---

## Stage — Develop (identify → develop)

**Precondition:** Every ticket in the DAG that you intend to work exists in **`tasks/feature-history/**/tickets.md`** (canonical **`###`** sections) and **`ticket-progress.md`**. `develop-frontier` **will not** invent tickets.

1. **Optional but recommended:** Run **`/identify-frontier`** (or the skill) to write **`tasks/handoffs/…-parallel-frontier.md`** (global queue). Also append a **feature-scoped** summary under **`handoffs/YYYY-MM-DD-identify-note.md`** in **this** `FR-NNNN` folder so the next worker reads one place.
2. Update **`tasks/ticket-progress.md` → Current focus** per **`develop-frontier`**: `Session status` = `developing`, list worktrees and ticket ids.
3. Run **`/develop-frontier`** (or the skill) to launch **one subagent per parallel-capable ticket**, each in a child worktree under **`.worktrees/FR-NNNN-<slug>/`** on a feature-prefixed ticket/stage branch, **TEST→DEV→VAL** in order **inside** each ticket.
4. For each parallel subagent, ensure **`parallel/…-diary.md`** gets an entry when that stream starts and when it ends.
5. When a ticket or stream edits **`docs/`** and the project ships **`./develop`**: prefer **`./develop build`** (or **`./develop up`** to manually verify) for doc **VAL** in line with **`docs/ai-context.md`** (run verification in **Docker** / **Dev Container** for consistency).
6. **CURRENT.md:** on **`feat/FR-NNNN-<slug>`** and each **`feat/FR-NNNN-<slug>/T-…`** ticket branch, create or refresh repo-root **`CURRENT.md`** per **Branch state (`CURRENT.md`)** after phase changes and merges.

---

## Stage — Prompt: continue?

After each develop chunk or when the user returns:

- If the checkout is on **`feat/*`**, read repo-root **`CURRENT.md`** first, then **`handoffs/`** and **`serial-diary.md`**.
- **Ask:** “Continue with the next work (**title**, linked ticket) / another parallel batch, or pause?” — name **titles** from **`tickets.md`**, link ids for detail.
- If the queue or deps changed, re-run **`/identify-frontier`**.
- **User-facing close** — end with **Executive summary**, **Suggested next step**, and **Options** when the user can reasonably choose paths (per **User-facing close (required)**).

---

## Stage — Finish implementation (prompt, then run)

1. **Ask:** “All targeted tickets for this **`FR-NNNN`** are VAL-done. Merge via **`/finish-feature`** (feature branch → **PR to `main`**) or **`/finish-frontier`** (direct **`main`** integration)?”
2. **Default for `FR-NNNN` product work:** run **`/finish-feature`** — merges feature-prefixed ticket/stage branches into **`feat/FR-NNNN-<slug>`**, validates, opens **PR** for human review. **Do not** push **`main`** from automation here.
3. **Alternate:** **`/finish-frontier`** when the team explicitly integrates parallel tickets straight into **`main`**. Follow that skill’s **revalidation** / **`broken-main`** gate.
4. **CURRENT.md:** before **`/finish-feature`**, ensure **`feat/FR-NNNN-<slug>`**’s **`CURRENT.md`** reflects all merged tickets. The **PR to `main`** (or the human merge) should **remove** **`CURRENT.md`** on **`main`** per **Branch state (`CURRENT.md`)**.
5. After merge: run **Diary consolidation** → update **`DIARY.md`** (newest-first stack); **do not delete** remote **`feat/*`** branches.

---

## Stage — Closeout, handoff, and index

1. Write **`90-closeout.md`**:
   - **Executive summary** (what shipped vs deferred, in plain language);
   - **Links to all files** in `FR-NNNN-<slug>/` (including **`handoffs/`** and **`DIARY.md`**);
   - If implementation ran: one line on repo-root **`CURRENT.md`** (maintained on **`feat/*`**; removed on **`main`** when merged) per **Branch state (`CURRENT.md`)**;
   - **Mapping** `FR-NNNN` → tickets: for each **`T-FR-NNNN-xx`**, give **title** and a **link** to its **`###`** section in **`tickets.md`** (not ids-only bullets); **PR** link if **`finish-feature`** ran;
   - **Suggested next step** for the team (one primary);
   - **Options** for follow-up work (new tickets, `DESIGN-GAP` items, or alternative owners) when more than one path exists; otherwise state there is a single obvious follow-up or none.
2. Write **`handoffs/YYYY-MM-DD-closeout.md`** in **this feature folder** with the same anchor content (primary handoff). Optionally add **`tasks/handoffs/FR-NNNN-<slug>-closeout.md`** as a **short pointer** (“see feature `handoffs/…`”) — never let the global file replace the feature-local handoff.
3. Final **Diary consolidation:** ensure **`DIARY.md`** exists with **newest-first** merged entries from **`serial-diary.md`** + **`parallel/`**; commit on a surviving branch for traceability.
4. Update **`REGISTRY.md`**: set status **complete** (or `design-only`, `in-progress` as appropriate).
5. If project rules or commands were updated as part of the feature, list them in **`90-closeout.md`**.

---

## When to update `.cursor` / `.claude` / `docs/ai-context.md`

If the feature request **introduces a new process or renames a command**, update **both**:

- **Cursor:** `.cursor/rules/`, `.cursor/skills/`
- **Claude:** `.claude/commands/`, `.claude/rules/`

per **`.cursor/rules/cursor-claude-doc-sync.mdc`**. Otherwise, **no** doc churn.

---

## Quality checks (before handoff)

- [ ] `FR-NNNN` appears in `REGISTRY.md` (reservation **pushed to `main`** before heavy parallel work) and in **`handoffs/…-closeout.md`** inside the feature folder (optional pointer in `tasks/handoffs/` only).
- [ ] **`DIARY.md`** updated with newest-first merged diary when work had parallel streams or long serial history.
- [ ] `20-tickets-dag.md` / **`tickets.md`** DAG has no cycles; every edge matches **`Deps:`** in **`tickets.md`** and the global mermaid in **`docs/design/tickets-initial.md`** (when present).
- [ ] `serial-diary` (and `parallel/…` if used) have a recap per stage.
- [ ] `90-closeout.md` links to **every** artifact in the feature folder.
- [ ] If implementation ran: `develop-frontier` preconditions were satisfied; **`finish-feature`** or **`finish-frontier`** was chosen consistently with **§2d**; **VAL** per **`docs/ai-context.md`** (Docker / Dev Container). **Doc changes:** if **`docs/`** or **`mkdocs.yml`** changed, doc **VAL** used **`./develop build`** or equivalent Docker-based check when **`./develop`** exists.
- [ ] If multiple streams are active: **`tasks/ticket-progress.md` → Parallel streams** (or a dated **`tasks/handoffs/`** note) lists each ticket (**title** + **`T-FR-NNNN-xx`** + link to **`tickets.md`** where helpful), **`FR-NNNN`** (if any), and worktree path per **`docs/ai-context.md` §2c**.
- [ ] **CURRENT.md:** every active **`feat/FR-NNNN-<slug>`** and **`feat/FR-NNNN-<slug>/T-…`** implementation branch has an accurate repo-root **`CURRENT.md`** (see **Branch state (`CURRENT.md`)**); after integration to **`main`**, **`CURRENT.md`** is removed or neutralized per policy.
- [ ] **User-facing close:** the last user-visible reply for the chunk (and matching **`handoffs/`** or **`90-closeout.md`**) includes **Executive summary**, **Suggested next step**, and **Options** when several paths are reasonable (**User-facing close (required)**).

## Known process tensions (surface to the user if unclear)

1. **Tickets must exist** before `develop-frontier` / `identify-frontier` can act — the FR workflow is responsible for **landing** or **stating** merge-ready **`tickets.md`** + **`ticket-progress.md`** (+ DAG rows in **`tickets-initial.md`**).
2. **`FR-NNNN`** is the **feature** id; **`T-FR-NNNN-xx`** is the **implementation ticket** id (ticket embeds feature); link any cross-feature tickets explicitly in closeout.
3. **Registry races:** mitigated by **pushing the registry reservation to `main` immediately** after allocating **`FR-NNNN`**; if two streams still collide, **`git pull`** and resolve **`REGISTRY.md`** manually (re-number or merge rows), then push again.
4. **“Identify”** in the spoken workflow means **FR registry + intake**, not the **`/identify-frontier`** command until tickets exist.
5. **Parallel features:** several **`FR-NNNN`** may be in **`design` / `in-progress`** at once — use **separate** feature directories and **`parallel/`** diaries; do not append unrelated features to one **`serial-diary.md`**. Shared tracker files still need **one-writer discipline** or explicit merge order (**`docs/ai-context.md` §2c**).
6. **Two-layer tickets:** **`tickets.md`** owns **`###`** bodies; **`docs/design/tickets-initial.md`** owns the **global mermaid** — keep **Deps:** and graph edges in sync when either changes.
7. **Git audit:** feature and ticket **`feat/*`** branches must remain on the remote unless a **human** explicitly deletes them after review.

## See also

- **`reference-templates.md`** (in this directory)
- **`./develop`**, root **`develop.conf.example`**, **`README.md`**
- **`identify-frontier`**, **`develop-frontier`**, **`finish-feature`**, **`finish-frontier`**
- **`docs/ai-context.md`**
- **`tasks/feature-history/README.md`**
