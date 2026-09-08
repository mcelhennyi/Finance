@HARNESS_GUIDE.md
@docs/ai-context.md

## Codex session bootstrap

After this file, load in order:

1. **`docs/ai-context.project.md`** when present — shared project process overlay
2. **`.codex/rules/session.md`** — binding rules and full load order
3. **`.codex/project.md`** when present — Codex-only project overlay (syncignored at consumer root after first init)

See **`.codex/README.md`** and **`docs/skeleton-project-overlays.md`**.

## Codex-specific notes

- Prefer **subagents or delegated tasks** for large exploration or multi-file work; see **`docs/ai-context.md` §1b**.
- Keep **`tasks/ticket-progress.md`** current when doing ticket work (**Active ticket**, **Branch / worktree**, **Session status**). Worktrees live under **`.worktrees/FR-NNNN-<slug>/`**: `feature/` for **`feat/FR-NNNN-<slug>`**, plus child ticket/stage worktrees on feature-prefixed branches.
- Run development-specific commands (**build**, **test**, **lint**, package-manager scripts, doc builds, and dev servers) inside Docker / Docker Compose / Dev Container / CI images where possible; use **`./develop`** / `docker compose run` before host-local execution, and document host exceptions in ticket diaries or handoffs.
- For any web UI work, required validation means scripted frontend checks plus rendered browser inspection before **VAL** per **`docs/ai-context.md`**; use **`@Browser`** when available after starting the local app, and follow project overlays / stack conventions for commands, URLs, and route/state matrices.
- **Parallel features:** several **`FR-NNNN`** streams may be active; **`/develop-frontier`** batches **`T-FR-NNNN-xx`** from the **global** graph — see **`docs/ai-context.md` §2c** and **`tasks/ticket-progress.md` → Parallel streams**.
- **Feature DAGs:** every feature-local **`20-tickets-dag.md`** starts with its
  canonical Mermaid graph. The feature integration owner refreshes it before
  and after every wave with **`python3 scripts/refresh_ticket_dags.py --root .`**:
  visible labels and dependencies are plain English while stable ids remain;
  completed is green, in-development yellow, and outstanding red; and a generated
  project/feature explanation of no more than three sentences sits directly below
  the graph.
- **Continuous controller:** each operator bug gets its own report→ticket→TEST→DEV→VAL subagent lane while the parent keeps taking new work; serialize shared id/DAG integration. Before every wave, merge the fetched project remote default into affected features, re-read changed authority/docs, validate, then run the skeleton hash gate — **`.codex/rules/orchestrator-controller.md`**.
- When you assign a new **`FR-NNNN`** in **`REGISTRY.md`**, **commit and push to `main` immediately** after the minimal feature stub exists so concurrent work deconflicts ids (**`docs/ai-context.md` §2b**).
- For substantive answers that need a structured close, prefer **Executive summary**, **Details**, **Suggested next step**, and **Options** when several paths exist. The `/feature-status` BLUF/fractions/table format is **explicit-invocation only**; ordinary status, progress, allocation, blocker, completion, summary, and next-step questions do not trigger it.

Codex discovers reusable command skills under **`.agents/skills/`**. Wrappers named **`source-command-*`** point at the same workflows as Cursor skills and Claude commands.

