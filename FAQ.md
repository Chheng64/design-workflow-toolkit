# FAQ

The questions people actually ask, with the answers the documentation backs.

[← README](README.md) · [Start Here](START_HERE.md) · [Workflow Guide](WORKFLOW_GUIDE.md)

---

## Contents

- [Do I have to run all twelve states?](#do-i-have-to-run-all-twelve-states)
- [Does this only work with Claude?](#does-this-only-work-with-claude)
- [Does the agent design the product, or do I?](#does-the-agent-design-the-product-or-do-i)
- [How long does a feature take?](#how-long-does-a-feature-take)
- [What if the audit reports dozens of failures?](#what-if-the-audit-reports-dozens-of-failures)
- [What happens when a revision loop hits its ceiling?](#what-happens-when-a-revision-loop-hits-its-ceiling)
- [Can I use my own design system?](#can-i-use-my-own-design-system)
- [Is Figma required?](#is-figma-required)
- [Where do I put my product's screens, routes and states?](#where-do-i-put-my-products-screens-routes-and-states)
- [Why is there exactly one example?](#why-is-there-exactly-one-example)

---

## Do I have to run all twelve states?

Two are legitimately skippable. **STATE 12** is skipped when the work is not going to a build team — set `handoff_required: false`. **STATE 02** may be waived per goal when a goal is explicitly marked `no-research-needed`; that is per goal, not wholesale.

You cannot skip STATE 08 before STATE 09, or STATE 09 before STATE 11. The audit exists so the user never debugs; the gate exists so the machine never ships on its own authority.

## Does this only work with Claude?

The skills are written as Claude Skills and that is the smoothest path, but nothing in the contracts is vendor-specific. A state is a document that says what to read, what to write, what must be true on exit and what to do on failure. Any agent that can read files, write files and run Node can execute one. The validators are plain Node and know nothing about any model.

## Does the agent design the product, or do I?

You rule; it produces and proves. The two decisions the machine is structurally forbidden from making are the product direction (Direction Approval Gate, STATE 03) and the decision to ship (Primary User Approval Gate, STATE 09). Between those, the machine does the work and shows its evidence. An unruled question is carried forward as an open decision (`o-<id>`), never defaulted at build time.

## How long does a feature take?

Agent time is dominated by STATE 07 and STATE 08; human time is dominated by the two gates. A small feature — one flow, five to eight screens — is typically a working session plus two review passes. See the per-state indicative durations in [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md). Treat them as planning aids, not commitments.

## What if the audit reports dozens of failures?

Assume the instrument first. On the extraction run, one audit opened at 60 failures with 3 real, and one state probe reported 37 failures of which every single one was the harness. The known false-positive classes are catalogued in [`skills/08-self-audit/SKILL.md`](skills/08-self-audit/SKILL.md#b-harness-false-positives) — scroll rails read as overflow, `#feed` read as a colour, harness chrome read as off-palette, deliberate crops, timing flakes. Confirm at source, correct the harness, re-run. Never waive, never report unconfirmed.

## What happens when a revision loop hits its ceiling?

`HALT_BLOCKED`, with an escalation summary of unresolved items — never a fourth unbounded cycle. The state is fully persisted and resumable. The ceiling resets only by explicit user authorisation, recorded in the revision log. This is a working outcome, not a crash.

## Can I use my own design system?

That is the intended path. Name it in `toolkit.config.json` → `designSystem.sourceId`, **by source id**. STATE 06 maps components to your primitives reuse-first and raises an Extension Note for genuine gaps. The rule exists because a plan built on the wrong design system validates perfectly against it — one such mix-up survived four revision cycles and reached `HALT_BLOCKED` before anyone spotted the tell.

## Is Figma required?

Only for STATE 12, and only when `handoff_required` is true. The navigation graph, the state graphs, the annotations and the reports are all produced by local tools and are readable without Figma. The Figma layer is where those derivations get drawn for a build team.

## Where do I put my product's screens, routes and states?

[`reference/screen-registry.csv`](reference/README.md). It is the spine: `tools/navgraph.mjs` derives the entire navigation model from its cells. Rows are added as flows are designed, not up front — but the columns are fixed. Two separators, not interchangeable: `states` is comma-separated, `entry_from` and `navigates_to` are pipe-separated.

## Why is there exactly one example?

Because it is ours. [`examples/signin/`](examples/signin/README.md) is this repository running its own pipeline on its own product — all twelve states, all seven validators, three human gates, one revision cycle, zero waivers. Shipping another product's artifacts as examples invites the exact failure STATE 06 records first — a plan built on a borrowed source validates perfectly against it. Run the pipeline once on a small feature of **your** product and keep that feature's artifacts as your reference set; [`examples/README.md`](examples/README.md) explains how.

---

[← README](README.md) · [Start Here](START_HERE.md) · [Workflow Guide](WORKFLOW_GUIDE.md) · [Glossary](GLOSSARY.md)
