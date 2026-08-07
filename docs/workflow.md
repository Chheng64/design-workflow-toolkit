# AI Product Design Agent — Workflow Architecture

> **Type:** Workflow specification (operating procedure for an AI agent).
> **Not:** A product spec, UI design, or implementation. This document defines the *process* another AI executes, not the product it produces.
> **Modularity:** Each state below is designed to become an independent Claude Skill. State boundaries = Skill boundaries. Inputs/Outputs = Skill contracts.
> **Scope:** Product-agnostic. Nothing in this document names a product. Everything a product owns — paths, viewport, palette, design system, ports, loop ceilings — lives in [`toolkit.config.json`](../toolkit.config.json).

This is the **source of truth** for the toolkit. The twelve skills under
[`skills/`](../skills/) implement the states defined below; where a skill and this
document disagree, this document wins and the skill is the bug. The hardened
build-and-verify rules the skills carry are indexed in
[`method-rules.md`](method-rules.md); the artifact shapes they read and write are
in [`artifact-contracts.md`](artifact-contracts.md).

---

## 1. Workflow Definition

### 1.1 Purpose

Define a deterministic, resumable state machine that an AI Product Design Agent follows to take a raw product request from intake to a validated, user-approved design deliverable. The machine enforces validation gates, human approval checkpoints, and bounded feedback loops so that quality is structural rather than incidental.

### 1.2 Design Principles

| Principle | Consequence for the machine |
|-----------|-----------------------------|
| **Modular** | Every state is a self-contained Skill with a typed input/output contract. No state reaches into another's internals. |
| **Deterministic** | Given the same state + inputs + artifacts, transitions resolve identically. Randomness is not a transition input. |
| **Resumable** | State + artifact store is persisted after every transition. The machine can halt and resume at any state boundary. |
| **Gated** | The machine cannot reach `FINAL_OUTPUT` without passing every validation rule and every required approval gate. |
| **Bounded** | Every loop has a retry ceiling and an escalation path. No infinite revision cycles. |
| **Auditable** | Every transition emits a log record (from-state, to-state, trigger, timestamp, artifact hashes). |

### 1.3 Artifact Store (shared state)

All states read from and write to a single versioned artifact store. Each artifact is immutable once written; revisions create new versions. Canonical artifacts:

| Artifact ID | Produced by | Consumed by |
|-------------|-------------|-------------|
| `requirements.md` | Requirement Analysis | Research, Product Review, UX Planning |
| `research.md` | Research | Product Review, UX Planning, UI Planning |
| `product-review.md` | Product Review | UX Planning |
| `ux-plan.md` | UX Planning | Flow Generation, UI Planning |
| `flows.md` | Flow Generation | UI Planning, Prototype |
| `ui-plan.md` | UI Planning | Prototype |
| `prototype/` | Prototype | Self Audit, User Review |
| `audit-report.md` | Self Audit | User Review, Revision |
| `review-record.md` | User Review | Revision, Final Output |
| `revision-log.md` | Revision | (loop target states) |
| `navgraph.json` | Flow Visualization | Flow Visualization, Final Output |
| `navmap-report.md` | Flow Visualization | Final Output (handoff gate evidence) |
| `flow-visualization.md` | Flow Visualization | Final Output |
| `deliverable/` | Final Output | — (terminal) |

### 1.4 Global Machine State (metadata, not artifacts)

```yaml
machine_state:
  current_state: <STATE_NAME>
  entry_count: { <STATE_NAME>: <int> }      # per-state visit counter for retry ceilings
  loop_count: { <LOOP_ID>: <int> }          # per-loop iteration counter
  approvals: { <GATE_ID>: <granted|denied|pending> }
  handoff_required: <bool>                  # gates STATE 12 (developer handoff in scope?)
  blocked_reason: <string|null>
  last_transition: { from, to, trigger, ts }
  artifact_versions: { <artifact_id>: <version_hash> }
```

---

## 2. State Catalog

Legend for each state block:
- **State Name** — canonical machine identifier (also the Skill name).
- **Purpose** — the single responsibility of this state/Skill.
- **Inputs** — artifacts + metadata required to enter and run.
- **AI Skills Used** — sub-capabilities invoked internally.
- **Processing Steps** — ordered internal procedure.
- **Outputs** — artifacts written on success.
- **Validation Rules** — machine-checkable conditions on the outputs.
- **Exit Conditions** — what must be true to leave.
- **Possible Next States** — allowed transitions.
- **Failure Recovery** — what happens on validation failure or error.
- **Approval Required** — human gate, if any.

---

### STATE 01 — `REQUIREMENT_ANALYSIS`

**Purpose:** Convert an ambiguous product request into a structured, testable requirements artifact and a normalized problem statement.

**Inputs:**
- `raw_request` (user prompt / brief)
- Optional attachments (docs, links, constraints)
- `machine_state`

**AI Skills Used:** requirement extraction, ambiguity detection, assumption surfacing, scope classification, acceptance-criteria generation.

