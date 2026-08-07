# Design Toolkit

A **product-agnostic design pipeline**: twelve Claude Skills, a state machine that
orders them, machine-checkable validation rules, and the tooling that proves the
output rather than asserting it.

Point it at a product brief. It takes you from an ambiguous request to a frozen,
approved, developer-navigable deliverable — with a human gate where a human gate
belongs and nowhere else.

> This is **operating documentation, not an execution trigger.** Run a state only
> when a request explicitly asks for that work. Absent a task, treat this repo as
> the operating manual.

## Why this shape

Every rule in here was written by a defect. The pipeline was extracted from a full
product design run — 11 flows, 48 screens, 4 shipped deliverables — and each
"project-hardened" rule in a skill is a defect that got past a green check on that
run. The catalogue is [`docs/method-rules.md`](docs/method-rules.md). Read it before
deciding a step is optional; the cheap version of each step is exactly the version
that failed.

Three of them, stated once, because they shape everything else:

- **A DOM assertion suite is not a substitute for looking at the render.** 84/84
  assertions passed against a screen that displayed nothing.
- **A failing probe is a hypothesis, not a finding.** One audit's first run
  reported 60 failures; 57 were the harness.
- **An approval is scoped to the bytes it saw.** A gate that cannot name its
  sha256 cannot be shipped from.

## Layout

```
design-toolkit/
├── toolkit.config.json     # the ONLY file a new product must edit to start
├── docs/
│   ├── workflow.md         # the state machine — source of truth
│   ├── method-rules.md     # every hardened rule, indexed by code
│   └── artifact-contracts.md
├── skills/                 # one folder per state → one Claude Skill
│   ├── 01-requirement-analysis/ … 11-final-output/
│   └── 12-flow-visualization/     # navigation map + Developer Handoff Gate
├── templates/              # empty artifact + reference file templates
│   └── prototype/          # run-local.sh · serve.py · play.html (the review player)
├── tools/                  # config-driven validators and harnesses (Node ≥22)
├── artifacts/              # runtime artifact store — pipeline output lands here
├── reference/              # this product's registry, lanes, vocabulary, DS refs
├── state/                  # machine_state.yaml — resumable run state
└── examples/               # (empty) worked artifacts, if you keep any
```

## The pipeline

```
requirement-analysis → research → product-review → ux-planning → flow-generation
  → ui-planning → prototype → self-audit → user-review → [flow-visualization] → final-output
```

`flow-visualization` runs only when `handoff_required` — the work is going to a
build team. Everything else is unconditional. `revision` is not in the line: it is
the loop that routes failures back to the state that caused them.

| Gate | Where | Blocks |
|---|---|---|
| Clarification | 01 | leaving with unresolved blocking ambiguity |
| **Direction Approval** | 03 → 04 | spending design effort on an unapproved direction |
| **Primary User Approval** | 09 → 11 | shipping an unapproved deliverable |
| Conflict Mini-Gate | 10 | dispatching contradictory change requests |
| **Developer Handoff** | 12 → 11 | shipping a design a build team cannot navigate |

Gates are granted by the user, never by the machine, and revert to `pending` the
moment approved artifacts change.

## Start a product

```bash
# 1. edit toolkit.config.json — name, slug, viewport, design system source id
# 2. seed the reference files
cp templates/screen-registry.csv  reference/screen-registry.csv
cp templates/nav-lanes.json       reference/nav-lanes.json
cp templates/state-vocabulary.md  reference/state-vocabulary.md
cp templates/machine_state.yaml   state/machine_state.yaml
# 3. run STATE 01 against the brief
```

Full walkthrough: [`GETTING-STARTED.md`](GETTING-STARTED.md).

## Tools

All read `toolkit.config.json`; none contains a product-specific value. Node ≥22,
zero dependencies. Every validator exits `0` clean / `1` findings / `2` tool error,
so "the map matches the registry" is a check rather than a claim.

| Tool | State | Answers |
|---|---|---|
| `tools/navgraph.mjs` | 12 | which screen leads to which screen — derived from the registry |
| `tools/stategraph.mjs` | 12 | within a screen, which states exist and what moves between them |
| `tools/stateprobe.mjs` | 12 | does each state's hook actually **paint** |
| `tools/annotate.mjs` | 12 | per edge: nav kind, motion, API call, guard — each with a citation |
| `tools/audit.mjs` | 08 | the rendering-class audit: paint, targets, overflow, contrast, script fonts, source sweeps |
| `tools/smoke.mjs` | 07 | build-time: does this view paint, any console errors, any target under the floor |
| `tools/cdp.mjs` | — | headless Chrome driver (no dependencies) |

```bash
node tools/navgraph.mjs --fail-on major
node tools/audit.mjs --shots artifacts/shots
```

## The rule that makes it composable

Skills communicate **only** through the artifact store (`artifacts/`), never
directly. A skill's contract is its Reads and Writes. The orchestrator — not a
skill — holds `machine_state`, evaluates guards, fires transitions, enforces gates
and loop ceilings, and persists state after every transition.
