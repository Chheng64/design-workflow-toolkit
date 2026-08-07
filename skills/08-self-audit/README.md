# Skill: `self-audit` — STATE 08

**Adversarially review the prototype before any user attention is spent.**

Full contract: [SKILL.md](SKILL.md) · state machine: [../../docs/workflow.md](../../docs/workflow.md) §STATE 08

| Field | Value |
|---|---|
| Machine state | `SELF_AUDIT` |
| Reads | `prototype/`, `traceability`, all upstream |
| Writes | `audit-report-<feature>.md` |
| Depends on | prototype |
| Approval gate | None — the machine gating itself |
| Retry ceiling | 3 (`L_AUDIT_FIX`) |
| Next states | `USER_REVIEW` (pass) / `REVISION` (fail) / self-loop |

## The rule that matters most here

Every check is **rendering-class** — computed visibility and geometry, never DOM presence. A failing probe is a hypothesis until confirmed at source.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
