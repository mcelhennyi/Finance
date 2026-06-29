# Codex agent configuration

Codex-specific process files live under **`.codex/`** so they stay separate from skeleton-synced **`AGENTS.md`** and shared **`.claude/rules/`**.

| Path | Role |
| --- | --- |
| **`AGENTS.md`** | Codex entry point (skeleton-synced base; load **`.codex/`** per that file) |
| **`.codex/project.md`** | Codex-only project overlay — **syncignored** at consumer root after first init |
| **`.codex/rules/session.md`** | Session bootstrap — load order and binding rules |
| **`.codex/rules/*.md`** | Codex mirrors of Cursor/Claude always-on rules |
| **`.agents/skills/source-command-*`** | Thin wrappers → canonical **`.cursor/skills/`** |

Workflow skills remain canonical in **`.cursor/skills/`**; Claude uses **`.claude/commands/`** wrappers.

**`init-project`** is a skeleton-template Cursor skill (syncignored at consumer root). Post-clone customization uses **`docs/ai-context.project.md`** and **`.codex/project.md`**.
