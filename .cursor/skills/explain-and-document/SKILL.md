---
name: explain-and-document
description: >-
  Explain the purpose of a requested code path, workflow, feature, command, or
  system behavior and write that explanation into docs/manual as a static HTML
  wiki page. Use only when the user asks for /explain-and-document or explicitly
  asks to explain and document something in the manual; this is not a general
  rule for every explanatory question.
---

# Explain And Document

Explain a requested topic and add or update a static HTML manual page under
**`docs/manual/`**. This command is explicit and opt-in; do not treat every
"what is this for?" or "how does this work?" question as a manual-writing task.

## Argument

A topic is required. Accept any useful scope:

- File path, directory, symbol, command, route, feature id, ticket id, or user
  workflow.
- A natural-language question such as "what is the purpose of the sidecar
  daemon?".
- Optional requested page title or slug.

If the topic is ambiguous, inspect the repo first. Ask only when several
unrelated systems match and choosing one would make the manual misleading.

## Output

Write or update an HTML page under:

`docs/manual/<topic-slug>.html`

Also ensure **`docs/manual/index.html`** links the page. If **`mkdocs.yml`** has
an explicit `nav:` and no Manual section, add **`docs/manual/index.html`** and
the new page so the manual is attached to the published docs site.

## Workflow

1. Map the requested topic with `rg --files`, `rg <symbol>`, tests, design docs,
   tickets, and existing manual pages.
2. Read enough code to verify the explanation:
   - entry points,
   - callers/callees,
   - data contracts or schemas,
   - tests and validation scripts,
   - docs/specs that claim authority over the behavior.
3. Write or update the manual page as semantic static HTML using this shape:
   - `<h1>Topic</h1>`
   - `Purpose`
   - `How It Works`
   - `Key Files`
   - `Inputs And Outputs` when applicable
   - `Operational Notes` when useful
   - `Last Verified`
4. Ground each substantive claim in specific files, symbols, tests, or design
   docs. Label uncertain inferences plainly.
5. Reconsider the whole manual's information architecture before saving:
   - review the homepage, page order, labels, and existing groups;
   - place the page where a reader would naturally look first;
   - create or rename directories when related pages are becoming cumbersome;
   - update moved links, nav, breadcrumbs, and search metadata.
6. If code and docs disagree, include a **Docs/code mismatch** note rather than
   hiding the disagreement.
7. Update **`docs/manual/manual-search-index.js`** with the new or changed page
   title, URL, summary, tags, synonyms, and likely user-goal phrases.
8. Update **`docs/manual/update-log.html`**:
   - set the `manual:last-reviewed-code-hash` meta tag and visible value to
     `git rev-parse HEAD`;
   - set the `manual:last-reviewed-at` meta tag and visible value to today;
   - append a changelog entry naming the page and explaining that the manual
     changed because the user explicitly requested `/explain-and-document`;
   - record whether the manual structure changed and what search metadata was
     updated.

## Static site style

- Write for a capable teammate who needs orientation, not marketing copy.
- Prefer short sections, tables, and diagrams over long prose when they make the
  workflow easier to scan.
- Link related manual pages and authoritative design docs.
- Do not paste large code blocks; quote only focused snippets when necessary.
- Keep the manual about observed implementation behavior unless the page is
  explicitly documenting a design-only concept.
- Use static HTML, local CSS, and local assets only.
- Use the project-level design language only when it is explicitly documented or
  implemented in a reusable source. If no project-level design language has been
  set, use intentionally plain formatting and add a visible note: "Manual style
  placeholder: project design language has not been set."
- When a project design source exists, cite it in **`docs/manual/manual.css`**
  or the generated page notes so future updates can tell whether the styling is
  intentional.

## Search

Every manual page must remain reachable through local fuzzy search:

- Maintain **`docs/manual/manual-search-index.js`**.
- Include titles, summaries, tags, synonyms, and user-goal phrases.
- Keep search dependency-free and static-site friendly.
- Verify the new page appears for at least one likely query.

## Validation

When **`docs/manual/`** or **`mkdocs.yml`** changes:

1. Prefer **`./develop build`** or the project’s containerized docs build.
2. If unavailable, use the documented host MkDocs fallback and record why.
3. Verify the new manual page is linked from **`docs/manual/index.html`**,
   appears in **`docs/manual/manual-search-index.js`**, and, when applicable,
   from **`mkdocs.yml`**.

## Final response

Return:

- The manual page path as a clickable file link.
- The topic explained.
- Any docs/code mismatches found.
- Validation performed or why it could not run.
