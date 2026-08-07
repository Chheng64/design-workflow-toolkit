<!-- TEMPLATE — handoff
     Written by STATE 11 · full contract: skills/11-final-output/SKILL.md
     Copy into artifacts/ (per-feature name) and fill in. Angle brackets are
     placeholders; every heading below is load-bearing for a downstream check. -->

# <Project> — <Feature> · Design Handoff

_Feature: **<feature>** · State: **DONE** (Primary User Approval granted <date>,
<n>th pass, scoped to `proto-<feature>-NN`) · Date: <date>_

> <standing caveats that apply to everything below — provisional tokens,
> unreviewed copy, simulated content.>

## What this delivers

| Screen | ID | Built |
|---|---|---|
| <name> | S-XXX-NN | <what actually ships on it> |

**States:** <every state a screen can be driven into>

## Requirement source

<the brief, the registry rows, or the promises already frozen into other flows.
Say which — a flow built with no user brief is a different object from one built
to a spec, and the receiving team needs to know.>

## Key decisions

- **D-XN — <decision>.** <the ruling and why it went that way.>

## Pipeline artifacts

requirements-<feature> (<n>R / <n> ACs) → research-<feature> →
product-review-<feature> (**proceed**, D-X0..) → ux-plan-<feature> →
flows-<feature> → ui-plan-<feature> → traceability-<feature> →
**prototype `proto-<feature>-NN`** → audit-report-<feature> (**PASS n/n**) →
review-record-<feature>.

**Figma:** <file id + page, or PENDING with what blocks it.>

## Acceptance criteria

- **audit-<feature>-NN PASS — n / n ACs** (run against the frozen bytes, P4).
- <headless assertion count, run stability, console sweep, hex conformance,
  screenshot count.>
- Superseded ACs: <n>, each naming the ratified revision that replaced it (P3).

## Freeze

| File | sha256 |
|---|---|
| `prototype/<file>.html` | `<sha256>` |

## Review packet

```
prototype/run-local.sh → play.html #<feature>
```

Hooks: <every deep-link hook, from traceability — this is what makes the
deliverable re-drivable after the loop closes.>

## Waivers

| Rule | Waived because | Rider | What closes it |
|---|---|---|---|
| V2 / §8 rule 4 | <reason> | debt #<n> | <the specific action> |

_A waived rule ships only with a grantor, a rider and a closing condition (P6)._

## Known limitations

| ID | Limitation |
|---|---|
| **o-xN** | <the open, what ships instead, what would close it — at full strength (P8).> |

## §8 Completion Rules

| # | Rule | Holds | Evidence |
|---|---|---|---|
| 1 | `current_state` = `DONE` | ✅ | machine_state written this edit |
| 2 | approval scoped to the final frozen versions | ✅ | review-<feature>-NN `reads_versions` + freeze sha |
| 3 | `C_ALL_CRITERIA_MET` | ✅ | traceability-<feature>: n met / n waived / n superseded / **0 unmet** |
| 4 | `C_AUDIT_PASS` on the final version | ✅ | audit-<feature>-NN, run on the frozen sha |
| 5 | deliverable + handoff + traceability + decision log exist | ✅ | this folder |
| 6 | no `open` items in the latest `revision-log.md` | ✅ | rev-<feature>-NN |