**Processing Steps:**
1. Parse `raw_request` into goals, actors, constraints, non-goals.
2. Detect ambiguity and missing information; produce an `open_questions` list.
3. Classify scope (small / medium / large) and effort tier.
4. Draft falsifiable acceptance criteria per requirement.
5. Surface assumptions explicitly, flagged as `assumed` vs `confirmed`.
6. If blocking ambiguity exists above threshold → prepare clarification set.

**Outputs:** `requirements.md` (goals, actors, constraints, non-goals, acceptance criteria, assumptions, open_questions, scope class).

**Validation Rules:**
- V1: ≥1 goal and ≥1 acceptance criterion present.
- V2: Every requirement has at least one falsifiable acceptance criterion.
- V3: No requirement tagged both `assumed` and `confirmed`.
- V4: `open_questions` either empty or each item has severity (`blocking`/`non-blocking`).

**Exit Conditions:** All validation rules pass AND no `blocking` open question remains unresolved (resolved either by user answer or explicit assumption acceptance).

**Possible Next States:**
- → `RESEARCH` (normal path).
- → `REQUIREMENT_ANALYSIS` (self-loop: re-run after clarification answers).
- → `HALT_BLOCKED` (unresolved blocking ambiguity + user unavailable).

**Failure Recovery:** On validation failure, re-run steps 1–5 with the failed rule as a corrective constraint. If `blocking` open questions exist, raise **Clarification Gate** (see §5). Retry ceiling: 3, then → `HALT_BLOCKED`.

**Approval Required:** **Clarification Gate** only when blocking ambiguity exists. No approval otherwise.

---

### STATE 02 — `RESEARCH`

**Purpose:** Gather external and internal evidence (domain, competitors, patterns, constraints) that informs product and UX decisions.

**Inputs:** `requirements.md`, `machine_state`, optional research scope config.

**AI Skills Used:** domain research, competitive scan, pattern mining, constraint discovery, evidence synthesis, source citation.

**Processing Steps:**
1. Derive research questions from `requirements.md`.
2. Fan out searches by modality (domain, competitor, interaction pattern, technical constraint).
3. Collect evidence with citations; dedupe.
4. Synthesize findings into themes; note contradictions.
5. Rank findings by relevance to acceptance criteria.
6. Emit unresolved-evidence gaps.

**Outputs:** `research.md` (themes, evidence + citations, competitor notes, pattern catalog, constraints, gaps).

**Validation Rules:**
- V1: Every theme cites ≥1 source.
- V2: Each requirement goal maps to ≥1 research theme OR is explicitly marked `no-research-needed`.
- V3: Contradictions listed, not silently resolved.
- V4: No fabricated citations (source resolvable).

**Exit Conditions:** All validation rules pass; coverage of goals ≥ configured threshold (default 100% mapped-or-waived).

**Possible Next States:**
- → `PRODUCT_REVIEW` (normal).
- → `RESEARCH` (self-loop: coverage gap).
- → `REQUIREMENT_ANALYSIS` (back-transition: research reveals requirement is malformed/contradictory).

**Failure Recovery:** On coverage/citation failure, re-run fan-out targeting the failed goals only. Retry ceiling: 2. On repeated fabrication-risk failure → downgrade unreachable themes to `gap` and continue with a logged warning.

**Approval Required:** None.

---

### STATE 03 — `PRODUCT_REVIEW`

**Purpose:** Evaluate whether the requirements + research justify the product direction; make a proceed / re-scope decision before design effort begins.

**Inputs:** `requirements.md`, `research.md`, `machine_state`.

**AI Skills Used:** product critique, prioritization (value vs effort), risk analysis, scope reconciliation, decision recording.

**Processing Steps:**
1. Reconcile requirements against research evidence.
2. Score requirements on value/effort/risk.
3. Identify contradictions between desired scope and evidence.
4. Produce a proceed / re-scope / stop recommendation with rationale.
5. Record decision and its triggers.

**Outputs:** `product-review.md` (prioritized requirement set, risk register, direction recommendation, rationale, decision record).

**Validation Rules:**
- V1: Recommendation ∈ {`proceed`, `re-scope`, `stop`} with written rationale.
- V2: Every high-risk item has a mitigation or an explicit accept-risk note.
- V3: Prioritized set is a subset of validated requirements (no new scope introduced here).

**Exit Conditions:** Validation passes AND **Direction Approval Gate** resolved.

**Possible Next States:**
- → `UX_PLANNING` (recommendation `proceed`, gate approved).
- → `REQUIREMENT_ANALYSIS` (recommendation `re-scope`).
- → `HALT_STOPPED` (recommendation `stop`, gate confirms).

**Failure Recovery:** On validation failure, re-run scoring with the failed rule as constraint. Retry ceiling: 2. If user denies direction at the gate → route to `REQUIREMENT_ANALYSIS` with denial notes.

**Approval Required:** **Direction Approval Gate** (user must approve product direction before design resources are spent). Mandatory.

---

### STATE 04 — `UX_PLANNING`

