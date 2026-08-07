---
name: research
description: >-
  State 02 of the AI Product Design Agent workflow. Gathers external and
  internal evidence — domain knowledge, competitors, interaction patterns, and
  technical constraints — that informs downstream product and UX decisions. Use
  when a validated requirements artifact exists and design work needs an
  evidence base: research questions are derived from requirements, searches fan
  out by modality, findings are synthesized into cited themes with
  contradictions preserved, and coverage of every goal is tracked to a
  threshold. Reads requirements.md; writes research.md. Depends on
  requirement-analysis. No approval gate.
---

# Research (STATE 02)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 02.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests research. It communicates
> only through the artifact store (`artifacts/`), never directly with other
> skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | `artifacts/requirements.md`, `machine_state`, optional research scope config |
| Writes | `artifacts/research.md` |
| Depends on | `requirement-analysis` (must precede) |
| Approval gate | None |
| Retry ceiling | 2 (`L_RESEARCH`), then continue with logged `gap` |
| Next states | `PRODUCT_REVIEW` (pass) / `RESEARCH` (self-loop, coverage gap) / `REQUIREMENT_ANALYSIS` (back-transition, requirement malformed/contradictory) |

## Purpose

Gather external and internal evidence (domain, competitors, patterns,
constraints) that informs product and UX decisions. Downstream states should be
able to reason from cited findings rather than re-searching the problem space.

## Processing steps

1. Derive **research questions** from `requirements.md`.
2. Fan out searches by **modality**: domain, competitor, interaction pattern,
   technical constraint.
3. Collect **evidence with citations**; dedupe.
4. Synthesize findings into **themes**; note **contradictions**.
5. Rank findings by **relevance to acceptance criteria**.
6. Emit **unresolved-evidence gaps**.

## Output — `artifacts/research.md`

Write with structured frontmatter + body so downstream skills and the machine
can validate mechanically.

```markdown
---
artifact: research
version: <hash-or-incrementing-id>
produced_by: research
reads_version: <requirements.md version consumed>
coverage: <mapped-or-waived % of goals>
---

## Themes
- T1: <theme statement>
  - sources: [S1, S3]
  - relevance: <which acceptance criteria / goals this informs>
  - maps_to: [G1, G2]        # goal IDs from requirements.md
- T2: ...

## Evidence & citations
- S1 [resolvable]: <claim/finding> — <source: url or reference>
- S2 [resolvable]: <claim/finding> — <source>

## Competitor notes
- <competitor>: <observation> (sources: [S2])

## Pattern catalog
- P1: <interaction/design pattern> — <where observed> (sources: [S4])

## Constraints
- <technical / domain / regulatory constraint> (sources: [S5])

## Contradictions
- C1: <finding A> vs <finding B> — <both sources cited, left unresolved>

## Goal coverage
- G1 → [T1] | G2 → [T2] | G3 → no-research-needed

## Gaps
- GAP1: <unresolved evidence gap or downgraded theme> [reason]
```

## Validation rules (machine-checkable on output)

- **V1:** Every theme cites ≥1 source.
- **V2:** Each requirement goal maps to ≥1 research theme **OR** is explicitly
  marked `no-research-needed`.
- **V3:** Contradictions are listed, not silently resolved.
- **V4:** No fabricated citations — every source is resolvable.

## Exit conditions

All validation rules pass **AND** goal coverage ≥ configured threshold
(default 100% mapped-or-waived).

## Failure recovery

- On coverage/citation failure: re-run the fan-out targeting **only the failed
  goals**. Increment `entry_count[RESEARCH]` / `loop_count[L_RESEARCH]`.
- Retry ceiling 2 (`L_RESEARCH`). On repeated fabrication-risk failure →
  downgrade unreachable themes to `gap` and continue with a logged warning.
- If research reveals a requirement is malformed or contradictory →
  back-transition to `REQUIREMENT_ANALYSIS` (root cause is upstream).

## Approval gate

None. Research produces evidence for later gates but raises no approval of its
own.
