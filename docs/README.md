# `docs/` — the specification layer

[← Repository root](../README.md) · [Architecture](../ARCHITECTURE.md) · [Workflow Guide](../WORKFLOW_GUIDE.md)

---

## Purpose

Three documents that define what the toolkit **is**, as opposed to how to use it. Everything else in the repository implements or explains what is written here.

| File | What it defines | Authority |
|---|---|---|
| [`workflow.md`](workflow.md) | The state machine: twelve states, transitions, guards, gates, retry logic, loop logic, completion rules, skill decomposition. | **Source of truth.** Where a skill and this document disagree, the document wins and the skill is the bug. |
| [`method-rules.md`](method-rules.md) | Every project-hardened rule, indexed by the code you cite it as, with the class of failure that produced it. | The catalogue. Each skill carries the full statement of its own set; this file is the index across all of them. |
| [`artifact-contracts.md`](artifact-contracts.md) | The artifact store: what exists, who owns it, the naming scheme, the load-bearing frontmatter fields, gate records, validation shape. | The data contract every skill writes to. |
| [`rule-candidates.md`](rule-candidates.md) | Observations seen exactly once, waiting for an independent recurrence before they can be hardened. | **Not enforced.** Nothing here is cited, checked, or allowed to block. It exists so a second occurrence is recognisable as a second one. |

## Inputs

None. These documents are the root of the dependency graph. They are edited by hand, deliberately, and every other document in the repository defers to them.

## Outputs

Nothing at runtime. Their output is **authority**: a rule cited by code, a transition that can be checked against a table, a frontmatter field a downstream state can rely on.

## Examples

**Citing a rule in a plan or a log.** Rules are referenced by code, not by paraphrase:

```markdown
Dispatched to `UI_PLANNING` per R3 (root cause is where the fault was introduced).
Class swept per R2: 138 instances across 7 flows.
Return edge passes through SELF_AUDIT per R6.
```

**Resolving a disagreement between a skill and the spec.** A skill's `SKILL.md` opens with the line that settles it:

```markdown
> Source of truth: ../../docs/workflow.md §STATE 07.
```

**Looking up which document answers a question:**

| Question | Document |
|---|---|
| What transition fires when the audit verdict is `fail`? | [`workflow.md` §3](workflow.md) |
| What does `C_NAVMAP_CLEAN` mean? | [`workflow.md` §4](workflow.md) |
| What is the ceiling on `L_REVISION`, and what happens on breach? | [`workflow.md` §7](workflow.md) |
| Why does the audit look at screenshots? | [`method-rules.md`](method-rules.md) → **M2** |
| I found something once — is it a rule? | [`rule-candidates.md`](rule-candidates.md) → the bar for promotion |
| Why must `reads_versions` be in frontmatter? | [`artifact-contracts.md`](artifact-contracts.md) |
| Which fields does a gate record have to carry? | [`artifact-contracts.md`](artifact-contracts.md) → Gate records |

## Best practices

- **Read `workflow.md` before deciding a step is optional.** The cheap version of each step is exactly the version that failed.
- **Cite rules by code.** `R2` is checkable against a catalogue; "route the class" is a paraphrase that drifts.
- **When a skill and the spec disagree, fix the skill.** Editing the spec to match a skill inverts the authority relationship, and then nothing is the source of truth.
- **A new project-hardened rule belongs in three places**: the owning skill's hardened method section, the skill's Recorded failure modes, and this catalogue. All three, in the same edit.
- **State a rule as a class, never as an anecdote.** "One product's checkout screen did X" is a story. "A view that never receives its active class passes structural assertions while painting nothing" is a rule.
- **Do not add operating guidance here.** Durations, common mistakes and worked examples belong in [`WORKFLOW_GUIDE.md`](../WORKFLOW_GUIDE.md). This layer stays specification.

## Related

- [`ARCHITECTURE.md`](../ARCHITECTURE.md) — how the specification is realised in folders and tools
- [`WORKFLOW_GUIDE.md`](../WORKFLOW_GUIDE.md) — the operating layer over `workflow.md`
- [`ARTIFACT_FLOW.md`](../ARTIFACT_FLOW.md) — the operating layer over `artifact-contracts.md`
- [`DESIGN_PRINCIPLES.md`](../DESIGN_PRINCIPLES.md) — why the rules in `method-rules.md` take the shape they do