**Purpose:** Define the UX strategy — information architecture, key tasks, states, and non-happy-path coverage — without producing screens.

**Inputs:** `requirements.md`, `research.md`, `product-review.md`, `machine_state`.

**AI Skills Used:** IA modeling, task analysis, state enumeration, edge-case discovery, accessibility planning.

**Processing Steps:**
1. Derive primary user tasks from prioritized requirements.
2. Model information architecture and navigation model.
3. Enumerate states per task: happy path AND non-happy-path (error, empty, loading, interrupted, offline, permission-denied).
4. Define accessibility and reduced-motion requirements at the strategy level.
5. Note UX risks and open decisions.

**Outputs:** `ux-plan.md` (task list, IA, per-task state enumeration, edge-case matrix, accessibility strategy, open UX decisions).

**Validation Rules:**
- V1: Every primary task has enumerated happy + ≥3 non-happy-path states.
- V2: Accessibility strategy present and non-empty.
- V3: Every task traces to ≥1 prioritized requirement.
- V4: No screen-level or visual design content (strategy only).

**Exit Conditions:** Validation passes.

**Possible Next States:**
- → `FLOW_GENERATION` (normal).
- → `PRODUCT_REVIEW` (back-transition: UX planning reveals unviable priorities).
- → `UX_PLANNING` (self-loop: edge-case coverage gap).

**Failure Recovery:** On V1/V4 failure, re-run enumeration with the specific missing coverage as target. Retry ceiling: 2, then flag `partial-coverage` and continue only if `product-review` risk tolerance allows.

**Approval Required:** None (checkpoint review only, non-blocking).

---

### STATE 05 — `FLOW_GENERATION`

**Purpose:** Produce concrete user flows / state transitions connecting the UX plan's tasks and states.

**Inputs:** `ux-plan.md`, `requirements.md`, `machine_state`.

**AI Skills Used:** flow modeling, transition mapping, decision-point analysis, dead-end detection.

**Processing Steps:**
1. For each task, sequence states into directed flows.
2. Insert decision points and branch conditions.
3. Map every non-happy-path state to a recovery route.
4. Detect and eliminate dead ends and unreachable states.
5. Annotate transitions with triggers and guards.

**Outputs:** `flows.md` (per-task flow graphs, decision points, branch conditions, recovery routes, reachability report).

**Validation Rules:**
- V1: No unreachable state in any flow.
- V2: No dead-end state without an explicit terminal justification.
- V3: Every non-happy-path state from `ux-plan.md` has a recovery transition.
- V4: Every decision point has mutually exhaustive branch conditions.

**Exit Conditions:** Validation passes; reachability report clean.

**Possible Next States:**
- → `UI_PLANNING` (normal).
- → `UX_PLANNING` (back-transition: flow modeling exposes a missing state).
- → `FLOW_GENERATION` (self-loop: dead-end/reachability fix).

**Failure Recovery:** On V1/V2 failure, patch the offending flow segment and re-validate only that segment. Retry ceiling: 3. Persistent unreachable state → back-transition to `UX_PLANNING`.

**Approval Required:** None.

---

### STATE 06 — `UI_PLANNING`

**Purpose:** Define UI structure, component inventory, and design-system usage plan — still specification, not rendered UI.

**Inputs:** `flows.md`, `ux-plan.md`, `research.md`, `machine_state`, design-system reference (if provided).

**AI Skills Used:** component decomposition, design-system mapping, layout planning, token/primitive selection, reuse analysis.

**Processing Steps:**
1. Decompose each flow state into required UI regions/components.
2. Map components to existing design-system primitives first; flag gaps needing extension.
3. Define layout and hierarchy rules per state.
4. Specify tokens (spacing, color, typography, motion) by reference, not values invented ad hoc.
5. Produce component inventory with reuse-vs-new classification.

**Outputs:** `ui-plan.md` (component inventory, DS mapping, layout rules, token references, extension requests, reuse report).

**Validation Rules:**
- V1: Every flow state maps to a component set.
- V2: Component-to-DS mapping prefers reuse; every `new` component has a justification.
- V3: No isolated one-off styling introduced where a DS primitive exists.
- V4: Token references resolve to the provided design system (or are flagged as extension).

**Exit Conditions:** Validation passes.

**Possible Next States:**
- → `PROTOTYPE` (normal).
- → `FLOW_GENERATION` (back-transition: UI planning reveals a flow gap).
- → `UI_PLANNING` (self-loop: reuse/mapping fix).

**Failure Recovery:** On V2/V3 failure, re-map offending components toward DS reuse. Retry ceiling: 2. Unavoidable new components → route through an **Extension Note** appended to `ui-plan.md` (informational, non-blocking).

**Approval Required:** None (may raise informational Extension Note).

---

### STATE 07 — `PROTOTYPE`

**Purpose:** Assemble the planned UI + flows into a coherent prototype artifact per the specifications produced upstream.

**Inputs:** `ui-plan.md`, `flows.md`, `ux-plan.md`, `machine_state`.

**AI Skills Used:** assembly/composition, spec-to-artifact translation, consistency enforcement, state wiring.

