# Task Tracker

## Active

- [ ] FR-0002 budget entry page workflow
  - [x] Reserve `FR-0002` and create the feature-history stub
  - [x] Write intake and design artifacts for manual budget allocation entry
  - [x] Create canonical tickets and global tracker rows
  - [x] Ask whether to start implementation via `/develop-frontier`
- [ ] Build web interface for statement upload (drag-and-drop, multi-bank)
- [ ] Implement Phase 1 ingestion service (`src/finance/ingestion/`)
- [ ] Implement Phase 1 analysis service (`src/finance/analysis/`)
- [ ] Implement CLI (`src/finance/cli/`)
- [ ] Implement database models and Alembic migrations (`src/finance/db/`)
- [ ] Write unit tests for parser plugins
- [ ] Write integration tests for ingestion pipeline
- [ ] Configure `~/.finance/config.toml` default template

## Completed

- [x] Initialize project repository
- [x] Create project configuration files (.cursorrules, CLAUDE.md, pyproject.toml)
- [x] Create documentation structure (MkDocs, docs/)
- [x] Write user stories and requirements
- [x] Write Phase 1 design docs (ingestion service, analysis service)
- [x] Write Phase 2 design stubs (goals service)
- [x] Write Phase 3 design stubs (projection service)
- [x] Write technology decisions
- [x] Write system overview with phased roadmap
- [x] Push initial documentation to GitHub

## Backlog

- [ ] Add Frost Bank CSV parser
- [ ] Add Wells Fargo CSV parser
- [ ] Add American Express CSV parser
- [ ] Add PNC CSV parser
- [ ] Receipt PDF ingestion (pdfminer)
- [ ] Receipt image ingestion (pytesseract)
- [ ] Receipt-to-transaction matching
- [ ] GitHub Actions CI (lint, test, docs build)
