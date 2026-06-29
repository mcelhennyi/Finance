---
name: add-todo
description: >-
  Add a task to tasks/todo.md under Active. Use when the user says add a todo,
  track this, remind me to, or similar.
---

# Add Todo

Lightweight follow-up tracking — does not replace ticket workflow (**`T-FR-NNNN-xx`**) or **`tasks/ticket-progress.md`**.

## Steps

1. Read **`tasks/todo.md`**.
2. Append the new item under **Active** using the format:

   ```markdown
   - [ ] <task description>
   ```

3. Confirm to the user what was added.

## Compose (do not fork)

| Need | Use |
| --- | --- |
| Feature design + tickets | **`/feature-request`** |
| Parallel implementation | **`/identify-frontier`** → **`/develop-frontier`** |
| Lightweight follow-up | **`/add-todo`** (this skill) |
