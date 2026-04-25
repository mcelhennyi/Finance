@docs/ai-context.md

## Claude-specific notes

- Prefer **subagents or delegated tasks** for large exploration or multi-file work; see **`docs/ai-context.md`** §1b.
- Keep **`tasks/ticket-progress.md`** current when doing ticket work (**Active ticket**, **Branch / worktree**, **Session status**). Worktrees live under **`.worktrees/FR-NNNN-<slug>/`**: `feature/` for **`feat/FR-NNNN-<slug>`**, plus child ticket/stage worktrees on feature-prefixed branches.
- **Parallel features:** several **`FR-NNNN`** streams may be active; **`/develop-frontier`** batches **`T-FR-NNNN-xx`** from the **global** graph — see **`docs/ai-context.md` §2c** and **`tasks/ticket-progress.md` → Parallel streams**.
- When you assign a new **`FR-NNNN`** in **`REGISTRY.md`**, **commit and push to `main` immediately** after the minimal feature stub exists so concurrent work deconflicts ids (**`docs/ai-context.md` §2b**).

Custom slash commands live in **`.claude/commands/`**:

| Command | Role |
|---------|------|
| **`/feature-request`** | **`FR-NNNN`** lifecycle: intake, layered design, **`20-tickets-dag.md`**, canonical **`tickets.md`**, optional frontier; repo-root **`CURRENT.md`** on **`feat/*`**; end turns with **Executive summary** + **next step** + **options** when relevant — see **`.cursor/skills/feature-request/SKILL.md`**. |
| **`/feature-request-continue`** | Resume an in-progress **`FR-NNNN`** from **`tasks/feature-history/`** (read **`CURRENT.md`** when on **`feat/*`**). |
| **`/identify-frontier`** | Parallel-ticket handoff from **`ticket-progress.md`** + **`tasks/feature-history/**/tickets.md`** (+ DAG). Run **after** tickets exist. |
| **`/develop-frontier`** | One subagent per parallel-capable ticket (**TEST→DEV→VAL** per child worktree under **`.worktrees/FR-NNNN-<slug>/`**). |
| **`/finish-feature`** | Merge feature-prefixed ticket/stage branches into **`feat/FR-NNNN-<slug>`**, validate, **PR → `main`**; do not auto-delete remote **`feat/*`**. |
| **`/finish-frontier`** | Merge parallel ticket/stage branches into **`main`** per policy. |
| **`/commit-with-metrics`** | Commit with optional AI metrics footer — **`.cursor/skills/commit-with-ai-metrics/SKILL.md`**. |
| **`/sync-skeleton`** | Update **`.skeleton/`** submodule and **`skeleton.manifest`** root copies; run **`./sync-skeleton`** — **`.cursor/skills/sync-skeleton/SKILL.md`**, **`.skeleton/INIT.MD`**. |

**“Identify” disambiguation:** spoken **identify (FR)** = register **`FR-NNNN`** + intake; **`/identify-frontier`** = parallel **tickets** only after **`tickets.md`** exists.

Development standards: **`.claude/rules/development-standards.md`**.
