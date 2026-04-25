---
name: commit-with-ai-metrics
description: >-
  Prepares git commits whose message includes an AI usage and effort metrics
  footer (tokens, cost, time) with explicit documented vs estimated labels. Use
  when the user asks to commit with metrics, AI token/cost notes, effort time,
  or slash/commit-with-metrics style workflow.
---

# Commit with AI metrics

Use when staging work should be committed **and** the message records **token/cost** and **time-on-feature** with honest labels.

## Principles

1. **Never fabricate numbers.** Omit or write `unknown / not tracked`.
2. **Every numeric claim needs a classification** (see **Classification labels** below).
3. Metrics are **supplementary** — normal conventional subject + body still required.

## Classification labels

| Kind | Label | Meaning |
|------|--------|---------|
| Tokens / cost | **DOCUMENTED** | Billing, IDE export, API meter — cite source |
| Tokens / cost | **ESTIMATED** | Derived rough math — cite basis |
| Tokens / cost | **UNKNOWN** | Not captured |
| Time | **RECORDED** | Timer / tracker — cite tool |
| Time | **ESTIMATED** | Human recall |
| Time | **DERIVED** | From git span, etc. |

## Commit message template

Place metrics **after** `---` following the technical body.

```
<type>(<scope>): <imperative subject>

<why / what changed. Wrap at ~72 chars.>

---
Metrics (AI assistance & effort)
- Tokens: … — <DOCUMENTED|ESTIMATED|UNKNOWN> (…)
- Cost: … — <DOCUMENTED|ESTIMATED|UNKNOWN> (…)
- Feature time: … — <RECORDED|ESTIMATED|DERIVED> (…)

Notes: Estimates are non-authoritative. Documented figures match named sources at commit time.
```

## Git commands

1. `git status` and `git diff --cached --stat`
2. `git commit -F -` with heredoc for multiline messages
