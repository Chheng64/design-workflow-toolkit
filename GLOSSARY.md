# Glossary

Canonical terminology. Where two words could mean the same thing, this page says which one the documentation uses.

[← README](README.md) · [Architecture →](ARCHITECTURE.md) · [Workflow Guide →](WORKFLOW_GUIDE.md)

---

## Contents

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) · [H](#h) · [L](#l) · [M](#m) · [N](#n) · [O](#o) · [P](#p) · [R](#r) · [S](#s) · [T](#t) · [U](#u) · [V](#v) · [W](#w)

Also: [Terms we do not use](#terms-we-do-not-use) · [Rule code prefixes](#rule-code-prefixes)

---

## A

**Acceptance criterion (AC)**
A falsifiable, observable pass/fail condition attached to a requirement. Produced by STATE 01, checked by STATE 08's conformance matrix, and counted by STATE 11's completion rule 3. An AC that cannot fail makes both unevaluable rather than failed.

**Advisory**
The lowest severity rung. Reported, does not fail a run unless `--fail-on advisory`.

**Approval**
A human grant recorded at a gate, **scoped to the artifact versions it saw**. Not a state of mind, not a message — a record naming sha256s.

**Artifact**
A file produced by a state and consumed by later states. Immutable once written; revisions create new versions. Lives in `artifacts/`.

**Artifact store**
`artifacts/`. The single versioned store through which all skills communicate. Skills never communicate directly.

**Assumption**
A statement the pipeline is proceeding on, flagged `assumed` or `confirmed` in `requirements-<feature>.md`. An assumption is visible and reversible; a guess is neither.

---

## B

**Back-transition**
Routing to an **upstream** state because the root cause of a fault is there. Distinct from a retry, which fixes a fault inside the current state's own output.

**Blocking**
The highest severity rung. Also, the severity of an open question that must be answered before STATE 01 can exit.

**Boundary** (`⟂`)
A node in a flow graph belonging to another flow — mocked at build time. **A boundary status is a dated claim**: correct when written, silently wrong once the owning flow ships.

---

## C

**Canon term**
A member of the closed state vocabulary. Adding one costs a written justification; a term only one screen would ever use is a **qualifier**, not a canon term.

**Ceiling**
A loop's maximum iteration count, configured in `toolkit.config.json` → `loops`. A ceiling nobody counts is not a ceiling.

**Change item**
One entry in a revision's change set, carrying a defect class, a sweep result, a root cause, a target state and a status.

**Change request (CR)**
A user ask captured at STATE 09, structured into a spec-linked item with a target state. **No change request is silently dropped.**

**Clearance claim**
A statement that something is clean. It must state its **scope inside the claim** — "no boundary mocks left" was written about one flow and read as holding for the set.

**Completion rules**
The six conditions that must all hold for the machine to be `DONE`. Each gets a boolean **and a one-line reason**.

**Conformance matrix**
The table in `audit-report-<feature>.md` marking every acceptance criterion `met` / `unmet` / `waived` with evidence.

**Contract** (skill contract)
A skill's **Reads** and **Writes**. Nothing reaches into another skill's internals.

**Cross-feature edge**
A navigation edge whose source and target live in different features. Expect roughly half the edge set; it was 46 of 100 on the extraction run.

---

## D

**Deep-link hook**
A query parameter that drives a prototype directly into a flow state — `?view=`, `?state=`, `?sheet=`, `?load=`. Every flow state, variant and error case ships one, recorded in traceability. **A state that cannot be driven cannot be audited or demonstrated at a gate.**

**Defect class**
The general form of a reported defect. Revisions route the **class**, not the instance, and record the sweep count.

**Deliverable**
`artifacts/deliverable-<feature>/` — the frozen prototype plus the handoff. One per approval gate.

**Delivered**
A screen is delivered when it is inside a frozen deliverable. Distinct from **designed**, which only means it exists.

**Derivation**
A model produced by a tool from a single source, re-runnable and checkable. The opposite of a drawing. *If the diagram and the derivation disagree, the diagram is wrong.*

**Direction Approval Gate**
The mandatory gate at STATE 03 → 04. Blocks spending design effort on an unapproved direction.

**Dispatch**
STATE 10 sending a change item to the state that owns its root cause, with a **bounded scope** — what changes and what must not.

---

## E

**E1–E7**
The seven enterprise extensions of STATE 12: swimlanes, cross-feature map, heatmap, deep links, state machines, developer annotations, overview page. Also used as rule codes.

**Edge**
A navigation transition between two screens (STATE 12), or between two states within a screen (E5). Derived in the first case, authored **with evidence** in the second.

**Entry state**
STATE 01. The only state with no upstream dependency.

**Escalation summary**
What `HALT_BLOCKED` writes on a ceiling breach: everything resolved, the unresolved set, the standing disclosed items, and a resume path.

**Evidence**
For a transition or annotation: a `file:line` citation into the frozen bytes, which the tool resolves. For an acceptance criterion: a named screenshot, probe result or sweep. Not prose.

**Extension Note**
STATE 06's informational, non-blocking record of components the design system had no primitive for. Exists so a DS owner can later see what the product needed.

---

## F

**Feature delta**
A post-approval change that alters behaviour. Needs a **ruling**; the gate is `pending` until it lands. Distinct from a bug-fix-only delta, which needs a scope confirm plus byte-level evidence.

**Finding**
A confirmed defect, written into a report with a severity. Distinct from a **failing probe**, which is a hypothesis until confirmed at source.

**Flow**
A directed graph of the states a user passes through for one task. Produced by STATE 05, deliberately screen-free in content.

**Freeze**
Recording the sha256 of every delivered file. **A freeze is a hash, not a copy.**

**Frontmatter**
The YAML block opening every artifact. A field a downstream rule is defined over belongs here, not in a body table.

---

## G

**Gate**
A point where a forward transition requires a human grant. Five exist; three block. The grantor is always the user.

**Guard**
A boolean condition on a transition — `C_VALID`, `C_AUDIT_PASS`, `C_APPROVED`, `C_LOOP_OK`, `C_RETRY_OK`, `C_ALL_CRITERIA_MET`, `C_HANDOFF_REQUIRED`, `C_NAVMAP_CLEAN`. If a guard fails, the machine takes the state's Failure Recovery path, not the forward edge.

---

## H

**HALT_BLOCKED**
A resumable terminal. The machine is paused pending human input, an answer, or a ceiling reset. Fully persisted; resumes at the exact state. **A working outcome, not a crash.**

**HALT_STOPPED**
A deliberate stop, ruled at Product Review or by the user, recorded with rationale. Not a failure.

**Handoff**
`handoff-<feature>.md` inside the deliverable. What shipped, key decisions, freeze hashes, review packet, waivers, known limitations, completion rules.

**Harness**
A tool that drives the prototype — `smoke.mjs`, `audit.mjs`, `stateprobe.mjs`. All three read the prototype through the same **harness contract** in `toolkit.config.json` → `prototype`.

**Harness correction**
A fix to the instrument after a failing probe turned out to be the tool's fault. Recorded in the audit report, because an uncorrected harness re-reports the same noise next run.

**Heat**
In-degree per screen plus the count of distinct source features. **Measured, never assigned** — a screen reached from six features is a hub, and hubs are where regressions land.

**`hook_only`**
A route that exists as a URL hook with no in-screen control behind it. Navigable by QA, unreachable by a user. "Navigable" and "implemented" are different claims.

---

## L

**Loop**
A bounded cycle with a named id, a ceiling and a counter: `L_CLARIFY`, `L_RESEARCH`, `L_UX_EDGE`, `L_REVISION`, `L_AUDIT_FIX`.

---

## M

**Machine state**
`state/machine_state.yaml`. **Not an artifact** — the machine's own record, and the file completion rule 1 is defined over. Written at decision time, in the same edit as the thing it records.

**Major**
The middle severity rung. Typically what `--fail-on major` is set to at a gate.

---

## N

**`navgraph.json`**
The derived navigation model, and the authority every other STATE 12 output is generated from. Machine-derived, regenerated, **never hand-edited**.

**Non-happy path**
A state that is not the success case: loading, empty, error, interrupted, offline, permission-denied. STATE 04 must enumerate at least three per task; STATE 05 must give every one a recovery route.

---

## O

**Open decision** (`o-<id>`)
An unruled question carried forward rather than defaulted. **An unruled question that reaches the prototype as an invented answer is how a placeholder gets frozen into an approved deliverable.**

**Orchestrator**
Whatever holds `machine_state`, evaluates guards, fires transitions, enforces gates and ceilings, and persists after every transition. **Not a skill.** May be a person, an agent, or (roadmap phase 2) a CLI.

**Orphan**
A screen with no inbound edge and no external entry point. Reported by `navgraph.mjs` as `N2-orphan`, severity blocking.

---

## P

**Packet**
What STATE 09 hands the user at the gate: the running prototype, the audit summary, the known limitations, and **the deep-link hook list**. The hook table *is* the packet.

**Pass count**
`pass N = 1 + revision rounds delivered`. Bumped in every place that states it, in the same edit.

**Primary User Approval Gate**
The central human gate, at STATE 09 → 11. Blocks shipping an unapproved deliverable.

**Probe**
A single check run against the running prototype. **A failing probe is a hypothesis, not a finding.**

**Prototype**
The assembled, drivable artifact produced by STATE 07. Deliberately not production code — its job is to be drivable, auditable and reviewable.

---

## R

**Reachability report**
STATE 05's evidence that no state is unreachable and no dead end is unjustified. Evidence, not a claim.

**`reads_versions`**
The frontmatter field naming the **exact** versions an artifact consumed — not "the latest". What completion rule 2 is checked against, and the field a real gate record dropped.

**Registry**
`reference/screen-registry.csv`. **The spine** — the entire navigation model is derived from its cells.

**Rendering-class**
A check that reads computed visibility and measured geometry rather than DOM presence. Every check in STATE 08 is rendering-class.

**Retry**
Re-running a state with the failed rule injected as a corrective constraint, because the fault is inside its own output. Distinct from a back-transition.

**Rider**
The numbered debt item a waiver rides on. **A waiver with no rider is a silent waiver.**

**Root cause**
Where a fault was **introduced**, not where it is visible. Everything is visible in the prototype; that is not evidence it belongs to `PROTOTYPE`.

**Round**
One prototype rebuild, however many sub-lettered asks it folds.

---

## S

**`seen_changes`**
The dedup set that stops a rejected change re-entering the revision loop endlessly.

**Severity**
`blocking` → `major` → `advisory`. `--fail-on <level>` names the lowest rung that causes a non-zero exit.

**Skill**
One state, implemented as a folder under `skills/` with a `SKILL.md` contract. Holds no machine state.

**State**
Two distinct meanings, disambiguated by context and capitalisation:
- **`STATE 01`–`STATE 12`** — a step of the workflow machine.
- **a flow state** — a condition a screen or task can be in (`happy`, `error{invalid-input}`). Drawn from the closed vocabulary.

**State vocabulary**
The closed set of flow-state names, in `reference/state-vocabulary.md`. Syntax: `canon` or `canon{qualifier}`. **Normalize first, then generate** — generating first freezes N private vocabularies into a deliverable.

**Superseded**
A legitimate status for an artifact version or an acceptance criterion, **naming the revision that superseded it**. In a prototype, supersession **deletes**: the old CSS, strings and handlers are stripped, itemised and recorded.

**Sweep**
A mechanical search for every instance of a defect class, whose **count is recorded**. "Fixed in 1 file" and "fixed in 11 files" are different claims.

---

## T

**Traceability**
`traceability-<feature>.md` — requirement → task → flow → component → prototype element, plus flow state → representation → hook. What makes STATE 07's V1 checkable rather than assertable.

**Terminal**
Either a machine terminal (`DONE`, `HALT_STOPPED`, `HALT_BLOCKED`) or a flow node with no outbound edge **and a recorded justification**.

---

## U

**`UNKNOWN`**
A legal annotation value, counted in the report. **A guessed value is not legal.** An `api` field filled with a plausible endpoint is worse than an empty one, because the developer will build it.

**Un-specced addition**
A prototype element with no spec entry behind it. Fails STATE 07's V2 — and so does a leftover from a superseded component.

---

## V

**V-rule**
A machine-checkable validation rule on a state's output. `V1`–`V4` come from the specification and hold for every product; **`V5+` are project-hardened, each written by a defect that passed `V1`–`V4`.**

**Validator**
One of the seven tools in `tools/`. Exits `0` clean / `1` findings / `2` tool error.

**Verdict**
STATE 08's `pass` or `fail`, **scoped to the bytes it audited**. A `fail` is a normal outcome, not an error. A stale verdict is not a verdict.

---

## W

**Waiver**
A user-granted exception to a rule. Ships only with a grantor, a **rider** debt item, a place in Known limitations, and a stated closing condition. **A rule may be waived, never skipped.**

---

## Terms we do not use

Consistency matters more than elegance. Where two words compete, this is the one the documentation uses.

| Use | Not | Why |
|---|---|---|
| **artifact** | deliverable, document, output | `deliverable` means specifically the frozen package. |
| **state** (of the machine) | step, stage, phase | `phase` is reserved for the roadmap. |
| **flow state** | screen state, UI state, mode | Disambiguates from machine states. |
| **gate** | checkpoint, review, sign-off | A gate blocks a transition; a checkpoint does not. |
| **finding** | issue, bug, problem | A finding is confirmed. A failing probe is a hypothesis. |
| **derive** | generate, build (of a graph) | Derivation implies a single source and re-runnability. |
| **freeze** | export, publish, ship | A freeze is a hash. |
| **validation rule** | test, assertion, check (of a V-rule) | Reserved so "check" can mean a single tool assertion. |
| **skill** | agent, prompt, module | A skill is a state with a typed contract. |
| **orchestrator** | controller, runner, driver | One word, one responsibility set. |
| **hook** | link, shortcut, anchor | A hook is a query parameter that drives a state. |
| **rendering-class** | visual, UI-level | Names the method — computed visibility and geometry. |
| **project-hardened** | battle-tested, proven | Names the origin: written by a recorded defect. |

---

## Rule code prefixes

Every project-hardened rule carries a code, citable from a plan, a log or a gate record. The catalogue is [`docs/method-rules.md`](docs/method-rules.md).

| Prefix | Domain | Owning skill |
|---|---|---|
| **B1–B8** | Build method | [07 prototype](skills/07-prototype/SKILL.md) |
| **F1–F3** | Figma plugin-API traps | [07 prototype](skills/07-prototype/SKILL.md) |
| **M1–M6** | Verification method | [08 self-audit](skills/08-self-audit/SKILL.md) |
| **G1–G8** | Review method | [09 user-review](skills/09-user-review/SKILL.md) |
| **R1–R8** | Revision method | [10 revision](skills/10-revision/SKILL.md) |
| **P1–P8** | Packaging method | [11 final-output](skills/11-final-output/SKILL.md) |
| **W1–W10** | Navigation mapping | [12 flow-visualization](skills/12-flow-visualization/SKILL.md) |
| **E1–E7** | Enterprise extensions | [12 flow-visualization](skills/12-flow-visualization/SKILL.md) |

### Tool finding codes

| Prefix | Tool | Meaning |
|---|---|---|
| **N…** | `navgraph.mjs` | Navigation derivation findings — `N1` broken edge, `N2` orphan, `N3` asymmetric, `N4` terminal, `N8` lane, `N9` deep link, `N10` unparsed, `N11` state vocabulary. |
| **S0–S9** | `stategraph.mjs` | Per-screen state machine findings — machine exists, node set matches, evidence resolves, hook read, reachability, id drift, declared-but-unbuilt. |
| **E0–E13** | `annotate.mjs` | Developer annotation findings — blank field, uncited value, unresolved citation, `nav` UNKNOWN, `api` claim vs sweep, `hook_only`. |

Note that `E1`–`E7` appear twice with different meanings: as STATE 12's **extension** codes, and as `annotate.mjs` **finding** codes. Context disambiguates — extensions are named ("E1 swimlanes"), findings are cited bare with a tool ("`annotate` E1").

---

[← README](README.md) · [Architecture →](ARCHITECTURE.md) · [Workflow Guide →](WORKFLOW_GUIDE.md) · [Method rules →](docs/method-rules.md)
