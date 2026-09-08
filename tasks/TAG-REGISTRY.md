# Tag and numbered-id registry

**Authoritative roster** for every **durable numbered tag** an agent may place
in design docs, tickets, code traceability comments, or handoffs. **Never**
invent an id in prose without reserving it here first.

**Reservation rule (mandatory):**

1. Open this file (and **`tasks/feature-history/REGISTRY.md`** when allocating
   **`FR-NNNN`**).
2. Find the **`next_*`** counter for the tag family and area (or global section).
3. Add a row with status **`reserved`**, today's date, a one-line intent, and
   the target doc/path (may be `TBD` until the tag is written).
4. Bump the **`next_*`** counter.
5. **`git commit` and `git push` to the default branch** before using the id in
   any other file. Parallel agents must see the reservation on the remote.

**Retiring ids:** When a tag is removed from design (rework landed, gap closed,
growth triggered), set status to **`retired`** with a note. Do **not** reuse the
number.

**Process detail:** **`.cursor/rules/tag-reservation.mdc`** (mirrored
**`.claude/rules/tag-reservation.md`** and **`.codex/rules/tag-reservation.md`**).

---

## Tag families (id format)

| Family | Id format | Reserve in | Notes |
|--------|-----------|------------|-------|
| Feature request | `FR-NNNN` | [`feature-history/REGISTRY.md`](feature-history/REGISTRY.md) | Four-digit; same commit/push rule |
| Implementation ticket | `T-FR-NNNN-xx` | Owning feature [`tickets.md`](feature-history/) + row below | `xx` is two-digit per feature |
| Design gap | `DG-<area><n>` | Section **Design gaps** | Stop work; do not guess |
| Design flaw | `DF-<area><n>` | Section **Design flaws** | Amend design with evidence |
| Rework required | `RW-<area><n>` | Section **Rework required** | Durable until rework ships |
| Growth | `GR-<area><n>` | Section **Growth** | v0 until trigger; then amend design |
| Refinement | `R-<area><n>` | Section **Refinements** | Deferred detail; v0 path clear |
| Design decision | `DEC-<area><n>` | Section **Decisions** | Recorded decision blocks |
| Trade study | `TS-<area><n>` | Section **Trade studies** | Linked options/decisions |
| Code traceability | `@FH-<area>-<n>` | Section **Traceability** | Finance Hub project prefix |
| Amendment comment | `<area>-<n>` in `<!-- AMENDMENT: ... -->` | Section **Amendments** | Per `docs/ai-context.md` |

**Transient tags** (`CODE-DEFECT`, `COMPLETED`) do not need registry rows.
Fix or close them in the same change set.

## Area keys

| Area | Scope |
|------|-------|
| `API` | FastAPI routes, request/response contracts, and service boundaries |
| `DATA` | Persistence, migrations, ingestion, seed data, and normalization |
| `UI` | React app shell, pages, components, browser behavior, and accessibility |
| `BUD` | Budget allocation, budget plans, and cash-flow graph behavior |
| `BBD` | Buy/Borrow/Die projection engine and experience |
| `DOC` | Design docs, process docs, and published MkDocs behavior |
| `OPS` | Docker, scripts, ports, CI, and local development environment |

---

## Implementation tickets (`T-FR-NNNN-xx`)

Per-feature **`next_xx`** lives in that feature's **`tickets.md`** header. When
reserving a new ticket id, add a summary row here.