**Processing Steps:**
1. Instantiate each flow state using the component inventory.
2. Wire transitions per `flows.md` (including recovery routes).
3. Apply DS tokens/primitives per `ui-plan.md`.
4. Ensure cross-state consistency (naming, hierarchy, motion).
5. Produce a traceability map: prototype element → source spec.

**Outputs:** `prototype/` (assembled artifact) + `traceability.md`.

**Validation Rules:**
- V1: Every flow state from `flows.md` is represented.
- V2: Every prototype element traces to a spec entry (no un-specced additions).
- V3: DS token usage matches `ui-plan.md` references.
- V4: All wired transitions correspond to defined flow transitions.

**Exit Conditions:** Validation passes; traceability complete.

**Possible Next States:**
- → `SELF_AUDIT` (normal).
- → `UI_PLANNING` (back-transition: spec insufficient to assemble).
- → `PROTOTYPE` (self-loop: assembly fix).

**Failure Recovery:** On V1/V2 failure, assemble missing states or remove un-specced additions, then re-validate. Retry ceiling: 3. Repeated spec insufficiency → back-transition to `UI_PLANNING`.

**Approval Required:** None.

---

### STATE 08 — `SELF_AUDIT`

**Purpose:** Machine self-review of the prototype against all upstream specs and quality dimensions before showing the user.

**Inputs:** `prototype/`, `traceability.md`, all upstream artifacts, `machine_state`.

**AI Skills Used:** adversarial review, spec-conformance checking, accessibility audit, consistency audit, edge-case coverage audit.

**Processing Steps:**
1. Check prototype conformance to requirements → flows → UI plan.
2. Run accessibility + reduced-motion audit against `ux-plan.md` strategy.
3. Verify non-happy-path coverage is present and reachable.
4. Detect inconsistencies, orphan elements, unmet acceptance criteria.
5. Classify findings by severity (`blocker`/`major`/`minor`).
6. Emit pass/fail verdict.

**Outputs:** `audit-report.md` (findings by severity, conformance matrix, verdict).

**Validation Rules:**
- V1: Every acceptance criterion from `requirements.md` is marked met / unmet with evidence.
- V2: Zero unresolved `blocker` findings to pass.
- V3: Accessibility audit executed (not skipped).
- V4: Verdict ∈ {`pass`, `fail`} with rationale.

**Exit Conditions:**
- `pass` → proceed to user.
- `fail` → route to revision.

**Possible Next States:**
- → `USER_REVIEW` (verdict `pass`).
- → `REVISION` (verdict `fail`, `blocker`/`major` findings).
- → `SELF_AUDIT` (self-loop: re-audit after in-place minor fix, bounded).

**Failure Recovery:** `fail` verdict is a normal outcome, not an error → deterministic route to `REVISION` with findings attached. Internal audit error (e.g., missing input) → back-transition to the state that owed the missing artifact.

**Approval Required:** None (this is the machine gating itself before spending user attention).

---

### STATE 09 — `USER_REVIEW`

**Purpose:** Present the audited prototype to the user and capture structured approval or change requests.

**Inputs:** `prototype/`, `audit-report.md`, `machine_state`.

**AI Skills Used:** review packaging, local serving (run local), change-request structuring, feedback classification, expectation reconciliation.

**Processing Steps:**
1. **Run Local (default):** serve `prototype/` over local HTTP and open the player entry point (`prototype/play.html`, feature-switch dropdown). If a server is already listening → **Refresh Run Local**: reuse it and reopen the player. Standard command: `prototype/run-local.sh [port]` (default port 8765). Record the player URL.
2. Package prototype + audit summary for human review (review happens against the *running* local prototype, not static files).
3. Present known limitations transparently (from `audit-report.md`).
4. Capture user response: `approve` / `request-changes` / `reject`.
5. Structure change requests into actionable, spec-linked items with target state.
6. Record the review outcome.

**Outputs:** `review-record.md` (decision, structured change requests each tagged with target state, verbatim feedback, player URL used for review, timestamp).

**Validation Rules:**
- V1: Outcome ∈ {`approve`, `request-changes`, `reject`}.
- V2: If `request-changes`, ≥1 change request, each linked to a target state.
- V3: No change request silently dropped.
- V4: Run Local executed — review conducted against a served prototype (player URL recorded in `review-record.md`), not file previews.

**Exit Conditions:** User decision captured and structured.

**Possible Next States:**
- → `FLOW_VISUALIZATION` (`approve` AND `C_HANDOFF_REQUIRED`).
- → `FINAL_OUTPUT` (`approve` AND NOT `C_HANDOFF_REQUIRED`).
- → `REVISION` (`request-changes`).
- → `REQUIREMENT_ANALYSIS` (`reject` — direction wrong at root).

**Failure Recovery:** If user is unavailable → `HALT_BLOCKED` (state persisted, resumable). If feedback is ambiguous → targeted clarification sub-prompt before structuring (bounded to 2 rounds), else record as `non-blocking` note.