| Command | Role |
|---------|------|
| **`/audit-design`** | Pre-ticket readiness audit for a **top-level design doc** path — **`.cursor/skills/audit-design/SKILL.md`**. Run before **`/feature-request`** when design already exists. |
| **`/audit-security`** | Read-only security audit for a design, code path, service, dependency set, container image, protocol, or release scope; includes current CVE/advisory checks — **`.cursor/skills/audit-security/SKILL.md`**. |
| **`/feature-request`** | **`FR-NNNN`** lifecycle: intake, layered design, open/pin the live **`20-tickets-dag.md`** when the active client supports it (absolute clickable path fallback), plain-English labels/dependencies plus a short project/feature explanation directly below, green/yellow/red updates by wave, canonical **`tickets.md`**, optional frontier; repo-root **`CURRENT.md`** on **`feat/*`**; end turns with **Executive summary** + **next step** + **options** when relevant — **`.cursor/skills/feature-request/SKILL.md`**. |
| **`/expand-feature`** | Same-**`FR-NNNN`** sub-feature addendum: scale process to the ask; simple UI tweaks use a dedicated worktree plus docs HTML mock, while larger additions write **`30-expand-*`**, append same-FR tickets/DAG/tracker rows, then optionally run frontier implementation — **`.cursor/skills/expand-feature/SKILL.md`**. Bug fixes keep one ticket/lane per report. |
| **`/feature-bug`** | Continuously log, same-FR ticket, and TEST→DEV→VAL each pre-PR/manual-test issue in its own subagent lane under **`bugs/`** while the parent remains available — **`.cursor/skills/feature-bug/SKILL.md`**. |
| **`/feature-request-continue`** | Resume an in-progress **`FR-NNNN`** from **`tasks/feature-history/`** (read **`CURRENT.md`** when on **`feat/*`**); **`git fetch`** and verify integration PR state before suggesting merge; if merged, apply closeout hygiene (**`90-closeout.md`**, retire **`Parallel streams`** row, **Current focus**). |
| **`/identify-frontier`** | Parallel-ticket handoff from **`ticket-progress.md`** + **`tasks/feature-history/**/tickets.md`** (+ DAG). Run **after** tickets exist. |
| **`/develop-frontier`** | Before every wave/micro-wave, merge fetched project remote-default updates into affected features, re-read/validate changed authority, compare pinned/remote skeleton hashes, and refresh/check each top feature DAG (plain-English labels/dependencies, directly-below project/feature explanation, completed green, development yellow, outstanding red); run one subagent per ticket (**TEST→DEV→VAL**) and use **`finish-feature`** only after the **§2d** gate. |
| **`/finish-feature`** | Merge ticket/stage branches into **`feat/FR-NNNN-<slug>`**, validate; **mandatory closeout** (**`90-closeout.md`**, **`REGISTRY`**, **`ticket-progress`**) plus **`/explain-feature`** and fresh-context **`/update-manual`** when gate passes; **PR → default branch** only when **`docs/ai-context.md` §2d** feature-complete gate is met; do not auto-delete remote **`feat/*`**. |
| **`/finish-frontier`** | Merge parallel ticket/stage branches into **`main`** per policy. |
| **`/explain-feature`** | Completed-feature before/after HTML explanation saved under **`tasks/feature-history/FR-NNNN-<slug>/`** with diagrams, code/design/test links, validation proof, and review checklist; run automatically by **`/finish-feature`** after the feature-complete gate — **`.cursor/skills/explain-feature/SKILL.md`**. |
| **`/explain-and-document`** | Explicit opt-in explanation workflow: explain a requested topic from code/docs evidence and write it into the static HTML manual under **`docs/manual/`** with search/index updates — **`.cursor/skills/explain-and-document/SKILL.md`**. |
| **`/update-manual`** | Diff current code against **`docs/manual/update-log.html`** last reviewed hash, update the static HTML manual/search/index, and advance the hash/log even for no-op manual updates — **`.cursor/skills/update-manual/SKILL.md`**. |
| **`/commit-with-metrics`** | Commit with optional AI metrics footer — **`.cursor/skills/commit-with-ai-metrics/SKILL.md`**. |
| **`/add-todo`** | Lightweight follow-up in **`tasks/todo.md`** — **`.cursor/skills/add-todo/SKILL.md`**. |
| **`/actor-dream`** | Dream with actors, story graphs, outside forces, and guiding figures to extend traceable user stories into upgrade hypotheses, tests, and growth candidates — **`.cursor/skills/actor-dream/SKILL.md`**. |
| **`/code-tour`** | Generate a self-contained interactive HTML walkthrough for a scoped code area — hot path, code excerpts, diagrams, error handling, tests, and docs/code mismatches — **`.cursor/skills/code-tour/SKILL.md`**. |
| **`/executive-summary`** | Create a concise BLUF-first project/task summary under **`tasks/executive-summaries/`** with timestamp, branch, commit, scope, and evidence traceability — **`.cursor/skills/executive-summary/SKILL.md`**. |
| **`/feature-status`** | **Explicit-only:** resolve and open/pin the live DAG when supported (always surface its absolute clickable path), then give a concise BLUF, ticket/wave fractions, and a **Done / Upcoming / Blocked / Skipped** table — **`.cursor/skills/feature-status/SKILL.md`**. |
| **`/sync-skeleton`** | Update **`.skeleton/`** submodule and manifest-listed root copies — **`.cursor/skills/sync-skeleton/SKILL.md`**, **`.skeleton/INIT.MD`**. |

**“Identify” disambiguation:** spoken **identify (FR)** = register **`FR-NNNN`** + intake; **`/identify-frontier`** = parallel **tickets** only after **`tickets.md`** exists.

**Development standards:** **`.claude/rules/development-standards.md`**. **Binding rules:** **`.codex/rules/`** (see **`.codex/rules/session.md`**). **Doc sync:** **`.codex/rules/agent-doc-sync.md`**.
