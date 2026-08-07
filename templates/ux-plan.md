<!-- TEMPLATE — ux-plan
     Written by STATE 04 · full contract: skills/04-ux-planning/SKILL.md
     Copy into artifacts/ (per-feature name) and fill in. Angle brackets are
     placeholders; every heading below is load-bearing for a downstream check. -->

---
artifact: ux-plan
version: <ux-<feature>-NN>
produced_by: ux-planning
reads_versions:
  requirements.md: <version>
  research.md: <version>
  product-review.md: <version>
feature: <feature/flow id>
coverage: <tasks with full state enumeration> / <total tasks>
---

# UX Plan — <feature>

## Primary tasks (→ requirements)

| Task | User intent | Reqs |
|---|---|---|
| TASK-A | <what the user is trying to do> | R1, R4 |
| TASK-B | ... | R2 |

## Information architecture

<the content/entity model and where each task lives inside it>

## Navigation model

<how a user moves between the IA's regions: entry points, persistent
navigation, push vs replace, back semantics, deep-link posture>

## State enumeration

### TASK-A
| State | Kind | Trigger | Strategy |
|---|---|---|---|
| happy | happy | <trigger> | <what the user experiences> |
| loading | non-happy | <trigger> | ... |
| empty | non-happy | <trigger> | ... |
| error | non-happy | <trigger> | ... |
| interrupted | non-happy | <trigger> | ... |
| permission-denied | non-happy | <trigger> | ... |

### TASK-B
...

## Edge-case matrix

| | loading | empty | error | interrupted | offline | permission-denied |
|---|---|---|---|---|---|---|
| TASK-A | ✅ | ✅ | ✅ | ✅ | n/a — <why> | ✅ |
| TASK-B | ✅ | ✅ | ✅ | ✅ | ✅ | n/a — <why> |

## Accessibility strategy

- Interactive target floor: <value> — **state the number here**; it becomes an
  acceptance criterion the audit checks against, so an unrealistic one becomes
  debt later.
- Contrast posture, focus order, keyboard reachability, screen-reader
  expectations, motion opt-out, script/locale and per-glyph font handling.

## UX risks

- U1: <risk> — <what it threatens> — <planned response>

## Open decisions

- o-<id>: <question> — <what it blocks> — <who can rule>