**Approval Required:** **Primary User Approval Gate.** This is the central human gate of the machine.

---

### STATE 10 — `REVISION`

**Purpose:** Apply audit findings and/or user change requests by routing work back to the correct upstream state(s), tracking each change to closure.

**Inputs:** `audit-report.md` and/or `review-record.md`, all artifacts, `machine_state`.

**AI Skills Used:** change triage, root-cause routing, impact analysis, revision tracking.

**Processing Steps:**
1. Merge findings + change requests into a single change set.
2. Triage each change to its root-cause state (requirements? flow? UI? prototype?).
3. Order changes by dependency (upstream before downstream).
4. Dispatch to target state(s) via back-transition; on return, re-run downstream states as needed.
5. Track each change item to `resolved` / `deferred` with reason.

**Outputs:** `revision-log.md` (change set, routing decisions, per-item status, iteration number).

**Validation Rules:**
- V1: Every change item has a target state and a status.
- V2: No change item left `open` at state exit (must be `resolved` or explicitly `deferred`).
- V3: Iteration number incremented; loop ceiling not exceeded.

**Exit Conditions:** All change items `resolved` or `deferred`; downstream states re-validated.

**Possible Next States (dispatch targets):**
- → `REQUIREMENT_ANALYSIS` / `RESEARCH` / `PRODUCT_REVIEW` / `UX_PLANNING` / `FLOW_GENERATION` / `UI_PLANNING` / `PROTOTYPE` (root-cause routing).
- → `SELF_AUDIT` (after downstream rebuild, before returning to user).
- → `HALT_BLOCKED` (revision loop ceiling exceeded — escalate).

**Failure Recovery:** If loop ceiling (default 3 full revision cycles) is hit → `HALT_BLOCKED` with an escalation summary of unresolved items rather than looping indefinitely. Conflicting change requests → surface conflict to user (mini-gate) before dispatch.

**Approval Required:** None to *start* revision. Re-approval happens when the loop returns to `USER_REVIEW`.

---

### STATE 12 — `FLOW_VISUALIZATION` *(module DWF-05)*

**Purpose:** Generate the navigation visualization inside the design file so the approved design is *ready for development*, not merely visually complete. Sits on the `USER_REVIEW (approve) → FINAL_OUTPUT` edge; skipped when `handoff_required` is false.

> Numbered 12 by authoring order, not by machine order. STATE 05 rules what a flow *is* and is deliberately screen-free; STATE 12 proves the design file *says so* to a developer who was not in the room, and is screen-only.

**Inputs:** `flows.md`, `screen-registry.csv`, `nav-lanes.json`, `prototype/`, `traceability.md`, the design file, `machine_state`.

**AI Skills Used:** graph derivation, layout generation, connector generation, cross-feature seam analysis, deep-link scanning, annotation synthesis, design-file write (`use_figma`).

**Processing Steps:**
1. Derive the navigation graph from the screen registry (tool, not hand-drawing).
2. Reconcile the derived graph against the ratified flow graphs; disagreements are findings, not merges.
3. Lay out one Section per journey — left→right, 8pt grid, branches vertical.
4. Draw connectors styled by class, each labelled with trigger / action / condition.
5. Place decision nodes with mutually exhaustive branch labels carried from the flow guards.
6. Stamp screen metadata (ID, name, route, feature, flow, version, status) on every frame.
7. Generate extensions **E1–E7**: swimlanes · cross-feature map · navigation heatmap · deep-link addressing · per-screen state machines · developer annotations · PM/QA overview page.
8. Validate, then present the report — not the picture — at the gate.

**Outputs:** `navgraph.json`, `navmap-report.md`, `flow-visualization.md`, and the design-file Sections, cross-feature map, overview page and legend.

**Validation Rules:**
- V1: Every registry entry has a frame in a Section.
- V2: Every derived navigation path exists as a connector.
- V3: No orphan screens.
- V4: No broken connectors (endpoints exist, generated against current coordinates).
- V5: All branches terminate; every decision node's branch set is exhaustive.
- V6: Entry and exit screens identified per Section.
- V7: Section names follow `FLOW-XXX • Journey Name`.
- V8: Connector directions match derived edge direction.
- V9–V13: extension and freshness rules — lane coverage reported, deep-link addressability reported per flow, state labels drawn from a closed vocabulary, no blank annotation field (`UNKNOWN` legal and counted), and the committed derivation re-derives identically from the current registry.

**Exit Conditions:** Derivation exits clean at the configured severity, or every remaining finding carries a granted waiver with a rider debt item; V1–V13 pass; **Developer Handoff Gate** granted.

**Possible Next States:**
- → `FINAL_OUTPUT` (gate granted).
- → `FLOW_GENERATION` (a registry route exists that no flow graph ratified — this state may not rule a branch).
- → `REVISION` (registry and prototype disagree about a route).
- → `FLOW_VISUALIZATION` (self-loop: sync or connector regeneration).

