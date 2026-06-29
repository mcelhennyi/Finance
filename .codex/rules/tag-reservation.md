# Tag and id reservation (Codex)

Mirrors **`.cursor/rules/tag-reservation.mdc`** and **`.claude/rules/tag-reservation.md`**. Follow the Claude file for full tables and workflow; keep all three aligned when editing.

Before creating or referencing any durable numbered id (`DG-`, `RW-`, `GR-`, `FR-`, `T-FR-…`, traceability tags, …):

1. Read the registry section in **`tasks/TAG-REGISTRY.md`** (and **`tasks/feature-history/REGISTRY.md`** for **`FR-NNNN`**).
2. Reserve with status **`reserved`**, bump counters.
3. **`git commit` and `git push` to the default branch** before writing the id into design docs, code, or tickets.

Full discipline: **`.claude/rules/tag-reservation.md`**.
