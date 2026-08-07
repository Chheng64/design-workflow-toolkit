# Skill: `user-review` — STATE 09

**Present the audited prototype and capture a structured human verdict.**

Full contract: [SKILL.md](SKILL.md) · spec: [docs/workflow.md](../../docs/workflow.md) §STATE 09 · guide: [WORKFLOW_GUIDE.md](../../WORKFLOW_GUIDE.md#state-09--user_review)

[← skills/](../README.md) · prev ← [08 self-audit](../08-self-audit/README.md) · next → [12 flow-visualization](../12-flow-visualization/README.md) when `handoff_required`, else [11 final-output](../11-final-output/README.md)

| Field | Value |
|---|---|
| Machine state | `USER_REVIEW` |
| Reads | `prototype/`, `audit-report` |
| Writes | `review-record-<feature>.md` |
| Depends on | self-audit |
| Approval gate | **Primary User Approval Gate** — the central human gate |
| Retry ceiling | 2 clarification rounds |
| Next states | `FLOW_VISUALIZATION` / `FINAL_OUTPUT` / `REVISION` / `REQUIREMENT_ANALYSIS` |

## The rule that matters most here

**Run Local, never a static preview** (V4) — the player URL is recorded. An approval is scoped to the bytes it saw, and the freeze hashes prove which.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