**Failure Recovery:** Connector/layout faults regenerate wholesale from the derived graph — never hand-patched. Derivation drift re-runs the derivation and records the edge-set delta. Retry ceiling: 3, then back-transition to `FLOW_GENERATION`.

**Approval Required:** **Developer Handoff Gate.** Blocks `FINAL_OUTPUT`. The gate record names the versions it saw (registry sha, derivation run, prototype versions).

---

### STATE 11 — `FINAL_OUTPUT`

**Purpose:** Produce the finalized, packaged deliverable and close the workflow.

**Inputs:** approved `prototype/`, `review-record.md` (`approve`), full artifact set, `navmap-report.md` + `flow-visualization.md` when `handoff_required`, `machine_state`.

**AI Skills Used:** packaging, artifact finalization, handoff-doc generation, completeness verification.

**Processing Steps:**
1. Verify `USER_REVIEW` outcome is `approve` and current.
2. Freeze artifact versions; assemble final package.
3. Generate handoff documentation (decisions, traceability, known limitations).
4. Run final completeness check against acceptance criteria.
5. Emit terminal record and close machine.

**Outputs:** `deliverable/` (frozen prototype + handoff doc + traceability + decision log).

**Validation Rules:**
- V1: `USER_REVIEW` = `approve` and not superseded by a later change request.
- V2: 100% of acceptance criteria marked `met` (or user-waived, recorded).
- V3: All artifacts version-frozen and referenced.
- V4: Handoff doc present.

**Exit Conditions:** All validation passes → machine enters terminal `DONE`.

**Possible Next States:**
- → `DONE` (terminal success).
- → `REVISION` (final completeness check fails — regression caught at the last gate).

**Failure Recovery:** If V2 fails at the last moment, do **not** ship → route to `REVISION` with the specific unmet criteria. No silent shipping of incomplete work.

**Approval Required:** None additional (final packaging is gated by the already-granted Primary User Approval; re-approval only if content changes post-approval).

---

## 3. Transitions (consolidated table)

| From | Trigger / Condition | To |
|------|---------------------|-----|
| `REQUIREMENT_ANALYSIS` | validation pass, no blocking ambiguity | `RESEARCH` |
| `REQUIREMENT_ANALYSIS` | clarification answered | `REQUIREMENT_ANALYSIS` |
| `REQUIREMENT_ANALYSIS` | blocking ambiguity, user unavailable | `HALT_BLOCKED` |
| `RESEARCH` | validation pass, coverage met | `PRODUCT_REVIEW` |
| `RESEARCH` | coverage gap | `RESEARCH` |
| `RESEARCH` | requirement malformed | `REQUIREMENT_ANALYSIS` |
| `PRODUCT_REVIEW` | `proceed` + Direction Gate approved | `UX_PLANNING` |
| `PRODUCT_REVIEW` | `re-scope` | `REQUIREMENT_ANALYSIS` |
| `PRODUCT_REVIEW` | `stop` confirmed | `HALT_STOPPED` |
| `UX_PLANNING` | validation pass | `FLOW_GENERATION` |
| `UX_PLANNING` | unviable priorities | `PRODUCT_REVIEW` |
| `FLOW_GENERATION` | validation pass | `UI_PLANNING` |
| `FLOW_GENERATION` | missing state discovered | `UX_PLANNING` |
| `UI_PLANNING` | validation pass | `PROTOTYPE` |
| `UI_PLANNING` | flow gap discovered | `FLOW_GENERATION` |
| `PROTOTYPE` | validation pass | `SELF_AUDIT` |
| `PROTOTYPE` | spec insufficient | `UI_PLANNING` |
| `SELF_AUDIT` | verdict `pass` | `USER_REVIEW` |
| `SELF_AUDIT` | verdict `fail` | `REVISION` |
| `USER_REVIEW` | `approve` + `C_HANDOFF_REQUIRED` | `FLOW_VISUALIZATION` |
| `USER_REVIEW` | `approve` + ¬`C_HANDOFF_REQUIRED` | `FINAL_OUTPUT` |
| `USER_REVIEW` | `request-changes` | `REVISION` |
| `USER_REVIEW` | `reject` | `REQUIREMENT_ANALYSIS` |
| `USER_REVIEW` | user unavailable | `HALT_BLOCKED` |
| `REVISION` | dispatch to root cause | any upstream state |
| `REVISION` | rebuild complete | `SELF_AUDIT` |
| `REVISION` | loop ceiling exceeded | `HALT_BLOCKED` |
| `FLOW_VISUALIZATION` | Developer Handoff Gate granted | `FINAL_OUTPUT` |
| `FLOW_VISUALIZATION` | unratified registry route | `FLOW_GENERATION` |
| `FLOW_VISUALIZATION` | registry ↔ prototype route conflict | `REVISION` |
| `FLOW_VISUALIZATION` | sync / connector regeneration | `FLOW_VISUALIZATION` |
| `FINAL_OUTPUT` | validation pass | `DONE` |
| `FINAL_OUTPUT` | completeness regression | `REVISION` |

**Terminal states:** `DONE` (success), `HALT_STOPPED` (deliberate stop), `HALT_BLOCKED` (resumable pause pending human/unblock).

