---
name: flow-visualization
description: >-
  STATE 12 of the AI Product Design Agent workflow (module DWF-05), on the edge
  between the Primary User Approval Gate and delivery. Turns the approved flow
  graphs into a navigation map a developer can build from without asking a
  designer a question: journey sections, styled connectors carrying trigger and
  guard, decision nodes, screen metadata, swimlanes, a cross-feature map, a
  navigation heatmap, deep-link addressing, per-screen state machines, developer
  annotations, and a PM/QA overview page. Use when flows are ratified and the
  work is heading for developer handoff: every connector is derived from the
  screen registry rather than drawn, the derivation is a tool with an exit code,
  a boundary is treated as a dated claim rather than a permanent property, and
  the gate passes on the report rather than on the picture. Reads flows-*.md,
  reference/screen-registry.csv, reference/nav-lanes.json, the prototype and the
  design file; writes navgraph.json, navmap-report.md, the design-file flow pages
  and flow-visualization-<scope>.md. Depends on flow-generation and on user-review
  (`approve`). Approval gate: Developer Handoff Gate.
---

# Flow Visualization & Navigation Mapping (STATE 12 · DWF-05)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 12,
> §3 Transitions, §5 Approval Gates.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests navigation mapping. It
> communicates only through the artifact store (`artifacts/`), never directly
> with other skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | `artifacts/flows-<feature>.md`, `reference/screen-registry.csv`, `reference/nav-lanes.json`, `artifacts/prototype/` (hook scan), `artifacts/traceability-<feature>.md`, `artifacts/deliverable-*/handoff-*.md`, the Figma design file, `machine_state` |
| Writes | `artifacts/navgraph.json`, `artifacts/navmap-report.md`, `artifacts/flow-visualization-<scope>.md`, and the Figma flow sections / cross-feature map / overview page |
| Depends on | `flow-generation` (graphs exist) **and** `user-review` = `approve` for every flow being mapped |
| Approval gate | **Developer Handoff Gate** — blocks `FINAL_OUTPUT` |
| Retry ceiling | §6 flow-heavy **3**, then back-transition to `FLOW_GENERATION` |
| Next states | `FINAL_OUTPUT` (normal) / `FLOW_GENERATION` (a route exists in the registry that no flow graph ratified) / `REVISION` (registry and prototype disagree about a route) / `FLOW_VISUALIZATION` (self-loop, sync or connector fix) |

## Purpose

Generate the navigation visualization inside the design file so the design is
**ready for development**, not merely visually complete.

## Why this is not STATE 05

`FLOW_GENERATION` and this state both hold graphs, and they are not the same
object.

| | STATE 05 · `FLOW_GENERATION` | STATE 12 · `FLOW_VISUALIZATION` |
|---|---|---|
| Node | a *state the user is in* | a *frame in the design file* |
| Question | is this flow correct? | can a developer build from this file without asking? |
| Screens | deliberately screen-free | screen-only — a node with no frame is a finding |
| Truth | ratified by review of the prototype | derived from the registry, checked by exit code |
| When | before any screen is named | after the approval gate, before the freeze |

STATE 05 rules what the flow *is*. STATE 12 proves the design file *says so*, to
somebody who was not in the room. A flow graph can be perfect and still hand off
badly: the extraction run shipped eight per-flow map pages and still could not
answer *"which screens does the home screen reach, and which reach it"* without a
person reading eleven documents.

## Processing steps

1. **Derive** the navigation graph from the registry — `tools/navgraph.mjs`.
2. **Reconcile** the derived graph against `flows-<feature>.md`. Registry routes
   with no ratified edge, and ratified edges with no registry route, are
   findings, not merge candidates.
3. **Lay out** one Figma Section per journey, screens left → right on an 8pt
   grid, branches vertical, merges reconnecting cleanly.
4. **Draw** connectors, styled by class, each carrying its trigger / action /
   condition label.
