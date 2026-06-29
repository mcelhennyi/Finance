## 2026-06-29 (ticket worker) - T-FR-0006-08 TEST/DEV/VAL complete

**Stage:** TEST -> DEV -> VAL on `feat/FR-0006-budget-cash-flow-graph`

**Scope:** Implemented unified source/sink allocation primitive contracts. Allocation rows now carry `allocation_role`, nullable `from_account_ref`, nullable `to_account_ref`, and nullable `counterparty`; endpoint refs validate against same-plan cash-flow node refs; graph replacement rejects deleting nodes still referenced by allocation endpoints; source rows can drive monthly income summaries while sink rows remain allocation/spend/storage totals.

**Validation:**

- Backend: `docker compose run --rm -v "$(pwd):/app" -w /app api sh -c "pip install -e /app pytest -q && python -m pytest tests/test_api_budget_allocation.py tests/test_api_cash_flow_graph.py tests/test_allocation_contracts.py tests/test_seed_budget_allocation_yaml.py -q"` -> 46 passed, 1 existing Starlette/httpx deprecation warning.
- Backend focused regression: `docker compose run --rm -v "$(pwd):/app" -w /app api sh -c "pip install -e /app pytest -q >/dev/null && python -m pytest tests/test_allocation_budget_sync.py -q"` -> 6 passed.
- Frontend: `docker compose run --rm -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"` -> lint passed, 47 Vitest tests passed, production build passed with existing Vite chunk-size warning.

**Notes:** T-FR-0006-09-owned frontend graph interaction files showed parallel worktree changes during this session and were left untouched.
