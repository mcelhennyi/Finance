# Projection Service — Overview

**Phase**: 3 (Planned)

**Location**: `src/finance/projections/` *(not yet implemented)*

## Purpose

The Projection Service models your financial future. Given your historical spending and income patterns, it projects cash flow, savings, and net worth over 12–24 months. It also supports scenario modeling — "what if I get a raise?", "what if I take on a car payment?"

## Planned Capabilities

- Baseline projection from historical averages (last 3-month or 12-month rolling)
- Scenario definition: income changes, new debts, one-time expenses, savings rate changes
- Side-by-side scenario comparison (base case vs. modified)
- 12-month and 24-month cash flow projection charts
- Net worth projection (assets − liabilities over time)
- Life event annotations on the timeline

## Key Data Concepts

- **Baseline**: Historical average spending per category and income per source
- **Scenario**: A set of changes applied on top of the baseline (start date, amount, duration)
- **Projection**: Month-by-month cash flow calculated from baseline + scenario
- **Net Worth Trajectory**: Running total of projected savings minus known liabilities

## Design Status

This service will be fully designed before Phase 3 implementation begins. Design will cover:

- Scenario definition schema
- Projection calculation engine
- Chart.js integration for projection visualization
- Scenario comparison UI

*See [User Stories](../../../research/user-stories.md) — Stories 4 and 5 for the requirements driving this service.*
