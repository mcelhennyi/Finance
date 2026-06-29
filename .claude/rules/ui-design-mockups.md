# UI design HTML mocks

Mirrors **`.cursor/rules/ui-design-mockups.mdc`**. Keep both files aligned.

## Required before UI implementation

When the user asks to **create or update UI design** — screens, flows, layout, chrome, plugin surfaces, dashboard tiles, or any **visible** behavior in **`docs/design/`** — produce **static HTML mockups** that convey the **exact look and feel** **before** React/Mantle/app implementation or UI **DEV** tickets.

### Deliverables

1. **HTML** under **`docs/design/mockups/`** (browser-openable; desktop + phone variants when responsive behavior matters; shared **`.css`** when reused).
2. For additions to an existing UI, update the current UI as the example when possible: keep its real chrome/tokens/layout and show the proposed change in place. Document the exception when the current UI cannot be used.
3. **Link** mocks from the owning **`docs/design/…`** doc.
4. Then tickets / implementation.

### Exemptions

Non-UI-only design, prose-only edits, or an **explicit** user waiver documented in intake/diary.

### Audit / feature-request

- **`/audit-design`:** visible UI without mocks → not ticket-ready.
- **`/feature-request` Stages 1..N:** complete mocks (or documented waiver) before UI-leaning tickets.

See **`docs/design/documentation-style.md`** and **`feature-request`** skill.
