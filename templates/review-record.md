<!-- TEMPLATE — review-record
     Written by STATE 09 · full contract: skills/09-user-review/SKILL.md
     Copy into artifacts/ (per-feature name) and fill in. Angle brackets are
     placeholders; every heading below is load-bearing for a downstream check. -->

---
artifact: review-record
version: review-<feature>-NN
produced_by: user-review
reads_versions:
  prototype: <proto-<feature>-NN — the exact bytes reviewed>
  audit-report.md: <audit-<feature>-NN>
feature: <feature/flow id>
date: <YYYY-MM-DD>
gate: PrimaryUserApprovalGate
verdict: APPROVED | REQUEST-CHANGES | REJECTED
player_url: http://localhost:8765/play.html#<feature>
---

# Gate record — <feature>

## Decision

**<VERDICT>** on the **Nth presentation**, <date>.

User instruction, verbatim: *"<quote>"*.

| Field | Value |
|---|---|
| Flow | <flow + screen ids> |
| Prototype at decision | `<proto-…>` |
| Audit of record | `<audit-…>` — <PASS N / N> |
| Reviewed at | `<player URL>` (Run Local rule V4) |
| Passes to approval | <N> |

## What was approved

<the ratified behaviour, decision by decision — this is what REVISION and
FINAL_OUTPUT will treat as settled.>

## Verification at approval

| Check | Result |
|---|---|
| Audit | <PASS N / N ACs> |
| Assertions (rendering-class) | <N / N> |
| Console | <N errors> |
| Screenshots | <N> |

## Change requests (if `request-changes`)

| ID | Verbatim ask | Target state | Spec link | Status |
|---|---|---|---|---|
| CR1 | *"<quote>"* | `UI_PLANNING` | R-x3 / F2 | open → revision-log |

_No request is dropped (V3). Anything not actioned is recorded as `deferred`
with a reason._

## Deltas ratified by this decision

| # | Delta | Class | Evidence |
|---|---|---|---|
| 1 | <change on top of frozen bytes> | bug-fix only \| **feature** | <inverse-delta hash / behaviour> |

## Known limitations presented

<verbatim from audit-report.md — carried, not laundered (G5).>

## Opens carried forward

| ID | Question | Ships as |
|---|---|---|

## Validations waived

| Rule | Why | Granted by | Rides on |
|---|---|---|---|

## Freeze hashes

| Deliverable file | sha256 |
|---|---|