5. **Place** decision nodes at every branch, with mutually exhaustive labels
   carried over from the flow graph's guards.
6. **Stamp** screen metadata on every frame (W6).
7. **Generate** the enterprise layers E1–E7 (swimlanes, cross-feature map,
   heatmap, deep links, state machines, developer annotations, overview page).
8. **Validate**, then present the report — not the picture — at the gate.

## Method (hardened)

Each rule below was written by something that went wrong at, or just past,
handoff. Codes are cited from reports and gate records — index in
[`docs/method-rules.md`](../../docs/method-rules.md).

### W1 — Derive the graph; never draw it

Every connector in the file traces to a cell in `reference/screen-registry.csv`.
The derivation is a tool with an exit code, so "the map matches the registry" is
a check rather than a claim:

```bash
node tools/navgraph.mjs --fail-on major
# → artifacts/navgraph.json  (nodes, edges, heat, states, deep links, findings)
# → artifacts/navmap-report.md
```

Paths come from `toolkit.config.json`; the registry it reads is
`paths.registry`. A connector drawn by hand is an assertion nobody can re-check. If a route
belongs in the map and not in the registry, the fix is to fix the registry.

### W2 — One Section per journey, never per feature

```
FLOW-001 • New User Onboarding
FLOW-002 • Existing User Login
FLOW-003 • Password Reset
```

Section name format is `FLOW-XXX • Journey Name`. Journeys do not share a
Section, because the reason to open a Section is to follow one path end to end.
A Section named after a *feature* silently becomes a bucket, and a bucket
answers no question.

### W3 — Layout is a contract, not taste

- Screens ordered left → right in traversal order.
- 240–320 px between frames, uniform within a Section.
- Everything on the 8pt grid.
- Branches descend vertically from their decision node; merge points reconnect
  to the main line rather than crossing it.

A reviewer scanning right is reading the happy path. That only holds if the
ordering is enforced, so it is checked (**V4**), not assumed.

### W4 — Arrow style carries meaning, and the legend ships in the file

| Class | Style | Means |
|---|---|---|
| Primary navigation | solid 2 px, arrow head | the ratified happy route |
| Alternative path | dashed | a ruled non-default branch |
| Error / failure | red dashed | a route taken only on failure |
| Modal / sheet | curved | overlay, not a view push |
| External link | dotted | leaves the app |

Without a **Flow Legend** frame in the same file, four line styles are
decoration. The legend is part of the output, not documentation about it.

### W5 — In a Design file, a connector is a vector and it does not reflow

Figma's connector object — the one that re-routes when a frame moves — is
**FigJam**. In a Design file the arrows are vectors: move a frame and the arrow
stays where it was, still looking correct. This is the single most dangerous
property of the artifact, because a stale arrow is indistinguishable from a
fresh one.

Two consequences, both binding:

1. Connectors are **regenerated wholesale** from `navgraph.json` on every sync.
   They are never hand-patched — a hand patch is a fact that exists in exactly
   one place.
2. When a journey is large or volatile enough that regeneration is expensive,
   the auto-routing copy belongs in **FigJam** (`generate_diagram` /
   `get_figjam`), and the Design file carries the frames. `navgraph.json` stays
   the authority for both.

`use_figma` writes require the `/figma-use` skill loaded first — mandatory,
every call, no exceptions.

### W6 — Every frame carries its own metadata

Seven fields, on the frame, in the file:

```
Screen ID · Screen Name · Route · Feature · Flow · Version · Status
```

`Version` is the prototype version the frame was rendered from
(`proto-<feature>-NN`), and `Status` is the registry status. A frame that cannot
say which bytes it depicts cannot be checked against them — which is exactly how
Study's Figma page drifted four revision rounds behind the prototype (R5–R8) and
nothing detected it.

### W7 — Sync is triggered by a hash, not by memory

Whenever a screen is renamed, moved, deleted, added, or re-routed, the map is
out of date. The trigger is mechanical: `navgraph.json` records the registry it
was derived from, and a re-derivation whose edge set differs from the committed
one **is** the sync signal. On that signal:

1. Regenerate connectors (W5).
2. Re-lay the Section (W3).
3. Refresh decision nodes and flow labels.
4. Re-run E2/E3 (a new edge changes the cross-feature map and the heatmap).
5. Record the change in the requirements document and in
   `flow-visualization-<scope>.md`.

"We updated the Figma" is not a sync record. A diff of the edge set is.

### W8 — A boundary is a dated claim

`skills/05`'s `⟂` boundary node is correct **when written** and silently wrong
the moment the owning flow ships. The extraction run carried **eleven live boundary
call sites** routing to a placeholder long after every destination flow existed.

In this state the equivalent is a cross-feature port drawn as external when the
target is now a real frame in the same file. So: every boundary port is
re-derived from `navgraph.json` at each sync, and the boundary table records the
**date** its status was last checked. A status with no date is not a status.

### W9 — Render-backed frames are fine here; state variants are not optional

This file's 48 screens are **render-backed images, not component-decomposed
vector designs**. For navigation mapping that is acceptable — connectors attach
to the frame, and the frame is the node.

What is *not* optional is that every state a screen can be in exists as its own
frame. E5 attaches a state machine to a screen; if `loading` and `error` live
only inside the prototype, the state diagram has nothing to point at, and the
developer reads the map as "this screen has one state". The delivery pass built
93 frames for 48 screens precisely because of this.

### W10 — The gate passes on the report, not on the picture

A screenshot of a flow map is persuasive and proves nothing. What is presented
at the Developer Handoff Gate is `navmap-report.md` plus the tool's exit code,
with every finding either cleared or carrying a named waiver and a rider debt
item (`skills/11` P6). A picture that looks right over a report that says
`2 blocking` is the exact failure this state exists to prevent.

## Enterprise extensions

E1–E7 are not optional garnish; each one answers a question the base map cannot,
and each is **derived** by the same tool that derives the edges. An extension
that has to be maintained by hand is an extension that goes stale — so where the
data does not exist, the extension reports its absence instead of inventing it.

### E1 — Swimlane layout (Customer / Admin / System / API)

Within a Section, frames are banded into horizontal lanes by the actor that
drives the transition. Lane order is fixed top → bottom so lanes read the same
across every Section: `customer · admin · system · api`.

**Derivation.** The registry has no actor column, so lanes come from the lane file
named in `toolkit.config.json` → `paths.lanes`. Unassigned screens are reported
(`N8`), never guessed into a lane, because a wrong lane reads as a ruling about
who owns a screen.

**A single-actor product is the honest degenerate case**: every screen in
`customer`, with `admin`, `system` and `api` declared and empty. That was the
extraction run's output, and it is *why* system/API attribution is carried at the
**edge** level by E6's annotation columns rather than by node lanes — an
auto-advance splash and a payment webhook are properties of the *transition*, not
of the screen.

For multi-actor products the same file scales: assign back-office screens to
`admin`, timer/daemon-driven surfaces to `system`, and service-mediated steps to
`api`, and the layout engine bands them without any other change.

### E2 — Cross-feature flow mapping

The base map shows a journey. This shows the **seams** — every edge whose source
and target live in different features, e.g. `Login → Transfer → Notification`.

**Derivation.** `navgraph.json.crossFlow`, computed from the registry.

**Expect roughly half the edge set to cross a feature boundary** — it was 46 of
100 on the extraction run. That is precisely the half no single flow document
owns. Output:

- a dedicated **`🗺 Cross-Feature Map`** page, features as nodes, edge weight =
  number of screen-level routes;
- a **boundary port** on each Section for every inbound and outbound cross-flow
  edge, naming the owning flow and the date its status was checked (W8).

This is the machine version of `skills/05`'s `⟂` node, and it is what would have
caught the stale-boundary class: a port whose target is now a real frame in the
same file cannot keep rendering as external, because the derivation says
otherwise.

