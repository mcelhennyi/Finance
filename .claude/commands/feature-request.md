---
description: Guide the end-to-end process of implementing a new feature, following the docs-first methodology. Use when the user wants to build something new or says "add a feature for...", "I want to build...", "let's implement...".
---

# Feature Request

Guides end-to-end implementation following the docs-first methodology from `docs/design/philosophy.md`.

---

## Phase 1 — Gather Requirements

**Goal:** Understand what the user wants before writing anything.

1. Ask: *"What is the feature and why is it needed?"*
2. Build a **hierarchical intent model**:
   - **High-level goal** — the outcome
   - **Sub-goals** — capabilities that serve the goal
   - **Specific behaviors** — concrete interactions
3. Ask 2–3 targeted follow-up questions to refine scope.
4. Identify which user story in `docs/research/user-stories.md` this traces back to (or add a new one).

**Exit criteria:** You can state the high-level goal, sub-goals, and specific behaviors in one concise summary, and the user confirms it.

---

## Phase 2 — Design

1. Read `docs/design/system-overview.md` to check for conflicts with existing architecture.
2. Create or update a design doc at `docs/design/services/<feature-name>/overview.md` with these sections:

```markdown
# Feature: <Name>

## Overview
One-paragraph description.

## User Story Reference
Links to relevant user story in docs/research/user-stories.md.

## Hierarchical Intent
- **Goal:** …
- **Sub-goals:** …
- **Behaviors:** …

## Architecture / Approach
Chosen approach and rationale. Include alternatives considered.

## Module Changes
Which modules are added or modified.

## Data Model Changes
Schema additions or migrations needed.

## CLI / API Interface
New commands or endpoints.

## Test Plan
Summary of what will be tested.
```

3. Present the design to the user for approval before proceeding.

**Exit criteria:** User approves the design.

---

## Phase 3 — Test Specification

Write test specs **before** any implementation code.

1. Create `tests/test_<feature>.py`.
2. Write test stubs using **Given / When / Then** format:

```python
def test_<behavior>():
    """
    Given <precondition>
    When <action>
    Then <expected outcome>
    """
    raise NotImplementedError
```

**Exit criteria:** Test stubs exist and map back to the design.

---

## Phase 4 — Implementation

Implement following the design doc. Constraints:

1. Implement exactly what the design doc specifies. Do not deviate.
2. If the design doc is ambiguous, STOP and note a DESIGN-GAP.
3. Do NOT write tests — they already exist as stubs.

**Exit criteria:** Implementation code exists and matches the design doc.

---

## Phase 5 — Validation

1. Run the test suite: `pytest tests/test_<feature>.py -v`
2. Classify each failure:
   - `CODE-DEFECT`: Design is correct, code is wrong → fix the code
   - `DESIGN-FLAW`: Design assumption is wrong → amend design, then re-implement

**Exit criteria:** All feature tests pass.

---

## Phase 6 — Integration Check

1. Run the full test suite: `pytest -v`
2. Run `finance ingest` + `finance query` end-to-end with a sample statement.

**Exit criteria:** Full suite green, end-to-end works.

---

## Phase 7 — Retrospective

1. Append to `tasks/lessons.md` if anything surprising happened.
2. Update `tasks/todo.md` — mark complete, add follow-up items.

**Exit criteria:** Lessons recorded, todo current.
