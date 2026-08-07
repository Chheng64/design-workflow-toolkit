# `skills/` — the twelve states

[← Repository root](../README.md) · [Workflow Guide](../WORKFLOW_GUIDE.md) · [Spec](../docs/workflow.md)

---

## Purpose

One folder per workflow state. Each is a self-contained Claude Skill with a typed contract: what it reads, what it writes, what must be true to leave it, and what to do when it fails.

**The states are here. The state machine is not.** No skill holds `machine_state`, evaluates a guard, or decides what happens next — that is the orchestrator's job. A skill runs when asked, does one state's work, writes its artifact, and stops.

| Folder | State | Writes | Gate |
|---|---|---|---|
| [`01-requirement-analysis/`](01-requirement-analysis/) | `REQUIREMENT_ANALYSIS` | `requirements-<f>.md` | Clarification (conditional) |
| [`02-research/`](02-research/) | `RESEARCH` | `research-<f>.md` | — |
| [`03-product-review/`](03-product-review/) | `PRODUCT_REVIEW` | `product-review-<f>.md` | **Direction Approval** |
| [`04-ux-planning/`](04-ux-planning/) | `UX_PLANNING` | `ux-plan-<f>.md` | — |
| [`05-flow-generation/`](05-flow-generation/) | `FLOW_GENERATION` | `flows-<f>.md` | — |
| [`06-ui-planning/`](06-ui-planning/) | `UI_PLANNING` | `ui-plan-<f>.md` | Extension Note (informational) |
| [`07-prototype/`](07-prototype/) | `PROTOTYPE` | `prototype/`, `traceability-<f>.md` | — |
| [`08-self-audit/`](08-self-audit/) | `SELF_AUDIT` | `audit-report-<f>.md` | — |
| [`09-user-review/`](09-user-review/) | `USER_REVIEW` | `review-record-<f>.md` | **Primary User Approval** |
| [`10-revision/`](10-revision/) | `REVISION` | `revision-log-<f>.md` | Conflict Mini-Gate (conditional) |
| [`11-final-output/`](11-final-output/) | `FINAL_OUTPUT` | `deliverable-<f>/` | — (gated by 09) |
| [`12-flow-visualization/`](12-flow-visualization/) | `FLOW_VISUALIZATION` | `navgraph.json`, `navmap-report.md`, design-file pages | **Developer Handoff** |

> **12 is numbered by authoring order, not machine order.** It sits on the `USER_REVIEW (approve) → FINAL_OUTPUT` edge and runs before 11 whenever `handoff_required` is true.

## Inputs

Whatever each state's contract names — always files in [`artifacts/`](../artifacts/) or [`reference/`](../reference/), plus `machine_state`, plus the raw brief in STATE 01's case.

**Skills never read each other's internals.** If STATE 06 needs something STATE 05 knows, it reads `flows-<feature>.md`.

## Outputs

One artifact per state, written to [`artifacts/`](../artifacts/) with conforming frontmatter. Plus, for STATE 06, the colour allowlist written into `toolkit.config.json`; and for STATE 11, the terminal record in `state/machine_state.yaml`.

## The anatomy of a `SKILL.md`

Every one has the same eight sections, and the second half is the part that matters:

| Section | What it carries |
|---|---|
| **Contract** | Reads · Writes · Depends on · Approval gate · Retry ceiling · Next states |
| **Purpose** | The single decision this state owns |
| **Processing steps** | *What* to do |
| **Hardened method** | *How* — each rule written by a defect that shipped, with a citable code |
| **Output** | The exact frontmatter and body shape |
| **Validation rules** | `V1`–`V4` from the spec; `V5+` project-hardened |
| **Exit conditions / Failure recovery** | What must hold to leave, and where to go when it does not |
| **Recorded failure modes** | The evidence for the hardened method |

The `README.md` beside it is a one-screen orientation: the contract table, plus **the single rule that matters most in that state**.

## Examples

**Invoking a state.** One state per request. The agent does that state and stops.

```
Run STATE 04 ux-planning from skills/04-ux-planning/SKILL.md.
Read artifacts/requirements-checkout.md, artifacts/research-checkout.md
and artifacts/product-review-checkout.md.
Write artifacts/ux-plan-checkout.md.
```

**Checking a contract before you run.** Open the skill's `README.md` — the contract table tells you whether the inputs exist and whether an upstream gate is still `pending`.

**Citing a rule from a log:**

```markdown
Deep-link hooks added for all 6 states per B2; recorded in traceability-checkout.md.
Superseded card component stripped per B7 — 4 selectors, 2 string keys, 1 handler.
```

## Best practices

- **Run one state per request.** The stopping places are the point. A skill that runs ahead removes the checkpoint where you would have caught the problem cheaply.
- **Do not work around a missing input.** A missing artifact is a **back-transition** to the state that owed it. "The spec does not say" is a routing signal, not a licence to invent.
- **Read the Recorded failure modes before running a state for the first time.** They are short, and each one is a defect you would otherwise reproduce.
- **A `V5+` rule is not optional.** `V1`–`V4` are the specification; `V5+` exist because a defect passed `V1`–`V4`.
- **Never edit a skill to make a rule easier.** If a rule is wrong, the fix is a new recorded defect and a spec change — in that order.
- **Keep skills stateless.** If a skill starts wanting to remember something between runs, that is machine state, and it belongs in `state/machine_state.yaml`.
- **The description frontmatter matters.** It is what makes a skill discoverable by an agent. Keep it specific about *when* to use the skill, not just what it does.

## Related

- [`WORKFLOW_GUIDE.md`](../WORKFLOW_GUIDE.md) — all twelve states with durations, common mistakes and cross-references
- [`docs/workflow.md`](../docs/workflow.md) — the specification each skill implements
- [`docs/method-rules.md`](../docs/method-rules.md) — every hardened rule, indexed by code
- [`ARTIFACT_FLOW.md`](../ARTIFACT_FLOW.md) — what each skill's output is and who consumes it
