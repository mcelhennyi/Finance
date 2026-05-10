# Handoff: Budget category inventory, seed catalog sync, relink-on-delete

**Date:** 2026-05-10  
**Area:** Budget allocation API + Budget page UI + YAML seed

## What shipped

### Category inventory (replaces “saved-only” list)

- **`GET /api/budget-allocation/category-inventory`**: rows with `label`, `allocation_item_count` (all `allocation_items` across plans), `catalog_id` when present in `budget_category_labels`.
- **`POST /api/budget-allocation/category-reassign`**: body `{ from_label, replacement_label }` — bulk-updates allocation lines, syncs derived budgets per affected month, drops saved row for `from_label` if any, ensures `replacement_label` exists in catalog.
- **`DELETE /api/budget-allocation/category-catalog/{id}`**: only if **no** lines use that label; otherwise **400** (use relink first).

### Catalog / seed / CRUD

- **`ensure_budget_category_labels_from_strings`** in `src/finance/allocation/category_catalog.py` — idempotent inserts.
- **`apply_budget_seed_yaml`**: after inserting items, seeds **all item categories** into `budget_category_labels`.
- **`create_allocation_item` / `update_allocation_item`** (category change): ensures the category string is in the catalog.

### Frontend (`BudgetPage.tsx`)

- Categories section: **table** (Category | Lines | Saved | Actions).
- **Relink…** when `allocation_item_count > 0` → modal + **`POST /category-reassign`**.
- **Remove** when saved and zero lines → **`DELETE`** catalog by id.
- **`listBudgetCategoryInventory`**, **`reassignBudgetCategory`** in `frontend/src/api/client.ts`; types in `frontend/src/types.ts`.
- **`invalidateAll`** includes `budgetCategoryInventory` (not legacy catalog-only key).

### Tests

- `tests/test_api_budget_allocation.py` — inventory, delete blocked when lines exist, reassign, cleanup.
- `tests/test_seed_budget_allocation_yaml.py` — after minimal YAML seed, `Living` exists in `budget_category_labels`.

### Earlier context (same branch / session thread)

- Cash-flow **`parent_ref`** on nodes; DB additive migration; YAML umbrellas (Ian’s / Natalie’s Chase) + child cards; default graph + `graphNodeRefForPaymentMethod` → `ian_chase_sapphire`.
- **`schemas.py`**: `CashFlowEdgeSpec` was restored as its own class (merge bugfix).

## Key files

| Layer | Path |
| --- | --- |
| Catalog + inventory + reassign | `src/finance/allocation/category_catalog.py` |
| Seed hook | `src/finance/seed_budget_allocation_yaml.py` |
| Item create/update catalog sync | `src/finance/allocation/service.py` |
| API | `src/api/routers/budget_allocation.py`, `src/api/schemas.py` |
| UI | `frontend/src/pages/BudgetPage.tsx`, `frontend/src/api/client.ts`, `frontend/src/types.ts` |
| Model | `src/finance/db/models.py` — `BudgetCategoryLabel` |

## Follow-ups (optional)

- **Docs:** `scripts/README.md` / design doc snippet for new endpoints if you publish API docs.
- **Relink UX:** Escape key to close modal; optional “also remove `from_label` from picker when zero tx” behavior.
- **Per-plan inventory:** today counts are **global**; filter by `plan_id` if product wants plan-scoped counts only.
- **Vitest:** run `npx vitest run …` in `frontend/` when `node_modules` available (not run in agent sandbox for this handoff).

## Verify locally

```bash
PYTHONPATH=src python3 -m pytest tests/test_api_budget_allocation.py tests/test_seed_budget_allocation_yaml.py -q
```

Docker dev stack per `scripts/dev.sh` / `docker compose` per project policy.
