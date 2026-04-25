# AI development context

**Single source of truth for AI-assisted development *process***: session flow, worktrees, tickets, collaboration norms, and how spec ↔ code conflicts are handled. **Cursor** (`.cursor/rules/main.mdc`) and **Claude Code** (`CLAUDE.md`) should reference this file.

**Product and system design** live under **`docs/design/`** (and, if you publish a docs site from this repo, treat that site as the **primary source of truth** for business + system design the same way you would authoritative pages under **`docs/design/`**). This file does not duplicate those specs; it tells agents how to use them.

This document is **stack-agnostic**. Language-specific rules belong in **`.cursor/rules/stack-conventions.mdc`** (or equivalent) once you choose a stack.

---

## Session bootstrap

At session start, load in order:

1. **`docs/ai-context.md`** (this file)
2. **`tasks/ticket-progress.md`** — queue beacon, optional **Parallel streams**, and **TEST / DEV / VAL** rows
3. **`docs/design/architecture/overview.md`** when it exists and is populated
4. **`README.md`**
5. **`tasks/lessons.md`**

Skim **`tasks/handoffs/`** and **`tasks/feature-history/REGISTRY.md`** for recent decisions.

---

## Worktree policy and session status

- **Local worktree root:** store all repo-local git worktrees under **`.worktrees/`** (gitignored). Do not commit nested worktree directories.
- **Per-feature worktree:** each **`FR-NNNN-<slug>`** gets a feature integration worktree under **`.worktrees/FR-NNNN-<slug>/feature/`** on branch **`feat/FR-NNNN-<slug>`**.
- **Per-ticket / per-stage worktree:** each worked implementation ticket or stage gets its own child worktree under the feature folder, e.g. **`.worktrees/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name/`**, on a branch named with both feature and ticket/stage, e.g. **`feat/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name`**. Create these branches from the current feature branch, then merge them back into **`feat/FR-NNNN-<slug>`**.
- **Parallel streams:** multiple tickets or features may be active; each stream keeps its own worktree. Document parallel work in **`tasks/ticket-progress.md`** (**Parallel streams** table) so status is visible.
- **Integration checkout** (often repo root on the default branch) coordinates merges and shared task files; avoid feature implementation there unless the team directs it.

**Session status values:** `starting` | `planning` | `developing` | `testing` | `integrating` | `complete` | `blocked` | `handoff`

---

## Docs authority and escalation

### Documentation as source of truth

- **Design docs are intended to be correct** for the behavior and interfaces they describe. When documentation and code disagree, **fix the code**, not the doc. The design is the authority for specified behavior (aligned with a **docs-first** / **MkDocs-as-primary** posture when your project adopts a published site).
- **No silent spec edits:** if the design is wrong or incomplete, use the amendment process below — same discipline as “documentation is the source of truth, but the source of truth can change auditably.”
- **Ambiguity:** if you are inventing interfaces or behavior not grounded in **`docs/design/`** (or an agreed ticket that extends it), **stop** — that is a **`DESIGN-GAP`** until resolved.
- **Where there is no design yet:** major behavior should land as a short spec under **`docs/design/`** (or an **`FR-NNNN`** design artifact your process defines) before or alongside code, not only in implementation.

### Escalation tags

| Tag | When |
|-----|------|
| `DESIGN-GAP` | Spec ambiguous — stop; do not guess |
| `DESIGN-FLAW` | Wrong testable assumption in design |
| `CODE-DEFECT` | Design correct; implementation wrong |
| `COMPLETED` | Implementation and design match; all criteria met |

### Amendment format

```markdown
<!-- AMENDMENT: <AREA>-<NUMBER> -->
<!-- Author: <agent session> -->
<!-- Date: YYYY-MM-DD -->
<!-- Reason: <rationale> -->

<updated content>

<!-- /AMENDMENT -->
```

---

## Implementation standards (fill when stack is chosen)

