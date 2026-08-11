# Documentation style

Conventions for **documentation** and **traceability**. **Stack-specific** rules (language formatters, frameworks) live in **`.cursor/rules/stack-conventions.mdc`** once defined.

## Authority

- **`docs/design/`** (and your published documentation site when you maintain one from this repo) is the **source of truth** for product and system behavior **to the extent it is written down**: interfaces, architecture, and acceptance-level requirements. Code implements that truth; it does not replace it.
- If code and design disagree, **fix the code** unless the design is provably wrong — then use the amendment process in **`docs/ai-context.md`** (`DESIGN-GAP`, `DESIGN-FLAW`, `CODE-DEFECT`). **`.cursor/rules/docs-authority-and-escalation.mdc`** (and **`.claude/rules/docs-authority-and-escalation.md`**) restate this for agents; keep them aligned with **`docs/ai-context.md`**.

## Traceability

- Non-trivial units (services, modules, handlers) carry **`@PROJ-<AREA>-<NUMBER>`** in a short comment or docstring **for stacks where inline tags make sense**.
- Replace **`PROJ`** with your project prefix (set during **`init-project`**).
- **Areas:** define a small set for your product (examples: `API`, `AUTH`, `DATA`, `UI`, `JOB`).

## Actor profile traceability

Seed data should be actor-driven when it is used for product behavior, demos, screenshots, or E2E tests. Maintain a design doc such as **`docs/design/seed-actor-profiles.md`** with one profile per seeded user-like actor.

Use stable story keys rather than new numbered tags for ordinary actor-story traceability:

```text
story/<actor-slug>/<flow-slug>
```

Example: `story/avery/entry-backend`.

Each story key should map to the actor's daily-life trigger, UI surface, backend/API/domain surface, persistence or scheduling behavior, security boundary, and test/E2E expectation. If a story becomes a formal durable design tag (`GR-*`, `DG-*`, `RW-*`, etc.), reserve that tag in **`tasks/TAG-REGISTRY.md`** before writing it into design docs.

Actor profile docs should include a story relationship graph when stories affect other actors. Each edge names the origin story, affected actor, and handler story. Blank handler cells are coverage gaps: create the missing handler story or allocate the missing role/outside-force actor before VAL.

Do not restrict actors to product roles. Stakeholders, antagonists, vendors, regulators, economic pressure, and guiding figures may all be actors when they influence decisions or behavior. Guiding figures carry a principle lens, decision bias, affected actors, story pressure, and guardrails; they bias tradeoffs but never override written design authority, evidence, safety, privacy, or ethics. Generic process and templates live in **`docs/design/actor-driven-development.md`**.

When actor graphs grow beyond a handful of stories, keep an app-readable corpus under **`docs/design/actors/`**: one actor/story Markdown file per unit, typed **`edges.jsonl`**, generated **`index.json`**, and **`actor-graph.json`**. Prefer generated indexes for tools and future profile-server UIs; prose links are for humans.

## Ticket IDs (map to `FR-NNNN`)

Implementation ticket **definitions** (headings, phases, **Deps:**) live in **`tasks/feature-history/FR-NNNN-<slug>/tickets.md`**. **`tasks/ticket-progress.md`** tracks **TEST / DEV / VAL** for each id. **`docs/design/tickets-initial.md`** is the **global index + DAG** (links and mermaid), not the home for **`###`** ticket sections.

| Part | Meaning |
|------|---------|
| **`T-`** | Literal prefix (implementation ticket). |
| **`FR-NNNN`** | Four-digit feature id as in **`tasks/feature-history/REGISTRY.md`**. |
| **`-xx`** | Two-digit sequence within that feature (`01`, `02`, …). |

**Full id:** **`T-FR-NNNN-xx`**.

**Reserved:** **`FR-0000`** — repository / platform bootstrap; starter definitions may live in **`tasks/feature-history/FR-0000-bootstrap/tickets.md`**.

**Branches / worktrees:** Keep local worktrees under **`.worktrees/FR-NNNN-<slug>/`**. The feature branch is **`feat/FR-NNNN-<slug>`** at **`.worktrees/FR-NNNN-<slug>/feature/`**; ticket/stage branches include both feature and ticket/stage names, e.g. **`feat/FR-0007-auth-overhaul/T-FR-0007-01-auth-api`** at **`.worktrees/FR-0007-auth-overhaul/T-FR-0007-01-auth-api/`**.

**`Deps:`** list other tickets by **full id** or `none`.