---

## 4. Conditions (guard reference)

| Condition ID | Definition |
|--------------|-----------|
| `C_VALID(state)` | All validation rules of `state` pass. |
| `C_NO_BLOCKING_Q` | No `open_question` with severity `blocking` unresolved. |
| `C_COVERAGE_MET` | Goal-to-theme (or goal-to-task) mapping ≥ threshold. |
| `C_AUDIT_PASS` | `audit-report.md` verdict = `pass`, zero `blocker`. |
| `C_APPROVED(gate)` | `machine_state.approvals[gate]` = `granted`. |
| `C_LOOP_OK(loop)` | `machine_state.loop_count[loop]` < ceiling. |
| `C_RETRY_OK(state)` | `machine_state.entry_count[state]` < retry ceiling. |
| `C_ALL_CRITERIA_MET` | 100% acceptance criteria `met` or `waived`. |
| `C_HANDOFF_REQUIRED` | `machine_state.handoff_required` = true — the scope is going to a build team, so the navigation visualization is in scope. |
| `C_NAVMAP_CLEAN` | Navigation derivation exits clean at the configured severity, or every remaining finding carries a granted waiver + rider debt item. |

A forward transition fires only if its guard conjunction holds. If a guard fails, the machine takes the state's Failure Recovery path, not the forward edge.

---

## 5. Approval Gates

| Gate ID | Location | Blocks | Grantor | On deny |
|---------|----------|--------|---------|---------|
| **Clarification Gate** | `REQUIREMENT_ANALYSIS` | leaving with unresolved blocking ambiguity | user | self-loop or `HALT_BLOCKED` |
| **Direction Approval Gate** | `PRODUCT_REVIEW` → `UX_PLANNING` | spending design effort on unapproved direction | user | → `REQUIREMENT_ANALYSIS` |
| **Primary User Approval Gate** | `USER_REVIEW` → `FINAL_OUTPUT` | shipping unapproved deliverable | user | → `REVISION` or `REQUIREMENT_ANALYSIS` |
| **Conflict Mini-Gate** | `REVISION` | dispatching conflicting change requests | user | user resolves conflict, then dispatch |
| **Developer Handoff Gate** | `FLOW_VISUALIZATION` → `FINAL_OUTPUT` | shipping a design a build team cannot navigate from | user | self-loop, or → `FLOW_GENERATION` / `REVISION` per the failing rule |

Rules:
- No forward transition through a gate without `C_APPROVED(gate)`.
- Gate state persists in `machine_state.approvals`; resumable.
- An approval is scoped to the artifact versions it saw. If artifacts change after approval, the gate reverts to `pending` (prevents stale-approval shipping).

---

## 6. Retry Logic

**Per-state retry (validation failure within a state):**
- Each state has a retry ceiling (default 2, prototype/flow-heavy states 3).
- On validation failure: re-run the state's processing steps with the failed rule injected as a corrective constraint.
- Increment `entry_count[state]`. When `C_RETRY_OK(state)` is false → take the state's declared escalation edge (usually a back-transition or `HALT_BLOCKED`).

**Retry vs back-transition distinction:**
- **Retry (self-loop):** the fault is *inside* this state's output → fix here.
- **Back-transition:** the fault's root cause is *upstream* → route to the owning state.

**Error (non-validation) handling:**
- Missing required input artifact → back-transition to the producing state.
- Tool/skill runtime error → retry the failed step up to 2 times, then escalate to `HALT_BLOCKED` with diagnostic.

---

## 7. Loop Logic

| Loop ID | Path | Ceiling | On ceiling breach |
|---------|------|---------|-------------------|
| `L_CLARIFY` | `REQUIREMENT_ANALYSIS` self-loop | 3 | `HALT_BLOCKED` |
| `L_RESEARCH` | `RESEARCH` self-loop | 2 | continue with logged `gap` |
| `L_UX_EDGE` | `UX_PLANNING` self-loop | 2 | `partial-coverage` flag |
| `L_REVISION` | `USER_REVIEW` → `REVISION` → upstream → `SELF_AUDIT` → `USER_REVIEW` | 3 full cycles | `HALT_BLOCKED` + escalation summary |
| `L_AUDIT_FIX` | `SELF_AUDIT` ↔ `REVISION` | 3 | escalate into `L_REVISION` accounting |

Loop invariants:
- Every loop increments a counter *before* re-entry, checked by `C_LOOP_OK`.
- The **Revision Loop** (`L_REVISION`) is the primary product loop. It must always terminate by either (a) user `approve`, or (b) ceiling → `HALT_BLOCKED`. It can never silently continue.
- Deduplicate against a `seen_changes` set so a rejected change does not re-enter the loop endlessly.

---

## 8. Completion Rules

The workflow is **complete** only when ALL hold:

