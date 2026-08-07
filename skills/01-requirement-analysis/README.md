# Skill: `requirement-analysis` — STATE 01

**Turn an ambiguous request into structured, testable requirements.**

Full contract: [SKILL.md](SKILL.md) · spec: [docs/workflow.md](../../docs/workflow.md) §STATE 01 · guide: [WORKFLOW_GUIDE.md](../../WORKFLOW_GUIDE.md#state-01--requirement_analysis)

[← skills/](../README.md) · entry state · next → [02 research](../02-research/README.md)

| Field | Value |
|---|---|
| Machine state | `REQUIREMENT_ANALYSIS` |
| Reads | `raw_request`, attachments |
| Writes | `requirements-<feature>.md` |
| Depends on | — (entry state) |
| Approval gate | **Clarification Gate** — only when blocking ambiguity exists |
| Retry ceiling | 3 |
| Next states | `RESEARCH` / self-loop / `HALT_BLOCKED` |

## The rule that matters most here

Falsifiable acceptance criteria are the product of this state. Everything downstream is checked against them, so a vague one is a check nobody can fail.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
