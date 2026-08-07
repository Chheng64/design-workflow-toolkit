# Skill: `research` — STATE 02

**Gather cited evidence — domain, competitors, patterns, constraints.**

Full contract: [SKILL.md](SKILL.md) · spec: [docs/workflow.md](../../docs/workflow.md) §STATE 02 · guide: [WORKFLOW_GUIDE.md](../../WORKFLOW_GUIDE.md#state-02--research)

[← skills/](../README.md) · prev ← [01 requirement-analysis](../01-requirement-analysis/README.md) · next → [03 product-review](../03-product-review/README.md)

| Field | Value |
|---|---|
| Machine state | `RESEARCH` |
| Reads | `requirements-<feature>.md` |
| Writes | `research-<feature>.md` |
| Depends on | requirement-analysis |
| Approval gate | None |
| Retry ceiling | 2 (`L_RESEARCH`) |
| Next states | `PRODUCT_REVIEW` / self-loop / `REQUIREMENT_ANALYSIS` |

## The rule that matters most here

Contradictions are **listed, not silently resolved**, and a goal is either mapped to a theme or explicitly marked `no-research-needed`.

## Contract rule

This skill communicates **only** through the artifact store (`artifacts/`), never
directly with another skill. It runs when the orchestrator — or an explicit user
task — requests this state, and not otherwise.
