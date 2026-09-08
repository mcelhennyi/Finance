# Codex session bootstrap

Load and follow these files **in order** at the start of every Codex session.

## Load order

1. **`AGENTS.md`** (repo root entry)
2. **`docs/ai-context.md`**
3. **`docs/ai-context.project.md`** when present — shared project process overlay
4. **`.codex/project.md`** when present — Codex-only overlay
5. **`tasks/ticket-progress.md`**
6. **`docs/design/architecture/overview.md`** when populated
7. **`README.md`**

## Binding rules (always follow)

Same intent as Cursor **`alwaysApply`** rules and Claude **`.claude/rules/`**:

| Topic | Codex rule | Canonical source |
| --- | --- | --- |
| Doc sync | **`.codex/rules/agent-doc-sync.md`** | **`.cursor/rules/cursor-claude-doc-sync.mdc`** |
| Docs authority / escalation | **`.codex/rules/docs-authority-and-escalation.md`** | **`.claude/rules/docs-authority-and-escalation.md`** |
| Expert review | **`.codex/rules/expert-review.md`** | **`.claude/rules/expert-review.md`** |
| Tag reservation | **`.codex/rules/tag-reservation.md`** | **`.claude/rules/tag-reservation.md`** |
| REWORK-REQUIRED | **`.codex/rules/rework-required.md`** | **`.claude/rules/rework-required.md`** |
| GROWTH | **`.codex/rules/growth-required.md`** | **`.claude/rules/growth-required.md`** |
| GROWTH monitoring | **`.codex/rules/growth-monitoring.md`** | **`.claude/rules/growth-monitoring.md`** |
| UI design mocks | **`.codex/rules/ui-design-mockups.md`** | **`.claude/rules/ui-design-mockups.md`** |
| Orchestrator controller | **`.codex/rules/orchestrator-controller.md`** | **`.claude/rules/orchestrator-controller.md`** |

Also load:

- **`.claude/rules/development-standards.md`** — code comments, worktrees, subagents, ticket completion
- **`.cursor/rules/stack-conventions.mdc`** when present — stack and build conventions (often project-owned / syncignored)
- **`.cursor/rules/code-style.mdc`** when present — language-specific style (project-owned when added)

## Web UI validation

For any user-visible web UI work, follow required **Web UI validation** in **`docs/ai-context.md`** and **`.claude/rules/development-standards.md`**: scripted frontend checks plus rendered browser inspection before **VAL**. Use project overlays or stack conventions for commands, URLs, and route/state matrices; use browser-capable Codex tooling when available after the app starts.

## Workflows

Slash-style prompts resolve via **`.agents/skills/source-command-*`** → canonical **`.cursor/skills/`** (see **`AGENTS.md`** command table). Use **`/expand-feature`** for same-**`FR-NNNN`** additions: simple UI tweaks get a dedicated worktree plus docs HTML mock, while involved changes get addendum design + same-FR ticket expansion before returning to the normal frontier workflow. Use **`/feature-bug`** to create one dedicated report→same-FR-ticket→TEST→DEV→VAL subagent lane per operator issue while the parent remains available; serialize shared id/DAG integration and parallelize only dependency-safe ticket work.

Before the first **`/develop-frontier`** wave and every later wave or bug
micro-wave, fetch the project remote default and merge its newest absent commit
into affected feature branches, re-read changed authority/docs, and validate
the impact. Then compare the pinned and fetched remote skeleton hashes from a
clean default-branch integration worktree. Equal hashes skip sync entirely;
different hashes require sync, validation, default-branch landing, and
affected-feature refresh. Stop before ticket dispatch if either gate fails.
Keep each affected feature's canonical Mermaid DAG at the top of
**`20-tickets-dag.md`** and reconcile it before/after every wave: completed
green, in-development yellow, and outstanding red. Run **`python3
scripts/refresh_ticket_dags.py --root .`** so visible labels/dependencies remain
plain English with stable ids preserved and the generated project/feature
**Where things stand** explanation (no more than three sentences) remains
directly below the DAG; verify with the same command plus **`--check`**.

Manual documentation and feature explanations are distinct workflows: **`/explain-feature`** writes completed-feature before/after HTML under **`tasks/feature-history/FR-NNNN-<slug>/`** and runs during **`/finish-feature`** closeout; **`/explain-and-document`** writes requested explanations into the static HTML manual under **`docs/manual/`**, while **`/update-manual`** refreshes that manual from the last reviewed code hash and also runs during **`/finish-feature`** closeout. Do not treat ordinary explanatory questions as automatic manual updates unless the user invokes or clearly requests that workflow.

## User-facing response close

For substantive answers that benefit from structure, prefer **Executive
summary**, **Details**, **Suggested next step**, and **Options** when several
reasonable paths exist. `/feature-status` is explicit-invocation only: do not
use its BLUF, ticket/wave fractions, or Done/Upcoming/Blocked/Skipped table for
ordinary progress, allocation, blocker, completion, summary, or next-step
questions.

## Subagents

Prefer delegated agents for large exploration or multi-file work per **`docs/ai-context.md` §1b**. If delegation is unavailable, split work into smaller user-visible steps.

## Doc sync obligation

When editing any rule or workflow, update Cursor, Claude, and Codex mirrors in the same change per **`.codex/rules/agent-doc-sync.md`**.
