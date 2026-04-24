# Product Development Philosophy: Generative Development

## Overview

Finance Hub uses **generative development** — a documentation-driven, self-evolving architecture approach that transforms product development from manual code maintenance to system-level evolution.

Instead of manually updating individual code files (cells) that become obsolete, we grow the **organism** (the system architecture) through structured documentation and strict architectural rules that enable the system to generate itself consistently and optimally.

## The Core Problem with Traditional Development

### The "Cells" Approach (Traditional)

Traditional software development treats code as isolated cells that must be manually maintained:

- **Manual Maintenance Burden**: Developers manually update individual code files
- **Isolated Changes**: Changes are often isolated and inconsistent across the codebase
- **Obsolescence**: Code becomes obsolete as requirements evolve, creating technical debt
- **Exponential Maintenance**: Maintenance burden grows exponentially as the system scales
- **Architectural Drift**: System architecture drifts over time as patches are applied

### The "Organism" Approach (Generative Development)

Generative development treats the system as a living organism that evolves:

- **System-Level Operation**: Developers operate at the system level through documentation
- **Consistent Generation**: Generative development ensures consistency across all generated code
- **Cohesive Evolution**: The system evolves as a cohesive whole, not as disconnected parts
- **Design-Driven Changes**: Feedback drives evolution at the design level, not just code patches
- **Machine-Assisted Speed**: Development happens at machine-assisted speed through AI-powered code generation

## The Five Pillars of Generative Development

### 1. User-Driven Foundation

**Principle**: Real financial needs, not abstract requirements, drive all design decisions.

**Practice**:

- Start with descriptive documentation tied to real pain points and workflows
- Capture actual frustrations and desired outcomes
- Document the financial journeys in detail
- Every feature must trace back to a real need documented in `docs/research/user-stories.md`

**Example**:
Instead of "we need a transaction browser," we document: "Every month I'm surprised by my bank balance. I have three credit cards and no single view shows me where all the money went. I need to see every transaction, searchable and categorized, in one place."

### 2. System-Level Design Before Implementation

**Principle**: Complete architectural understanding before any code is written.

**Practice**:

- Define each module completely at the architectural level before writing code
- Document: operational goals, system boundaries, integration points, phased plans
- Create detailed designs for each phase to understand complexity and change impact
- This allows methodical feature development at machine-assisted speed

**Example**:
Before building the Ingestion Service, we document:

- What transaction fields we need to normalize
- How it integrates with the Analysis Service (shared DB schema)
- Phase 1: CSV parsing and SQLite storage
- Phase 2: PDF/receipt parsing and multi-account support

### 3. Phased Evolution

**Principle**: Build complexity incrementally, with each phase fully designed before implementation.

**Practice**:

- Design and document each phase in depth before building

**Phase 1 (MVP)**: Ingest, Store, Query

- Credit card CSV ingestion
- Receipt OCR ingestion
- SQLite storage with normalized schema
- CLI for querying and filtering
- Interactive HTML reports

**Phase 2**: Goals, Budgets, Unified View

- Income and liability tracking
- Goal and budget definition
- Budget vs. actual tracking
- Net cash flow dashboard
- Web-based UI

**Phase 3**: Trends, Projections, Scenarios

- Multi-period trend analysis
- Scenario modeling engine
- Future projections
- Year-over-year comparison

### 4. Generative Development Through Architectural Rules

**Principle**: Strict architectural rules enable the system to generate itself consistently.

**Practice**:

- Strict rules enforced via `.cursorrules` and design docs
- AI assistants follow these rules to generate consistent, well-structured code
- Common patterns are extracted and reused (parsers, normalizers, formatters)
- The system evolves toward optimal architecture through rule-driven generation

**Key Rules Include**:

- Always use the parser plugin interface for new statement formats
- Commonize shared functionality used by 2+ modules
- Follow layered architecture (CLI/API, Service, Repository, Model layers)
- Comprehensive documentation requirements
- Testing requirements (unit + integration)

### 5. User Feedback as Evolutionary Force

**Principle**: User feedback drives system changes at the architectural level, not just code patches.

**Practice**:

- Feedback drives changes at the design level
- Changes are documented first in design documents
- Then implemented through generative development following established patterns
- This creates a feedback loop:
  1. Financial pain point or new need
  2. Design documentation (system-level design changes)
  3. Architectural rules (updated patterns and standards)
  4. Generative code generation (AI-assisted implementation)
  5. Validation and new feedback

## The Generative Development Workflow

### Step-by-Step Process

1. **Capture Financial Need / Pain Point**
   - Document the real workflow and frustration
   - Tie to user stories in `docs/research/user-stories.md`

2. **Design the System Response**
   - Document in `docs/design/` directory
   - Define at the system/architectural level
   - Include integration points, phases, and complexity analysis

3. **Define Phases and Complexity**
   - Break down into Phase 1, 2, 3, etc.
   - Design each phase completely before building
   - Understand complexity and dependencies

4. **Use Generative Development to Create Code**
   - Follow architectural rules (`.cursorrules`)
   - Use AI assistants to generate code following design docs
   - Ensure consistency with existing patterns

5. **Test and Gather Feedback**
   - Run comprehensive tests
   - Validate against design requirements
   - Use the system for real financial data

6. **Evolve Design Based on Feedback**
   - Update design documents
   - Refine architectural rules if needed
   - Plan next phase or iteration

7. **Repeat**

## Key Principles for Developers

### 1. Documentation is the Source of Truth

All system behavior is defined in design documents. Code is generated from documentation, not the other way around.

### 2. Design Before Implementation

Never write code without a complete design document. The design document should be detailed enough that an AI assistant could generate the code from it.

### 3. User Feedback Drives Evolution

Changes start at the design level, not the code level. When new needs arise, update the design documents first, then let generative development implement the changes.

### 4. Privacy by Design

Financial data is sensitive. Privacy constraints are embedded in the architecture from Phase 1:

- All data stays local
- No cloud sync
- Raw statements never committed to source control
- No PII in logs
