---
name: flow-generation
description: >-
  State 05 of the AI Product Design Agent workflow. Turns the UX plan's tasks and
  states into directed flow graphs — sequenced transitions, decision points with
  exhaustive branch conditions, a recovery route for every non-happy-path state,
  and a reachability report proving no unreachable state and no unjustified dead
  end. Use when a UX strategy exists and design needs concrete flows before any
  screen or component is named: each task becomes a graph, every edge carries a
  trigger and a guard, every branch is mutually exhaustive, and every flow
  boundary into another feature is marked rather than assumed. Reads ux-plan.md
  and requirements.md; writes flows.md. Depends on ux-planning. No approval gate.
---

# Flow Generation (STATE 05)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 05.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests flow generation. It
> communicates only through the artifact store (`artifacts/`), never directly
> with other skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | `artifacts/ux-plan.md`, `artifacts/requirements.md`, `machine_state` |
| Writes | `artifacts/flows.md` (per feature: `flows-<feature>.md`) |
| Depends on | `ux-planning` (must precede) |
| Approval gate | None |
| Retry ceiling | 3 (unnamed `FLOW_GENERATION` self-loop — flow-heavy state, §6), then back-transition to `UX_PLANNING` |
| Next states | `UI_PLANNING` (normal) / `UX_PLANNING` (back-transition, flow modeling exposes a missing state) / `FLOW_GENERATION` (self-loop, dead-end or reachability fix) |

## Purpose

Produce concrete user flows and state transitions that connect the UX plan's
tasks and states, so `UI_PLANNING` has a graph to lay out instead of a list to
interpret.

This state is **screen-free in the same sense STATE 04 is**: a node is a *state*
the user is in, not a visual design. Naming a node after a screen id is fine —
and is the toolkit's convention — but the node's contents are still triggers,
guards and routes, never layout, component names or colour.

## Processing steps

1. For each task in `ux-plan.md`, **sequence its states into a directed flow**.
2. Insert **decision points** and their **branch conditions**.
3. Map **every non-happy-path state to a recovery route** — the state must lead
   somewhere the user can act, not just be reachable.
4. **Detect and eliminate dead ends and unreachable states.** Produce the
   reachability report as evidence, not as a claim.
5. **Annotate every transition with its trigger and guard.**

## Output — `artifacts/flows.md`

Structured frontmatter + body, so downstream skills and the machine can validate
mechanically. Per-feature file naming (`flows-checkout.md`, `flows-onboarding.md`) is the
toolkit convention; the contract is identical.

```markdown
---
artifact: flows
version: flow-<feature>-NN
supersedes: <prior version, if any>
produced_by: flow-generation
reads_versions: { ux-plan-<feature>.md: <version>, requirements-<feature>.md: <version> }
feature: <feature/flow id>
folds_in: [<revision rounds / decisions this version absorbs>]
---

# Flows — <feature>

Node ids = prototype views. `⟂` = flow boundary (another flow's screen, mocked).

## Canon entry paths

<the named paths a user actually takes in, one line each — these are what a
reviewer checks the prototype against>

## F1 — <segment name> (<tasks covered>)

```
⟂OTHER-01 ──trigger──▶ [D1 <question>?]
   D1 no  ──▶ NODE-A ──trigger──▶ NODE-B
   D1 yes ──▶ NODE-B directly
NODE-B ──[D2 <question>?]
   D2 <case> ──▶ NODE-C
   D2 <case> ──▶ inline recovery (self-loop; recovery: <what the user can do>)
```

**D1:** <the guard, as a checkable expression> · **D2:** <guard> — all exhaustive.

<prose only where the diagram cannot carry it: contested tap targets, suppression
rules, decisions that changed a branch>

## F2 — ...

## Decision log

| ID | Decision | Ruled by | Date |
|---|---|---|---|
| D-<x>N | <what was decided, and what it replaced> | user / audit / this state | <date> |

## Reachability report

| Node | Reachable from | Terminal? | Justification if terminal |
|---|---|---|---|
| NODE-A | entry, NODE-C | no | — |
| NODE-Z | NODE-C | **yes** | <why terminating here is correct> |

Unreachable nodes: **0**. Dead ends without justification: **0**.

## Recovery coverage

| Non-happy state (ux-plan) | Recovery transition |
|---|---|
| TASK-A / error | → retry edge on NODE-B |
| TASK-A / empty | → NODE-A with a route-out CTA |

## Flow boundaries

| Boundary node | Owning flow | Status |
|---|---|---|
| ⟂OTHER-01 | <flow> | mocked / real handoff |

## Open decisions

- o-<id>: <question> — <which branch it leaves unruled> — <who can rule>
```

## Validation rules (machine-checkable on output)

- **V1:** No unreachable state in any flow.
- **V2:** No dead-end state without an explicit terminal justification.
- **V3:** Every non-happy-path state from `ux-plan.md` has a recovery
  transition.
- **V4:** Every decision point has **mutually exhaustive** branch conditions.

V4 is the one that fails quietly. "Exhaustive" means the branch set covers the
guard's whole domain — including null, not-yet-loaded and permission-denied —
not merely that two plausible cases are listed.

## Exit conditions

All validation rules pass **and** the reachability report is clean.

## Failure recovery

- On **V1 / V2** failure: patch the **offending flow segment** and re-validate
  **only that segment**. Do not regenerate the whole graph — a full rewrite
  loses the ratified decisions the diagram encodes.
- On **V3** failure: the missing recovery is usually a missing *state*, not a
  missing edge → check whether the fault is upstream before adding an edge that
  invents one.
- On **V4** failure: add the missing branch. If the missing branch has no ruled
  answer, it is an **open decision**, not a branch to invent.
- Retry ceiling **3**. A **persistent unreachable state** means `ux-plan.md`
  omitted a state → back-transition to `UX_PLANNING`. Do not add the state here;
  that enumeration belongs to STATE 04.

## Approval gate

None. Flows are ratified indirectly, at the STATE 09 gate, through the prototype
that implements them.

## Recorded failure modes

Defect classes that shipped past a clean flow graph on the run this toolkit was
extracted from. Each is a rule, not an anecdote — codes in
[`docs/method-rules.md`](../../docs/method-rules.md).

| Class | What happened | Rule |
|---|---|---|
| **Stale boundary** | Eleven live navigation call sites still routed to the placeholder boundary screen after every destination flow had shipped. A `⟂` node is correct *when written* and silently wrong once the owning flow exists. | The **Flow boundaries** table is re-checked whenever any other feature reaches `FINAL_OUTPUT` — a boundary's `status` is a dated claim, not a permanent property. |
| **Scoped claim read as global** | "No boundary mocks left" was written about one flow's mocks and read as holding for the set. | State the **scope of a clearance claim in the claim itself**. |
| **Cross-flow canon drift** | Two approved flows shipped contradictory values for the same user-visible fact. Each flow graph was internally consistent. | A fact promised at a `⟂` boundary is a **cross-flow contract**. Record it in the decision log of both flows, or it drifts. |
| **Branch invented, not ruled** | Unruled product numbers and unowned scope questions entered flows as concrete branches and were frozen into approved deliverables. | An unanswered guard is an **open decision carried forward** (`o-<id>`), never a default silently chosen here. |
| **Graph green, screen blank** | A flow whose every node and edge was correct rendered nothing — the view container stayed `visibility:hidden` because nothing ever activated it. | Flow correctness is **not** implementation correctness. This state's verdict is scoped to the graph; the render is [`skills/08`](../08-self-audit/SKILL.md)'s job (M1/M2). |
