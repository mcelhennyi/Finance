# Documentation authority and escalation

Mirrors **`.cursor/rules/docs-authority-and-escalation.mdc`**. Keep both files aligned when editing.

**Process** (worktrees, tickets, frontier workflow, session bootstrap) lives in **`docs/ai-context.md`**, with optional repo-specific extensions in **`docs/ai-context.project.md`** when that file exists (see **`docs/skeleton-project-overlays.md`**). **Product and system behavior** — interfaces, architecture, testable requirements — lives in **`docs/design/`** and, if published, your **primary docs site** (e.g. MkDocs). Those design artifacts are the **source of truth** for what they specify.

## Docs are the source of truth (design)

When **code and design disagree**, **fix the code**, not the design doc. If the design is wrong, follow the amendment process in **`docs/ai-context.md`** — do not patch specs silently.

**UI look and feel:** For **user-visible** UI design create/update requests, **static HTML mocks** in **`docs/design/mockups/`** (linked from the design doc) are required **before** UI implementation — **`.claude/rules/ui-design-mockups.md`**.

## Escalation tags

| Tag | When to use | What to do |
| --- | --- | --- |
| **`DESIGN-GAP`** | Design is ambiguous or under-specified for the implementation | **Stop**; flag; do not guess. |
| **`DESIGN-FLAW`** | Wrong design assumption (evidence from tests or behavior) | **Stop** validation on that component; document; amend design per **`docs/ai-context.md`**. |
| **`CODE-DEFECT`** | Failure against a **correct** design | Fix the code (transient). |
| **`REWORK-REQUIRED`** | Design/intent is settled and correct, but **shipped code or another doc is knowingly out of sync** with it | **Durable** flag — record the specific deviating file/spec and the intended end state; track until reworked; remove the tag in the change that lands the rework. Full convention: **`rework-required.md`** (mirrored **`.cursor/rules/rework-required.mdc`**). |
| **`GROWTH`** | **v0 design is settled and implementable**, but a **named trigger/limit** will require a **design amendment** to an upgrade path | **Durable** flag — record trigger, limitation, upgrade, and v0 until triggered; amend design when the limit is hit; remove when upgrade ships or tag is retired with evidence. Full convention: **`growth-required.md`** (mirrored **`.cursor/rules/growth-required.mdc`**). |

**Numbered ids:** reserve new `DG-`, `DF-`, `RW-`, `GR-`, `R-`, `DEC-`, `TS-`, and traceability ids in **`tasks/TAG-REGISTRY.md`**, **commit and push** before use — **`tag-reservation.md`** / **`.cursor/rules/tag-reservation.mdc`**.

Amendment format: **`docs/ai-context.md`**.
