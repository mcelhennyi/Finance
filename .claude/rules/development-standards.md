# Development standards

Use with **`docs/ai-context.md`**. This file mirrors Cursor-facing rules for Claude Code sessions; Codex loads it via **`AGENTS.md`** and **`.codex/rules/session.md`** for shared development standards.

**Documentation as source of truth** (design vs process, escalation tags): **`docs/ai-context.md`** and **`docs-authority-and-escalation.md`** (mirrors **`.cursor/rules/docs-authority-and-escalation.mdc`**).

## Code style

- **Stack-specific rules:** **`.cursor/rules/stack-conventions.mdc`** once the project chooses languages and frameworks.

## Comments and documentation

**Goal:** A reader can follow the file from **comments alone** — dense enough to scan quickly, not a prose essay.

**Density targets:**

- **Every function** — leading comment or Doxygen: what it does, error/I/O contract when non-obvious.
- **Every few lines** in non-trivial logic — short `//` for **what** it does; add **why** when the line is not self-evident (encoding choice, dedupe, security boundary).
- **File header** — I/O channels, invariants, link to **`docs/design/...`**; traceability per **`docs/design/documentation-style.md`**.

| Layer | Format |
| --- | --- |
| **Header files** (`.h` / `.hpp`) | **Full Doxygen** on the file and every exported symbol — see **Header files (Doxygen)** below |
| **`.cpp` / function bodies** | Function banner + inline `//` every ~2–5 lines through branches, I/O, and state changes |
| **Obvious glue** | Skip only when the line is literally trivial after a well-named helper |

### Header files (Doxygen)

Every **header** that declares API surface must be **fully documented** in Doxygen style.

**File block:** `@file`, `@brief`, traceability tag, design link, I/O boundaries when relevant.

**Per public symbol:** `@brief` + description; functions need `@param`, `@return`, `@note` for errors/preconditions; members need `///<` or documented in the type block.

**`.cpp`:** banner + inline comments; do not duplicate full header Doxygen in the implementation.

Wrap **control flow and side effects** with comments (what + why if needed). Do **not** paste design specs into code.

**Still skip:** comments that only repeat the identifier on the next line.

TypeScript/React: **`.cursor/rules/code-style.mdc`** when present. Stack: **`.cursor/rules/stack-conventions.mdc`**.

## Vertical spacing (logical grouping)

Separate **weakly related** steps with a **blank line**. Keep **tightly related** lines together.

| Keep adjacent (no blank line between) | Separate with one blank line |
| --- | --- |
| Declarations used only by the **next** statement or `if`/`for` | Distinct phases (parse → validate → persist) |
| Parameter bind sequence before `sqlite3_step` | An `if`/`for`/`while` from unrelated setup above it |
| Small helper call + immediate check of its return | After a closing `}` before the next unrelated block |
| | Before `return` following a multi-line block |

**Control flow:** Blank line **before** `if` / `for` / `while` / `switch` unless the lines directly above are declarations **for that branch only**.

Optional **two** blank lines only between major sections in long translation units.

## File and directory organization

Prefer **small, purpose-focused files** in a **logical directory tree** over large translation units and a flat `src/` layout.

- **Single purpose per file** — daemon loop, CLI, JSON helpers, logging, and one-off jobs live in separate files when they are not the file’s core concern.
- **`include/<project>/…`** mirrors domains (`cli/`, `json/`, `daemon/`, …); **entry `main`** stays thin (init + dispatch).
- Split when a file mixes unrelated subsystems; avoid pointless one-liner files.

See **`.cursor/rules/stack-conventions.mdc`** for stack-specific layout.

**Entry points** (`main`, app bootstrap) orchestrate only; they do not own parsing, wire protocols, or job implementations.

Applies to **C++, TypeScript, and other implementation files** unless a formatter forbids it.

## Tie backs to documentation

- Escalation tags (**DESIGN-GAP**, **DESIGN-FLAW**, **CODE-DEFECT**) follow **`docs/ai-context.md`**.
- **UI design mocks:** when asked to create or update **user-visible** UI design, produce **HTML mocks** under **`docs/design/mockups/`** and link them from **`docs/design/`** **before** implementation — **`.claude/rules/ui-design-mockups.md`** (mirrors **`.cursor/rules/ui-design-mockups.mdc`**).

