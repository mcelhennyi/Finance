# Cursor/Claude/Codex doc sync

Mirrors **`.cursor/rules/cursor-claude-doc-sync.mdc`** and **`.claude/rules/cursor-claude-doc-sync.md`**. Keep all three aligned when editing.

When updating guidance, commands, skills, or workflow documentation, keep Cursor, Claude, and Codex docs aligned in the same change.

- Treat **`.cursor/**`**, **`.claude/**`**, **`.codex/**`**, **`AGENTS.md`**, and **`.agents/**`** guidance docs as mirrored sources of truth.
- If you add or modify a command, rule, or workflow in one ecosystem, update the corresponding doc in the other ecosystems in the same task.
- Keep intent, behavior, and operational steps identical unless a platform-specific difference is explicitly required.
- If a platform-specific difference is required, document the reason in every affected doc.
- Do not leave one side partially updated; complete all mirrors before considering the task done.
- **Agent workflow** (worktrees, frontiers, **subagents / context budget** in **`docs/ai-context.md` §1b**) must stay aligned across **`docs/ai-context.md`** (and **`docs/ai-context.project.md`** when it exists), **`.cursor/rules/main.mdc`**, **`.claude/rules/development-standards.md`**, **`CLAUDE.md`**, **`AGENTS.md`**, **`.codex/rules/session.md`**, and any **`.cursor/skills/`**, **`.claude/commands/`**, or **`.agents/skills/`** files that restate those rules.
- **Docs authority** (design as source of truth, escalation tags, fix-code-not-docs) must stay aligned across **`docs/ai-context.md`**, **`docs/ai-context.project.md`** when it amends process authority, **`docs/design/documentation-style.md`**, **`.cursor/rules/docs-authority-and-escalation.mdc`**, **`.claude/rules/docs-authority-and-escalation.md`**, and **`.codex/rules/docs-authority-and-escalation.md`**.
- **Tag reservation** (`tasks/TAG-REGISTRY.md`, commit/push before use) must stay aligned across **`docs/ai-context.md`**, **`docs/design/documentation-style.md`**, **`.cursor/rules/tag-reservation.mdc`**, **`.claude/rules/tag-reservation.md`**, and **`.codex/rules/tag-reservation.md`**.
- **GROWTH monitoring** (evaluable **`GR-…`** triggers, **`GROWTH_TRIGGERED`** logs, compile/runtime switches) must stay aligned across **`growth-required`** and **`growth-monitoring`** rule files (Cursor + Claude + Codex), and **`stack-conventions.mdc`** when the stack documents build flags.
- **UI design HTML mocks** must stay aligned across **`.cursor/rules/ui-design-mockups.mdc`**, **`.claude/rules/ui-design-mockups.md`**, **`.codex/rules/ui-design-mockups.md`**, **`docs/design/documentation-style.md`**, **`docs-authority-and-escalation`**, **`development-standards`**, and **`feature-request`** / **`audit-design`** skills when those files mention UI design workflow.
- **Web UI validation** (scripted frontend checks plus rendered browser inspection before UI **VAL**) must stay aligned across **`docs/ai-context.md`**, **`.cursor/rules/main.mdc`**, **`.claude/rules/development-standards.md`**, **`CLAUDE.md`**, **`AGENTS.md`**, **`.codex/rules/session.md`**, and feature / frontier skills or commands that restate ticket **VAL** behavior. Project overlays or stack conventions define repo-specific commands, URLs, and route/state matrices.
- **Project overlays:** repo-specific process text that must survive **`./sync-skeleton`** belongs in **`docs/ai-context.project.md`** (shared) and, for Codex-only extras, **`.codex/project.md`** — see **`docs/skeleton-project-overlays.md`**.
