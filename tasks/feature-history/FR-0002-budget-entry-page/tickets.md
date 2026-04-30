# Tickets — FR-0002 budget-entry-page

**Feature id:** **`FR-0002`**  
**Canonical ids:** **`T-FR-0002-xx`**

---

### T-FR-0002-01 — Define budget allocation contracts

**Title:** Define budget allocation contracts  
**Deps:** `T-FR-0001-05`

#### Purpose

Define the domain contracts for manual allocation plans, allocation items, cadence normalization, and derived monthly totals so downstream API, UI, and unified-view work share one behavior.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Lock contract behavior | Tests/spec examples cover accepted cadences, monthly normalization, plan/item validation, and derived summary totals |
| **DEV** | Implement contract layer | Pydantic schemas, ORM models, migration/init-db coverage, and reusable cadence helpers are implemented without changing existing FR-0001 behavior |
| **VAL** | Verify compatibility | Existing goals/budgets/unified summary tests still pass; new contract tests pass in the project validation environment |

#### Notes

- The sample spreadsheet is content evidence only. Do not copy its UI wording, visual layout, colors, or spreadsheet-specific terminology.
- Prefer backend-owned `monthly_amount` derivation so UI and API callers cannot disagree.

---

### T-FR-0002-02 — Expose budget allocation API

**Title:** Expose budget allocation API  
**Deps:** `T-FR-0002-01`

#### Purpose

Expose CRUD endpoints for allocation plans and items, plus a summary endpoint that returns derived monthly totals for the Budget page.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Freeze API behavior | API tests cover create/list/update/delete for plans and items, validation errors, missing ids, and summary totals |
| **DEV** | Implement endpoints | FastAPI router and service/repository functions persist plans/items and return typed response models |
| **VAL** | Verify API integration | Endpoint tests pass with an isolated database and existing API routes remain registered and healthy |

#### Notes

- Keep route naming aligned with Finance Hub concepts rather than source spreadsheet labels.
- Reuse patterns from the income/liability contract endpoints where they fit.

---

### T-FR-0002-03 — Sync allocation totals into unified budgets

**Title:** Sync allocation totals into unified budgets  
**Deps:** `T-FR-0002-02`

#### Purpose

Derive category/month `Budget` rows from allocation items so the existing goals actuals engine and unified monthly summary show budget variance for manually entered plans.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Define sync and conflict behavior | Tests cover category aggregation, idempotent re-save, item deletion, and unified summary variance after sync |
| **DEV** | Implement synchronization | Saving allocation plans updates derived category budgets without duplicating category/month rows |
| **VAL** | Verify unified read path | `GET /api/unified-view/summary` reflects allocation-derived category budgets and reconciles against seeded examples |

#### Notes

- The unified summary should continue reading budget contracts; it should not depend on frontend row-level details.
- If pre-existing manual aggregate budgets conflict with allocation-derived budgets, document and enforce one deterministic first-cut rule.

---

### T-FR-0002-04 — Deliver budget entry page

**Title:** Deliver budget entry page  
**Deps:** `T-FR-0002-02`

#### Purpose

Add a React page where users can enter, edit, delete, and review planned allocation items for a selected month.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Lock frontend contracts | Type/helper tests cover budget API types, local row payload preparation, validation helpers, and summary formatting |
| **DEV** | Implement page and navigation | `BudgetPage`, navigation entry, API client methods, editable table, summary cards, and loading/error states are implemented |
| **VAL** | Verify user workflow | Frontend type checks/tests pass and a Docker dev-stack manual check confirms add/edit/delete/summary flows against the API |

#### Notes

- Follow existing `ParametersPage` mutation and table patterns.
- Use Finance Hub wording and layout. The source spreadsheet does not define UI language or visual hierarchy.
- Invalidate unified summary queries after saves that affect category budgets.

---

### T-FR-0002-05 — Validate and document budget entry workflow

**Title:** Validate and document budget entry workflow  
**Deps:** `T-FR-0002-03`, `T-FR-0002-04`

#### Purpose

Validate the full manual budget entry workflow, document the user-facing behavior, and prepare the feature for integration.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Define final acceptance | Validation checklist covers backend API, unified summary, frontend workflow, docs, and known deferred import scope |
| **DEV** | Add docs and handoff updates | User/operator docs or feature handoff explain manual entry, derived totals, unified-view integration, and deferred import |
| **VAL** | Prove merge readiness | Docker-based backend tests, frontend checks, and docs checks pass or any host-local exceptions are documented |

#### Notes

- Include a closeout note that spreadsheet import remains a follow-up candidate.
- Update feature diaries, ticket progress, and global DAG completion markers only after the relevant ticket phases are actually complete.