## Testing environment

- Run development-specific commands (**build**, **test**, **lint**, **format**, generators, package-manager scripts, doc builds, and dev servers) inside Docker / Docker Compose / Dev Container / CI images where possible.
- Prefer repo wrappers such as **`./develop`**, `docker compose run`, or the configured Dev Container before host-local execution.
- When a container path is unavailable, host-local commands are allowed only as documented exceptions in the ticket diary / handoff, with a follow-up to add container support when appropriate.
- Run verification (**VAL**) in the containerized environment tickets specify.
- For web UI work, **`docs/ai-context.md` → Web UI validation** is required: pair scripted frontend checks with rendered browser inspection before marking **VAL** `done`. Project overlays or stack conventions provide the exact commands, local URL, browser-capable tool, and route/state matrix; document any host-local or browser-tool exception in the ticket diary or handoff.

## Worktrees and session beacon

- Store local git worktrees under **`.worktrees/`**.
- Each feature uses **`.worktrees/FR-NNNN-<slug>/feature/`** on **`feat/FR-NNNN-<slug>`**.
- Each implementation ticket or stage uses a child worktree under that feature folder on a feature-prefixed branch such as **`feat/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name`**.
- Keep **`tasks/ticket-progress.md` → Current focus** updated (**Active ticket**, **Branch / worktree**, **Session status**).

## Subagents (large work)

- **Ahead of large work:** Prefer delegation before broad exploration or multi-file refactors. Follow **`docs/ai-context.md` §1b**.
- **Per ticket:** **TEST → DEV → VAL** serially in **one** worktree unless the team directs otherwise.
- **Parallel tickets:** **`/develop-frontier`** — one subagent per **ticket id**; then **`/finish-feature`** (per **`FR-NNNN`**, **`docs/ai-context.md` §2d**; **mandatory closeout** plus **`/explain-feature`** and fresh-context **`/update-manual`** when gate passes) or **`/finish-frontier`** as the team chose.

## Feature request and frontier (compose)

- **`/feature-request`** / **`.cursor/skills/feature-request/SKILL.md`** — **`FR-NNNN`** design and **`tickets.md`**; **`/expand-feature`** / **`.cursor/skills/expand-feature/SKILL.md`** adds same-**`FR-NNNN`** expansion addenda and tickets when warranted, while simple UI tweaks can use a dedicated worktree plus docs HTML mock; neither replaces **`/identify-frontier`** / **`/develop-frontier`** / **`/finish-feature`** / **`/finish-frontier`**.
- **Repo-root `CURRENT.md`:** on **`feat/*`** implementation branches, keep **`CURRENT.md`** current per that skill; remove on **`main`** when integrated.
- **Manual docs and feature explanations:** **`/explain-feature`** writes completed-feature before/after HTML under **`tasks/feature-history/FR-NNNN-<slug>/`** and runs during **`/finish-feature`** closeout; **`/explain-and-document`** is the explicit opt-in workflow for turning an explanation into the static HTML manual under **`docs/manual/`**; **`/update-manual`** refreshes that manual from the last reviewed code hash and also runs during **`/finish-feature`** closeout. Do not convert ordinary explanatory answers into manual pages unless the user invokes or clearly requests the manual workflow.
- **User-facing close (FR work):** end substantive replies with **Executive summary**, **Suggested next step**, and **Options** when multiple paths apply — **`feature-request`** skill **User-facing close (required)**.
- **Spoken “identify (FR)”** = registry + intake; **`/identify-frontier`** = parallel **tickets** only **after** canonical **`### T-FR-NNNN-xx`** sections exist.
- **Registry races:** push **`REGISTRY.md`** + minimal stub to **`main` immediately** after allocating **`FR-NNNN`** (**`docs/ai-context.md` §2b**).

## Ticket completion

- When **VAL** is `done`, run **commit → push → PR** per team policy.
- Update **`docs/design/tickets-initial.md`** when your process marks triads complete.
- Optional metrics footer: **`/commit-with-metrics`** — **`.cursor/skills/commit-with-ai-metrics/SKILL.md`**.

## Session end

- Leave **`tasks/ticket-progress.md`** truthful for the next contributor.
