# Goals Service — Overview

**Phase**: 2 (Planned)

**Location**: `src/finance/goals/` *(not yet implemented)*

## Purpose

The Goals Service lets you define financial goals and budgets, then tracks actual spending and income against them. It is the feedback loop that tells you whether your financial habits are aligned with your intentions.

## Planned Capabilities

- Define monthly spend limits per category (e.g., "Dining: $400/month")
- Define savings goals (e.g., "Save $1,500/month")
- Track actual vs. goal in real time as transactions are ingested
- Show over/under status per category per period
- Alert when a category is trending over budget mid-month

## Key Data Concepts

- **Budget**: A spending limit for a category within a time period
- **Goal**: A target for savings, income, or net worth
- **Actuals**: Computed from transactions already in the database
- **Variance**: Actual − Budget (positive = over budget, negative = under budget)

## Design Status

This service will be fully designed before Phase 2 implementation begins. Design will cover:

- Goal and budget schema
- Budget vs. actual calculation engine
- Alert/notification mechanism
- Integration with the Analysis Service

*See [User Stories](../../../research/user-stories.md) — Story 2 for the requirements driving this service.*
