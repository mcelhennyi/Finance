---
description: >-
  Merges feature-prefixed ticket/stage branches into feat/FR-NNNN-slug, validates,
  maps semantic expert review and runs mandatory feature closeout (90-closeout.md, REGISTRY, ticket-progress)
  plus explain-feature and a fresh-context update-manual pass, opens PR to the default branch only
  after docs/ai-context.md §2d feature-complete gate; never auto-deletes remote
  branches. See skill finish-feature.
---

# /finish-feature

Follow the Cursor project skill **`finish-feature`** (`.cursor/skills/finish-feature/SKILL.md`).

**Summary:** For one **`FR-NNNN`**, merge all feature-prefixed ticket/stage work into **`feat/FR-NNNN-<slug>`** from **`.worktrees/FR-NNNN-<slug>/feature/`**, validate inside Docker / Compose where possible, and push the feature branch. Open **`gh pr create`** (or update PR) to the **default branch** only when every ticket in **`tickets.md`** is VAL **`done`** in **`ticket-progress.md`** (**feature-complete gate**) and **`bugs/`** has no `open`, `ticketed`, or `in-progress` row or running/queued bug lane. During PR preparation, map changed semantic surfaces—not only paths—to `EXPERT:<slug>` reviewers and request targeted review; missing mappings or pending approval never block PR creation, closeout, ticket triads, or non-default pushes. Immediately before final default-branch merge, recheck the current head and require scoped expert approvals separately from user manual validation. Neither gate authorizes the merge. When the feature-complete gate passes, **mandatory closeout** in the same run: **`90-closeout.md`** (including semantic expert state/evidence and separate manual-validation state), **`REGISTRY.md`** → **`done`**, feature **`README.md`**, **`ticket-progress.md`** (**Parallel streams** / **Current focus**), **`/explain-feature`** before/after HTML under the feature-history folder, a fresh-context **`/update-manual`** pass for **`docs/manual/`**, and **`handoffs/YYYY-MM-DD-finish-feature.md`** (see **`closeout-template.md`**). If the PR is **already merged**, skip opening a PR but still run closeout and verify expert evidence. Do **not** push the default branch or delete remote branches unless the user explicitly directs otherwise.

At closeout, require the feature-local **`20-tickets-dag.md`** to keep its
canonical graph at the top. Run **`python3 scripts/refresh_ticket_dags.py --root
.`**, review its plain-English labels/dependencies, stable ids/edges, all-green
state, and the no-more-than-three-sentence project/feature explanation directly
below it; require **`--check`** before the feature-complete gate passes.

End with **Executive summary**, **Suggested next step**, and **Options**.

## See also

- **`/develop-frontier`**, **`/finish-frontier`**, **`/feature-request`**, **`/feature-request-continue`**
- **`docs/ai-context.md`** §2d
- **`.cursor/skills/finish-feature/closeout-template.md`**
