# REWORK-REQUIRED tag

Mirrors **`.cursor/rules/rework-required.mdc`**. Keep both files aligned when
editing (per **`.claude/rules/cursor-claude-doc-sync.md`** when present, or
the project's equivalent agent-sync rule).

`REWORK-REQUIRED` is a documentation tag that records a **durable,
intentional flag that a piece of design or shipped code is known to deviate
from current developer intent and must be reworked.** It complements the
escalation tags in **`docs/ai-context.md`** (`DESIGN-GAP` / `DESIGN-FLAW` /
`CODE-DEFECT`).

## When to use it

Use `REWORK-REQUIRED` when **all** of the following hold:

- The **design doc is correct / is the intended target** (it is the source
  of truth), and
- **Existing code, or another existing doc, is known to conflict** with that
  intent — a deliberate decision the current implementation/spec no longer
  reflects, not a bug against a correct design, and
- A **persistent, auditable marker** is wanted that survives until the
  rework lands.

## How it differs from the escalation tags

| Tag | Meaning | Lifetime |
| --- | --- | --- |
| `DESIGN-GAP` | Design ambiguous / unspecified — **stop, do not guess** | until design is specified |
| `DESIGN-FLAW` | Design assumption proven wrong — amend the design | until design amended |
| `CODE-DEFECT` | Code fails a **correct** design — just fix the code | transient (fix it) |
| **`REWORK-REQUIRED`** | Intent is settled; **known code or doc deviates** and must be reworked to match | **durable** — stays until rework is delivered |

`CODE-DEFECT` says "the code is wrong, fix it now." `REWORK-REQUIRED` says
"the intended design is recorded here; the current code/doc consciously does
not match it yet — track this divergence, do not mistake the current
implementation for the target."

## Format

- **Block form** (preferred for substantive divergence):

  ```markdown
  > REWORK-REQUIRED RW-Xn — <one-line statement of the conflict>.
  > <which file(s)/spec conflicts>. Intended state: <what it must
  > become>. Tracked for rework.
  ```

- **Inline form**: `REWORK-REQUIRED` (optionally wrapped in a project
  highlight span/class if the project publishes a styled docs site).

- **Id convention:** `RW-<AREA-LETTER><n>` scoped to the owning doc
  (mirrors how the project tags traceability / `@PROJ-<AREA>-<NUMBER>`).
  **Reserve** new ids in **`tasks/TAG-REGISTRY.md`** (**commit and push**
  before use) — **`.claude/rules/tag-reservation.md`**. Reference the same id
  from any other doc that restates the divergence.

Styling is project-owned: a project that publishes a docs site may define a
highlight class (e.g. `design-doc-rework`) in its own stylesheet. The skeleton
defines the **tag and discipline**, not the CSS.

## Discipline

- Never silently "fix" the design doc to match deviating code — the doc is
  the source of truth; flag the code with `REWORK-REQUIRED` instead.
- Every `REWORK-REQUIRED` must name the **specific file or spec** that
  deviates and the **intended end state**, so it is actionable cold.
- When the rework lands, **remove** the tag in the same change (it is a
  divergence marker, not permanent documentation).
- Treat a `REWORK-REQUIRED` like a `DESIGN-GAP` for handoffs / ticket
  planning: surface it, do not bury it.
