# Skill: `ux-planning` — STATE 04

**Define the UX strategy — tasks, IA, state enumeration, accessibility posture.**

Full contract: [SKILL.md](SKILL.md) · state machine: [../../docs/workflow.md](../../docs/workflow.md) §STATE 04

| Field | Value |
|---|---|
| Machine state | `UX_PLANNING` |
| Reads | `requirements`, `research`, `product-review` |
| Writes | `ux-plan-<feature>.md` |
| Depends on | product-review |
| Approval gate | None — non-blocking checkpoint review |
| Retry ceiling | 2 (`L_UX_EDGE`) |
| Next states | `FLOW_GENERATION` / `PRODUCT_REVIEW` / self-loop |

## The rule that matters most here

Deliberately **screen-free**. The accessibility floor stated here becomes an acceptance criterion the audit checks — set the number you will actually build.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
