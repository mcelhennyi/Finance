# Tickets — FR-0000 bootstrap

**Feature id:** **`FR-0000`**  
**Canonical ids:** **`T-FR-0000-xx`**

---

### T-FR-0000-01 — Choose stack and scaffold repository

**Title:** Choose stack and scaffold repository  
**Deps:** `none`

#### Purpose

Select languages, build tooling, and baseline project layout. Record decisions in **`README.md`**, **`docs/design/architecture/overview.md`**, and **`.cursor/rules/stack-conventions.mdc`**.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Agree acceptance for “repo is real” | Checklist in **`INIT.MD`** satisfied for your org |
| **DEV** | Add minimal scaffold | Build/lint commands documented and run locally or in CI stub |
| **VAL** | Verify repeatability | Fresh clone + documented commands succeeds |

#### Notes

- Do not invent product requirements in this ticket; keep scope to **tooling and structure**.
