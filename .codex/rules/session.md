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
| Tag reservation | **`.codex/rules/tag-reservation.md`** | **`.claude/rules/tag-reservation.md`** |
| REWORK-REQUIRED | **`.codex/rules/rework-required.md`** | **`.claude/rules/rework-required.md`** |
| GROWTH | **`.codex/rules/growth-required.md`** | **`.claude/rules/growth-required.md`** |
| GROWTH monitoring | **`.codex/rules/growth-monitoring.md`** | **`.claude/rules/growth-monitoring.md`** |
| UI design mocks | **`.codex/rules/ui-design-mockups.md`** | **`.claude/rules/ui-design-mockups.md`** |

Also load:

- **`.claude/rules/development-standards.md`** — code comments, worktrees, subagents, ticket completion
- **`.cursor/rules/stack-conventions.mdc`** when present — stack and build conventions (often project-owned / syncignored)
- **`.cursor/rules/code-style.mdc`** when present — language-specific style (project-owned when added)

## Web UI validation

For any user-visible web UI work, follow required **Web UI validation** in **`docs/ai-context.md`** and **`.claude/rules/development-standards.md`**: scripted frontend checks plus rendered browser inspection before **VAL**. Use project overlays or stack conventions for commands, URLs, and route/state matrices; use browser-capable Codex tooling when available after the app starts.

## Workflows

Slash-style prompts resolve via **`.agents/skills/source-command-*`** → canonical **`.cursor/skills/`** (see **`AGENTS.md`** command table). Use **`/expand-feature`** for same-**`FR-NNNN`** additions: simple UI tweaks get a dedicated worktree plus docs HTML mock, while involved changes get addendum design + same-FR ticket expansion before returning to the normal frontier workflow.

Manual documentation and feature explanations are distinct workflows: **`/explain-feature`** writes completed-feature before/after HTML under **`tasks/feature-history/FR-NNNN-<slug>/`** and runs during **`/finish-feature`** closeout; **`/explain-and-document`** writes requested explanations into the static HTML manual under **`docs/manual/`**, while **`/update-manual`** refreshes that manual from the last reviewed code hash and also runs during **`/finish-feature`** closeout. Do not treat ordinary explanatory questions as automatic manual updates unless the user invokes or clearly requests that workflow.

## Subagents

Prefer delegated agents for large exploration or multi-file work per **`docs/ai-context.md` §1b**. If delegation is unavailable, split work into smaller user-visible steps.

## Doc sync obligation

When editing any rule or workflow, update Cursor, Claude, and Codex mirrors in the same change per **`.codex/rules/agent-doc-sync.md`**.