| Ticket id | FR | Status | Reserved | Owning `tickets.md` | Notes |
|-----------|----|--------|----------|---------------------|-------|
| T-FR-0000-01 | FR-0000 | complete | (legacy) | [FR-0000-bootstrap/tickets.md](feature-history/FR-0000-bootstrap/tickets.md) | Choose stack and scaffold repository |
| T-FR-0001-01 | FR-0001 | complete | (legacy) | [FR-0001-phase2-goals-unified-view/tickets.md](feature-history/FR-0001-phase2-goals-unified-view/tickets.md) | Define goals and budgets data contracts |
| T-FR-0001-02 | FR-0001 | complete | (legacy) | [FR-0001-phase2-goals-unified-view/tickets.md](feature-history/FR-0001-phase2-goals-unified-view/tickets.md) | Build goals and budget actuals engine |
| T-FR-0001-03 | FR-0001 | complete | (legacy) | [FR-0001-phase2-goals-unified-view/tickets.md](feature-history/FR-0001-phase2-goals-unified-view/tickets.md) | Add income and liabilities ingestion contracts |
| T-FR-0001-04 | FR-0001 | complete | (legacy) | [FR-0001-phase2-goals-unified-view/tickets.md](feature-history/FR-0001-phase2-goals-unified-view/tickets.md) | Expose unified monthly financial summary API |
| T-FR-0001-05 | FR-0001 | complete | (legacy) | [FR-0001-phase2-goals-unified-view/tickets.md](feature-history/FR-0001-phase2-goals-unified-view/tickets.md) | Deliver Phase 2 unified dashboard view |
| T-FR-0002-01 | FR-0002 | complete | (legacy) | [FR-0002-budget-entry-page/tickets.md](feature-history/FR-0002-budget-entry-page/tickets.md) | Define budget allocation contracts |
| T-FR-0002-02 | FR-0002 | complete | (legacy) | [FR-0002-budget-entry-page/tickets.md](feature-history/FR-0002-budget-entry-page/tickets.md) | Expose budget allocation API |
| T-FR-0002-03 | FR-0002 | complete | (legacy) | [FR-0002-budget-entry-page/tickets.md](feature-history/FR-0002-budget-entry-page/tickets.md) | Sync allocation totals into unified budgets |
| T-FR-0002-04 | FR-0002 | complete | (legacy) | [FR-0002-budget-entry-page/tickets.md](feature-history/FR-0002-budget-entry-page/tickets.md) | Deliver budget entry page |
| T-FR-0002-05 | FR-0002 | complete | (legacy) | [FR-0002-budget-entry-page/tickets.md](feature-history/FR-0002-budget-entry-page/tickets.md) | Validate and document budget entry workflow |
| T-FR-0003-01 | FR-0003 | complete | (legacy) | [FR-0003-bbd-projection-ui/tickets.md](feature-history/FR-0003-bbd-projection-ui/tickets.md) | Extract BBD projection as importable module |
| T-FR-0003-02 | FR-0003 | complete | (legacy) | [FR-0003-bbd-projection-ui/tickets.md](feature-history/FR-0003-bbd-projection-ui/tickets.md) | Add BBD projection REST API |
| T-FR-0003-03 | FR-0003 | complete | (legacy) | [FR-0003-bbd-projection-ui/tickets.md](feature-history/FR-0003-bbd-projection-ui/tickets.md) | Deliver BBD projection page |
| T-FR-0003-04 | FR-0003 | complete | (legacy) | [FR-0003-bbd-projection-ui/tickets.md](feature-history/FR-0003-bbd-projection-ui/tickets.md) | Validate BBD UX and document operator workflow |
| T-FR-0004-01 | FR-0004 | complete | (legacy) | [FR-0004-bbd-projection-experience/tickets.md](feature-history/FR-0004-bbd-projection-experience/tickets.md) | BBD bottom control dock and relocated actions |
| T-FR-0004-02 | FR-0004 | complete | (legacy) | [FR-0004-bbd-projection-experience/tickets.md](feature-history/FR-0004-bbd-projection-experience/tickets.md) | BBD visualization view-model and chart-ready series |
| T-FR-0004-03 | FR-0004 | complete | (legacy) | [FR-0004-bbd-projection-experience/tickets.md](feature-history/FR-0004-bbd-projection-experience/tickets.md) | BBD 2D story dashboard and educational callouts |
| T-FR-0004-04 | FR-0004 | complete | (legacy) | [FR-0004-bbd-projection-experience/tickets.md](feature-history/FR-0004-bbd-projection-experience/tickets.md) | BBD spatial / 3D-time experience |
| T-FR-0004-05 | FR-0004 | complete | (legacy) | [FR-0004-bbd-projection-experience/tickets.md](feature-history/FR-0004-bbd-projection-experience/tickets.md) | BBD experience integration VAL and operator docs |
| T-FR-0005-01 | FR-0005 | complete | (legacy) | [FR-0005-budget-page-docs-dock/tickets.md](feature-history/FR-0005-budget-page-docs-dock/tickets.md) | Budget page in-app guide, annotations, and floating dock |
| T-FR-0006-01 | FR-0006 | complete | (legacy) | [FR-0006-budget-cash-flow-graph/tickets.md](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) | Define cash-flow graph persistence contracts |
| T-FR-0006-02 | FR-0006 | complete | (legacy) | [FR-0006-budget-cash-flow-graph/tickets.md](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) | Add cash-flow graph migration and ORM models |
| T-FR-0006-03 | FR-0006 | complete | (legacy) | [FR-0006-budget-cash-flow-graph/tickets.md](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) | Expose cash-flow graph CRUD API |
| T-FR-0006-04 | FR-0006 | complete | (legacy) | [FR-0006-budget-cash-flow-graph/tickets.md](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) | Budget React Flow panel wired to graph API |
| T-FR-0006-05 | FR-0006 | complete | (legacy) | [FR-0006-budget-cash-flow-graph/tickets.md](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) | Cash-flow time scrub and aggregated views |
| T-FR-0006-06 | FR-0006 | complete | (legacy) | [FR-0006-budget-cash-flow-graph/tickets.md](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) | BBD-suggested cash-flow edges |
| T-FR-0006-07 | FR-0006 | complete | (legacy) | [FR-0006-budget-cash-flow-graph/tickets.md](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) | Compose default for allocation auto-template |

