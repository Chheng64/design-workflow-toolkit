# Rule candidates — the waiting room

[← docs/](README.md) · [Repository root](../README.md) · [Method rules →](method-rules.md) · [Contributing →](../CONTRIBUTING.md#contributing-a-hardened-rule)

---

## What this file is

Observations that **look** like hardened rules and have not earned it yet.

[Principle 5](../DESIGN_PRINCIPLES.md#5--every-defect-becomes-a-rule) says every defect becomes a rule. It does not say every defect becomes a rule *immediately*, and the difference is the whole reason this file exists. A rule is a claim about a **class** of failure. One occurrence is an anecdote about one run — it may be the first sighting of a real class, or it may be a local quirk that never recurs. There is no way to tell from inside the run that produced it.

So a single observation goes here, and it waits.

## Why a waiting room rather than a decision

Both ways of resolving a single observation immediately are wrong, and they fail in opposite directions.

| If you harden it on sight | If you discard it |
|---|---|
| The catalogue fills with rules written by one incident each. Every one costs a reader's attention on every run, and the ones that matter get read at the same weight as the ones that never recur. A rule nobody can afford to read is not enforced. | The second occurrence arrives months later with nothing recorded to match it against, and it reads as a first occurrence too. The class stays invisible for as long as nobody remembers the first one. |

The register is how a first sighting survives without being promoted. Recording is cheap; enforcing is not.

## The bar for promotion

A candidate becomes a hardened rule when **all five conditions in [CONTRIBUTING](../CONTRIBUTING.md#the-bar) hold**, plus one that applies only to candidates:

> **6 · It has recurred independently.** The same class of failure has appeared at least twice, in circumstances that did not share a cause with the first.

**Independently** means one of these — not merely a second instance:

- a **different project**, or
- a **different author**, or
- a **different state** of the same project, reached without knowledge of the first occurrence.

Two instances in one sweep of one file are **one** occurrence. So are two instances that a single fix removes. The question the sixth condition asks is not *how many times did I see this*, it is *would this have happened to someone who had never seen the first one*.

## What a candidate is not

Stated explicitly, because the failure mode here is a candidate quietly acquiring the authority of a rule.

- **It has no rule code**, and never gets one until promotion. `RC-n` is a register index, not a namespace in `B` / `F` / `M` / `G` / `R` / `P` / `W` / `E`.
- **It is not cited** in a plan, a revision log, an audit report or a gate record. Citing a candidate is how it becomes a de facto rule without passing the bar.
- **No tool checks it**, and no validation rule references it.
- **It does not block anything.** A candidate never produces a finding, a waiver or a debt item.

A candidate is a note to a future maintainer. That is its entire authority.

## Register

| # | Observation | First seen | Recurrences | Status |
|---|---|---|---|---|
| **RC-1** | Do not write the name of the thing you are claiming not to use, inside the file being swept for it. | `examples/signin`, STATE 12 | **0** | monitoring |

---

### RC-1 · A disclaimer inside a swept file is indistinguishable from the thing it disclaims

**Observation.** A source comment that states *"this prototype makes no network calls"* and then names the APIs it is not using — `fetch`, `XMLHttpRequest`, `WebSocket` — is matched by the sweep that looks for those names. The claim and its counter-evidence are the same bytes.

**First seen.** [`examples/signin`](../examples/signin/README.md), at STATE 12. `tools/annotate.mjs` raised a blocking `E11` for a network call site at `signin.html:262`. Confirmed at source: line 262 was the comment asserting there were no network calls. The sweep is deliberately broad — see [`annotate.mjs`](../tools/annotate.mjs) `NETWORK_RE` — and narrowing it to dodge comments would weaken a check that exists precisely because a claim about network behaviour must be re-derived rather than trusted.

**Why it might be a class.** The general shape is *a file that describes its own contents, inside the scope being scanned for those contents*. Nothing about it is specific to network APIs. The same shape would apply to a comment listing banned colours in a file swept for hex values, or naming a deprecated component in a file swept for that component.

**Why it is not a rule yet.** One occurrence, in one file, written by one author, removed by one edit. Every part of it could be local. Manufacturing a second instance to justify the rule would be the thing this method exists to prevent — a rule needs a defect that happened, not a defect that was arranged.

**What would promote it.** A second occurrence in a different project, or by a different author, where a descriptive comment trips a source sweep and the first occurrence played no part in it. On promotion the likely owner is [`skills/07-prototype`](../skills/07-prototype/SKILL.md) — the state that writes the file — with the statement generalised past network APIs.

**Workaround in the meantime.** The claim belongs in the traceability record, which is the artifact that exists to carry claims about the build, and which nothing sweeps for API names.

---

## Reviewing this file

Review the register whenever a run closes at `FINAL_OUTPUT`. Three outcomes:

| Outcome | Action |
|---|---|
| The class recurred independently | Promote it. Follow [Contributing a hardened rule](../CONTRIBUTING.md#contributing-a-hardened-rule) — three places, one edit — and replace the row here with a link to the code it became. |
| It did not recur, and the observation still looks plausible | Leave it. A candidate does not expire on a schedule; a class that recurs once every two years is still a class. |
| It did not recur, and the mechanism turned out to be wrong | **Retire it**, with the reason written into the row. A retired candidate stays in the file — deleting it loses the record that the question was asked and answered. |

Recording a candidate that never recurs costs one table row. Missing the second occurrence of a real class costs the run it happens in.

---

[← docs/](README.md) · [Method rules →](method-rules.md) · [Design principles →](../DESIGN_PRINCIPLES.md) · [Contributing →](../CONTRIBUTING.md)