- **Languages and frameworks:** Record versions, build commands, and lint/format rules in **`README.md`** and **`.cursor/rules/stack-conventions.mdc`** (set `alwaysApply: true` there when ready).
- **Testing:** Prefer **tests before behavior** when your ticket template uses phased work. Run **VAL** (verification) in the environment your tickets specify (often a Dev Container or CI image once defined).
- **Security:** Follow your organization’s policies. Do **not** commit secrets; keep `.env*` out of git unless using checked-in **`.env.example`** placeholders only.

---

## Traceability

Use a short project-level tag on non-trivial units, for example **`@FH-<AREA>-<NUMBER>`**, and define **AREA** names in **`docs/design/documentation-style.md`**.

---

## Implementation ticket IDs (`T-FR-NNNN-xx`)

Tickets use a **feature id** **`FR-NNNN`** (four digits) and a per-feature sequence **`xx`**.

- **Format:** **`T-FR-NNNN-xx`** — see **`docs/design/documentation-style.md`**.
- **Reserved platform line:** **`FR-0000`** — core bootstrap; canonical **`T-FR-0000-xx`** definitions may live in **`tasks/feature-history/FR-0000-bootstrap/tickets.md`**.

---

## Workflow orchestration

### 1. Plan mode

Use planning for multi-step or architectural work.

### 1b. Subagents ahead of large work (context budget)

- **Prefer subagents before large work** so the main session keeps a **thin context** and does not lose track of goals. Spawn delegated work **early** when the task is likely to span **many files**, **several subsystems**, **broad repo exploration**, or **more than one focused session** of edits.
- **Orchestrator role:** define success criteria, boundaries, and return format; merge **bounded handoffs** (paths, decisions, short markdown) from subagents instead of inlining huge tool dumps in the parent thread.
- **Examples:** repo-wide search → delegated exploration; parallel implementation tickets (**`T-FR-NNNN-xx`**) → **`develop-frontier`** (one subagent per ticket); large **`FR-NNNN`** design → subagents per subsystem with one **serial diary** owner; **several `FR-NNNN` in design** → one subagent **per feature directory** so each **`serial-diary.md`** stays coherent.
- **Platform:** In Cursor, use the **Task** tool with an appropriate `subagent_type` where available; in Claude Code, use **subagents** per product docs. If subagents are unavailable, **stop and split** the work into smaller user-visible steps rather than monolithic execution.

### 2. Subagent strategy

- **Per ticket** (id **`T-FR-NNNN-xx`):** phases **TEST → DEV → VAL** serially inside that ticket’s section in the owning feature’s **`tickets.md`**, **one child worktree** under that feature’s **`.worktrees/FR-NNNN-<slug>/`** folder.
- Do **not** parallelize phases for the **same** ticket across subagents.
- **Parallel tickets:** use **`identify-frontier`** / **`develop-frontier`**, then **`finish-feature`** (feature integration branch → **PR to `main`**, §2d) **or** **`finish-frontier`** (merge straight to **`main`**) — the parent should **delegate** implementation streams per **§1b** rather than doing every ticket inline.

### 2b. Feature request lifecycle (product `FR-NNNN`)

- **Cursor skill:** `feature-request` — **`.cursor/skills/feature-request/SKILL.md`**
- **Claude command:** `/feature-request` (and **`/feature-request-continue`** to resume)
- **Registry and history:** **`tasks/feature-history/REGISTRY.md`**, one directory **`tasks/feature-history/FR-NNNN-<slug>/`** per feature (intake, layered design, **`20-tickets-dag.md`**, **`serial-diary.md`** / **`parallel/`**, optional **`DIARY.md`**, **`handoffs/`**, **`90-closeout.md`**). **Reservation rule:** once **`FR-NNNN`** and **`next_id`** are updated and the minimal feature stub exists, **commit and push to `main` right away** so other parallel features see the assignment and do not pick the same id.
- **Composes** with: **`/identify-frontier`**, **`/develop-frontier`**, **`/finish-feature`** (default for product implementation per **§2d**), **`/finish-frontier`** — the feature request flow **produces and lands** tickets with ids **`T-FR-NNNN-xx`**, then those commands run on the ticket graph. It does **not** replace them.
- **Disambiguation:** *Identify* in the spoken *identify (FR) → develop → finish* product flow = **register `FR-NNNN` and intake**; **`/identify-frontier`** = parallel **tickets** from all **`tasks/feature-history/**/tickets.md`** + **`ticket-progress.md`** and should run **only after** tickets exist.