### E3 — Navigation heatmap

**Derivation.** In-degree per screen, plus the count of *distinct source
features* — a screen reached six times from one feature is a busy screen; a
screen reached from six features is a hub, and hubs are where regressions land.

Rendered as a three-step fill ramp on the frame chrome, **with the raw numbers
printed** — a colour with no number is a vibe. The handoff consumes the top rows
directly: hub screens get the caching, the back-stack rules and the regression
budget.

On the extraction run the top screen carried **11 inbound routes from 8
features** — that is the screen whose back behaviour must be specified before
build starts, not during it.

**Heat is measured, never assigned.** A designer's sense of which screen is
important is exactly the input this extension exists to replace.

### E4 — Deep-link visualization

Each frame carries the URL that drives it, so QA and developers can reach the
state directly instead of walking the flow.

**Derivation.** The tool scans the prototype pages for the query hooks each page
actually reads (`?view`, `?state`, `?lang`, …) — the hooks are read **out of the
implementation**, not out of a doc that claims them.

On the extraction run **8 of 11 flow pages exposed hooks; three exposed none at
all** (`N9`, major ×3). Those three could not be re-driven into a state after
handoff — a reviewer could not *open* an error screen, only navigate to it.

That is worth stating precisely, because the tracked debt item recorded "no
deep-link hook" for **one** flow. The mechanical scan found the same defect in
**three**. A finding scoped to one flow was read as scoped to one flow, and it was
not — `skills/05`'s *scoped claim read as global* rule, running in the other
direction.

### E5 — State-transition diagrams

Per screen: `Empty → Loading → Success → Error`, drawn as a compact state
machine attached under the frame, with the trigger on each edge.

**Derivation.** The registry's `states` column, one machine per screen.

**Expect the vocabulary to be the blocker, not the diagram.** On the extraction
run the registry carried **59 distinct free-text state labels across 48 screens,
49 of them outside any canonical set** — including *three* spellings of "empty for
a new user". Each was locally sensible. The set was not a state machine, and no
tool could tell whether two labels meant one concept or two.

So the rule is ordering, not effort:

1. Normalize to a **closed vocabulary**, with the specific case as a
   **qualifier**, not a new label: `canon` or `canon{qualifier}` —
   `error{invalid-number}`, `empty{new-user}`.
2. Then generate. Generating first freezes 59 private vocabularies into a
   deliverable.

The vocabulary, the qualifier rule and the full original → normalized mapping live
in the vocabulary file (`toolkit.config.json` → `paths.vocabulary`; start from
[`templates/state-vocabulary.md`](../../templates/state-vocabulary.md)).
`tools/navgraph.mjs` enforces both the term set (`N11-state-vocab`) and the syntax
(`N11-state-syntax`), and `tools/stategraph.mjs` enforces the term set again
(`S1-vocab`) over the authored edge set. Both import `CANON_STATES` from
`tools/config.mjs` — **one definition, two enforcers**. Adding a term is an edit
to that constant plus the justification in the vocabulary file; there is no third
copy to keep in step. On the extraction run 58 qualified labels resolved to 12
canon terms with **0 findings** — and the originals were preserved in the mapping
table, so the rewrite lost nothing.

Two rules the normalization pass produced:

- **The qualifier is kept, never dropped.** `error{wrong-otp}` and
  `error{unchecked-terms}` are different screens' different recoveries.
- **Adding a canon term costs a justification**, written into the vocabulary
  file. `confirm` and `filtered` earned their place because folding them into
  `happy` would have been a false statement about the screen; a term only one
  screen would ever use is a qualifier, not a canon term.

What building the layer added to the rule:

- **The node set is derived; the edge set is authored *with evidence*.** The
  registry owns which states exist (`tools/stategraph.mjs` fails the run if a
  machine adds or drops one). Transitions cannot be derived — they live in the
  prototype's control flow — so each one carries `evidence` as `file:line` and a
  `kind` (`user` · `system` · `entry` · `data`), and the tool checks the cited
  line exists in the frozen bytes. An unevidenced arrow is the failure mode this
  whole layer exists to avoid: it looks like a spec and is a guess.
