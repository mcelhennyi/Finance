@docs/ai-context.md

Load **`docs/ai-context.project.md`** when present (shared project process overlay). See **`docs/skeleton-project-overlays.md`**.

## Claude-specific notes

- Prefer **subagents or delegated tasks** for large exploration or multi-file work; see **`docs/ai-context.md` §1b**.
- Keep **`tasks/ticket-progress.md`** current when doing ticket work (**Active ticket**, **Branch / worktree**, **Session status**). Worktrees live under **`.worktrees/FR-NNNN-<slug>/`**: `feature/` for **`feat/FR-NNNN-<slug>`**, plus child ticket/stage worktrees on feature-prefixed branches.
- Run development-specific commands (**build**, **test**, **lint**, package-manager scripts, doc builds, and dev servers) inside Docker / Docker Compose / Dev Container / CI images where possible; use **`./develop`** / `docker compose run` before host-local execution, and document host exceptions in ticket diaries or handoffs.
- For any web UI work, required validation means scripted frontend checks plus rendered browser inspection before **VAL** per **`docs/ai-context.md`**; use the available browser-capable testing surface after starting the local app, and follow project overlays / stack conventions for commands, URLs, and route/state matrices.
- **Parallel features:** several **`FR-NNNN`** streams may be active; **`/develop-frontier`** batches **`T-FR-NNNN-xx`** from the **global** graph — see **`docs/ai-context.md` §2c** and **`tasks/ticket-progress.md` → Parallel streams**.
- When you assign a new **`FR-NNNN`** in **`REGISTRY.md`**, **commit and push to `main` immediately** after the minimal feature stub exists so concurrent work deconflicts ids (**`docs/ai-context.md` §2b**).

Custom slash commands live in **`.claude/commands/`**:

| Command | Role |
|---------|------|
| **`/audit-design`** | Pre-ticket readiness audit for a **top-level design doc** path (plain-English report: fix / address / defer before ticketing) — **`.cursor/skills/audit-design/SKILL.md`**. Run before **`/feature-request`** when design already exists. |
| **`/audit-security`** | Read-only security audit for a design, code path, service, dependency set, container image, protocol, or release scope; includes current CVE/advisory checks — **`.cursor/skills/audit-security/SKILL.md`**. |
| **`/feature-request`** | **`FR-NNNN`** lifecycle: intake, layered design, **`20-tickets-dag.md`**, canonical **`tickets.md`**, optional frontier; repo-root **`CURRENT.md`** on **`feat/*`**; end turns with **Executive summary** + **next step** + **options** when relevant — see **`.cursor/skills/feature-request/SKILL.md`**. |
| **`/expand-feature`** | Same-**`FR-NNNN`** sub-feature addendum: scale process to the ask; simple UI tweaks use a dedicated worktree plus docs HTML mock, while larger additions write **`30-expand-*`**, append same-FR tickets/DAG/tracker rows, then optionally run frontier implementation — **`.cursor/skills/expand-feature/SKILL.md`**. |
| **`/feature-request-continue`** | Resume an in-progress **`FR-NNNN`** from **`tasks/feature-history/`** (read **`CURRENT.md`** when on **`feat/*`**); **`git fetch`** and verify integration PR state before suggesting merge; if merged, apply **Closeout** hygiene (**`90-closeout.md`**, retire **`Parallel streams`** row, **Current focus**). |
| **`/identify-frontier`** | Parallel-ticket handoff from **`ticket-progress.md`** + **`tasks/feature-history/**/tickets.md`** (+ DAG). Run **after** tickets exist. |
| **`/develop-frontier`** | One subagent per parallel-capable ticket (**TEST→DEV→VAL** per child worktree under **`.worktrees/FR-NNNN-<slug>/`**); merge to **`feat/…`**; **`finish-feature`** only after **§2d** gate. |
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
| **`/feature-status`** | Give a concise plain-English feature update with a BLUF and a table of **Done**, **Upcoming**, **Blocked**, and **Skipped** work with rough complexity signals — **`.cursor/skills/feature-status/SKILL.md`**. |
| **`/sync-skeleton`** | Update **`.skeleton/`** submodule and **`skeleton.manifest`** root copies; run **`./sync-skeleton`** — **`.cursor/skills/sync-skeleton/SKILL.md`**, **`.skeleton/INIT.MD`**. |

**“Identify” disambiguation:** spoken **identify (FR)** = register **`FR-NNNN`** + intake; **`/identify-frontier`** = parallel **tickets** only after **`tickets.md`** exists.

Development standards: **`.claude/rules/development-standards.md`**. Doc sync: **`.claude/rules/cursor-claude-doc-sync.md`**.
