# Skill: `final-output` — STATE 11

**Freeze, package, write the handoff, and close the machine.**

Full contract: [SKILL.md](SKILL.md) · spec: [docs/workflow.md](../../docs/workflow.md) §STATE 11 · guide: [WORKFLOW_GUIDE.md](../../WORKFLOW_GUIDE.md#state-11--final_output)

[← skills/](../README.md) · prev ← [12 flow-visualization](../12-flow-visualization/README.md) or [09 user-review](../09-user-review/README.md) · next → `DONE`

| Field | Value |
|---|---|
| Machine state | `FINAL_OUTPUT` |
| Reads | approved artifact set, `review-record` |
| Writes | `deliverable-<feature>/`, terminal `machine_state` |
| Depends on | user-review (`approve`) |
| Approval gate | None additional — gated by the granted Primary Approval |
| Retry ceiling | 2 (packaging faults) |
| Next states | `DONE` / `REVISION` (completeness regression) |

## The rule that matters most here

A freeze is a **hash, not a copy**. All six completion rules are checked explicitly, each with a boolean *and a one-line reason*.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
