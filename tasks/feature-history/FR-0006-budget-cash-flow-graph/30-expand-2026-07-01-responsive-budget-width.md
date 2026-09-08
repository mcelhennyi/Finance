# FR-0006 expansion - responsive Budget width strategy

**Date:** 2026-07-01  
**Ticket:** `T-FR-0006-14` - Responsive Budget tables and full-screen edit forms  
**Status:** complete  
**Branch / worktree:** `feat/FR-0006-budget-cash-flow-graph--T-FR-0006-14-responsive-budget-width` / `.worktrees/FR-0006-budget-cash-flow-graph/T-FR-0006-14-responsive-budget-width/`

## User request

The Budget allocation and cash-flow graph tables should fit the width of the screen instead of forcing wide horizontal scroll. Dense data should use a deliberate width strategy:

- Hide columns that are usually empty, binary, repetitive, obvious from context, or visible elsewhere in the graph.
- Use compact signals such as colored backgrounds, short badges, dots, and shorthand for lower-priority fields.
- Prefer useful scan information and controls as width tightens.
- When edit actions need fields that cannot fit in a table or pane, open a modal that uses the whole screen for form data instead of editing inline in a narrow row.

## Product decision

This remains part of **FR-0006** because it refines the Budget cash-flow graph and allocation surfaces created by the current feature branch. It reopens the PR with a single post-closeout ticket rather than starting a new feature.

## Responsive priority contract

| Priority | Allocation lines | Graph accounts | Treatment |
|----------|------------------|----------------|-----------|
| P0 | Item, monthly amount, row actions | Account name, kind shorthand, row actions | Always visible. |
| P1 | Category, planned amount, cadence | Balance, parent relationship | Visible in table when space allows; folded into secondary text on narrow widths. |
| P2 | Due day, counterparty, notes-present signal | Institution, mask, active status | Hidden or compacted first; visible in modal. |
| P3 | Account linkage, obvious source/sink role text | Notes text, binary active label | Represent with color/shorthand or omit from the table because the graph/modal already exposes it. |

Allocation role remains semantically important, but the table should not spend a full column on obvious sink/source wording. Rows use a colored left edge/background and compact `SRC`/`SINK` signal. Allocation account linkage is no longer a primary table column; the graph and edit modal are the authoritative surfaces for that detail.

## UI design

- Allocation lines render as a fit-to-width desktop table from tablet up and as scan cards below that width.
- Allocation line edit opens a full-screen-on-phone modal with all fields grouped across the available viewport.
- Cash-flow graph account rows stop using the `64rem` minimum table. They use a fit table with breakpoint-hidden lower-priority columns.
- Account edit opens a full-screen-on-phone modal instead of expanding a dense inline row.
- Category relinking tables keep the current workflow but reduce repeated fields where practical, especially the current category column inside an already-expanded category.

Mock: [`docs/design/mockups/fr-0006-responsive-budget-width.html`](../../../docs/design/mockups/fr-0006-responsive-budget-width.html)

## Acceptance

- No allocation/account table requires horizontal scroll at desktop, tablet, or 390px phone viewport for the default seeded data.
- Allocation and account edit controls open modal forms that use the full screen on phone and a wide modal on desktop.
- Allocation lines keep item, category, cadence/planned amount, monthly amount, and actions quickly visible.
- Account rows keep account name, kind, balance, active/dot state, and actions quickly visible.
- Hidden account/allocation details remain available in the edit modal and graph view.
- Docker frontend lint/test/build pass.
- Rendered browser inspection covers desktop and 390px Budget page states with no console errors or page-level table overflow from the changed tables.

## Completion notes

Completed on 2026-07-01 in **`T-FR-0006-14`**. Allocation lines now use a fit-to-width desktop table and mobile cards; allocation account linkage is available in the graph/modal instead of a default table column. Allocation and cash-flow account edit actions open wide/full-screen modals. Cash-flow account rows no longer use a 64rem minimum table, and the app header/hover tips no longer create 390px page overflow.