- **Proving a hook is *read* is not proving the state is *shown*.** `stategraph`
  greps the page for the query parameter; `tools/stateprobe.mjs` then drives every
  hook URL headlessly and asserts the active view is **computed-visible** with ink
  on it — the M1 rule, and the corollary that *a hook which seeds state is not a
  hook that shows it*. The first probe run on the extraction set reported 37
  failures and **every one was the harness** (an offline webfont and a favicon 404
  counted as app errors, a node threshold tuned to a busy screen failing
  correctly-sparse empty states, and two hooks naming a fixture id the catalogue
  does not contain). Corrected, not waived.
- **Three node flags carry what a plain diagram would hide.** `entry-only` (real,
  but only ever built on arrival — no in-screen path), `terminal` (no outbound
  change by design; the way out is leaving the screen), and **`NOT IMPLEMENTED`**,
  drawn dashed: the registry declares the state and the frozen bytes never render
  it. Seven of 118 states were dashed on the extraction run. Dropping them would
  have made the deliverable agree with itself by deleting the disagreement.
- **The probe measures id drift instead of asserting it.** Reading the prototype's
  own screen-id readout at every hook produced 11 observations where the registry
  id and the printed id differ — confirming one known conflict and opening the same
  class on a second flow. Recorded in `id_conflicts`, **not reconciled**:
  renumbering is a registry decision.

Validation codes: `S0` machine exists per registry screen · `S1` node set ==
registry (and still vocabulary-legal) · `S2` initial declared and real · `S3`
endpoints + trigger kinds · `S4` evidence resolves to a real line · `S5` hook
parameter actually read by the page · `S6` reachable from initial or explicitly
`entry_only` · `S7` outbound or `terminal` · `S8` registry ↔ prototype id drift ·
`S9` declared-but-unbuilt, with the absence evidenced.

### E6 — Developer annotations

Each connector carries a four-field annotation, and each frame a two-field one.
This is the layer that turns a diagram into a spec.

| Field | On | Values | Source |
|---|---|---|---|
| `nav` | edge | `push` · `replace` · `modal` · `sheet` · `tab` · `back` · `deep-link` | flows-*.md transitions table |
| `anim` | edge | the named motion preset, or `none` | ui-plan motion spec |
| `api` | edge | the call this transition triggers, or `none` (simulated) | data-screen contract |
| `guard` | edge | the flow graph's guard expression | flows-*.md |
| `auth` | frame | `guest-ok` · `auth-required` · `premium` | registry states + flows |
| `perm` | frame | OS permission the screen needs, or `none` | ux-plan |

Two rules make this survivable:

- **`UNKNOWN` is a legal value and a guessed value is not.** An `api` field filled
  with a plausible endpoint is worse than an empty one, because the developer will
  build it. Every `UNKNOWN` is counted in the report.
- **Annotations cite, they do not restate.** The field carries the value *and* the
  artifact it came from. On the extraction run every `api` value read
  `none (simulated)` — no network call existed anywhere in the prototypes — and
  saying so in the field was the single most useful thing this layer did for the
  receiving team.

Built with `tools/annotate.mjs` against the annotation spec named in
`toolkit.config.json` → `paths.edgeAnnotations`. What building it added to the
rule:

- **Split the six fields by who owns the answer, exactly as E5 splits nodes from
  edges.** `api` and `anim` are **derived** — a re-run sweep, and the CSS the page
  declares. `nav` and `guard` are **authored with evidence**, because they live in
  the control flow: each carries the `file:line` of the call site and the tool
  resolves it against the frozen bytes. A citation that lands past the end of the
  file, or on a line that has since gone blank, is a finding — that is what makes
  the annotation survive the next revision instead of quietly aging.
