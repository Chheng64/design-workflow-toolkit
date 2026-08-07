---
name: product-review
description: >-
  State 03 of the AI Product Design Agent workflow. Decides whether the
  requirements and the research evidence justify spending design effort, and
  emits a proceed / re-scope / stop recommendation before any UX work begins.
  Use when a validated requirements artifact and a research artifact both exist
  and the direction has not yet been approved: requirements are reconciled
  against evidence, scored on value/effort/risk, contradictions between desired
  scope and evidence are named rather than absorbed, high-risk items get a
  mitigation or an explicit accept-risk note, and the decision is recorded with
  its triggers. Reads requirements.md and research.md; writes product-review.md.
  Depends on research. Raises the mandatory Direction Approval Gate.
---

# Product Review (STATE 03)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 03.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests a product review. It
> communicates only through the artifact store (`artifacts/`), never directly
> with other skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | `artifacts/requirements.md`, `artifacts/research.md`, `machine_state` |
| Writes | `artifacts/product-review.md` |
| Depends on | `research` (must precede) |
| Approval gate | **Direction Approval Gate** — mandatory, always fires |
| Retry ceiling | 2 (`entry_count[PRODUCT_REVIEW]`), re-run scoring with the failed rule as constraint |
| Next states | `UX_PLANNING` (`proceed` + gate approved) / `REQUIREMENT_ANALYSIS` (`re-scope`, or gate denied) / `HALT_STOPPED` (`stop` + gate confirms) |

## Purpose

Decide whether the requirements plus the research evidence justify the product
direction, **before** design resources are spent. This is the last cheap place
to stop or re-cut scope: everything downstream (UX plan, flows, UI plan,
prototype) compounds on the direction ratified here.

This state **judges** scope. It never **adds** scope — every prioritized item
must already exist in `requirements.md`.

## Processing steps

1. **Reconcile** each requirement against the research evidence: which themes
   support it, which contradict it, which leave it unevidenced.
2. **Score** every requirement on **value / effort / risk** and derive a
   priority band (`must` / `should` / `could` / `cut`).
3. **Identify contradictions** between desired scope and evidence — where the
   brief wants something the research says is wrong, unproven, or unowned.
4. **Build the risk register**: every high-risk item gets a mitigation **or** an
   explicit accept-risk note naming who accepts it.
5. Produce a **`proceed` / `re-scope` / `stop` recommendation** with written
   rationale tied to the scores and contradictions above.
6. **Record the decision and its triggers** — what evidence would reverse it.
7. Raise the **Direction Approval Gate**.

## Output — `artifacts/product-review.md`

Write with structured frontmatter + body so downstream skills and the machine
can validate mechanically.

```markdown
---
artifact: product-review
version: <hash-or-incrementing-id>
produced_by: product-review
reads_version:
  requirements: <requirements.md version consumed>
  research: <research.md version consumed>
recommendation: proceed | re-scope | stop
gate: direction-approval
gate_state: pending | approved | denied
---

## Recommendation

**<proceed | re-scope | stop>** — <rationale, tied to the scores and
contradictions below. Name the two or three findings that actually drove it.>

## Prioritized requirements

| ID | Requirement | Value | Effort | Risk | Band | Evidence |
|---|---|---|---|---|---|---|
| R1 | <text, verbatim from requirements.md> | H/M/L | H/M/L | H/M/L | must | [T1, T4] |
| R2 | ... | | | | should | [T2] |
| R7 | ... | | | | cut | unevidenced |

## Risk register

| ID | Risk | Sev | Mitigation **or** accept-risk | Owner |
|---|---|---|---|---|
| K1 | <risk statement> | high | <mitigation> | <role> |
| K2 | <risk statement> | high | **ACCEPTED** — <why, and by whom> | <role> |

## Scope contradictions

- X1: <brief wants A> vs <research theme T3 shows B> — <resolution, or
  explicitly left open with an open-decision id>

## Decision record

- D1: <decision> — trigger: <what evidence or event would reverse it>
- Deferred: <open decisions handed to later states, with ids>

## Cut list

- <requirement id> — <why it is out for this cycle, and what would bring it back>
```

## Validation rules (machine-checkable on output)

- **V1:** `recommendation` ∈ {`proceed`, `re-scope`, `stop`} **and** the
  rationale block is non-empty.
- **V2:** Every risk with `Sev = high` carries a mitigation **or** an explicit
  accept-risk note with a named owner.
- **V3:** The prioritized set is a **subset** of the validated requirements —
  every ID resolves in `requirements.md`. No new scope is introduced here.
- **V4:** Every prioritized requirement cites its evidence (research theme IDs)
  **or** is explicitly marked `unevidenced`.

## Exit conditions

All validation rules pass **AND** the **Direction Approval Gate** is resolved.

## Failure recovery

- On validation failure: re-run **scoring only**, with the failed rule as an
  explicit constraint. Increment `entry_count[PRODUCT_REVIEW]`.
- Retry ceiling **2**. Escalate rather than widen scope to satisfy a rule — a
  V3 failure means an upstream requirement is missing, not that this state
  should invent one.
- If the user **denies** direction at the gate → back-transition to
  `REQUIREMENT_ANALYSIS` carrying the denial notes as input.
- If the recommendation is `re-scope` → `REQUIREMENT_ANALYSIS` with the cut
  list and contradictions attached.
- If the recommendation is `stop` and the gate confirms → `HALT_STOPPED`.

## Approval gate

**Direction Approval Gate** — mandatory, fires every time. It exists to prevent
spending design effort on an unapproved direction. Gate state persists in
`machine_state.approvals`; an approval is scoped to the artifact version it
saw. A later revision of `product-review.md` re-opens the gate.

Present at the gate: the recommendation and its rationale, the priority bands,
the high-risk items with their mitigation-or-acceptance, and the cut list.
Unresolved contradictions are presented **as unresolved** — a gate answered on
a tidied-up picture is not an approval of the real direction.
