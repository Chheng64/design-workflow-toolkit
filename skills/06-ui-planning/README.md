# Skill: `ui-planning` — STATE 06

**Component inventory, DS mapping, layout, motion and contrast — by reference.**

Full contract: [SKILL.md](SKILL.md) · state machine: [../../docs/workflow.md](../../docs/workflow.md) §STATE 06

| Field | Value |
|---|---|
| Machine state | `UI_PLANNING` |
| Reads | `flows`, `ux-plan`, `research`, the design system |
| Writes | `ui-plan-<feature>.md` |
| Depends on | flow-generation |
| Approval gate | None — may raise an informational **Extension Note** |
| Retry ceiling | 2 |
| Next states | `PROTOTYPE` / `FLOW_GENERATION` / self-loop |

## The rule that matters most here

Name the design system **by source id**. A plan built on the wrong system validates perfectly against it, and no downstream rule can catch it.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
