# Workflow Guide

Every one of the twelve states, in full: what it is for, what it reads, what it writes, what must be true to leave it, what goes wrong, and how long it takes.

[← README](README.md) · [Architecture →](ARCHITECTURE.md) · [Artifact Flow →](ARTIFACT_FLOW.md) · [Validation Engine →](VALIDATION_ENGINE.md)

> **Source of truth.** [`docs/workflow.md`](docs/workflow.md) is the specification. Where this guide and that document disagree, the specification wins. This guide adds operating detail — common mistakes, durations, cross-references — without changing a single rule.

---

## Contents

| # | State | Gate | Skipping? |
|---|---|---|---|
| [01](#state-01--requirement_analysis) | `REQUIREMENT_ANALYSIS` | Clarification (conditional) | never |
| [02](#state-02--research) | `RESEARCH` | — | per goal, when marked `no-research-needed` |
| [03](#state-03--product_review) | `PRODUCT_REVIEW` | **Direction Approval** | never |
| [04](#state-04--ux_planning) | `UX_PLANNING` | — | never |
| [05](#state-05--flow_generation) | `FLOW_GENERATION` | — | never |
| [06](#state-06--ui_planning) | `UI_PLANNING` | Extension Note (informational) | never |
| [07](#state-07--prototype) | `PROTOTYPE` | — | never |
| [08](#state-08--self_audit) | `SELF_AUDIT` | — | never |
| [09](#state-09--user_review) | `USER_REVIEW` | **Primary User Approval** | never |
| [10](#state-10--revision) | `REVISION` | Conflict Mini-Gate (conditional) | it is a loop, not a step |
| [12](#state-12--flow_visualization) | `FLOW_VISUALIZATION` | **Developer Handoff** | when `handoff_required: false` |
| [11](#state-11--final_output) | `FINAL_OUTPUT` | — (gated by 09) | never |

Also in this guide: [How to read a state block](#how-to-read-a-state-block) · [Reading the durations](#reading-the-durations) · [Cross-state rules](#cross-state-rules)

---

## How to read a state block

Every state below uses the same thirteen headings, in the same order:

| Heading | What it tells you |
|---|---|
| **Goal** | The one-sentence outcome. |
| **Purpose** | Why this state exists in the machine — the decision it owns. |
| **Inputs** | What must be true and available to enter. |
| **Reads** | The exact files consumed. |
| **Outputs** | What the state produces, conceptually. |
| **Writes** | The exact files produced. |
| **Validation** | The machine-checkable rules on the output. `V1–V4` come from the specification and hold for every product; `V5+` are project-hardened rules, each written by a defect that passed `V1–V4`. |
| **Human approval** | The gate, if any, and who grants it. |
| **Exit criteria** | What must hold to leave. |
| **Common mistakes** | The recorded failure classes, and how to avoid each. |
| **Related artifacts** | What this state's output touches downstream. |
| **Expected duration** | Indicative, split into agent time and human attention. |
| **Dependencies** | What must precede it, and what depends on it. |

## Reading the durations

Durations are **planning aids, not commitments.** They assume one small-to-medium feature — one journey, five to ten screens — and an agent with file access running the skill as written.

- **Agent time** is wall-clock for the state's work, including tool runs.
- **Human attention** is the time a person actually spends reading or deciding.

A large feature scales agent time roughly linearly with screen count; human attention scales with the number of *decisions*, not screens. Revision rounds multiply both.

---

## STATE 01 · `REQUIREMENT_ANALYSIS`

**Skill:** [`skills/01-requirement-analysis/`](skills/01-requirement-analysis/) · **Spec:** [`docs/workflow.md` §STATE 01](docs/workflow.md)

### Goal

Turn an ambiguous product request into a structured, testable requirements artifact and a normalized problem statement.

### Purpose

Nothing downstream should have to re-interpret the raw brief. This state owns the conversion from prose to checkable commitments — and it is the only state that may raise a question the machine cannot answer for itself.

Its real product is the **falsifiable acceptance criterion**. Everything downstream is checked against those, so a vague one is a check nobody can fail.

### Inputs

- `raw_request` — the user prompt or brief.
- Optional attachments: documents, links, constraints.
- `machine_state`.

### Reads

`raw_request` · attachments · `state/machine_state.yaml`

### Outputs

A requirements document: goals, actors, constraints, non-goals, requirements with acceptance criteria, assumptions flagged `assumed` or `confirmed`, open questions with severity, and a scope class.

### Writes

`artifacts/requirements-<feature>.md`

### Validation

| Rule | Condition |
|---|---|
| **V1** | ≥1 goal **and** ≥1 acceptance criterion present. |
| **V2** | Every requirement has ≥1 falsifiable acceptance criterion. |
| **V3** | No requirement or assumption tagged both `assumed` and `confirmed`. |
| **V4** | `open_questions` is empty, or every item carries a severity — `blocking` or `non-blocking`. |

### Human approval

**Clarification Gate** — fires **only** when blocking ambiguity exists. No approval otherwise. Grantor: the user. On no answer: self-loop (`L_CLARIFY`, ceiling 3) or `HALT_BLOCKED`.

### Exit criteria

All validation rules pass **and** no `blocking` open question remains unresolved — resolved either by a user answer or by an explicit assumption acceptance recorded in the Assumptions section.

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Writing an acceptance criterion that cannot fail | "The screen is intuitive" gives STATE 08 nothing to check, so V1 of the audit is unevaluable rather than failed. | State an observable pass/fail condition: "submitting wrong credentials preserves the entered email and returns focus to the password field". |
| Answering a blocking question by assumption without recording it | A guess recorded as a requirement becomes a spec nobody chose. | Either get the answer, or record the assumption explicitly as `assumed` — visible, and reversible. |
| Introducing scope later that was never validated here | One of the five anti-patterns the machine explicitly forbids. STATE 03's V3 fails on it. | Route the new scope back to this state. |
| Merging goals into one blurred statement | Goal-to-theme coverage in STATE 02 and task tracing in STATE 04 both key off individual goal ids. | One goal, one id. |

### Related artifacts

Consumed by [02 research](#state-02--research), [03 product-review](#state-03--product_review), [04 ux-planning](#state-04--ux_planning), [08 self-audit](#state-08--self_audit) (the conformance matrix is built from its ACs) and [11 final-output](#state-11--final_output) (completion rule 3).

### Expected duration

| | |
|---|---|
| Agent time | 5–15 min |
| Human attention | 5 min, plus however long the blocking questions take to answer |

### Dependencies

**Requires:** nothing — this is the entry state.
**Required by:** every other state, directly or transitively.

---

## STATE 02 · `RESEARCH`

**Skill:** [`skills/02-research/`](skills/02-research/) · **Spec:** [`docs/workflow.md` §STATE 02](docs/workflow.md)

### Goal

Gather external and internal evidence — domain, competitors, interaction patterns, technical constraints — that informs product and UX decisions.

### Purpose

Downstream states should reason from cited findings rather than re-searching the problem space. This state also owns **contradictions**: where evidence disagrees, the disagreement is recorded, not resolved.

### Inputs

- A validated `requirements-<feature>.md`.
- Optional research scope config.
- `machine_state`.

### Reads

`artifacts/requirements-<feature>.md` · `state/machine_state.yaml`

### Outputs

Themes with sources, an evidence table with resolvable citations, competitor notes, a pattern catalogue, constraints, a contradictions list, a goal-coverage map and unresolved gaps.

### Writes

`artifacts/research-<feature>.md`

### Validation

| Rule | Condition |
|---|---|
| **V1** | Every theme cites ≥1 source. |
| **V2** | Each requirement goal maps to ≥1 theme **or** is explicitly marked `no-research-needed`. |
| **V3** | Contradictions are listed, not silently resolved. |
| **V4** | No fabricated citations — every source is resolvable. |

### Human approval

None. Research produces evidence for later gates but raises no approval of its own.

### Exit criteria

All validation rules pass **and** goal coverage meets the configured threshold — default 100% mapped-or-waived.

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Resolving a contradiction quietly | The disagreement is real information. Hiding it means STATE 03 scores a direction against evidence that has been tidied. | List both sides with both citations, unresolved. |
| A citation that does not resolve | V4 exists because a fabricated source is worse than a gap — it looks like evidence. | Downgrade the theme to `gap` with a reason. |
| Skipping research wholesale | The waiver is **per goal**, not per feature. | Mark the specific goals `no-research-needed`, so the decision is visible per goal. |
| Fanning out again over everything after a coverage failure | Wasteful and re-introduces the noise you already filtered. | Re-run the fan-out targeting **only** the failed goals. |

### Related artifacts

Consumed by [03 product-review](#state-03--product_review) (the evidence every priority is scored against), [04 ux-planning](#state-04--ux_planning) and [06 ui-planning](#state-06--ui_planning).

### Expected duration

| | |
|---|---|
| Agent time | 10–30 min, dominated by search fan-out |
| Human attention | 5 min to skim themes and contradictions |

### Dependencies

**Requires:** 01.
**Required by:** 03, 04, 06.
**Back-transition:** to 01 when research reveals a requirement is malformed or self-contradictory — the root cause is upstream.

---

## STATE 03 · `PRODUCT_REVIEW`

**Skill:** [`skills/03-product-review/`](skills/03-product-review/) · **Spec:** [`docs/workflow.md` §STATE 03](docs/workflow.md)

### Goal

Decide whether the requirements plus the evidence justify the product direction, and emit a `proceed` / `re-scope` / `stop` recommendation **before** design effort begins.

### Purpose

This is the last cheap place to stop or re-cut scope. Everything downstream — UX plan, flows, UI plan, prototype — compounds on the direction ratified here.

The state **judges** scope. It never **adds** scope: every prioritised item must already exist in `requirements-<feature>.md`.

### Inputs

- `requirements-<feature>.md` (validated).
- `research-<feature>.md` (validated).
- `machine_state`.

### Reads

`artifacts/requirements-<feature>.md` · `artifacts/research-<feature>.md` · `state/machine_state.yaml`

### Outputs

A recommendation with rationale, a prioritised requirement set banded `must` / `should` / `could` / `cut` with evidence citations, a risk register, named scope contradictions, a decision record with reversal triggers, and a cut list.

### Writes

`artifacts/product-review-<feature>.md`

### Validation

| Rule | Condition |
|---|---|
| **V1** | `recommendation` ∈ {`proceed`, `re-scope`, `stop`} with a non-empty rationale. |
| **V2** | Every `high`-severity risk carries a mitigation **or** an explicit accept-risk note with a named owner. |
| **V3** | The prioritised set is a **subset** of the validated requirements — every id resolves in `requirements-<feature>.md`. |
| **V4** | Every prioritised requirement cites its evidence (theme ids) or is explicitly marked `unevidenced`. |

### Human approval

**Direction Approval Gate** — mandatory, fires every time. Grantor: the user.

Present at the gate: the recommendation and its rationale, the priority bands, the high-risk items with their mitigation-or-acceptance, and the cut list. **Unresolved contradictions are presented as unresolved** — a gate answered on a tidied-up picture is not an approval of the real direction.

On deny → back-transition to `REQUIREMENT_ANALYSIS` carrying the denial notes.

### Exit criteria

All validation rules pass **and** the Direction Approval Gate is resolved.

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Inventing a requirement to satisfy a rule | V3 failure means an upstream requirement is **missing**, not that this state should write one. | Escalate to STATE 01 rather than widening scope here. |
| Presenting a cleaned-up picture at the gate | An approval given on a tidied summary does not cover the real direction. | Show the contradictions as unresolved and the cut list in full. |
| Recording a high risk with no owner | "Accepted" with no name is nobody's acceptance. | Name the role that accepts it. |
| Treating the gate as a formality | This is the last cheap stop. A wrong direction ratified here costs every downstream state. | Read the cut list before answering. |

### Related artifacts

Consumed by [04 ux-planning](#state-04--ux_planning) — which derives tasks from the `must` / `should` bands, not from the raw requirement set. The risk tolerance recorded here is what STATE 04 consults if it hits its edge-case ceiling.

### Expected duration

| | |
|---|---|
| Agent time | 10–20 min |
| Human attention | **10–20 min — the most valuable reading in the pipeline** |

### Dependencies

**Requires:** 02 (and transitively 01).
**Required by:** 04.
**Re-opens:** the Direction Gate re-opens whenever STATE 10 routes a change of *what to build* back here.

---

## STATE 04 · `UX_PLANNING`

**Skill:** [`skills/04-ux-planning/`](skills/04-ux-planning/) · **Spec:** [`docs/workflow.md` §STATE 04](docs/workflow.md)

### Goal

Define the UX strategy — information architecture, key tasks, per-task state enumeration and accessibility posture — **without producing a single screen**.

### Purpose

Flow generation needs something to sequence and UI planning needs something to lay out. This state also owns the enumeration that most design processes quietly skip: the non-happy paths.

It is deliberately **screen-free**. The moment it names a screen or a visual treatment it has skipped the decision it exists to make, and V4 fails.

### Inputs

- `requirements-<feature>.md`, `research-<feature>.md`, `product-review-<feature>.md`.
- A **granted** Direction Approval Gate.
- `machine_state`.

### Reads

`artifacts/requirements-<feature>.md` · `artifacts/research-<feature>.md` · `artifacts/product-review-<feature>.md` · `state/machine_state.yaml`

### Outputs

A task list traced to prioritised requirements, an information architecture and navigation model, per-task state enumeration, an edge-case matrix, an accessibility strategy with a stated target floor, UX risks and open decisions.

### Writes

`artifacts/ux-plan-<feature>.md`

### Validation

| Rule | Condition |
|---|---|
| **V1** | Every primary task enumerates a happy path **and ≥3 non-happy-path** states. |
| **V2** | The accessibility strategy is present and non-empty. |
| **V3** | Every task traces to ≥1 **prioritised** requirement. |
| **V4** | **No screen-level or visual design content** — no screen ids, no layout, no component names, no colour. |

### Human approval

None. Checkpoint review only, non-blocking — the direction was approved at 03 and the prototype has its own gate at 09.

**Open decisions recorded here are carried forward, not resolved by assumption.** An unruled question that reaches the prototype as an invented answer is how a placeholder ends up frozen into an approved deliverable.

### Exit criteria

All validation rules pass.

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Enumerating only the happy path | Every non-happy state missing here is missing from the flows, missing from the prototype, and discovered by a developer in build. | Loading, empty, error, interrupted, offline, permission-denied — mark `n/a` with a reason where genuinely inapplicable. |
| Naming screens or components | Pre-commits STATE 06 to a layout nobody chose, and fails V4. | Describe the *state the user is in* and what they experience. |
| Setting an accessibility floor nobody will build to | The number becomes an acceptance criterion STATE 08 checks. On the extraction run, ~140 elements across 20 screens passed the external AA standard and missed the project's own 44px claim; raising them would have restyled four approved gates. | State the number you will actually build, and put the same number in `toolkit.config.json` → `audit.tapTargetFloorPx`. |
| Quietly re-prioritising when the plan looks unviable | That scope decision belongs to a gated state. | Back-transition to `PRODUCT_REVIEW`. |

### Related artifacts

Consumed by [05 flow-generation](#state-05--flow_generation) (every non-happy state must get a recovery route), [06 ui-planning](#state-06--ui_planning) and [08 self-audit](#state-08--self_audit) (the accessibility and reduced-motion audit runs against this strategy).

### Expected duration

| | |
|---|---|
| Agent time | 15–30 min |
| Human attention | 5–10 min to check the edge-case matrix |

### Dependencies

**Requires:** 03 with the Direction Gate granted.
**Required by:** 05, 06, 08.
**Back-transition:** to 03 when the prioritised set turns out to be unviable.

---

## STATE 05 · `FLOW_GENERATION`

**Skill:** [`skills/05-flow-generation/`](skills/05-flow-generation/) · **Spec:** [`docs/workflow.md` §STATE 05](docs/workflow.md)

### Goal

Turn the UX plan's tasks and states into directed flow graphs — sequenced transitions, decision points with exhaustive branches, a recovery route for every non-happy state, and a reachability report.

### Purpose

`UI_PLANNING` should lay out a graph, not interpret a list.

This state is screen-free in the same sense STATE 04 is: a node is a *state the user is in*, not a visual design. Naming a node after a screen id is fine — and is the toolkit's convention — but the node's contents are triggers, guards and routes, never layout or colour.

### Inputs

- `ux-plan-<feature>.md` (validated), `requirements-<feature>.md`.
- `machine_state`.

### Reads

`artifacts/ux-plan-<feature>.md` · `artifacts/requirements-<feature>.md` · `state/machine_state.yaml`

### Outputs

Per-task flow graphs with triggers and guards, canon entry paths, a decision log, a reachability report, a recovery-coverage table, a flow-boundary table (`⟂` nodes) and open decisions.

### Writes

`artifacts/flows-<feature>.md`

### Validation

| Rule | Condition |
|---|---|
| **V1** | No unreachable state in any flow. |
| **V2** | No dead-end state without an explicit terminal justification. |
| **V3** | Every non-happy-path state from `ux-plan.md` has a recovery transition. |
| **V4** | Every decision point has **mutually exhaustive** branch conditions. |

> **V4 is the one that fails quietly.** "Exhaustive" means the branch set covers the guard's whole domain — including null, not-yet-loaded and permission-denied — not merely that two plausible cases are listed.

### Human approval

None. Flows are ratified indirectly at the STATE 09 gate, through the prototype that implements them.

### Exit criteria

All validation rules pass **and** the reachability report is clean: `Unreachable nodes: 0`, `Dead ends without justification: 0`.

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Inventing a branch for an unruled guard | An invented value becomes a frozen number nobody owns. Unruled product numbers entered flows as concrete branches and were frozen into approved deliverables. | Record it as an open decision (`o-<id>`) and carry it forward. |
| Regenerating the whole graph after one V1/V2 failure | A full rewrite loses the ratified decisions the diagram encodes. | Patch the offending segment; re-validate only that segment. |
| Adding a state here to satisfy V3 | A missing recovery is usually a missing *state*, and enumeration belongs to STATE 04. | Check upstream first; back-transition if the state is genuinely absent. |
| Treating a `⟂` boundary as permanent | A boundary is correct **when written** and silently wrong once the owning flow ships. Eleven live call sites still routed to a placeholder after every destination existed. | Re-check the whole boundary table whenever any other feature reaches `FINAL_OUTPUT`; the status is a dated claim. |
| Writing a clearance claim without its scope | "No boundary mocks left" was written about one flow and read as holding for the set. | State the scope **inside** the claim. |
| Reading a green flow graph as a correct implementation | A flow whose every node and edge was correct rendered nothing — the container stayed `visibility:hidden`. | This state's verdict is scoped to the graph. The render is STATE 08's job. |

### Related artifacts

Consumed by [06 ui-planning](#state-06--ui_planning), [07 prototype](#state-07--prototype) (every node must be represented and every transition wired) and [12 flow-visualization](#state-12--flow_visualization) (the derived registry graph is reconciled against these ratified graphs).

### Expected duration

| | |
|---|---|
| Agent time | 15–40 min, scaling with branch count |
| Human attention | 5–10 min on the decision log and open decisions |

### Dependencies

**Requires:** 04.
**Required by:** 06, 07, 12.
**Back-transition:** to 04 when a persistently unreachable state means the enumeration is short.

---

## STATE 06 · `UI_PLANNING`

**Skill:** [`skills/06-ui-planning/`](skills/06-ui-planning/) · **Spec:** [`docs/workflow.md` §STATE 06](docs/workflow.md)

### Goal

Define UI structure, component inventory and design-system usage — **still specification, not rendered UI**.

### Purpose

`PROTOTYPE` should assemble a plan, not improvise one. This state names components, tokens, geometry and motion **by reference**, and builds nothing.

A decision deferred to build time is a decision made by whoever builds fastest.

### Inputs

- `flows-<feature>.md`, `ux-plan-<feature>.md`, `research-<feature>.md`.
- The design-system reference — **named by source id**.
- `machine_state`.

### Reads

`artifacts/flows-<feature>.md` · `artifacts/ux-plan-<feature>.md` · `artifacts/research-<feature>.md` · design-system reference · `state/machine_state.yaml`

### Outputs

An inherited-verbatim list, a strict colour allowlist plus a ban list, a component inventory mapped to DS primitives with a reuse-vs-new classification, layout rules with real numbers at the real viewport, a motion spec forked for reduced-motion, audited contrast pairs with ratios, token-resolution accounting, a supersession table, an Extension Note and open decisions.

### Writes

`artifacts/ui-plan-<feature>.md` · **and** the allowlist into `toolkit.config.json` → `audit.colorAllowlist` / `colorBanned`

### Validation

| Rule | Condition |
|---|---|
| **V1** | Every flow state maps to a component set. |
| **V2** | Component-to-DS mapping **prefers reuse**; every `new` component has a written justification. |
| **V3** | No isolated one-off styling introduced where a DS primitive exists. |
| **V4** | Token references **resolve** to the provided design system, or are flagged as an extension. |

> **V4 is the one that fails quietly.** "Resolves" means the token exists in the named design system — not that a plausible-looking `var()` name was written down. A token the DS does not have is an extension request or an open decision; it is never a hex quietly added to the allowlist.

### Human approval

None. The **Extension Note** is informational and non-blocking: it exists so a design-system owner can later see what the product needed and the system did not have.

### Exit criteria

All validation rules pass.

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Naming the design system without a source id | A plan built on the **wrong** design system validates perfectly against it, so no downstream rule can catch it. One such spec survived four revision cycles and reached `HALT_BLOCKED`. | Record the DS **by source id** in `reads_versions.design-system` and in `toolkit.config.json` → `designSystem.sourceId`, then sanity-check that the system's own assumptions — viewport, platform, brand — match this product. |
| Adding a hex to the allowlist to make a spec true | The allowlist stops being a constraint the moment it bends. | A token that does not resolve is an **extension request or an open decision**. |
| Leaving the allowlist only in this document | STATE 08 reads `toolkit.config.json`. An allowlist that lives only here is an allowlist nothing enforces. | Write the same set into the config in the same edit. |
| Omitting the BANNED list | An allowlist alone cannot catch a value that was never supposed to exist. The audit must check **non-DS absence**, not just DS presence. | List the banned hexes and where they came from. |
| Deciding contrast at audit time | A progress bar failed 3:1 against its own track and shipped as the theme accent, contradicting the same spec's one-colour-per-category rule. | Decide contrast **here**, on the token pair, with the ratio written down. A failing pairing is a plan change, not a prototype patch. |
| Not claiming a selector namespace | A descendant selector on a new card also matched status and lock icons elsewhere and inflated them to ~340px. | Every `new` entry declares the selector namespace it claims and scopes its descendants. |
| An inventory that only grows | One revision superseded a component outright; two rebuilds later required stripping whole selector families by hand. | Record supersession, so the prototype strips it. |
| Making the token layer opt-in | An opt-in script→font token over a foreign base produced **138 instances across 7 flows** on an arbitrary OS fallback. Anything a component can forget to do, some component will forget. | Script → font mapping is a **base rule** of the token layer. |
| Geometry that contradicts the strategy | Layout rules set interactive elements between 29 and 38px against a stated floor of 44px. | State target sizes as numbers and check them against `audit.tapTargetFloorPx` — this is the last state where the number is free to change. |

### Related artifacts

Consumed by [07 prototype](#state-07--prototype) (the component inventory is what gets instantiated) and [08 self-audit](#state-08--self_audit) (token conformance and the palette check).

### Expected duration

| | |
|---|---|
| Agent time | 20–45 min |
| Human attention | 10 min on the inventory, the allowlist and the contrast table |

### Dependencies

**Requires:** 05.
**Required by:** 07, 08.
**Back-transition:** to 05 when an unmapped state turns out to be a *missing* state rather than a missing component set.

---

## STATE 07 · `PROTOTYPE`

**Skill:** [`skills/07-prototype/`](skills/07-prototype/) · **Spec:** [`docs/workflow.md` §STATE 07](docs/workflow.md)

### Goal

Assemble the planned UI and flows into a coherent, interactive prototype, plus the traceability map that proves it matches the specs.

### Purpose

This is where specs become bytes, and therefore the state where most defects are **born** — nearly every audit finding traces to an assembly decision made here. STATE 08 exists to catch them; this state exists to not make them.

### Inputs

- `ui-plan-<feature>.md`, `flows-<feature>.md`, `ux-plan-<feature>.md`.
- `machine_state`.

### Reads

`artifacts/ui-plan*.md` · `artifacts/flows*.md` · `artifacts/ux-plan*.md` · `state/machine_state.yaml`

### Outputs

The assembled prototype — one self-contained file per flow, the shared review player, deep-link hooks per flow state — and a traceability document mapping requirement → task → flow → component → prototype element.

### Writes

`artifacts/prototype/` · `artifacts/traceability-<feature>.md`

### Build method (the hardened contract)

Processing steps say *what*. These say *how*, and each was written by a defect that shipped. Codes are cited from plans and logs; index in [`docs/method-rules.md`](docs/method-rules.md).

| Code | Rule |
|---|---|
| **B1** | Emit in chunks, never one giant write. A whole flow file is 1,300–2,000 lines; every parallel builder that tried one write crashed mid-response and lost the work. |
| **B2** | Every flow state, variant and error case ships a **deep-link hook**, recorded in `traceability.md`. A state reachable only by clicking through four screens cannot be audited by 08 or demonstrated at the 09 gate. The hook table **is** the review packet. |
| **B3** | Claim the selector namespace before you use it; scope descendants with `>`. A single-file prototype has one global CSS namespace across every screen. |
| **B4** | String and config keys are a namespace too — sweep for duplicates across every file **and** every locale object. Duplicate keys do not error; the later definition silently wins. |
| **B5** | The token layer is the **base**, not an opt-in — then check the stack itself. CSS falls back **per glyph**. The same completeness rule applies to asset registries. |
| **B6** | A transition is not wired until its **destination paints**. Two shapes pass structural assertions: boundary mocks that outlived their boundary, and a state that exists but never becomes visible. |
| **B7** | Supersession **deletes**. Strip the old CSS, strings and handlers; record the strip itemised. Leftovers are un-specced elements and fail V2 exactly as additions do. |
| **B7b** | Honour the harness contract in `toolkit.config.json` → `prototype`. A prototype invisible to the contract reports as *blank* — indistinguishable from the defect B6 exists to catch. |
| **B8** | Self-check before handing to the audit: `node --check`, hex inventory, drive every view headless and **read the screenshots**, console sweep, and read every rendered number against its own copy. |

Plus, when pushing into Figma: **F1** `setBoundVariableForPaint()` silently drops `paint.opacity` — re-read `node.fills[0]`, spread the opacity on, reassign. **F2** a bad lookup returns `null` and the bind call accepts it without throwing — re-read and assert. **F3** `paint.opacity` round-trips as float32 — compare with an epsilon.

### Validation

| Rule | Condition |
|---|---|
| **V1** | Every flow state from `flows.md` is represented. |
| **V2** | Every prototype element traces to a spec entry — **no un-specced additions**. |
| **V3** | DS token usage matches `ui-plan.md` references. |
| **V4** | All wired transitions correspond to defined flow transitions. |
| **V5** *(hardened, B2)* | Every flow state in the V1 table carries a **deep-link hook**. A state that cannot be driven cannot be audited, so V1 is otherwise unverifiable. |
| **V6** *(hardened, B7)* | A superseded component leaves **no dead selectors, strings or handlers**. |

### Human approval

None. The prototype is not shown to the user from this state — `SELF_AUDIT` gates it first, and `USER_REVIEW` owns the presentation.

### Exit criteria

Validation passes; traceability complete; `node tools/smoke.mjs` clean on every page and view.

```bash
node tools/smoke.mjs "signin:main,error,reset" "home:dash,stack"
```

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Building around a missing spec | "The spec does not say" is a routing signal, not a licence to invent. An invented value assembled here becomes a frozen number nobody owns. | Back-transition to `UI_PLANNING`. |
| Forgetting to register a new page in `play.html`'s `FEATURES` array | A flow missing from the sidebar is a flow the user does not review. | Register it in the **same edit** that creates the page. |
| Treating structural assertions as proof the screen works | 84/84 DOM assertions passed against a screen that displayed nothing. | Drive it and assert the destination **paints** — computed visibility and geometry. |
| Adding chrome outside the screens a ruling scoped it to | An un-specced addition; fails V2. | Assemble the ruled behaviour; ship the alternative behind a demo toggle; raise the open for 09. |
| Resolving a spec-vs-ruling conflict inside the bytes | Deciding it in assembly hides the conflict where nobody can see it. | Assemble the ruled behaviour and raise the open. |
| Skipping the screenshot read in B8 | Renders break with zero console errors. A progress fill computed from a 0-based index showed empty on step 1; an "unlocked!" ceremony drew a **closed** padlock. | Read every screenshot once against its own copy. |

### Related artifacts

Consumed by [08 self-audit](#state-08--self_audit), [09 user-review](#state-09--user_review) (the hook table is the packet), [12 flow-visualization](#state-12--flow_visualization) (hooks are scanned out of the implementation) and [11 final-output](#state-11--final_output) (the bytes that get frozen).

### Expected duration

| | |
|---|---|
| Agent time | 45 min – 3 h, dominated by screen count |
| Human attention | 0 — nothing is shown to the user from this state |

### Dependencies

**Requires:** 06.
**Required by:** 08, 09, 11, 12.
**Back-transition:** to 06 on repeated spec insufficiency.

---

## STATE 08 · `SELF_AUDIT`

**Skill:** [`skills/08-self-audit/`](skills/08-self-audit/) · **Spec:** [`docs/workflow.md` §STATE 08](docs/workflow.md)

### Goal

Adversarially review the prototype against every upstream spec and quality dimension **before any user attention is spent on it**, and emit a `pass` / `fail` verdict.

### Purpose

The audit's job is to find what the builder missed. That means it must be adversarial toward its **own instrument** as much as toward the prototype.

A `fail` verdict is a normal outcome, not an error.

### Inputs

- `prototype/`, `traceability-<feature>.md`, all upstream artifacts.
- `reference/audit-plan.json` — or, absent that, the hooks in `reference/state-machines.json`.
- `machine_state`.

### Reads

`artifacts/prototype/` · `artifacts/traceability*.md` · all upstream artifacts · `reference/audit-plan.json` · `state/machine_state.yaml`

### Outputs

An audit report: the method actually run, findings classified `blocker` / `major` / `minor`, a conformance matrix marking every acceptance criterion with evidence, the harness corrections made, known limitations, and a verdict.

### Writes

`artifacts/audit-report-<feature>.md` · (harness side-output: `artifacts/audit-data.json`, `artifacts/shots/`)

### Verification method (the hardened contract)

| Code | Rule |
|---|---|
| **M1** | Every check is **rendering-class**: computed visibility and measured geometry, never DOM presence. |
| **M2** | **Look at the render.** Screenshot review is a required step across locale × theme × reduced-motion × state. |
| **M3** | **A failing probe is a hypothesis, not a finding.** Confirm at source, correct the harness, re-run. Never waive, never report unconfirmed. |
| **M4** | **Sweep the source**, not just the surface: duplicate keys, stale placeholder routes, per-glyph font fallback. |
| **M5** | The verdict is **scoped to the bytes it audited**. Targeted assertions run during a revision round are not an audit. |
| **M6** | **Record, do not silently resolve.** A conflict between two approved artifacts, or between a project criterion and an external standard, is a finding with a recommendation. |

### Validation

| Rule | Condition |
|---|---|
| **V1** | Every acceptance criterion from `requirements.md` is marked `met` / `unmet` / `waived` **with evidence**. |
| **V2** | Zero unresolved `blocker` findings to pass. |
| **V3** | The accessibility audit was **executed**, not skipped. |
| **V4** | Verdict ∈ {`pass`, `fail`} with rationale. |
| **V5** *(hardened, M1)* | Every check in the method record is rendering-class. A report whose evidence is DOM presence alone does not satisfy V1. |
| **V6** *(hardened, M5)* | `reads_versions.prototype` matches the currently frozen prototype bytes. A stale verdict is not a verdict. |

### Human approval

None. This is the machine gating itself before spending user attention. The **Known limitations** section is what the next state presents at its gate.

### Exit criteria

- `pass` → proceed to `USER_REVIEW`.
- `fail` → route to `REVISION` with the findings attached.

```bash
node tools/audit.mjs --shots artifacts/shots
# then READ artifacts/shots/ before writing the verdict
```

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Reporting the harness's first run verbatim | One audit opened at **60 failures with 3 real**; a state probe reported **37 and all 37 were the harness**. | Rule out the catalogued false-positive classes, correct the instrument, re-run. |
| Waiving a failure instead of confirming it | A waived unconfirmed failure is two errors: an unfixed defect and a false record. | Confirm at source. Every correction is recorded in the Harness corrections section. |
| Skipping the screenshots | Four of one flow's six real defects were **screenshot-only** finds. | M2 is a required step, not a supplement. |
| Auditing bytes that have since moved | Five of seven approved flows arrived at their gate past their audit of record; the eventual re-run found three more real defects. | Record the exact version in `reads_versions`; re-run if the frozen bytes have moved. |
| Silently editing one of two disagreeing sources | That hides the disagreement rather than resolving it. | Record it as a finding with a recommendation. |
| Tuning `minVisibleNodes` up to stop empty states failing | An empty state is sparse **by design**. Raising the threshold blinds the check that catches genuinely blank screens. | Keep the paint floor low. |

### Related artifacts

Consumed by [09 user-review](#state-09--user_review) (the known limitations are the gate's transparency input), [10 revision](#state-10--revision) (findings are half the change set) and [11 final-output](#state-11--final_output) (completion rule 4).

### Expected duration

| | |
|---|---|
| Agent time | 20–60 min, plus harness runtime |
| Human attention | 0 — but this is the state that makes the human's later attention cheap |

### Dependencies

**Requires:** 07.
**Required by:** 09, 10, 11.
**Back-transition:** to whichever state owed a missing input artifact. Do not audit around a missing spec.

---

## STATE 09 · `USER_REVIEW`

**Skill:** [`skills/09-user-review/`](skills/09-user-review/) · **Spec:** [`docs/workflow.md` §STATE 09](docs/workflow.md)

### Goal

Present the audited prototype to the user against a **running** local server and capture a structured `approve` / `request-changes` / `reject` decision.

### Purpose

This state spends the one resource the machine cannot manufacture: human attention. Everything upstream exists to make that attention cheap — the audit runs first so the user never debugs, and the packet is built so the user never hunts.

Everything downstream depends on this record being **exact**: `REVISION` routes from it, and `FINAL_OUTPUT` requires an `approve` scoped to the final frozen versions.

### Inputs

- `prototype/` (audited, verdict `pass`), `audit-report-<feature>.md`.
- `machine_state`.

### Reads

`artifacts/prototype/` · `artifacts/audit-report*.md` · `state/machine_state.yaml`

### Outputs

A gate record: decision, verbatim user instruction, what was approved, verification at approval, change requests each tagged with a target state, deltas ratified, known limitations presented, opens carried forward, waivers with riders, and freeze hashes.

### Writes

`artifacts/review-record-<feature>.md`

### Review method (the hardened contract)

| Code | Rule |
|---|---|
| **G1** | **Run Local, never a static preview.** `prototype/run-local.sh [port]` serves through `serve.py` and opens `play.html` — the player sidebar **is** the review chrome. |
| **G2** | The **packet is the hook list.** Ship STATE 07's traceability table with the verdict request. A state the user cannot reach in one step gets approved unseen. |
| **G3** | An approval is **scoped to the bytes it saw** — freeze and record the sha256, and name versions in `reads_versions`. |
| **G4** | **Classify a post-approval delta before asking about it.** Bug-fix-only → a scope confirm with byte-level evidence. Feature delta → a ruling; the gate is `pending`. |
| **G5** | **Present limitations; do not launder them.** An acceptance with qualifications is recorded with its qualifications. |
| **G6** | **Every waiver names its rider** debt item, its grantor and its closing condition. |
| **G7** | Keep the pass count honest: `pass N = 1 + revision rounds delivered`, bumped everywhere in the same edit. |
| **G8** | Ambiguity is **bounded, not absorbed** — two clarification rounds, then record as a non-blocking note. |

### Validation

| Rule | Condition |
|---|---|
| **V1** | Outcome ∈ {`approve`, `request-changes`, `reject`}. |
| **V2** | If `request-changes`, ≥1 change request, each linked to a target state. |
| **V3** | **No change request silently dropped** — every captured ask appears as `resolved`, `open` or explicitly `deferred` with a reason. |
| **V4** | **Run Local executed** — the review was conducted against a served prototype and the **player URL is recorded**, not against file previews. |
| **V5** *(hardened, G3)* | `reads_versions` names the exact prototype and audit versions, and **freeze hashes are recorded** for every approved file. |
| **V6** *(hardened, G6)* | Every waived validation names its rider debt item. |

### Human approval

**Primary User Approval Gate** — the central human gate of the machine. Grantor: the **user**, never the machine.

- No forward transition without `C_APPROVED(gate)`.
- Gate state persists in `machine_state.approvals` and is resumable.
- **The gate reverts to `pending` when approved artifacts change.**

### Exit criteria

The user decision is captured and structured, with the record naming its bytes.

```bash
artifacts/prototype/run-local.sh          # → http://localhost:8765/play.html
```

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Reviewing raw HTML files | Bypasses the player chrome. This was a direct user correction on a real run, and it is why V4 exists. | Review through `play.html`. |
| Naming the player and hooks in prose without recording the URL | Three of six records satisfied V4 in practice and left it unevidenced in the artifact. | Record the actual player URL in the record. |
| Dropping `reads_versions` from frontmatter | That is the exact field `FINAL_OUTPUT` checks completion rule 2 against. One real record dropped it. | Frontmatter first; body tables are additional, never a substitute. |
| Presenting a feature delta as a bug fix | Avoids re-opening a gate that should be re-opened. Bytes moved after approval three times in one session, including a whole screen rebuilt as a new surface. | Classify first, then ask for the right thing — a confirm or a ruling. |
| Recording a qualified acceptance as clean | A false record, and it is the artifact delivery is later checked against. | Record the qualifications with the acceptance. |
| Letting the pass count drift | Three pass counts were found stale at one gate and had to be corrected before it could close. | Bump every place that states it in the same edit. |
| Guessing at ambiguous feedback | A guess recorded as a requirement becomes a spec nobody chose. | Two clarification rounds, then a `non-blocking` note. |

### Related artifacts

Consumed by [10 revision](#state-10--revision) (change requests are half the change set) and [11 final-output](#state-11--final_output) (`reads_versions` and the freeze hashes are what completion rule 2 is checked against).

### Expected duration

| | |
|---|---|
| Agent time | 10–20 min to package and record |
| Human attention | **20–40 min — the decision that authorises shipping** |

### Dependencies

**Requires:** 08 with verdict `pass`.
**Required by:** 10, 11, 12.
**Escalation:** user unavailable → `HALT_BLOCKED`, fully persisted and resumable.

---

## STATE 10 · `REVISION`

**Skill:** [`skills/10-revision/`](skills/10-revision/) · **Spec:** [`docs/workflow.md` §STATE 10](docs/workflow.md)

### Goal

Apply audit findings and user change requests by routing each one back to the state where the fault was **introduced**, and track every item to closure.

### Purpose

Every other state produces its own artifact. This one **produces work for other states**, which makes it the only place where a misrouted fault becomes three wasted cycles instead of one.

It is also the primary product loop: it must terminate by user `approve` or by ceiling, and can never silently continue.

### Inputs

- `audit-report-<feature>.md` with verdict `fail`, **and/or** `review-record-<feature>.md` with `request-changes`.
- All artifacts, `machine_state`.

A change set with no named source is scope creep, not a revision.

### Reads

`artifacts/audit-report*.md` · `artifacts/review-record*.md` · all artifacts · `state/machine_state.yaml`

### Outputs

A revision log: the change set with class and sweep result per item, conflicts and their Mini-Gate outcomes, dependency order, supersessions, recorded constraints, a "deliberately not changed" table, impact analysis and re-validation results.

### Writes

`artifacts/revision-log-<feature>.md`

### Revision method (the hardened contract)

| Code | Rule |
|---|---|
| **R1** | Merge first; **dedup against `seen_changes`**. Same item + no new evidence → drop it and cite the prior decision. |
| **R2** | **Route the class, not the instance.** State the class, sweep for it, record the sweep count. "Fixed in 1 file" and "fixed in 11 files" are different claims. |
| **R3** | **Root cause is where the fault was introduced**, not where it is visible. A repeat is evidence of misrouting. |
| **R4** | Dispatch a **bounded scope** — what changes *and what must not*. |
| **R5** | Supersession is part of the change; **aged items are re-verified** against current bytes before dispatch. |
| **R6** | **Re-validate through `SELF_AUDIT`**, or record a waiver with a rider. Targeted verification is evidence inside the loop; it is not the audit. |
| **R7** | **Count the loop, out loud, every cycle.** One round = one prototype rebuild, however many sub-asks it folds. |
| **R8** | A conflict goes to the **Conflict Mini-Gate**, never into the bytes. |

### The routing table

| The ask is… | Root-cause state |
|---|---|
| a goal, scope, persona or constraint never captured | `REQUIREMENT_ANALYSIS` |
| a convention, benchmark or platform claim that turned out wrong | `RESEARCH` |
| a change in *what* to build or its priority | `PRODUCT_REVIEW` — the Direction Gate re-opens |
| a missing journey, an unserved need, an uncovered edge | `UX_PLANNING` |
| a missing or unreachable state, a wrong guard, a boundary that no longer holds | `FLOW_GENERATION` |
| a component, token, layout, motion, contrast or density spec | `UI_PLANNING` |
| the spec was right and the build does not match it | `PROTOTYPE` |
| the defect passed a green check | `SELF_AUDIT` **and** the owning artifact state — the check gap is its own item |

### Validation

| Rule | Condition |
|---|---|
| **V1** | Every change item has a target state and a status. |
| **V2** | No item left `open` at exit — `resolved`, `superseded`, or explicitly `deferred` **with a reason**. |
| **V3** | Iteration incremented; ceilings not exceeded **and the counters actually written**. |
| **V4** *(hardened, R2)* | Every item names its **defect class** and the sweep result. |
| **V5** *(hardened, R5)* | Replaced components are removed, not left dead; every carried item was re-verified against current bytes. |
| **V6** *(hardened, R8)* | Every conflict is recorded with **both sides** and its Mini-Gate outcome. |
| **V7** *(hardened, R6)* | The return edge to `USER_REVIEW` passes through `SELF_AUDIT`, or a waiver names its rider. |

### Human approval

**None required to start.** The **Conflict Mini-Gate** blocks *dispatching* contradictory change requests; grantor: the user.

Re-approval happens when the loop returns to `USER_REVIEW` — and the Primary User Approval Gate reverts to `pending` the moment approved artifacts change. That reversion is a consequence of this state's own dispatch, so record it in the dependency order.

### Exit criteria

All change items `resolved` or `deferred`; downstream states re-validated; the return edge passes through `SELF_AUDIT` on the rebuilt bytes.

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Patching the reported instance | A defect reported as six selectors in one file was patched three times and never swept. The root cause resurfaced **24 days later at 138 instances across 7 flows**. | Name the class, sweep for it, record the count. |
| Dispatching to where the symptom is visible | Everything is visible in the prototype. Four consecutive requests sent palette work downstream; the real fault was wrong-document adoption at `UI_PLANNING`, and the machine hit `HALT_BLOCKED` first. | Use the routing table. A repeat means the route was wrong. |
| Over-applying a bounded change | A one-screen palette change remixed the brand mark; the next round's first item was "restore it". A revision that does more than the item asked manufactures the next revision item. | Dispatch what changes **and what must not**. |
| Actioning a carried item without re-verifying it | Three of one carried defect's six reported selectors no longer existed by the time it was actioned. | Re-verify against current bytes; close as `superseded` naming the round that removed it. |
| Returning to the gate on targeted assertions | Five of seven approved flows arrived past their audit of record. | Return through `SELF_AUDIT`, or record a waiver with a rider. |
| Not writing the counter | One flow was recorded at `L_REVISION=2`, then delivered three more rounds — five against a ceiling of three. | `loop: L_REVISION (n/3)` in every log frontmatter. |
| Resolving a conflict inside the bytes | Silently editing one of two disagreeing approved deliverables is worse than the disagreement, and it moves frozen bytes without a ruling. | Ship the reversible reading, open the item, put it to the Mini-Gate. |
| Entering the loop on an empty change set | There is nothing to route. | Halt, write the escalation summary, and state the resume path. |

### Related artifacts

Writes work into every upstream state. Its log is read by [11 final-output](#state-11--final_output) for completion rule 6 — *no `open` change items in the latest revision log.* **A missing log reads as no evidence, not as no open items.**

### Expected duration

| | |
|---|---|
| Agent time | 15–45 min for triage and dispatch, plus the rebuild time of every state it dispatches to |
| Human attention | 0–15 min — only when the Conflict Mini-Gate fires |

### Dependencies

**Requires:** 08 (`fail`) or 09 (`request-changes`).
**Required by:** 11 (completion rule 6).
**Escalation:** `L_REVISION` 3/3 → `HALT_BLOCKED` with an escalation summary. The ceiling resets **only** by explicit user authorisation, recorded in the log.

---

## STATE 12 · `FLOW_VISUALIZATION`

**Skill:** [`skills/12-flow-visualization/`](skills/12-flow-visualization/) · **Spec:** [`docs/workflow.md` §STATE 12](docs/workflow.md) · module **DWF-05**

> Numbered 12 by authoring order, not machine order. It sits on the `USER_REVIEW (approve) → FINAL_OUTPUT` edge and is **skipped when `handoff_required` is false**.

### Goal

Generate the navigation visualization inside the design file so the approved design is *ready for development*, not merely visually complete.

### Purpose

A flow graph can be perfect and still hand off badly. The extraction run shipped eight per-flow map pages and still could not answer *"which screens does the home screen reach, and which reach it"* without a person reading eleven documents.

### Inputs

- `flows-<feature>.md` for every flow in scope, all with `user-review = approve`.
- `reference/screen-registry.csv`, `reference/nav-lanes.json`, `reference/state-vocabulary.md`, `reference/state-machines.json`, `reference/edge-annotations.json`.
- `artifacts/prototype/` (hook scan), `artifacts/traceability-<feature>.md`, existing handoffs.
- The Figma design file, `machine_state`.

### Reads

`artifacts/flows-<feature>.md` · `reference/screen-registry.csv` · `reference/nav-lanes.json` · `artifacts/prototype/` · `artifacts/traceability-<feature>.md` · `artifacts/deliverable-*/handoff-*.md` · the design file · `state/machine_state.yaml`

### Outputs

`navgraph.json` (the authority every other output here is generated from), the navigation report, the state's own record, and — in Figma — one Section per journey with frames, connectors, decision nodes, lane bands, per-frame metadata and annotations, plus the cross-feature map page, the overview page and the legend.

### Writes

`artifacts/navgraph.json` · `artifacts/navmap-report.md` · `artifacts/flow-visualization-<scope>.md` · design-file pages

### Method (the hardened contract)

| Code | Rule |
|---|---|
| **W1** | **Derive the graph; never draw it.** Every connector traces to a registry cell, and the derivation is a tool with an exit code. |
| **W2** | One Section per **journey**, never per feature. Format `FLOW-XXX • Journey Name`. |
| **W3** | Layout is a **contract**: left→right traversal order, 240–320px uniform pitch, 8pt grid, branches vertical. |
| **W4** | Arrow style carries meaning, and the **legend ships in the file**. |
| **W5** | In a Design file a connector is a **vector and does not reflow**. Regenerate wholesale; never hand-patch. |
| **W6** | Every frame carries its **own metadata**, including the prototype version it depicts. |
| **W7** | **Sync is triggered by a hash, not by memory.** A re-derivation whose edge set differs *is* the signal. |
| **W8** | A boundary is a **dated claim**. Re-derive every port each sync; record the date its status was checked. |
| **W9** | Render-backed frames are acceptable for mapping; **state variants are not optional**. |
| **W10** | **The gate passes on the report, not on the picture.** |

### The seven extensions

| Ext | Answers | Derived from |
|---|---|---|
| **E1** Swimlanes | who drives each transition — customer / admin / system / api | `reference/nav-lanes.json`; unassigned screens are **reported (`N8`), never guessed into a lane** |
| **E2** Cross-feature map | the seams — every edge crossing a feature boundary. Expect roughly half the edge set; it was 46 of 100 on the extraction run | `navgraph.json.crossFlow` |
| **E3** Heatmap | which screens are hubs — in-degree plus distinct source features. **Heat is measured, never assigned** | `navgraph.json.heat` |
| **E4** Deep links | which states QA can reach directly. Hooks are read **out of the implementation**, not out of a doc that claims them | prototype scan |
| **E5** State machines | per screen: which states exist and what moves between them. **Normalize the vocabulary first, then generate** | registry `states` column + `state-machines.json` evidence |
| **E6** Developer annotations | per edge: `nav`, `anim`, `api`, `guard`; per frame: `auth`, `perm`. **`UNKNOWN` is legal; a guess is not** | `edge-annotations.json`, re-swept every run |
| **E7** Overview page | one PM/QA page: counts, coverage, heatmap, QA paths, findings, legend, **provenance** | all of the above |

### Validation

| Rule | Condition |
|---|---|
| **V1** | Every registry entry has a frame in a Section. |
| **V2** | Every derived navigation path exists as a connector. |
| **V3** | No orphan screens — `navgraph.json` reports **0** `N2-orphan`. |
| **V4** | No broken connectors: endpoints exist, at the coordinates the connector was generated against. |
| **V5** | All branches terminate; every decision node's branch set is exhaustive. |
| **V6** | Entry and exit screens identified; every Section has ≥1 marked entry. |
| **V7** | Section names follow `FLOW-XXX • Journey Name`. |
| **V8** | Connector directions match the derived edge direction. |
| **V9** *(E1)* | Every screen has a lane, or the unlaned set is named in the report. |
| **V10** *(E4)* | Every flow's deep-link addressability is reported; a flow with no hooks is a **major** finding with a rider, not an omission. |
| **V11** *(E5)* | State labels are drawn from the closed vocabulary, with case detail as qualifiers. |
| **V12** *(E6)* | No annotation field is blank. `UNKNOWN` is legal and counted; blank is a failure. |
| **V13** *(W7)* | The committed `navgraph.json` re-derives byte-identically from the current registry. |

### Human approval

**Developer Handoff Gate** — blocks `FINAL_OUTPUT`. Grantor: the user.

It cannot pass until: the visualization is complete (V1, V2, V6, V7), the screen contract is synchronized (V13), connectors are validated (V4, V8), Sections are organized (V3, V5), navigation is unbroken (tool exit 0 at `--fail-on major`, or waivers), and the sync record is present and dated (W7).

The gate record names the **versions it saw**: the registry sha, the derivation run, and the prototype versions the frames were rendered from. Status on pass: **READY FOR DEVELOPMENT**, scoped to the flows named in `scope`.

### Exit criteria

```bash
node tools/navgraph.mjs   --fail-on major   # exit 0
node tools/stategraph.mjs --fail-on major
node tools/stateprobe.mjs
node tools/annotate.mjs   --fail-on major
```

Exit 0, or every remaining finding carries a granted waiver with a rider debt item and a closing condition. V1–V13 pass. The Developer Handoff Gate is `granted`.

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Drawing a connector by hand | An assertion nobody can re-check, and a stale arrow is indistinguishable from a fresh one. | If a route belongs in the map and not in the registry, **fix the registry**. |
| Hand-patching a detached arrow | In a Design file a connector is a vector and does not reflow. | Regenerate wholesale from `navgraph.json`. |
| Drawing an edge the flows never ratified | Drawing it *ratifies* it, and this state has no authority to rule a branch. | Back-transition to `FLOW_GENERATION`. |
| Generating before normalizing the state vocabulary | The registry carried **59 distinct free-text labels across 48 screens**, including three spellings of "empty for a new user". Generating first freezes N private vocabularies into a deliverable. | Normalize to the closed set with qualifiers, then generate. 58 qualified labels resolved to 12 canon terms with 0 findings. |
| Filling an `api` field with a plausible endpoint | Worse than an empty one, because the developer will build it. | `UNKNOWN` is legal and counted. The tool re-runs the network sweep itself rather than trusting the claim. |
| Presenting the picture at the gate | A flow map that renders beautifully over a derivation reporting broken routes is the exact failure this state exists to prevent. | Present `navmap-report.md` and the exit code. |
| Recording a finding at the wrong scope | A debt item recorded "no deep-link hook" for one flow; the mechanical scan found the same defect in **three**. | Scope the claim inside the claim, and let the sweep set the scope. |
| Treating a boundary status as permanent | A boundary promoted to a real handoff in code and never written back to the registry — caught by derivation, invisible to reading. | Re-derive every port each sync; record the date checked. A status with no date is not a status. |
| Dropping the provenance block from the overview page | It is what makes the page checkable a month later, and it is the block that gets dropped first. | It ships or the page does not. |

**What a first derivation finds.** The first run is not tool noise. On the extraction run it opened at **2 blocking · 8 major · 52 advisory**, and *every finding was a real defect in the registry*. Repairing **three cells** added **six edges** and **five cross-feature routes** — a navigation model can be 6% wrong and look complete.

### Related artifacts

`navmap-report.md` is the Developer Handoff Gate's evidence and is consumed by [11 final-output](#state-11--final_output) via `C_NAVMAP_CLEAN`.

### Expected duration

| | |
|---|---|
| Agent time | 1–3 h for a first derivation including vocabulary normalization and registry repair; 20–40 min per subsequent sync |
| Human attention | 15–30 min at the gate, reading the report |

### Dependencies

**Requires:** 05 (graphs exist) **and** 09 = `approve` for every flow being mapped.
**Required by:** 11 when `handoff_required`.
**Back-transition:** to 05 for an unratified registry route; to 10 when the registry and the prototype disagree about a route.

---

## STATE 11 · `FINAL_OUTPUT`

**Skill:** [`skills/11-final-output/`](skills/11-final-output/) · **Spec:** [`docs/workflow.md` §STATE 11](docs/workflow.md)

### Goal

Freeze the approved artifact versions, package the deliverable, write the handoff, check every completion rule explicitly, and close the machine.

### Purpose

This is the last place a wrong claim can be caught, and the only place the machine is allowed to say it is finished. Every other state produces an artifact someone downstream will check; this one produces **the record that the checking is over**.

### Inputs

- An approved `prototype/`, `review-record-<feature>.md` with outcome `approve`.
- `traceability-<feature>.md`, `audit-report-<feature>.md`, `revision-log-<feature>.md`, the full artifact set.
- When `handoff_required`: `navmap-report.md` and `flow-visualization-<scope>.md`, with the Developer Handoff Gate granted.
- `machine_state`.

### Reads

the approved artifact set · `state/machine_state.yaml`

### Outputs

`deliverable-<feature>/` containing the frozen prototype and the handoff document, plus the terminal record in `machine_state.yaml`.

### Writes

`artifacts/deliverable-<feature>/prototype/` · `artifacts/deliverable-<feature>/handoff-<feature>.md` · `state/machine_state.yaml` (terminal, **same edit**)

### Packaging method (the hardened contract)

| Code | Rule |
|---|---|
| **P1** | The approval must be **current and must name its bytes**. Classify any post-approval delta before freezing. |
| **P2** | **A freeze is a hash, not a copy.** One deliverable per approval gate. A screen that is in no frozen deliverable is not delivered, however finished it looks. |
| **P3** | V2 is checked against the **traceability matrix**, never from memory. `superseded` is a legitimate status and it names the revision that superseded it. |
| **P4** | The audit of record must have run on **the bytes being frozen**. A green audit on superseded bytes is not a green audit. |
| **P5** | Completion rule 6 needs a **revision log that exists**. A missing log reads as no evidence, not as no open items. |
| **P6** | A waiver is a legitimate exit; **silence is not** — user-granted, written into Known limitations, a numbered rider, and what would close it. |
| **P7** | **Close the machine record in the same edit as the freeze**, with a boolean *and a one-line reason* per completion rule. |
| **P8** | **Known limitations ship inside the deliverable, at full strength** — in the terms they were discovered in. |

### Validation

| Rule | Condition |
|---|---|
| **V1** | `USER_REVIEW` = `approve` and not superseded by a later change request. |
| **V2** | 100% of acceptance criteria marked `met` (or user-waived, recorded). |
| **V3** | All artifacts version-frozen and referenced. |
| **V4** | Handoff doc present. |
| **V5** *(hardened, P1+P2)* | Every frozen file is listed with its **sha256**, and that hash is the version the approval names. |
| **V6** *(hardened, P4)* | The audit of record ran on the bytes being frozen, or a waiver names its rider debt. |
| **V7** *(hardened, P5+P7)* | All six completion rules are checked **explicitly and individually**, each with a boolean and a one-line reason. Rule 6 is **failed**, not passed, when the revision log does not exist. |
| **V8** *(hardened, P6+P8)* | Every waived rule and every known limitation carries an **id**, a **rider debt item** and **what would close it**. |

### Human approval

**None additional.** Gated by the already-granted Primary User Approval Gate. Re-approval is required only if content changed post-approval — which is P1's whole subject, and is checked here rather than assumed.

### Exit criteria

All validation passes → the machine enters terminal `DONE`, with all six completion rules holding:

1. `current_state` = `DONE`.
2. `USER_REVIEW` = `approve`, scoped to the final frozen versions.
3. `C_ALL_CRITERIA_MET`.
4. `C_AUDIT_PASS` on the final prototype version.
5. `deliverable/` exists with frozen artifacts, handoff, traceability and decision log.
6. No `open` items in the latest revision log.

Plus, when `handoff_required`: the Developer Handoff Gate is granted and `C_NAVMAP_CLEAN` holds.

### Common mistakes

| Mistake | Why it costs | Instead |
|---|---|---|
| Copying a folder and calling it a freeze | Copying records nothing. | List every frozen file with its sha256, in the handoff **and** in `machine_state.freeze`. |
| Inferring which bytes the approval named | One gate record dropped `reads_versions` entirely, naming its prototype and audit only in a body table. | Go and get the naming. A record that cannot name its bytes cannot be shipped from. |
| Checking acceptance criteria from memory | One batch shipped with **no traceability matrix at all**, so V2 was not failed — it was *unevaluable*. | Check every AC id against the traceability matrix. Anything not `met` / `waived` / `superseded`, including absence, is `unmet`. |
| Shipping on an audit that predates the frozen bytes | The eventual re-run on the frozen bytes found **three more real defects**. | Compare the sha the audit ran against with the sha being frozen. If they differ, that is a `SELF_AUDIT` problem. |
| Treating a missing revision log as "no open items" | It reads as **no evidence**, and it fails rule 6. | Backfill the log, or fail the rule honestly. |
| Writing the machine record later | It sat two days and two approval rounds stale while the machine reported itself shipping. | Same edit as the freeze. |
| Softening a known limitation | The receiving team otherwise discovers it in build, at a much higher price. | At full strength, in the terms it was discovered in. |
| Recording `C3: true` with no reason | That is the same silence a waiver without a rider would be. | A boolean **and** a one-line reason, per rule. |
| Confusing `designed` with `delivered` | One flow's screens read `designed` in the registry and were never frozen into any deliverable. | A screen not in a frozen deliverable is not delivered. |

### Related artifacts

Terminal. Client-facing packages — a requirements document, a developer handoff, a data-screen contract, a design file — are **additive** to `deliverable/`, never substitutes, and each cites the frozen versions it was generated from.

### Expected duration

| | |
|---|---|
| Agent time | 20–45 min |
| Human attention | 10 min to read the handoff and the completion table |

### Dependencies

**Requires:** 09 = `approve`; and 12 with the Developer Handoff Gate granted when `handoff_required`.
**Required by:** nothing — terminal.
**Failure edge:** a completeness regression routes to `REVISION` with the **specific** unmet criteria, never a general "completeness failed".

---

## Cross-state rules

Four rules bind more than one state. They are the ones most often broken by a change that looked local.

| Rule | Statement | States it binds |
|---|---|---|
| **Scope your clearance claims** | "No boundary mocks left" was written about one flow and read as holding for the set. State the scope *inside* the claim. The mirror case: a gap recorded for one flow that a mechanical scan found in three. | 05, 07, 08, 12 |
| **An unruled question is carried, never defaulted** | An unanswered guard is an open decision (`o-<id>`), not a branch invented at build time. An invented value becomes a frozen number nobody owns. | 04, 05, 06, 07 |
| **A shared component is a cross-flow contract** | A component used by more than one flow names its owning plan, or each file re-decides it — and they drift. | 06, 07 |
| **Facts promised at a boundary are contracts** | A fact one flow promises at a `⟂` boundary belongs in both flows' decision logs, or two internally-consistent flows will disagree. | 05, 10, 11 |

### Trimming the pipeline

You can legitimately skip:

- **STATE 12** when the work is not going to a build team — `handoff_required: false`.
- **STATE 02** for a goal explicitly marked `no-research-needed` — per goal, not wholesale.

You cannot skip **STATE 08 before STATE 09**, or **STATE 09 before STATE 11**. The audit exists so the user never debugs; the gate exists so the machine never ships on its own authority.

---

[← README](README.md) · [Architecture →](ARCHITECTURE.md) · [Artifact Flow →](ARTIFACT_FLOW.md) · [Validation Engine →](VALIDATION_ENGINE.md) · [Design Principles →](DESIGN_PRINCIPLES.md) · [Method rules →](docs/method-rules.md)
