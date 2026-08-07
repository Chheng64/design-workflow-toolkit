---
name: requirement-analysis
description: >-
  State 01 of the AI Product Design Agent workflow. Converts an ambiguous
  product request into a structured, testable requirements artifact and a
  normalized problem statement. Use when a raw product brief needs to be parsed
  into goals, actors, constraints, non-goals, falsifiable acceptance criteria,
  surfaced assumptions, and an open-questions list before any research or design
  work begins. Reads raw_request; writes requirements.md. Entry state — no
  upstream dependency. Raises the Clarification Gate only when blocking
  ambiguity exists.
---

# Requirement Analysis (STATE 01)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 01.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests requirement analysis. It
> communicates only through the artifact store (`artifacts/`), never directly
> with other skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | `raw_request` (user prompt/brief), optional attachments, `machine_state` |
| Writes | `artifacts/requirements.md` |
| Depends on | — (entry state) |
| Approval gate | **Clarification Gate** — only when blocking ambiguity exists |
| Retry ceiling | 3, then → `HALT_BLOCKED` |
| Next states | `RESEARCH` (pass) / `REQUIREMENT_ANALYSIS` (self-loop, clarification) / `HALT_BLOCKED` (blocking ambiguity + user unavailable) |

## Purpose

Turn an ambiguous product request into a structured, testable requirements
artifact and a normalized problem statement. Nothing downstream should have to
re-interpret the raw brief.

## Processing steps

1. Parse `raw_request` into **goals, actors, constraints, non-goals**.
2. Detect ambiguity and missing information; produce an `open_questions` list.
3. Classify **scope** (small / medium / large) and effort tier.
4. Draft **falsifiable acceptance criteria** per requirement.
5. Surface **assumptions** explicitly, each flagged `assumed` vs `confirmed`.
6. If blocking ambiguity exceeds threshold → prepare a clarification set and
   raise the **Clarification Gate**.

## Output — `artifacts/requirements.md`

Write with structured frontmatter + body so downstream skills and the machine
can validate mechanically.

```markdown
---
artifact: requirements
version: <hash-or-incrementing-id>
produced_by: requirement-analysis
scope_class: small | medium | large
effort_tier: <tier>
---

## Problem statement
<normalized one-paragraph statement>

## Goals
- G1: <goal>
- G2: <goal>

## Actors
- <actor>: <role/need>

## Constraints
- <constraint>

## Non-goals
- <explicitly out of scope>

## Requirements & acceptance criteria
- R1: <requirement>
  - AC1.1: <falsifiable, observable pass/fail condition>
  - AC1.2: ...

## Assumptions
- A1 [assumed|confirmed]: <assumption>

## Open questions
- Q1 [blocking|non-blocking]: <question>
```

## Validation rules (machine-checkable on output)

- **V1:** ≥1 goal AND ≥1 acceptance criterion present.
- **V2:** Every requirement has ≥1 falsifiable acceptance criterion.
- **V3:** No requirement (or assumption) tagged both `assumed` and `confirmed`.
- **V4:** `open_questions` is empty, or every item carries a severity
  (`blocking` / `non-blocking`).

## Exit conditions

All validation rules pass **AND** no `blocking` open question remains
unresolved — resolved either by a user answer or an explicit assumption
acceptance recorded in the Assumptions section.

## Failure recovery

- On validation failure: re-run steps 1–5 with the failed rule injected as a
  corrective constraint. Increment `entry_count[REQUIREMENT_ANALYSIS]`.
- If `blocking` open questions exist: raise the **Clarification Gate** (workflow
  §5). Self-loop (`L_CLARIFY`, ceiling 3) while awaiting answers.
- Retry ceiling 3 reached, or user unavailable with blocking ambiguity →
  `HALT_BLOCKED` (state persisted, resumable).

## Approval gate

**Clarification Gate** — fires only when blocking ambiguity exists. No approval
required otherwise. Gate state persists in `machine_state.approvals`; an
approval is scoped to the artifact version it saw.
