# Skill: `product-review` — STATE 03

**Decide whether requirements + evidence justify spending design effort.**

Full contract: [SKILL.md](SKILL.md) · spec: [docs/workflow.md](../../docs/workflow.md) §STATE 03 · guide: [WORKFLOW_GUIDE.md](../../WORKFLOW_GUIDE.md#state-03--product_review)

[← skills/](../README.md) · prev ← [02 research](../02-research/README.md) · next → [04 ux-planning](../04-ux-planning/README.md)

| Field | Value |
|---|---|
| Machine state | `PRODUCT_REVIEW` |
| Reads | `requirements-<feature>.md`, `research-<feature>.md` |
| Writes | `product-review-<feature>.md` |
| Depends on | research |
| Approval gate | **Direction Approval Gate** — mandatory, always fires |
| Retry ceiling | 2 |
| Next states | `UX_PLANNING` / `REQUIREMENT_ANALYSIS` / `HALT_STOPPED` |

## The rule that matters most here

This state **judges** scope and never **adds** it. The last cheap place to stop or re-cut — everything downstream compounds on the direction ratified here.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