### 2c. Parallel features (multiple `FR-NNNN`) and the global ticket DAG

- **Parallel product features are allowed:** Several **`FR-NNNN`** efforts may be in **`design`** or **`in-progress`** at the same time. Each keeps its own directory under **`tasks/feature-history/FR-NNNN-<slug>/`** (and its own **`parallel/`** diaries). **`REGISTRY.md`** is the roster of all features and statuses.
- **One global dependency graph:** Every implementation ticket (**`T-FR-NNNN-xx`**) is **defined** in a feature’s **`tasks/feature-history/FR-NNNN-<slug>/tickets.md`**; **`docs/design/tickets-initial.md`** holds the **combined DAG** (mermaid) and links. **`identify-frontier`** computes **eligible ∩ incomplete** over the **entire** graph — tickets belonging to **different** features often run in the **same** frontier batch when **Deps** do not block each other.
- **Orchestration:** **`develop-frontier`** may therefore mix tickets from multiple features in one wave; each ticket still gets **one subagent** and **one child worktree** under its owning feature folder (see **§1b** / **§2**). Close implementation with **`finish-feature`** per **`FR-NNNN`** (ticket/stage branches → **`feat/FR-NNNN-<slug>`** → **PR to `main`**) when using the feature-branch line (**§2d**), **or** **`finish-frontier`** when merging **directly** into **`main`** in dependency-safe order across **all** merged branches.
- **Shared files (`tasks/ticket-progress.md`, per-feature **`tickets.md`**, `docs/design/tickets-initial.md` DAG, `REGISTRY.md`):** Parallel agents must **avoid clobbering** shared tables: update **only** the **Progress** row for the **ticket id you own**; edit **only** your feature’s **`tickets.md`** for **`###`** sections; for **Current focus** / registry / global mermaid **`triadDone`**, **coordinate** (short handoff in **`tasks/handoffs/`**, or a single integration owner). **`triadDone`** unions on merge follow **Finish-frontier merge notes** at the end of this file.
- **Hot-file contention:** If two parallel streams must edit the **same** files repeatedly, **serialize** via an explicit **dependency** in the relevant **`tickets.md`** or a small **foundation ticket** that lands first.

### 2d. Feature integration branch, `finish-feature`, handoffs, diaries, and branch audit

- **Feature integration branch + worktree:** For each **`FR-NNNN`** in implementation, maintain a long-lived git branch **`feat/FR-NNNN-<slug>`** (same **`<slug>`** as the feature-history folder) checked out at **`.worktrees/FR-NNNN-<slug>/feature/`**.
- **Ticket/stage branches:** Every worked ticket or stage branches from the feature branch and includes both names, e.g. **`feat/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name`** (or **`feat/FR-NNNN-<slug>/stage-short-name`** for non-ticket stages). Its worktree lives under **`.worktrees/FR-NNNN-<slug>/<ticket-or-stage-slug>/`** and merges **into the feature branch first** — not directly to **`main`** — unless an explicit exception is documented for hotfix flows.
- **`finish-feature`:** Merges ticket/stage branches into **`feat/FR-NNNN-<slug>`**, runs validation there, pushes the feature branch, and opens (or updates) a **pull request to `main`** for **human** review and merge. It does **not** replace **`finish-frontier`** for workflows that still integrate straight to **`main`**.
- **Continue / milestone handoffs** for a feature belong **primarily** under **`tasks/feature-history/FR-NNNN-<slug>/handoffs/`** (e.g. `YYYY-MM-DD-continue.md`, `YYYY-MM-DD-milestone.md`). Optionally mirror a one-line pointer in **`tasks/handoffs/`** if the team wants a global inbox — the **authoritative** narrative for “what’s next on this feature” stays next to that feature’s artifacts.
- **Diaries:** **`serial-diary.md`** is one append-only chain for serial work; parallel agents write only under **`parallel/<stream>.md`**. Periodically (and at closeout), produce **`DIARY.md`** in the same feature folder: **merge** content from **`serial-diary.md`** and **`parallel/*.md`** into **one** file ordered as a **stack** — **newest entries at the top** — each block labeled with **source file**, **date**, and **git ref** (branch or SHA) when known so git history stays traceable. **Do not delete** the underlying **`serial-diary.md`** / **`parallel/`** files when generating **`DIARY.md`**; they remain the raw audit log.
- **Never auto-delete remote branches** used in feature or ticket work (**`feat/*`**) — they record how the work evolved. Removing remotes or force-deleting history requires **explicit human** approval. Local worktree directories may be removed only when safe and the **remote** branch is retained.

