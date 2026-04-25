# Feature request registry (`FR-NNNN`)

**Rules:** Four-digit zero-padded ids. **Never** reuse an **`FR-NNNN`** for a different feature. Increment **`next_id`** when allocating a new number.

**Parallel features:** Multiple rows may be **`design`** or **`in-progress`** at the same time. Each row points at a **distinct** directory **`tasks/feature-history/FR-NNNN-<slug>/`**.

| FR id | Slug (directory) | Status | Tickets (when known) | Notes |
|-------|------------------|--------|------------------------|-------|
| FR-0000 | `FR-0000-bootstrap/` | `active` | **`T-FR-0000-01`** in [`FR-0000-bootstrap/tickets.md`](FR-0000-bootstrap/tickets.md) | Core / repo bootstrap. |

**next_id:** `1`

**Allocating a new `FR-NNNN`:** Create directory **`tasks/feature-history/FR-NNNN-<slug>/`**, add a row to the table, set **`next_id`** to **NNNN+1**, and add the ticket file path to **`TICKET-SOURCES.md`**.
