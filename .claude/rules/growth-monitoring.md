# GROWTH monitoring (`GR-…`)

Mirrors **`.cursor/rules/growth-monitoring.mdc`**. Keep both files aligned when
editing (per **`.cursor/rules/cursor-claude-doc-sync.mdc`**).

When a **`GROWTH`** tag (**`GR-<area><n>`**) is **objectively evaluable** in
running software, the implementation **shall monitor** for the trigger and
**log** when it fires so the system can **self-report** the need to grow.
Tag definition and discipline: **`.claude/rules/growth-required.md`**.

## Objectively evaluable

A **`GR-…`** tag qualifies when **all** of the following hold:

1. The design block names a **measurable trigger** (numeric threshold, bounded
   predicate, or telemetry field with a defined comparison).
2. The **evaluation inputs** exist at runtime (timers, counters, sizes, queue
   depth, etc.) without human judgment.
3. The owning design doc links the **`GR-…`** id to that trigger text (no
   orphan monitors).

Subjective triggers (“feels slow”, “when the team decides”) stay **design-only**
until amended with measurable criteria; **do not** add monitors for them.

## Monitoring obligation

- Evaluate at the **natural checkpoint** named in design (e.g. after overlay
  Tier-1 rebuild, after truth ingest batch, on daemon job completion).
- **Must not** change v0 algorithm choice or add work on the hot path beyond
  reading values already computed for the operation (no extra I/O solely for
  growth checks unless design explicitly allows sampling).
- On **first crossing** of the threshold (edge-triggered per process lifetime,
  or per design if repeat logging is required), emit a log line (see below).
- **Do not** auto-implement the **Upgrade** path when logging; firing a
  **`GR-…`** means **amend design** then implement per **`growth-required`**.

## Log contract (self-report)

Use a **single-line, stable, machine-parseable** record on the project's
diagnostic channel (stderr for native sidecar; structured main-process log for
Electron — see **`stack-conventions.mdc`**):

```text
GROWTH_TRIGGERED gr_id=GR-S2 metric=overlay_rebuild_p95_ms value=842 threshold=500 unit=ms
```

Required fields: **`gr_id`**, **`metric`**, **`value`**, **`threshold`** (or
**`predicate`** when not numeric). Optional: **`unit`**, **`sample_n`**, **`layer`**.

- **No secrets or PII** in growth lines.
- Repeat emissions: at most once per trigger crossing per process unless design
  specifies periodic re-reporting.

## Zero overhead by default (compile and runtime)

Monitoring **must not** block the most efficient v0 implementation.

| Mode | Behavior |
|------|----------|
| **Compiled out** (default for release / perf builds) | No growth checks or strings in the binary. |
| **Compiled in, runtime off** | Checks compiled; disabled via config/env (near-zero cost: branch on flag). |
| **Compiled in, runtime on** | Full evaluation and logging when thresholds cross. |

**Build-time (compile out):**

- **C++ / CMake:** option such as **`LZ_GROWTH_MONITOR`** (default **OFF**).
  When OFF, growth helpers are `#if` / empty stubs — no evaluation code linked.
- **TypeScript:** build define such as **`LZ_GROWTH_MONITOR`**; dead-code
  elimination when false so monitors are not in production bundles unless enabled.

**Runtime (when compiled in):**

- Single switch, e.g. env **`LZ_GROWTH_MONITOR=0|1`** or app config
  **`growthMonitor.enabled`**, default **off** in production profiles unless
  the team explicitly enables telemetry collection.

Document the project's chosen flag names in **`stack-conventions.mdc`** (or the
consumer overlay) when the stack is known.

## Design and registry

- In the **`GROWTH`** block, add **`Monitor:`** when evaluable — metric name,
  threshold, and checkpoint (one line). Example: **`Monitor: overlay_rebuild_p95_ms
  ≤ 500 ms after candidate append`**.
- Register **`GR-…`** in **`tasks/TAG-REGISTRY.md`**; note **`monitor: yes`**
  in the row when implementation exists or is planned.

## Tests

When monitors are compiled in, add a **unit or integration test** that forces
the predicate true and asserts one **`GROWTH_TRIGGERED`** line (or log capture)
with the expected **`gr_id`**.