- **Re-run the sweep; never trust the recorded claim.** The `api` column is only
  worth reading because the tool greps for `fetch` / `XMLHttpRequest` / `WebSocket` /
  `sendBeacon` / `EventSource` itself on every run and fails (`E11`) if the column
  says `none (simulated)` and the sweep disagrees. The most valuable column in this
  layer was the one where every value is identical — and it is only valuable
  because it is *measured* each time.
- **`nav` is the field that finds the missing routes.** Assigning a kind forces
  the question *which control does this?*, which `navgraph` never asks — it derives
  routes from the registry. On the extraction run that surfaced **four registry
  routes with no call site at all** (three previously unrecorded) and one new
  class: **`hook_only`**, a route that exists as a URL hook with no in-screen
  control behind it. Navigable by QA, unreachable by a user. "Navigable" and
  "implemented" are different claims and the annotation has to distinguish them.
- **State the value the bytes carry, not the value the plan asked for.** The plan
  specified a 280 ms view push; the build shipped 260 ms, and four files shipped
  none at all. Annotating the plan's number would have produced a document that is
  wrong in exactly the way a developer cannot detect.
- **Hash the drawing against the spec.** After the page is drawn, read its rows
  back out of the design file and hash them against `annotations.json` — identical
  signature, or the page and the artifact disagree. A picture that has drifted from
  its source is worse than no picture, and W5 already says connectors do not
  reflow, so prove the page says what the artifact says rather than asserting it.

Validation codes: `E0`/`E1` missing / blank field · `E2` uncited value · `E3`
value outside the closed set · `E4` citation does not resolve in the frozen bytes ·
`E5`/`E6`/`E7` duplicate / uncovered / orphan edge · `E8` `nav` = `UNKNOWN` (no call
site) · `E9`/`E10` frame coverage · `E11` the `api` claim vs the re-run sweep ·
`E12` an `anim` naming an animation the cited file does not declare · `E13`
`hook_only`.

### E7 — Auto-generated flow overview page (for PM and QA)

One page, generated last, that nobody has to assemble by hand:

```
🗺 Flow Overview
├── Counts        <n> screens · <n> edges · <n> flows · <n> cross-feature
├── Coverage      every registry screen → its Section + frame link
├── Heatmap       the E3 table, sorted
├── QA paths      every canon entry path, each with its deep-link URL
├── Findings      navmap-report.md's table, verbatim, with waivers
├── Legend        the W4 arrow classes + the E1 lane order
└── Provenance    registry sha · navgraph run · prototype versions · date
```

The **Provenance** block is what makes the page checkable a month later, and it
is the block that gets dropped first. It ships or the page does not.

## Output

### `artifacts/navgraph.json` + `artifacts/navmap-report.md`

Machine-derived, regenerated, never hand-edited. `navgraph.json` is the
authority every other output in this state is generated from.

### `artifacts/flow-visualization-<scope>.md` — the state's record

```markdown
---
artifact: flow-visualization
version: navmap-<scope>-NN
produced_by: flow-visualization
reads_versions: { screen-registry.csv: <sha>, flows-<feature>.md: <version>, prototype: proto-<feature>-NN }
scope: <the flows this map covers — stated as scope, per skills/05>
figma: { file: <key>, pages: [<name · node-id>] }
gate: { developer_handoff: granted|pending|waived, date: <date> }
---

# Navigation Map — <scope>

## Sections built
| Section | Journey | Screens | Edges | Figma node |

## Findings at gate
| Severity | Code | Subject | Status (cleared / waived + rider debt) |

## Boundary status (W8)
| Port | Owning flow | Status | Checked on |

## Sync record (W7)
| Date | Trigger | Edge-set delta | Actions taken |

## Extensions
| Ext | Status | Evidence |
| E1 swimlanes | <n>/<n> screens laned | reference/nav-lanes.json |
| E3 heatmap | derived | navgraph.json.heat |
| E4 deep links | <n>/<n> flows addressable | navgraph.json.deepLinks |
```