**Plain-English ticket bodies:** New and not-yet-started tickets lead with **In plain English**, **Why this exists**, **Out of scope**, and **Done when (plain English)** before technical acceptance criteria. DAG summaries use the same bar. Do not rewrite tickets already **`done`** or **`in progress`** unless asked. Full rule: **`.cursor/skills/feature-request/SKILL.md` → Plain-English ticket writing** and **`reference-templates.md` → Canonical ticket body**.

**Numbered documentation tags** (`DESIGN-GAP` **`DG-`**, `DESIGN-FLAW` **`DF-`**, `REWORK-REQUIRED` **`RW-`**, `GROWTH` **`GR-`**, `REFINEMENT` **`R-`**, decisions **`DEC-`**, trade studies **`TS-`**, traceability **`@…`**, amendments): allocate ids only via **`tasks/TAG-REGISTRY.md`** — reserve, **commit and push** to the default branch, then use the id in design docs. Area letters are defined in that file. **`FR-NNNN`** remains in **`tasks/feature-history/REGISTRY.md`**. Rule: **`.cursor/rules/tag-reservation.mdc`**.

**Mermaid triad nodes:** For **`T-FR-NNNN-xx`**, node ids **`TFR` + `NNNN` + `_` + `xx` + `_` + `TEST|DEV|VAL`**. When a ticket is fully complete, add the corresponding `class … triadDone` line in **`docs/design/tickets-initial.md`** (see that file).

## Writing rules for Cursor / Claude / Codex

1. **Prefer pointers over duplication** — Link to `docs/design/...` instead of restating full diagrams in tickets.
2. **Tables for conventions** — When listing options, use markdown tables.
3. **Mermaid for architecture** — Use `mermaid` blocks for graphs; keep diagrams **small** and versioned with the owning doc.
4. **No scope creep in comments** — Comments summarize; design decisions live in `docs/design/`.
5. **Amendments** — Use the HTML comment block format from **`docs/ai-context.md`** when revising authoritative sections.
6. **Durable doc tags (`REWORK-REQUIRED`, `GROWTH`)** — When settled design/intent is correct but **shipped code or another doc is knowingly out of sync**, flag with `REWORK-REQUIRED` (deviating file/spec + intended end state); persists until rework lands. When **v0 is correct now** but a **named limit or issue** requires a **future design upgrade**, flag with `GROWTH` (trigger, limitation, upgrade, v0 until triggered). For **objectively evaluable** `GROWTH` triggers, add **`Monitor:`** (metric, threshold, checkpoint) and implement optional **`GROWTH_TRIGGERED`** logging per **`.claude/rules/growth-monitoring.md`** / **`.cursor/rules/growth-monitoring.mdc`** (compile-outable, runtime-off by default). Do **not** silently edit design to match deviating code or pre-build upgrades before the trigger. Full conventions: **`.claude/rules/rework-required.md`** / **`.cursor/rules/rework-required.mdc`** and **`.claude/rules/growth-required.md`** / **`.cursor/rules/growth-required.mdc`**; escalation context in **`docs/ai-context.md`**. If you publish a docs site, add highlight classes (e.g. `design-doc-rework`, `design-doc-growth`) in your project stylesheet — styling is project-owned, tags are not.
7. **UI design HTML mocks** — When creating or updating **user-visible** UI in **`docs/design/`**, ship **static HTML** under **`docs/design/mockups/`** (and link from the design doc) **before** UI implementation tickets or React/shell code. Mocks must show the intended **look and feel** (layout, type, color, spacing, key states), not wireframe placeholders. For additions to an existing UI, update the current UI as the example when possible so the proposed change is shown in real context. Use desktop and phone variants when responsive behavior matters. Rule: **`.cursor/rules/ui-design-mockups.mdc`** (mirrored **`.claude/rules/ui-design-mockups.md`**).

## Code tie-backs

- Link from code to **`docs/design/...`** where behavior is specified.
- Do not embed secrets or customer-specific data in examples committed to git.

## In-code comments and spacing (implementation)

**Headers (`.hpp`):** **Full Doxygen** (`@file`, every public symbol). **Sources:** banners + inline `//`. Rules: **`.claude/rules/development-standards.md` → Header files (Doxygen)**, **`.cursor/rules/stack-conventions.mdc`**.

**Vertical spacing:** Blank lines between unrelated steps; declarations adjacent to the control flow they feed. Design decisions stay in **`docs/design/`** (writing rule 4).

**File organization:** Small modules under domain directories; thin entry points — **File and directory organization** in **`.claude/rules/development-standards.md`**.
