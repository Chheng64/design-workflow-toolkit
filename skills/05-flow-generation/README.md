# Skill: `flow-generation` — STATE 05

**Turn tasks and states into directed flow graphs with exhaustive branches.**

Full contract: [SKILL.md](SKILL.md) · spec: [docs/workflow.md](../../docs/workflow.md) §STATE 05 · guide: [WORKFLOW_GUIDE.md](../../WORKFLOW_GUIDE.md#state-05--flow_generation)

[← skills/](../README.md) · prev ← [04 ux-planning](../04-ux-planning/README.md) · next → [06 ui-planning](../06-ui-planning/README.md)

| Field | Value |
|---|---|
| Machine state | `FLOW_GENERATION` |
| Reads | `ux-plan-<feature>.md`, `requirements` |
| Writes | `flows-<feature>.md` |
| Depends on | ux-planning |
| Approval gate | None |
| Retry ceiling | 3 |
| Next states | `UI_PLANNING` / `UX_PLANNING` / self-loop |

## The rule that matters most here

"Exhaustive" means the branch set covers the guard's whole domain — including null, not-yet-loaded and permission-denied. An unanswered guard is an open decision, never an invented default.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
