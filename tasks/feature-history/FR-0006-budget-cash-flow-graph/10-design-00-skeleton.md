# FR-0006 — Design (level 0, skeleton)

## Purpose

Give operators a **directed cash-flow graph** (accounts and flows as **nodes** and **edges**) that is **persisted**, **editable**, and **visualized** with **React Flow**, aligned with phased scope in [`docs/design/budget-cash-flow-graph.md`](../../../docs/design/budget-cash-flow-graph.md).

## Actors

- **Operator** — edits graph in the Budget experience.
- **Budget allocation API** — existing plans/items (**FR-0002**); graph rows attach to a plan (or month scope — **locked in contracts ticket**).
- **BBD projection API** (**FR-0003**) — future **suggested edges** only via explicit integration (**P4** ticket).

## Public surfaces (skeleton)

| Surface | Kind | Contract (signature / schema sketch) | Owner (logical) |
|---------|------|----------------------------------------|-----------------|
| `CashNode` | Persisted entity | `id`, `display_name`, `kind` (enum: checking, savings, income_source, liability_surrogate, …), optional `institution`, position/layout hints for React Flow | `src/finance/` domain + ORM |
| `CashFlowEdge` | Persisted entity | `id`, `from_node_id`, `to_node_id`, `label`, amount rule (fixed / percent / remainder sketch), cadence, optional calendar link | `src/finance/` domain + ORM |
| `GET/PUT …/cash-flow-graph` (or split resource paths) | REST | Read/write **full graph** (nodes + edges) for a scoped **plan_id** + optional month; JSON matches Pydantic DTOs | FastAPI router |
| React Flow panel | SPA | Loads graph DTO, renders nodes/edges, persists via API; uses **`@xyflow/react`** | `frontend/` Budget area |

## Data in / out

| Input | Output | Storage |
|-------|--------|---------|
| User edits, API payloads | Graph JSON, validation errors | Relational tables + migration; optional **`CashFlowSnapshot`** later (**T-FR-0006-05**) |
| BBD run outputs (later) | Suggested edges (non-destructive) | Read-only suggestions until user accepts |

## Open questions

- **Scope key:** one graph per **allocation plan** vs per **month** globally — decide in **T-FR-0006-01** and reflect in FKs.
- **`due_day`** on allocation lines vs edge schedules — advisory vs linked (**DESIGN-GAP** until decided; default: advisory).
- **Auto-layout** library vs manual drag positions — implementation choice in **T-FR-0006-04**.
