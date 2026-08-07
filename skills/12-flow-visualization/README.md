# Skill: `flow-visualization` — STATE 12

**Generate the navigation map so the design is ready for development.**

Full contract: [SKILL.md](SKILL.md) · spec: [docs/workflow.md](../../docs/workflow.md) §STATE 12 · guide: [WORKFLOW_GUIDE.md](../../WORKFLOW_GUIDE.md#state-12--flow_visualization)

[← skills/](../README.md) · prev ← [09 user-review](../09-user-review/README.md) (`approve`) · next → [11 final-output](../11-final-output/README.md) · numbered 12 by authoring order, runs before 11

| Field | Value |
|---|---|
| Machine state | `FLOW_VISUALIZATION` |
| Reads | `flows`, screen registry, lanes, `prototype/`, the design file |
| Writes | `navgraph.json`, `navmap-report.md`, `flow-visualization-<scope>.md`, design-file pages |
| Depends on | flow-generation **and** user-review (`approve`) |
| Approval gate | **Developer Handoff Gate** — blocks `FINAL_OUTPUT` |
| Retry ceiling | 3 |
| Next states | `FINAL_OUTPUT` / `FLOW_GENERATION` / `REVISION` / self-loop |

## The rule that matters most here

**Derive the graph; never draw it.** The gate passes on the report and the tool's exit code, not on the picture. Skipped entirely when `handoff_required` is false.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