### In Figma

Per journey: a `FLOW-XXX • Journey Name` Section holding frames, connectors,
decision nodes, branch/decision labels, entry and exit markers, lane bands, and
the per-frame metadata + annotation blocks. Plus, once per file: the
`🗺 Cross-Feature Map` page, the `🗺 Flow Overview` page, and the Flow Legend.

## Validation rules (machine-checkable on output)

- **V1:** Every Screen Contract / registry entry has a frame in a Section.
- **V2:** Every navigation path in `navgraph.json` exists as a connector.
- **V3:** No orphan screens — `navgraph.json` reports **0** `N2-orphan`.
- **V4:** No broken connectors: every connector's endpoints are frames that
  still exist, at the coordinates the connector was generated against (W5).
- **V5:** All branches terminate — every decision node's branch set is exhaustive
  and every branch reaches a frame or a justified terminal.
- **V6:** Entry and exit screens identified; every Section has ≥1 marked entry.
- **V7:** Section names follow `FLOW-XXX • Journey Name`.
- **V8:** Connector directions match `navgraph.json` edge direction.
- **V9** *(E1)*: Every screen has a lane, or the unlaned set is named in the
  report — `N8` is cleared or waived, never absent.
- **V10** *(E4)*: Every flow's deep-link addressability is reported; a flow with
  no hooks is a **major** finding carrying a rider debt item, not an omission.
- **V11** *(E5)*: State labels are drawn from the closed vocabulary, with case
  detail as qualifiers. `N11` cleared or waived with the count stated.
- **V12** *(E6)*: No annotation field is blank. `UNKNOWN` is legal and counted;
  blank is a failure.
- **V13** *(W7)*: The committed `navgraph.json` re-derives byte-identically from
  the current registry. A drifted derivation means the map is stale, whatever
  the picture looks like.

## Exit conditions

`node tools/navgraph.mjs --fail-on major` exits **0**, or every remaining
finding carries a granted waiver with a rider debt item and a closing condition
(`skills/11` P6). V1–V13 pass. The Developer Handoff Gate is `granted`.

## Failure recovery

- **V2 / V3 failure — a route in the registry that no flow graph ratified** →
  back-transition to `FLOW_GENERATION`. Do not draw the edge here; drawing it
  ratifies it, and this state has no authority to rule a branch (`skills/05`,
  *branch invented, not ruled*).
- **Registry and prototype disagree about a route** — on the extraction run the
  registry claimed an edge that did not exist, because the destination screen
  re-implemented the control inline instead of routing → `REVISION`. Exactly one of
  the two is wrong and this state cannot tell which; routing it to the state that
  owns the fault is `skills/10` R2.
- **V4 failure — connectors detached after frames moved** → self-loop:
  regenerate from `navgraph.json`. Never nudge an arrow back into place.
- **V13 failure — derivation drifted** → re-run the derivation, re-lay the
  affected Sections, and record the edge-set delta in the sync table. A sync
  with no recorded delta did not happen.
- **Retry ceiling 3.** A persistent unreachable screen means the registry and
  the ratified flows disagree at the root → `FLOW_GENERATION`.

## Approval gate — Developer Handoff Gate

Developer Handoff cannot pass until:

- navigation visualization complete (V1, V2, V6, V7),
- screen contract synchronized (V13),
- connectors validated (V4, V8),
- Sections organized (V3, V5),
- no broken navigation (tool exit 0 at `--fail-on major`, or waivers),
- flow diagrams up to date (W7 sync record present and dated).

Grantor: the user. On deny: the denial names the failing rule, and the state
self-loops or back-transitions per Failure recovery. The gate record goes into
`flow-visualization-<scope>.md` frontmatter, and — per `skills/11` P1 — it names
the **versions it saw**: the registry sha, the `navgraph.json` run and the
prototype versions the frames were rendered from. A gate that cannot name its
bytes is the defect one real gate record shipped — it dropped `reads_versions`
entirely, which is the exact field delivery is checked against.

