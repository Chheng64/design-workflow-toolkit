# Contributing

Contributions that improve documentation, add a validator, or harden a rule with a recorded defect are welcome.

[← README](README.md) · [Spec](docs/workflow.md) · [Method rules](docs/method-rules.md) · [Design principles](DESIGN_PRINCIPLES.md)

---

## Contents

- [The two conventions](#the-two-conventions)
- [Before you start](#before-you-start)
- [What kind of contribution is this?](#what-kind-of-contribution-is-this)
- [Contributing a hardened rule](#contributing-a-hardened-rule)
- [Contributing a validator](#contributing-a-validator)
- [Contributing to a skill](#contributing-to-a-skill)
- [Contributing documentation](#contributing-documentation)
- [Changing the specification](#changing-the-specification)
- [Pull request checklist](#pull-request-checklist)
- [Style](#style)
- [What will be declined](#what-will-be-declined)

---

## The two conventions

Everything else follows from these.

### 1 · `docs/workflow.md` is the source of truth

Where a skill and that document disagree, **the document wins and the skill is the bug**. Fixing the disagreement by editing the specification to match a skill inverts the authority relationship, and then nothing is the source of truth.

### 2 · A new project-hardened rule names the defect that produced it

Rules in this repository are not opinions. They are recorded failures, stated as a **class**, with a citable code, indexed in [`docs/method-rules.md`](docs/method-rules.md).

> "One product's checkout screen broke" is a story.
> "A view that never receives its active class passes structural assertions while painting nothing" is a rule.

A proposed rule that cannot name what it prevents does not belong here — however sensible it sounds.

---

## Before you start

```bash
node --version     # must be ≥ 22 — the tools use global fetch and WebSocket
python3 --version  # 3.x, for the review server
```

There is no `npm install`. [`tools/`](tools/) has **zero dependencies**, deliberately: a verification layer that rots because of a transitive dependency is not a verification layer. A pull request that adds a runtime dependency to `tools/` needs to argue for it explicitly.

Read these three before your first contribution:

| Document | Why |
|---|---|
| [`docs/workflow.md`](docs/workflow.md) | The specification everything defers to. |
| [`docs/method-rules.md`](docs/method-rules.md) | Every existing rule, and the shape a new one has to match. |
| [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) | Why the rules take the form they do. |

---

## What kind of contribution is this?

| You want to… | Go to |
|---|---|
| Report a defect that got past a green check | [Contributing a hardened rule](#contributing-a-hardened-rule) — open a **rule report** issue first |
| Add or improve a check | [Contributing a validator](#contributing-a-validator) |
| Improve a state's contract or method | [Contributing to a skill](#contributing-to-a-skill) |
| Fix or extend documentation | [Contributing documentation](#contributing-documentation) |
| Change a state, transition, guard, gate or ceiling | [Changing the specification](#changing-the-specification) — open an issue first, always |
| Report something exploitable | [`SECURITY.md`](SECURITY.md) — not a public issue |

---

## Contributing a hardened rule

This is the highest-value contribution to this repository, and the one with the strictest bar.

### The bar

A rule is accepted when all five hold:

1. **A real defect produced it**, and the defect got past an existing check. A rule that prevents something no check ever missed is guidance, not a hardened rule.
2. **It is stated as a class**, not as an incident. Name the shape of the failure, not the product it happened in.
3. **It names the state that owns it.** The state where the fault is *introduced*, not where it is visible — see [principle 11](DESIGN_PRINCIPLES.md#11--route-the-class-not-the-instance).
4. **It is evidenced by something checkable.** A rule is satisfied by the evidence named in a validation rule, never by understanding it.
5. **It gets a code** in the owning state's namespace — `B`, `M`, `G`, `R`, `P`, `W`, `E`, `F` — continuing that namespace's numbering.

### Where it goes — three places, one edit

| Place | What goes there |
|---|---|
| `skills/NN-name/SKILL.md` → hardened method section | The full statement of the rule, with its code and the defect that produced it. |
| `skills/NN-name/SKILL.md` → Recorded failure modes | A row: what happened, and the rule it produced. This is the *evidence* for the method section. |
| [`docs/method-rules.md`](docs/method-rules.md) | The index row: code, the rule in one line, the class of failure that produced it. |

If the rule also adds a machine-checkable condition, it becomes a **`V5+`** rule in the same skill. `V1`–`V4` come from the specification and hold for every product; `V5+` exist precisely because a defect passed `V1`–`V4`.

### The check-gap case

If the defect passed a **green check**, the root cause is two things, and it needs two dispatches:

- the artifact state that produced the defect, **and**
- `SELF_AUDIT`, for the missing permanent rule.

Fixing only the first leaves the class open. This is a recorded failure in its own right — on the extraction run, invented colours passed a green audit because the audit checked design-system *presence* and never non-DS *absence*.

### Template

```markdown
### <CODE> — <the rule, in one imperative line>

<What the rule requires, in two or three sentences.>

**Written by:** <the class of failure. State the mechanism — why the defect is
invisible to the checks that already exist — not the product it occurred in.>

**Evidenced by:** <the validation rule, tool finding code, or artifact field that
makes this checkable rather than assertable.>
```

---

## Contributing a validator

### The bar

A tool in [`tools/`](tools/) must:

| Requirement | Why |
|---|---|
| Accept `--root <dir>` | So it can run against any project. Root resolution order is `--root` → `$TOOLKIT_ROOT` → nearest ancestor containing `toolkit.config.json` → cwd. |
| Read all configuration through [`tools/config.mjs`](tools/config.mjs) | **No product-specific value lives in a tool.** A hardcoded value is how a toolkit fossilises around its first product. |
| Use the shared `SEVERITIES` ladder | `blocking` → `major` → `advisory`, with `--fail-on` naming the lowest failing rung. |
| Distinguish exit `1` from exit `2` | `1` = findings. `2` = the check **did not run**, which is unevaluable, not passing. Conflating them is the defect. |
| Write both a JSON output and a human-readable one | The JSON is what the next tool reads; the markdown is what a person reads at a gate. |
| Add zero dependencies | Node ≥22 built-ins only. |
| Support `--quiet` | The exit code still holds. |

### The method bar

Two rules bind every check, and both were written by real runs:

- **Rendering-class only.** Computed visibility and measured geometry, never DOM presence. A node can exist, lay out, and accept a programmatic click while painting nothing — 84 of 84 DOM assertions once passed against a screen that displayed nothing.
- **A failing probe is a hypothesis.** If your tool can produce a false positive class, **document it** in [`VALIDATION_ENGINE.md § 10`](VALIDATION_ENGINE.md#10--the-false-positive-catalogue). One audit's first run reported 60 failures with 3 real; one state probe reported 37 and every one was the harness.

### Where it goes

1. `tools/<name>.mjs` — the tool.
2. `tools/README.md` — the table row and an example invocation.
3. `VALIDATION_ENGINE.md` — a full section: what it checks, why it matters, usage, typical output, common failures and fixes.
4. The owning skill's exit conditions, if the tool gates a state.
5. `toolkit.config.json` and `tools/config.schema.json`, if it needs a new configuration key.

---

## Contributing to a skill

A skill is a **state with a typed contract**, not a prompt. Roughly half of every `SKILL.md` is validation rules, exit conditions, failure recovery and recorded failure modes — that half is the product.

### Rules

- **Keep skills stateless.** If a skill starts wanting to remember something between runs, that is machine state and it belongs in `state/machine_state.yaml`, held by the orchestrator.
- **Keep the artifact-store boundary.** A skill reads and writes named files. It never reaches into another skill's internals, and it never receives context that is not in a file.
- **Do not weaken a rule to reduce friction.** A rule that fires too often is either a real signal or a badly-specified rule. The fix is to specify it better, or to correct the instrument — never to lower the bar.
- **Keep both files in sync.** `SKILL.md` is the contract; `README.md` beside it is the one-screen orientation — the contract table plus the single rule that matters most in that state.
- **The `description` frontmatter is load-bearing.** It is what makes a skill discoverable by an agent. Say *when* to use it, not just what it does.

---

## Contributing documentation

Documentation changes are welcome and do not need an issue first.

### Before opening the pull request

```bash
# every relative link and in-document anchor must resolve
node tools/linkcheck.mjs      # if present; otherwise check manually
```

At the time of writing there is no committed link checker — [`DOCS_AUDIT.md`](DOCS_AUDIT.md) recommends adding one. If you add it, it takes the same contract as every other tool in `tools/`.

### Conventions

| Convention | Detail |
|---|---|
| **Terminology** | Use the terms in [`GLOSSARY.md`](GLOSSARY.md). It also lists the words we deliberately do not use, and why. |
| **Navigation** | Header nav, footer nav, and a table of contents on anything over ~200 lines. Breadcrumbs on folder and skill documents. |
| **Diagrams** | Mermaid, following the colour conventions in [`DIAGRAMS.md`](DIAGRAMS.md#diagram-conventions). Blue = control, green = verification, yellow = human decision, purple = terminal output, red = failure, grey = loop. |
| **Numbers** | Every number in this documentation is real and traceable to the extraction run. Do not add an illustrative one. If a number is corrected, correct **every** occurrence — `grep` finds them. |
| **Links to seeded files** | Never link to `reference/<file>`; those do not exist until a user copies them in. Link to `templates/<file>` or `reference/README.md`. |

---

## Changing the specification

Changes to [`docs/workflow.md`](docs/workflow.md) — a state, a transition, a guard, a gate, a loop ceiling, a completion rule — **always need an issue first**.

The bar is the same as for a rule: **name the defect**. A principle that a real defect contradicts *should* change; the requirement is that the change names the defect the same way every rule here does.

A specification change is not complete until:

1. `docs/workflow.md` states the new behaviour.
2. Every affected `SKILL.md` matches it.
3. Every affected `README.md` and root document matches it.
4. [`docs/method-rules.md`](docs/method-rules.md) carries the rule, if one was added.
5. The diagrams in [`DIAGRAMS.md`](DIAGRAMS.md) and the documents that embed them are updated.

---

## Pull request checklist

Copy this into your pull request description. The template does it for you.

- [ ] **Does this change a rule, a state, a transition, a gate, or a ceiling?** If yes — which defect produced the change, and was an issue opened first?
- [ ] **Does `docs/workflow.md` still win?** No skill contradicts it.
- [ ] **If a rule was added:** it is in all three places — the skill's method section, the skill's recorded failure modes, and `docs/method-rules.md` — with a code.
- [ ] **If a tool was added or changed:** `--root`, config via `config.mjs`, shared severities, `1` vs `2` distinguished, JSON **and** human output, zero new dependencies.
- [ ] **If a false-positive class is possible:** it is documented in `VALIDATION_ENGINE.md § 10`.
- [ ] **Terminology matches `GLOSSARY.md`.**
- [ ] **Every relative link resolves**, and no link points at a `reference/` file that only exists after seeding.
- [ ] **No number was invented.** Every figure traces to a recorded run.
- [ ] **Documentation updated** in the same pull request, not "in a follow-up".

---

## Style

**Prose.** Professional technical writing. No marketing language, no AI buzzwords. Say what a thing does and what it prevents. The five audiences are product designers, UX designers, product managers, developers and founders — write for all five, and assume none of them wants to be impressed.

**Commit messages.** Conventional Commits. Subject ≤ 50 characters, imperative mood. A body only when the *why* is not obvious from the diff.

```
feat(tools): add contrast probe for gradient backgrounds
fix(skills/07): correct B7 supersession example
docs: add breadcrumbs to skill READMEs
```

**Code.** Match the surrounding file. `tools/` is plain ES modules with a header comment stating what the tool answers and which method rules it carries. Keep that header — it is how a reader knows why a check exists.

---

## What will be declined

Stated plainly so nobody spends an evening on one.

| Contribution | Why |
|---|---|
| A rule with no recorded defect | It is guidance, not a hardened rule. There are other places for guidance. |
| Weakening a validator to reduce noise | The fix is a better specification or a corrected instrument. |
| Removing a `V1`–`V4` rule | Those come from the specification. A pack or a fork may *add* `V5+`; nothing removes `V1`–`V4`. |
| A machine-granted approval, of any kind | Two of the five gates exist specifically because the machine cannot be trusted to grant them. |
| A runtime dependency in `tools/` | Unless the argument is very good. Zero is the design. |
| A proprietary or binary artifact format | Artifacts stay markdown, JSON, CSV, YAML and HTML. Portability is a principle. |
| Renumbering skills to machine order | `12` is authoring order and the skill says so. Renumbering breaks every citation in every existing plan, log and gate record. |
| An example borrowed from another product | It is the exact failure `skills/06` records first: a plan built on the wrong source validates perfectly against it. |
| A vendor-specific model dependency | The states are contracts. Any agent that can read files, write files and run Node executes them. |

---

## Code of conduct

By participating you agree to uphold [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

---

[← README](README.md) · [Spec](docs/workflow.md) · [Method rules](docs/method-rules.md) · [Validation engine](VALIDATION_ENGINE.md) · [Glossary](GLOSSARY.md)
