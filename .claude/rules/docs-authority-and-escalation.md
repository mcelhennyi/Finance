# Documentation authority and escalation

Mirrors **`.cursor/rules/docs-authority-and-escalation.mdc`**. Keep both files aligned when editing.

**Process** (worktrees, tickets, frontier workflow, session bootstrap) lives in **`docs/ai-context.md`**. **Product and system behavior** — interfaces, architecture, testable requirements — lives in **`docs/design/`** and, if published, your **primary docs site** (e.g. MkDocs). Those design artifacts are the **source of truth** for what they specify.

## Docs are the source of truth (design)

When **code and design disagree**, **fix the code**, not the design doc. If the design is wrong, follow the amendment process in **`docs/ai-context.md`** — do not patch specs silently.

## Escalation tags

| Tag | When to use | What to do |
| --- | --- | --- |
| **`DESIGN-GAP`** | Design is ambiguous or under-specified for the implementation | **Stop**; flag; do not guess. |
| **`DESIGN-FLAW`** | Wrong design assumption (evidence from tests or behavior) | **Stop** validation on that component; document; amend design per **`docs/ai-context.md`**. |
| **`CODE-DEFECT`** | Failure against a **correct** design | Fix the code. |

Amendment format: **`docs/ai-context.md`**.
