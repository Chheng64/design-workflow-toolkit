# Skill: `prototype` — STATE 07

**Assemble the specs into a coherent prototype plus its traceability map.**

Full contract: [SKILL.md](SKILL.md) · spec: [docs/workflow.md](../../docs/workflow.md) §STATE 07 · guide: [WORKFLOW_GUIDE.md](../../WORKFLOW_GUIDE.md#state-07--prototype)

[← skills/](../README.md) · prev ← [06 ui-planning](../06-ui-planning/README.md) · next → [08 self-audit](../08-self-audit/README.md)

| Field | Value |
|---|---|
| Machine state | `PROTOTYPE` |
| Reads | `ui-plan`, `flows`, `ux-plan` |
| Writes | `prototype/`, `traceability-<feature>.md` |
| Depends on | ui-planning |
| Approval gate | None |
| Retry ceiling | 3 |
| Next states | `SELF_AUDIT` / `UI_PLANNING` / self-loop |

## The rule that matters most here

Every flow state ships a **deep-link hook** (B2). A state that cannot be driven cannot be audited by 08 or demonstrated at the 09 gate — and the hook table is the review packet.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
