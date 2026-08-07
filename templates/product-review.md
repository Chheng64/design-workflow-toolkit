<!-- TEMPLATE — product-review
     Written by STATE 03 · full contract: skills/03-product-review/SKILL.md
     Copy into artifacts/ (per-feature name) and fill in. Angle brackets are
     placeholders; every heading below is load-bearing for a downstream check. -->

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
