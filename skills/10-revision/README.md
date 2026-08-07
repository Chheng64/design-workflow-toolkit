# Skill: `revision` — STATE 10

**Route findings and change requests back to the state that caused them.**

Full contract: [SKILL.md](SKILL.md) · state machine: [../../docs/workflow.md](../../docs/workflow.md) §STATE 10

| Field | Value |
|---|---|
| Machine state | `REVISION` |
| Reads | `audit-report` and/or `review-record` |
| Writes | `revision-log-<feature>.md` |
| Depends on | self-audit **or** user-review |
| Approval gate | None to start; **Conflict Mini-Gate** before dispatching a conflict |
| Retry ceiling | `L_REVISION` 3 full cycles |
| Next states | any upstream state / `SELF_AUDIT` / `HALT_BLOCKED` |

## The rule that matters most here

The only state that writes work into other states. Route the **class**, not the instance — and write the loop counter down every cycle, or the ceiling is not a ceiling.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
