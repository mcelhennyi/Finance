# Tickets — FR-0003 bbd-projection-ui

**Feature id:** **`FR-0003`**  
**Canonical ids:** **`T-FR-0003-xx`**

---

### T-FR-0003-01 — Extract BBD projection as importable module

**Title:** Extract BBD projection as importable module  
**Deps:** `none`

#### Purpose

Make the simulation in [`scripts/bbd_projection.py`](../../../scripts/bbd_projection.py) reusable from the FastAPI app without subprocess calls: typed entry points `project`, optional paths for Monte Carlo, `monte_carlo`, `load_scenario_from_config` / TOML I/O retained for CLI parity.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|---------------|
| **TEST** | Lock public module API | Unit tests exercise `project()` deterministic path and fixtures against current script behavior |
| **DEV** | Extract implementation | Logic lives under `src/` (package TBD); `scripts/bbd_projection.py` delegates to it; CLI UX unchanged |
| **VAL** | Verify CLI + pytest | `./develop`/`docker compose` test run passes including new module tests |

#### Notes

- Prefer minimal churn: migrate whole file into a package rather than rewriting algorithms.

---

### T-FR-0003-02 — Add BBD projection REST API

**Title:** Add BBD projection REST API  
**Deps:** `T-FR-0003-01`

#### Purpose

Expose `POST /api/bbd-projection/run` (path final name in DEV) accepting a structured scenario plus options (Monte Carlo trial count bound, deterministic-only default). Return yearly schedule rows and terminal estate comparison payload suitable for UI.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|---------------|
| **TEST** | Freeze API contracts | Router tests validate happy path + validation errors + Monte Carlo ceiling |
| **DEV** | Implement router | New router registered in `src/api/main.py`; Pydantic models; no secrets; reasonable timeout for large MC |
| **VAL** | Integration | API tests green in Docker/CI |

#### Notes

- Do not log raw scenario dollar amounts at DEBUG.

---

### T-FR-0003-03 — Deliver BBD projection page

**Title:** Deliver BBD projection page  
**Deps:** `T-FR-0003-02`

#### Purpose

New React route/page to edit scenario fields (mirror TOML groups), invoke the API, show yearly schedule (sortable table or chart using existing conventions), Monte Carlo aggregate stats when requested, and a visible “illustrative only / not advice” banner.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|---------------|
| **TEST** | Frontend contracts | Types/tests for payload mapping and formatter helpers where useful |
| **DEV** | Build UI | `Layout` navigation entry; loading/error boundaries; aligns with dashboard styling |
| **VAL** | Manual Docker check | `docker compose`/dev stack: run deterministic + optional small MC |

#### Notes

- First cut may use grouped form fields before a full JSON editor.

---

### T-FR-0003-04 — Validate BBD UX and document operator workflow

**Title:** Validate BBD UX and document operator workflow  
**Deps:** `T-FR-0003-02`, `T-FR-0003-03`

#### Purpose

Ensure operators know how CLI and UI relate; docs list API route; `scripts/README.md` documents delegation to packaged module once extracted.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|---------------|
| **TEST** | Checklist exists | Acceptance checklist in diary or ticket notes |
| **DEV** | Doc updates | `scripts/README.md` + optional user-facing README link |
| **VAL** | `./develop build`/smoke where docs nav changed | MkDocs unaffected or updated if nav added |

#### Notes

- If MkDocs grows a “Tools” page, wire it once; optional for MVP.
