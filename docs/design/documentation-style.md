# Documentation style

Conventions for **documentation** and **traceability**. **Stack-specific** rules (language formatters, frameworks) live in **`.cursor/rules/stack-conventions.mdc`** once defined.

## Authority

- **`docs/design/`** (and your published documentation site when you maintain one from this repo) is the **source of truth** for product and system behavior **to the extent it is written down**: interfaces, architecture, and acceptance-level requirements. Code implements that truth; it does not replace it.
- If code and design disagree, **fix the code** unless the design is provably wrong — then use the amendment process in **`docs/ai-context.md`** (`DESIGN-GAP`, `DESIGN-FLAW`, `CODE-DEFECT`). **`.cursor/rules/docs-authority-and-escalation.mdc`** (and **`.claude/rules/docs-authority-and-escalation.md`**) restate this for agents; keep them aligned with **`docs/ai-context.md`**.

## Traceability

- Non-trivial units (services, modules, handlers) carry **`@FH-<AREA>-<NUMBER>`** in a short comment or docstring **for stacks where inline tags make sense** (**`FH`** = Finance Hub).
- **Areas:** e.g. `API`, `ING` (ingestion), `WEB`, `DATA`, `AN` (analysis), `AUTH`, `UI`, `JOB` — extend this list when you introduce a new one.

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

**Mermaid triad nodes:** For **`T-FR-NNNN-xx`**, node ids **`TFR` + `NNNN` + `_` + `xx` + `_` + `TEST|DEV|VAL`**. When a ticket is fully complete, add the corresponding `class … triadDone` line in **`docs/design/tickets-initial.md`** (see that file).

## Writing rules for Cursor / Claude

1. **Prefer pointers over duplication** — Link to `docs/design/...` instead of restating full diagrams in tickets.
2. **Tables for conventions** — When listing options, use markdown tables.
3. **Mermaid for architecture** — Use `mermaid` blocks for graphs; keep diagrams **small** and versioned with the owning doc.
4. **No scope creep in comments** — Comments summarize; design decisions live in `docs/design/`.
5. **Amendments** — Use the HTML comment block format from **`docs/ai-context.md`** when revising authoritative sections.

## Code tie-backs

- Link from code to **`docs/design/...`** where behavior is specified.
- Do not embed secrets or customer-specific data in examples committed to git.
