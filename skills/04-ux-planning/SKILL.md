---
name: ux-planning
description: >-
  State 04 of the AI Product Design Agent workflow. Defines the UX strategy —
  primary tasks, information architecture, per-task state enumeration including
  every non-happy path, and the accessibility posture — without producing a
  single screen. Use when a direction has been approved and design needs a
  strategy before flows exist: tasks are derived from the prioritized
  requirements, the IA and navigation model are set, each task enumerates its
  happy path plus at least three non-happy-path states (error, empty, loading,
  interrupted, offline, permission-denied), accessibility and reduced-motion are
  planned at the strategy level, and UX risks and open decisions are named
  rather than designed around. Reads requirements.md, research.md and
  product-review.md; writes ux-plan.md. Depends on product-review. No approval
  gate — non-blocking checkpoint review only.
---

# UX Planning (STATE 04)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 04.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests UX planning. It communicates
> only through the artifact store (`artifacts/`), never directly with other
> skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | `artifacts/requirements.md`, `artifacts/research.md`, `artifacts/product-review.md`, `machine_state` |
| Writes | `artifacts/ux-plan.md` |
| Depends on | `product-review` (must precede; its Direction Approval Gate must be approved) |
| Approval gate | None — checkpoint review only, non-blocking |
| Retry ceiling | 2 (`L_UX_EDGE`, `UX_PLANNING` self-loop), then flag `partial-coverage` |
| Next states | `FLOW_GENERATION` (normal) / `PRODUCT_REVIEW` (back-transition, priorities unviable) / `UX_PLANNING` (self-loop, edge-case coverage gap) |

## Purpose

Define the UX **strategy** — information architecture, key tasks, states, and
non-happy-path coverage — so that flow generation has something to sequence and
UI planning has something to lay out.

This state is deliberately **screen-free**. The moment it names a screen or a
visual treatment it has skipped the decision it exists to make, and V4 fails.

## Processing steps

1. Derive **primary user tasks** from the **prioritized** requirements — the
   `must` / `should` bands of `product-review.md`, not the raw requirement set.
2. Model the **information architecture** and the **navigation model**.
3. Enumerate **states per task**: the happy path **and** the non-happy paths —
   error, empty, loading, interrupted, offline, permission-denied.
4. Define **accessibility and reduced-motion requirements** at the strategy
   level (targets, contrast posture, focus order, motion opt-out, script/locale
   handling).
5. Note **UX risks and open decisions**, each with an id that later states and
   the review gate can cite.

## Output — `artifacts/ux-plan.md`

Write with structured frontmatter + body so downstream skills and the machine
can validate mechanically.

```markdown
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
```

## Validation rules (machine-checkable on output)

- **V1:** Every primary task enumerates a happy path **AND ≥3
  non-happy-path** states.
- **V2:** The accessibility strategy is present and non-empty.
- **V3:** Every task traces to ≥1 **prioritized** requirement.
- **V4:** **No screen-level or visual design content** — strategy only. No
  screen ids, no layout, no component names, no colour.

## Exit conditions

All validation rules pass.

## Failure recovery

- On **V1** failure: re-run the enumeration targeting **only** the tasks with
  missing coverage. Increment `loop_count[L_UX_EDGE]`.
- On **V4** failure: strip the screen-level content back out. Design detail that
  arrives here is not free — it pre-commits `UI_PLANNING` to a layout nobody
  chose.
- Retry ceiling **2**, then flag `partial-coverage` and continue **only if**
  `product-review.md`'s risk tolerance allows it. Otherwise escalate.
- If UX planning reveals the prioritized set is **unviable** → back-transition
  to `PRODUCT_REVIEW`. Do not quietly re-prioritize here; that scope decision
  belongs to a gated state.

## Approval gate

None. Checkpoint review only, non-blocking — the direction was already approved
at STATE 03, and the prototype has its own gate at STATE 09. **Open decisions
recorded here are carried forward**, not resolved by assumption: an unruled
question that reaches the prototype as an invented answer is how a placeholder
ends up frozen into an approved deliverable.