1. `machine_state.current_state` = `DONE`.
2. `USER_REVIEW` outcome = `approve`, scoped to the final frozen artifact versions (not superseded).
3. `C_ALL_CRITERIA_MET` = true (every acceptance criterion `met` or explicitly `waived` with record).
4. `C_AUDIT_PASS` held on the final prototype version.
5. `deliverable/` exists with frozen artifacts + handoff doc + traceability + decision log.
6. No `open` change items in the latest `revision-log.md`.
7. When `handoff_required`: the **Developer Handoff Gate** is `granted`, and `navmap-report.md` is clean or carries waivers with rider debt items (`C_NAVMAP_CLEAN`).

**Deliberate non-completion terminals:**
- `HALT_STOPPED` — Product Review or user chose `stop`. Recorded with rationale. Not a failure; an intentional end.
- `HALT_BLOCKED` — machine paused pending human input or unblock. Fully persisted; resumable at the exact state. Not terminal-final.

**Anti-patterns the machine forbids:**
- Reaching `FINAL_OUTPUT` without the Primary User Approval Gate.
- Shipping with unmet acceptance criteria (V2 of Final Output).
- Infinite revision (bounded by `L_REVISION`).
- Stale approval shipping (gate reverts to `pending` on artifact change).
- Introducing scope in `PRODUCT_REVIEW` or later that was never validated in `REQUIREMENT_ANALYSIS`.

---

## 9. Skill Decomposition Map

Each state → one independent Claude Skill. Skill contract = state's Inputs (read) and Outputs (write). Skills communicate only through the artifact store, never directly.

| Skill (state) | Reads | Writes | Depends on (must precede) |
|---------------|-------|--------|---------------------------|
| `requirement-analysis` | raw_request | requirements.md | — |
| `research` | requirements.md | research.md | requirement-analysis |
| `product-review` | requirements.md, research.md | product-review.md | research |
| `ux-planning` | requirements, research, product-review | ux-plan.md | product-review |
| `flow-generation` | ux-plan.md | flows.md | ux-planning |
| `ui-planning` | flows.md, ux-plan.md, research.md | ui-plan.md | flow-generation |
| `prototype` | ui-plan.md, flows.md, ux-plan.md | prototype/, traceability.md | ui-planning |
| `self-audit` | prototype/ + all upstream | audit-report.md | prototype |
| `user-review` | prototype/, audit-report.md | review-record.md | self-audit |
| `revision` | audit-report.md, review-record.md | revision-log.md | user-review OR self-audit |
| `flow-visualization` | flows.md, screen-registry.csv, nav-lanes.json, prototype/, design file | navgraph.json, navmap-report.md, flow-visualization.md, design-file flow pages | flow-generation + user-review (approve) |
| `final-output` | approved artifacts (+ navmap-report.md when handoff is in scope) | deliverable/ | user-review (approve), flow-visualization (gate granted) |

**Invocation order (happy path):**
`requirement-analysis → research → product-review → ux-planning → flow-generation → ui-planning → prototype → self-audit → user-review → flow-visualization → final-output`

`flow-visualization` is skipped when `handoff_required` is false; every other step is unconditional.

**Orchestrator responsibility (not a Skill):** hold `machine_state`, evaluate guards/conditions, fire transitions, enforce gates and loop ceilings, persist state after each transition. The orchestrator is the state machine; the Skills are the states.

---

## 10. Machine Diagram (textual)

```
[REQUIREMENT_ANALYSIS] --pass--> [RESEARCH] --pass--> [PRODUCT_REVIEW]
        ^  ^  ^                       |                     | proceed(gate)
        |  |  |  re-scope             | malformed           v
        |  |  +------------------------+              [UX_PLANNING]
        |  |                                               |
        |  | reject                                        | pass
        |  |                                               v
        |  |                                        [FLOW_GENERATION]
        |  |                                               |
        |  |                          missing-state <------+  pass
        |  |                                               v
        |  |                                         [UI_PLANNING]
        |  |                            flow-gap <--------+  pass
        |  |                                               v
        |  |                                          [PROTOTYPE]
        |  |                        spec-insufficient <---+  pass
        |  |                                               v
        |  |                                         [SELF_AUDIT]
        |  |                                       fail /       \ pass
        |  |                                          v          v
        |  |                                     [REVISION] <--[USER_REVIEW]
        |  |            dispatch to any upstream ---/   |  \ request-changes
        |  +--------------------------------------------+   \
        |               reject                               \ approve
        |                                                      v
        |                                          [FLOW_VISUALIZATION]  (skipped if
        |                            unratified-route <------+  |         no handoff)
        |                            route-conflict → REVISION  | Developer Handoff Gate
        |                                                       v
        +---------------------------------------------- [FINAL_OUTPUT] --pass--> (DONE)
                                                              |
                                                    completeness-fail
                                                              v
                                                         [REVISION]

Terminals: (DONE) | (HALT_STOPPED) | (HALT_BLOCKED, resumable)
```

---

## 11. Usage Note

This document is **reference material / standard operating procedure**. It does not instruct execution of any stage. An agent should run a stage only when the user's current request explicitly asks for that work. Absent an explicit task, treat this as the operating manual, not a trigger.