---

## Design gaps (`DG-<area><n>`)

### Area `API`

**next_id:** `1`

| Id | Status | Reserved | Owning doc | Notes |
|----|--------|----------|------------|-------|

### Area `DATA`

**next_id:** `1`

| Id | Status | Reserved | Owning doc | Notes |
|----|--------|----------|------------|-------|

### Area `UI`

**next_id:** `1`

| Id | Status | Reserved | Owning doc | Notes |
|----|--------|----------|------------|-------|

### Area `BUD`

**next_id:** `1`

| Id | Status | Reserved | Owning doc | Notes |
|----|--------|----------|------------|-------|

### Area `BBD`

**next_id:** `1`

| Id | Status | Reserved | Owning doc | Notes |
|----|--------|----------|------------|-------|

### Area `DOC`

**next_id:** `1`

| Id | Status | Reserved | Owning doc | Notes |
|----|--------|----------|------------|-------|

### Area `OPS`

**next_id:** `1`

| Id | Status | Reserved | Owning doc | Notes |
|----|--------|----------|------------|-------|

## Design flaws (`DF-<area><n>`)

*(Per-area subsections use the same table shape as design gaps.)*

## Rework required (`RW-<area><n>`)

*(Per-area subsections use the same table shape as design gaps.)*

## Growth (`GR-<area><n>`)

*(Per-area subsections use the same table shape as design gaps. When a trigger
is objectively evaluable at runtime, add **`Monitor:`** in the design block and
implement **`GROWTH_TRIGGERED`** logging per **`.claude/rules/growth-monitoring.md`**
and **`.codex/rules/growth-monitoring.md`**. Note **`monitor: yes`** in the
registry row.)*

## Refinements (`R-<area><n>`)

*(Per-area subsections use the same table shape as design gaps.)*

## Decisions (`DEC-<area><n>`)

*(Per-area subsections use the same table shape as design gaps.)*

## Trade studies (`TS-<area><n>`)

*(Per-area subsections use the same table shape as design gaps.)*

## Traceability (`@FH-<area>-<n>`)

**next_id:** `1`

| Id | Status | Reserved | Owning doc | Notes |
|----|--------|----------|------------|-------|

## Amendments (`<!-- AMENDMENT: ... -->`)

| Key | Status | Reserved | Owning doc | Notes |
|-----|--------|----------|------------|-------|

**next_amendment_seq:** `1`
