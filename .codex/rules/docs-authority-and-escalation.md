# Documentation authority and escalation (Codex)

Mirrors **`.cursor/rules/docs-authority-and-escalation.mdc`** and **`.claude/rules/docs-authority-and-escalation.md`**. Follow the Claude file for full prose; keep all three aligned when editing.

**Process** lives in **`docs/ai-context.md`** + **`docs/ai-context.project.md`**. **Product behavior** lives in **`docs/design/`** and the published docs site.

When **code and design disagree**, **fix the code**. Escalation tags: **`DESIGN-GAP`**, **`DESIGN-FLAW`**, **`CODE-DEFECT`**, **`REWORK-REQUIRED`**, **`GROWTH`** — see **`.claude/rules/docs-authority-and-escalation.md`**.

**UI mocks:** user-visible UI design → HTML mocks under **`docs/design/mockups/`** before implementation — **`.codex/rules/ui-design-mockups.md`**.

**Numbered ids:** reserve in **`tasks/TAG-REGISTRY.md`**, commit and push before use — **`.codex/rules/tag-reservation.md`**.