### 3. Self-improvement

After user corrections, append **`tasks/lessons.md`**.

### 4. Verification

Do not mark **VAL** `done` without meeting the ticket’s verification criteria.

### 5. Task management

- Update **`tasks/ticket-progress.md`** Progress rows for the ticket you own — **only your row** when multiple agents run in parallel.
- When several features are active, keep **`Parallel streams`** (in **`ticket-progress.md`**) accurate, or add a dated line to **`tasks/handoffs/`** naming each stream’s **ticket id**, **`FR-NNNN`**, branch, and **`.worktrees/…`** path.
- When a ticket completes, update the **DAG Overview** **`triadDone`** classes in **`docs/design/tickets-initial.md`** (per **`docs/design/documentation-style.md`** — e.g. `TFR0007_01_TEST` … `triadDone`).

### 6. Session end

Optional **Suggested next step** for the next worker (from **Current focus** + what you finished).

### 7. Ticket completion — commit, push, PR

When **TEST/DEV/VAL** are all **`done`**:

1. **Commit** — Conventional message; optional metrics footer per **`.cursor/skills/commit-with-ai-metrics/SKILL.md`** / **`/commit-with-metrics`**.
2. **Push** — `git push -u origin HEAD` (or as required).
3. **Open PR** — Prefer `gh pr create`; if unavailable, note what blocked it. Under the **feature-branch workflow** (**§2d**), each completed ticket/stage opens a PR with **base** **`feat/FR-NNNN-<slug>`** and **head** the feature-prefixed ticket/stage branch; after all tickets land, **`finish-feature`** opens (or updates) the **PR** with **base** **`main`** and **head** **`feat/FR-NNNN-<slug>`** — still **no** automated push to **`main`**. For **direct-to-main** integration, use **base** **`main`** for ticket PRs per team policy.

---

## Finish-frontier merge notes

**`finish-feature`** uses the same **union** rules for shared tracker files when merging **ticket** branches into **`feat/FR-NNNN-<slug>`**; it does **not** push **`main`** — only a **PR** for human merge (**§2d**).

When merging multiple ticket/stage branches (via **`finish-frontier`** into **`main`**), resolve **shared** files (e.g. `docs/design/tickets-initial.md` mermaid `triadDone` classes) by **union** of completed tickets.

After merge resolution, run a mandatory full revalidation gate on the **target** branch (**`main`** for **`finish-frontier`**; **`feat/FR-NNNN-<slug>`** when finishing a feature) before pushing **that** branch:

- If all required checks pass: **`finish-frontier`** may push **`main`**; **`finish-feature`** pushes only **`feat/FR-NNNN-<slug>`** and relies on the **PR to `main`** for human merge — never push **`main`** from automation in the feature workflow.
- If any check fails or a requirement is unmet, do **not** push the green integration branch; create/update a blocker as the primary ticket in `tasks/ticket-progress.md`, set `Session status` to `blocked`, and for **`finish-frontier`** push the integration state to `broken-main` until the blocker reaches VAL `done`.

---

## Further reading

- **`INIT.MD`** — clone, **`init-skeleton`**, **`sync-skeleton`**, **`init-project`**
- **`sync-skeleton`** skill / **`/sync-skeleton`** — run **`./sync-skeleton`** from the project root (see **`INIT.MD` → *Syncing template updates***)
- **`docs/design/documentation-style.md`** — ticket ids, traceability, writing rules
- **`.cursor/skills/feature-request/SKILL.md`** — full **`FR-NNNN`** stage contract
