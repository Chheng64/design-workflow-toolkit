<!-- TEMPLATE — flows
     Written by STATE 05 · full contract: skills/05-flow-generation/SKILL.md
     Copy into artifacts/ (per-feature name) and fill in. Angle brackets are
     placeholders; every heading below is load-bearing for a downstream check. -->

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
