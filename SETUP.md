# Setup — pointing the toolkit at a real product

[← README](README.md) · [Start Here](START_HERE.md) · [Workflow Guide →](WORKFLOW_GUIDE.md) · [Validation Engine →](VALIDATION_ENGINE.md)

Ten minutes of setup, then the pipeline runs itself one state at a time.

> **New to the toolkit?** [`START_HERE.md`](START_HERE.md) assumes zero knowledge and walks a complete first project in under thirty minutes. This page is the field guide for pointing the toolkit at a **real** product with a real design system.

## 0. Prerequisites

- **Node ≥22** (the tools use global `fetch`/`WebSocket`; no npm install, no dependencies)
- **Python 3** (the Run Local server)
- **Chrome** — path in `toolkit.config.json` → `audit.chrome`, or `$TOOLKIT_CHROME`
- Figma MCP access, only if `handoff_required` and STATE 12 is in scope

## 1. Configure the product

Edit [`toolkit.config.json`](toolkit.config.json). This is the only file you must
edit before starting. Fields that actually change behaviour:

| Field | Why it matters |
|---|---|
| `product.slug` | names the Chrome profile and the artifact ids |
| `product.viewport` | the capture and review viewport — every screenshot and geometry probe |
| `product.locales` | how many locale objects a duplicate-key sweep expects |
| `product.scripts` | every writing system the product renders. Empty = the per-glyph font check is off, and a product that renders a non-Latin script with this empty ships the wrong-font-stack class blind |
| `designSystem.sourceId` | **name the DS by source id.** A plan built on the wrong design system validates perfectly against it — that failure cost three revision cycles and a `HALT_BLOCKED` |
| `audit.tapTargetFloorPx` | the number STATE 04 commits to and STATE 08 checks. Set it to what you will actually build |
| `audit.colorAllowlist` | written by STATE 06, enforced by STATE 08. Empty = palette enforcement off |

## 2. Seed the reference files

```bash
cp templates/screen-registry.csv reference/screen-registry.csv
cp templates/nav-lanes.json      reference/nav-lanes.json
cp templates/state-vocabulary.md reference/state-vocabulary.md
cp templates/machine_state.yaml  state/machine_state.yaml
```

The registry is the spine. Screens are added to it as flows are designed, not
up front — but the *columns* are fixed, because `tools/navgraph.mjs` derives the
entire navigation model from them.

## 3. Run the pipeline

One state per request. Each skill writes its artifact and stops; the orchestrator
(you, or an agent holding `machine_state`) evaluates the guard and fires the next
transition.

```
01 requirement-analysis   brief            → artifacts/requirements-<feature>.md
02 research               requirements     → artifacts/research-<feature>.md
03 product-review         + research       → artifacts/product-review-<feature>.md   ⟨Direction Gate⟩
04 ux-planning            + review         → artifacts/ux-plan-<feature>.md
05 flow-generation        ux-plan          → artifacts/flows-<feature>.md
06 ui-planning            flows + DS       → artifacts/ui-plan-<feature>.md
07 prototype              ui-plan          → artifacts/prototype/ + traceability-<feature>.md
08 self-audit             prototype        → artifacts/audit-report-<feature>.md
09 user-review            + audit          → artifacts/review-record-<feature>.md    ⟨Primary Gate⟩
12 flow-visualization     registry + flows → artifacts/navgraph.json + navmap-report.md ⟨Handoff Gate⟩
11 final-output           approved set     → artifacts/deliverable-<feature>/
10 revision               (loop)           → artifacts/revision-log-<feature>.md
```

Per-feature file naming (`flows-checkout.md`) is the convention. The contract is
identical either way.

## 4. Stand up Run Local before the first review

STATE 07 copies the player into the prototype directory:

```bash
cp templates/prototype/{run-local.sh,serve.py,play.html} artifacts/prototype/
chmod +x artifacts/prototype/run-local.sh
```

Then register every page you build in `play.html`'s `FEATURES` array — **in the
same edit that creates the page**. A flow missing from the sidebar is a flow the
user does not review.

```bash
artifacts/prototype/run-local.sh          # → http://localhost:8765/play.html
```

Live reload is active only while `state/machine_state.yaml`'s top-level
`current_state` is `USER_REVIEW`. Outside review the same server serves plain
pages — check the state file before calling reload broken.

## 4b. The harness contract

Every harness reads the prototype the same way, through `toolkit.config.json` →
`prototype`. Build to it, or change it there — never in a tool:

```
.screen                     the viewport-sized container
  .view[data-view][data-sid]      one per flow state
  .view.active                    exactly the one being shown
  #sid                            prints the active view's screen id
```

`data-sid` is what makes registry ↔ prototype id drift **measurable**: the probe
reads what the page prints and compares it to the id the registry claims, instead
of trusting either.

## 5. Wire the validators in

```bash
node tools/smoke.mjs "home:dash,stack"       # STATE 07, before handing to the audit
node tools/audit.mjs --shots artifacts/shots # STATE 08 — then READ the screenshots
node tools/navgraph.mjs --fail-on major      # STATE 12
node tools/stategraph.mjs --fail-on major
node tools/stateprobe.mjs
node tools/annotate.mjs --fail-on major
```

`tools/audit.mjs` derives what to drive from `reference/audit-plan.json` when it
exists, and otherwise from the hooks in `reference/state-machines.json`. Copy
[`templates/audit-plan.json`](templates/audit-plan.json) to start.

## 6. What to keep honest as you go

Four things drift silently. Each one has a rule and each rule was written by a
real failure:

1. **The loop counter.** Write `L_REVISION (n/3)` in every revision log. A ceiling
   nobody counts is not a ceiling — one flow delivered five rounds against a
   ceiling of three and nothing detected it.
2. **The pass count.** `pass N = 1 + revision rounds delivered`, bumped in every
   place that states it, in the same edit.
3. **`machine_state.yaml`.** Write it at decision time. It once sat two days stale
   while the machine reported itself shipping.
4. **Boundary status.** A `⟂` boundary is correct when written and silently wrong
   the moment the owning flow ships. Re-check the whole set whenever any feature
   reaches `FINAL_OUTPUT`; record the date it was checked.

## 7. Trimming the pipeline

You can legitimately skip:

- **STATE 12** when the work is not going to a build team (`handoff_required: false`).
- **STATE 02** for a goal explicitly marked `no-research-needed` — per goal, not wholesale.

You cannot skip STATE 08 before STATE 09, or STATE 09 before STATE 11. The audit
exists so the user never debugs; the gate exists so the machine never ships on its
own authority.

## 8. Where to go from here

| If you want to… | Read |
|---|---|
| The full contract for any state — inputs, outputs, exit criteria, common mistakes, duration | [`WORKFLOW_GUIDE.md`](WORKFLOW_GUIDE.md) |
| What every validator checks, its typical output, and how to fix each finding | [`VALIDATION_ENGINE.md`](VALIDATION_ENGINE.md) |
| What each artifact is, who consumes it, and which part is load-bearing | [`ARTIFACT_FLOW.md`](ARTIFACT_FLOW.md) |
| How the engine, store, gates and tools fit together | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Why the rules are shaped this way | [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) |
| Every hardened rule, indexed by the code you cite it as | [`docs/method-rules.md`](docs/method-rules.md) |
| The exact terminology this documentation uses | [`GLOSSARY.md`](GLOSSARY.md) |

---

[← README](README.md) · [Start Here](START_HERE.md) · [Workflow Guide →](WORKFLOW_GUIDE.md) · [Architecture →](ARCHITECTURE.md)