Status on pass: **READY FOR DEVELOPMENT**, scoped to the flows named in `scope`
— and scoped in the claim itself, never as a bare "handoff ready".

## What a first derivation finds

The first run is not tool noise. On the extraction run it opened at **2 blocking ·
8 major · 52 advisory**, and *every finding was a real defect in the registry*.
The classes, because they recur:

| Code | What it means | Why it happens |
|---|---|---|
| `N2b-inbound-only-declared` | A screen is reachable in the product and undrawable from the registry — the only evidence of the route lives on the receiving screen. | `entry_from` was filled in and `navigates_to` was not. |
| `N3-asymmetric` | A forward edge is missing. | Verify against the flow graphs **and** the prototype before touching the cell. |
| `N3b-backedge` | `entry_from` names a screen that no longer routes here, or omits one that now does. | `entry_from` is written when a screen is designed and never updated when a *later* flow starts routing to it. Advisory — the forward edge is authoritative and the map draws correctly — and worth fixing anyway, because `entry_from` is what a developer reads to answer "who can send me here". |
| `N10-unparsed` | A registry cell carries prose where an id belongs. | Hand-editing. |
| `N11-state-vocab` | State labels outside the closed set. | See E5 — normalize before you generate. |

Two numbers worth carrying:

- Repairing **three cells** added **six edges** and **five cross-feature routes**.
  A navigation model can be 6% wrong and look complete.
- The most instructive single finding was a boundary that had been **promoted to a
  real handoff in the code and never written back to the registry** (W8) — caught
  by derivation, invisible to reading.

Before E6 ran, **43 of 106 edges carried a label** and the other 63 were
unlabelled routes. Assigning the E6 values closed that gap *and* found four more
routes with no call site at all, plus one addressable only by URL.

## Recorded failure modes

| Class | What happened | Rule |
|---|---|---|
| **The picture outlived the truth** | One flow's design-file page went out of sync at revision 5 and stayed wrong through revision 8 — four separate rebuilds missing — while the page still looked complete. Another carried a frame showing four rows against a screen rebuilt to six categories. | W6, W7, V13 |
| **A boundary that stopped being a boundary** | Eleven live call sites still routed to the placeholder screen after every destination flow had shipped. Correct when written, silently wrong once the owning flow existed. | W8, E2 |
| **A route with no edge behind it** | The registry claimed an edge the code does not implement — the destination screen re-implements the control inline instead. Two implementations of one control, synced by convention. **The E6 pass found three more of the same class**, none of them visible to `navgraph`, because deriving a route from the registry never asks whether a control exists behind it. | V2, E6 `E8`, Failure recovery |
| **Navigable read as implemented** | One route is real and reachable — **by URL**. The control the registry names it after is a non-interactive element. A QA hook proves a state can be *shown*, never that a user can *get there*. | E6 `hook_only` / `E13` |
| **A destination that differs from the one named** | A route carried no query string, so it landed on a feature's home screen rather than the checkout step the registry names. The edge exists; only the endpoint is wrong, which is the hardest version to see. | E6 `nav` evidence, `skills/08` M6 |
| **A gap recorded at the wrong scope** | A debt item recorded "no deep-link hook" for one flow. The mechanical scan found the same defect in two more — the finding was true and its scope was not. | E4, `skills/05` scoped-claim rule |
| **A vocabulary that cannot compose** | 59 distinct state labels across 48 screens, including three spellings of "empty for a new user". Each was locally sensible; the set was not a state machine. Normalized into 12 canon terms + qualifiers, originals preserved in the mapping table. | E5, V11 |
| **Frames that depict unnamed bytes** | Design-file frames carrying no prototype version cannot be checked against the prototype, so drift is undetectable rather than merely undetected. | W6 |
| **Green picture, red report** | This state's whole risk: a flow map that renders beautifully over a derivation reporting broken routes. The gate reads the report. | W10, V13 |

