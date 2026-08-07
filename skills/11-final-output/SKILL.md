---
name: final-output
description: >-
  State 11 of the AI Product Design Agent workflow, and the only state that can
  close the machine. Freezes the approved artifact versions, packages the
  deliverable, writes the handoff document, checks every §8 Completion Rule
  explicitly, and emits the terminal record. Use when the Primary User Approval
  Gate has been granted and the work is to be shipped: the approval is verified
  as current *and* as naming the exact bytes being frozen, the freeze is a hash
  rather than a copy, acceptance criteria are checked against the traceability
  matrix rather than from memory, the audit of record is confirmed to have run
  on the bytes being frozen, every waived rule ships with an id and a rider debt
  item, known limitations ship inside the deliverable at full strength, and the
  machine record is closed in the same edit as the freeze. Reads the approved
  artifact set and review-record.md; writes deliverable/ and the terminal
  machine_state. Depends on user-review (`approve`). Approval gate: none
  additional — this state is gated by the already-granted Primary User Approval.
---

# Final Output (STATE 11)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 11,
> §3 Transitions, §4 Conditions, §5 Approval Gates, §8 Completion Rules.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests delivery. It communicates
> only through the artifact store (`artifacts/`), never directly with other
> skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | approved `artifacts/prototype/`, `artifacts/review-record*.md` (`approve`), `artifacts/traceability*.md`, `artifacts/audit-report*.md`, `artifacts/revision-log*.md`, the full artifact set, `machine_state` |
| Writes | `artifacts/deliverable-<feature>/` (frozen prototype + `handoff-<feature>.md`) and the terminal `state/machine_state.yaml` record |
| Depends on | `user-review` with outcome `approve` — this state has no other entry |
| Approval gate | **None additional.** Gated by the already-granted **Primary User Approval Gate**. Re-approval only if content changes post-approval (§5 stale-approval rule) |
| Retry ceiling | §6 default **2** for faults *inside* packaging (an unwritten hash, a missing handoff). A completeness regression is **not** a retry — it is the declared `REVISION` edge |
| Next states | `DONE` (terminal success) / `REVISION` (completeness regression caught at the last gate) |

## Purpose

Produce the finalized, packaged deliverable and close the workflow.

This is the last place a wrong claim can be caught, and the only place the
machine is allowed to say it is finished. Every other state produces an artifact
someone downstream will check; this one produces the **record that the checking
is over**. §8's six Completion Rules are its real specification — V1–V4 below are
how they are enforced at the moment of freezing.

The run this toolkit was extracted from reached `FINAL_OUTPUT` **eleven times**
and closed the machine once. At that closure: two of the four validation rules had
been waived at the previous gate, `machine_state.yaml` sat two days stale while
the machine reported itself shipping, one flow's handoff did not exist, and §8
rule 6 was unevaluable for ten of eleven flows. All four were caught at the final
sweep. The method below is what would have caught them **at the gate they were
made at**.

## Processing steps

1. **Verify** `USER_REVIEW` outcome is `approve` and current.
2. **Freeze** artifact versions; assemble the final package.
3. **Generate** handoff documentation (decisions, traceability, known limitations).
4. **Run** the final completeness check against acceptance criteria.
5. **Emit** the terminal record and close the machine.

## Packaging method (hardened)

Steps 1–5 say *what*. This section is the contract for *how*, and each rule was
written by something that went wrong at, or just past, delivery. Codes are cited
from handoffs and gate records — index in
[`docs/method-rules.md`](../../docs/method-rules.md).

### P1 — The approval must be current **and** must name its bytes

§5: *an approval is scoped to the artifact versions it saw.* That makes
`reads_versions` in `review-record.md` a load-bearing field of **this** state —
it is what §8 rule 2 is checked against. A record that cannot name its bytes
cannot be shipped from, and the fix is to go and get the naming, not to infer it.

The most recent gate record on the extraction run **dropped `reads_versions`
entirely**, naming its prototype and audit only in a body table. An earlier record
is the correct shape: frontmatter naming the version reviewed, with the outcome
*scoped to* a later version — saying out loud that the bytes moved between review
and approval.

Before freezing, classify any post-approval delta per `skills/09` **G4**:

- **bug-fix-only** → a one-line scope confirm, and the byte-level evidence bar
  (identical hex inventory, diff confined to named regions, the pre-fix file
  reconstructed from the inverse delta hashing back to the approved sha).
- **feature delta** → a ruling. The gate is `pending`; there is nothing to
  package yet.

One prototype rebuilt an entire screen as a new surface **after** its approval.
It was a feature delta, and the deliverable still held the previous version — the
deliverable and the prototype disagreed about what had shipped for a full day,
until it was ratified and re-frozen.

### P2 — A freeze is a hash, not a copy

Copying a folder records nothing. Every frozen file is listed with its **sha256**
in the handoff and in `machine_state.freeze`, and those hashes are what the next
gate, the next audit and the next revision compare against.

One deliverable per **approval gate**, named for what that gate approved — a
single gate covering five flows produces one deliverable folder and one handoff,
and every flow's row in `machine_state.flows` names the folder it landed in.

**A screen that is not in a frozen deliverable is not delivered.** One flow was
built direct: its screens read `designed` in the registry and were never frozen
into any deliverable, because the flow had no upstream pipeline documents to
freeze. `designed` and `delivered` are different claims and the snapshot must not
blur them.

### P3 — V2 is checked against the traceability matrix, never from memory

The final completeness check is mechanical: every acceptance criterion id in
`requirements-<feature>.md` appears in `traceability-<feature>.md` with a status
in `{met, waived, superseded}`. Anything else — including absence — is `unmet`.

One batch shipped 21 screens with **condensed pipeline artifacts and no
traceability matrix at all**, so V2 was not failed — it was *unevaluable*, and the
gate recorded a V3 waiver instead. When the matrix was finally built at closure it
covered 26 requirements / 90 ACs: **83 met, 6 superseded by later ratified
revisions, 1 met-with-advisory, 0 unmet**.

`superseded` is a legitimate status and it **names the ratified revision that
superseded it**. An AC quietly dropped because a later round replaced its screen
is indistinguishable from an AC that was never built, unless the supersession is
written down.

### P4 — The audit of record must have run on the bytes being frozen

§8 rule 4 is not "an audit passed", it is `C_AUDIT_PASS` **on the final prototype
version**. Compare the sha the audit ran against with the sha being frozen. If
they differ, this is not a packaging problem — it is a `SELF_AUDIT` problem, and
per `skills/10` **R6** the return edge exists precisely for it.

**Five of seven approved flows arrived at their gate past their audit of
record** — one three rounds past, one four. Each round had been verified by
targeted headless assertions and screenshots, which is evidence *inside* the loop
and is not the audit. That became tracked debt, waived at the gate. When the audit
was finally re-run against the frozen bytes it returned **PASS 386/386, stable
over two runs, 37 screens driven** — and found **three more real defects** on the
way there, including the whole app rendering one script on a stack with no face
for it: 138 instances across 7 flows, the root cause of a defect first reported 24
days earlier.

A green audit on superseded bytes is not a green audit.

### P5 — §8 rule 6 needs a revision log that exists

*No `open` change items in the latest `revision-log.md`* is checked by reading the
log's frontmatter and change-set table. A missing log does not read as "no open
items" — it reads as **no evidence**, and it fails the rule.

The revision log only ever covered the first flow. The 13 revision rounds across
the other flows lived in status prose, not in the artifact this state reads, so
rule 6 was unevaluable for ten of eleven flows until a consolidated closure entry
backfilled it.

### P6 — A waiver is a legitimate exit; silence is not

§8 rule 3 permits an acceptance criterion to be `waived` **with record**. The
record is the whole of the permission. A waiver ships only when all three hold:

1. The **user grants it** — the machine cannot waive its own rules.
2. It is written into the deliverable's **Known limitations** *and* opened as a
   numbered debt item, with an id both sides can cite.
3. It states **what would close it**.

Audit currency and a missing traceability matrix were both waived this way at one
gate, each riding a numbered debt item, and **both were closed the next day** —
one by a re-run audit that found three more defects, the other by a backfill that
reported 0 unmet. That is the waiver working exactly as designed.

**The waiver was never the problem. The silence would have been.**

### P7 — Close the machine record in the same edit as the freeze

§8 rule 1 is a claim about the record, and a record written later is a
reconstruction. `current_state`, `last_transition`, `approvals`, the per-flow
terminal rows, the freeze hashes and an explicit `completion_check` for C1–C6 are
written **in the same edit** that freezes the bytes.

`machine_state.yaml` sat **two days and two approval rounds stale** — still
reading `current_state: USER_REVIEW`, gate `pending`, while seven flows had been
approved and the machine was reporting itself as shipping. Nothing detected it,
because nothing was reading the file the completion rule is defined over.

Each of the six rules gets a boolean **and a one-line reason**. `C3: true` with
no reason is the same silence P6 forbids.

### P8 — Known limitations ship inside the deliverable, at full strength

Every limitation the pipeline discovered goes into the handoff in the terms it
was discovered in — not softened, not summarised into a reassurance. The
receiving team will otherwise discover it in build, at a much higher price.

The extraction run shipped 20 parked open decisions, a provisional design-system
palette, a tap-target gap against its own acceptance criterion, and a design file
whose 48 frames were **render-backed images, not component-decomposed vector
designs**. The last one is the model: stated plainly, with why (decomposition
wants the real DS export first) rather than omitted because it reads badly.

Two shapes from that run are the reference:

- A handoff's *Known limitations* table — four opens, each with what ships instead
  and what would close it, including a genuine canon conflict between two
  *approved* deliverables that was **deliberately not patched** (silently editing
  one to hide a disagreement with another is worse than the disagreement).
- A requirements document's acceptance section, which records the five
  qualifications on that acceptance rather than presenting it as clean.

Client-facing packages (requirements document, developer handoff, data-screen
contract, design file) are **additive** to `deliverable/`, not substitutes for it,
and each cites the frozen versions it was generated from.

## Output — `artifacts/deliverable-<feature>/`

```
artifacts/deliverable-<feature>/
├── prototype/            # the frozen bytes, hashed
└── handoff-<feature>.md  # V4
```

Plus the terminal record in `state/machine_state.yaml` (P7).

### `handoff-<feature>.md`

````markdown
# <Project> — <Feature> · Design Handoff

_Feature: **<feature>** · State: **DONE** (Primary User Approval granted <date>,
<n>th pass, scoped to `proto-<feature>-NN`) · Date: <date>_

> <standing caveats that apply to everything below — provisional tokens,
> unreviewed copy, simulated content.>

## What this delivers

| Screen | ID | Built |
|---|---|---|
| <name> | S-XXX-NN | <what actually ships on it> |

**States:** <every state a screen can be driven into>

## Requirement source

<the brief, the registry rows, or the promises already frozen into other flows.
Say which — a flow built with no user brief is a different object from one built
to a spec, and the receiving team needs to know.>

## Key decisions

- **D-XN — <decision>.** <the ruling and why it went that way.>

## Pipeline artifacts

requirements-<feature> (<n>R / <n> ACs) → research-<feature> →
product-review-<feature> (**proceed**, D-X0..) → ux-plan-<feature> →
flows-<feature> → ui-plan-<feature> → traceability-<feature> →
**prototype `proto-<feature>-NN`** → audit-report-<feature> (**PASS n/n**) →
review-record-<feature>.

**Figma:** <file id + page, or PENDING with what blocks it.>

## Acceptance criteria

- **audit-<feature>-NN PASS — n / n ACs** (run against the frozen bytes, P4).
- <headless assertion count, run stability, console sweep, hex conformance,
  screenshot count.>
- Superseded ACs: <n>, each naming the ratified revision that replaced it (P3).

## Freeze

| File | sha256 |
|---|---|
| `prototype/<file>.html` | `<sha256>` |

## Review packet

```
prototype/run-local.sh → play.html #<feature>
```

Hooks: <every deep-link hook, from traceability — this is what makes the
deliverable re-drivable after the loop closes.>

## Waivers

| Rule | Waived because | Rider | What closes it |
|---|---|---|---|
| V2 / §8 rule 4 | <reason> | debt #<n> | <the specific action> |

_A waived rule ships only with a grantor, a rider and a closing condition (P6)._

## Known limitations

| ID | Limitation |
|---|---|
| **o-xN** | <the open, what ships instead, what would close it — at full strength (P8).> |

## §8 Completion Rules

| # | Rule | Holds | Evidence |
|---|---|---|---|
| 1 | `current_state` = `DONE` | ✅ | machine_state written this edit |
| 2 | approval scoped to the final frozen versions | ✅ | review-<feature>-NN `reads_versions` + freeze sha |
| 3 | `C_ALL_CRITERIA_MET` | ✅ | traceability-<feature>: n met / n waived / n superseded / **0 unmet** |
| 4 | `C_AUDIT_PASS` on the final version | ✅ | audit-<feature>-NN, run on the frozen sha |
| 5 | deliverable + handoff + traceability + decision log exist | ✅ | this folder |
| 6 | no `open` items in the latest `revision-log.md` | ✅ | rev-<feature>-NN |
````

## Validation rules (machine-checkable on output)

- **V1:** `USER_REVIEW` = `approve` and not superseded by a later change request.
- **V2:** 100% of acceptance criteria marked `met` (or user-waived, recorded).
- **V3:** All artifacts version-frozen and referenced.
- **V4:** Handoff doc present.
- **V5** *(hardened, per P1 + P2)*: Every frozen file is listed with its
  **sha256**, and that hash is the version the approval names. An approval that
  cannot name its bytes fails V1 rather than being inferred from.
- **V6** *(hardened, per P4)*: The audit of record ran on **the bytes
  being frozen**. If it did not, a waiver is recorded and names its rider debt.
- **V7** *(hardened, per P5 + P7)*: All six §8 Completion Rules are
  checked **explicitly and individually**, each with a boolean and a one-line
  reason, in the deliverable and in `machine_state.completion_check`. No rule is
  asserted by silence, and rule 6 is failed — not passed — when the revision log
  for the feature does not exist.
- **V8** *(hardened, per P6 + P8)*: Every waived rule and every known
  limitation carries an **id**, a **rider debt item** and **what would close it**.

## Exit conditions

All validation passes → machine enters terminal `DONE`.

## Failure recovery

- **V2 fails at the last moment** → do **not** ship. Route to `REVISION` with the
  **specific unmet criteria**, never a general "completeness failed". No silent
  shipping of incomplete work.
- **Approval is stale** (bytes moved after approval, P1) → the gate reverts to
  `pending` per §5. That is a `USER_REVIEW` return, not a freeze — classify the
  delta first (`skills/09` G4) so the return asks for the right thing: a scope
  confirm or a ruling.
- **Audit of record predates the frozen bytes** (P4) → back to `SELF_AUDIT` on
  the frozen bytes, or ship on an explicit user-granted waiver with a rider.
- **Missing input artifact** — no traceability matrix, no revision log, no
  handoff — → back-transition to the state that owed it. A completeness check run
  over a missing artifact is not a pass.
- **Packaging fault** (unwritten hash, unwritten handoff) → retry inside this
  state, ceiling 2, then `HALT_BLOCKED` with a diagnostic.

## Approval gate

**None additional.** Final packaging is gated by the already-granted **Primary
User Approval Gate**; re-approval is required only if content changes
post-approval — which is P1's whole subject, and is checked here rather than
assumed.

## Recorded failure modes

### A. Freeze integrity

| Case | What happened | Rule |
|---|---|---|
| **The deliverable and the prototype disagreed** | A screen was rebuilt as a new surface after approval; the deliverable still held the previous version. A **feature** delta over approved bytes, not a bug fix. | P1, V1 |
| **The gate record dropped the field this state reads** | One record omitted `reads_versions` — the exact field §8 rule 2 is checked against — naming its prototype and audit only in a body table. | P1, V5 |
| **`designed` mistaken for `delivered`** | One flow was built direct; its screens read `designed` in the registry and were never frozen into any deliverable, because there were no upstream artifacts to freeze. | P2 |
| **External references age too** | Handoffs cited design-file pages that had stopped matching the prototype — one flow's frames were four revision rounds out of sync. A frozen deliverable does not freeze the things it links to. | P2, P8 |

### B. Completion-rule accounting

| Case | What happened | Rule |
|---|---|---|
| **The machine record was stale while the machine reported shipping** | `machine_state.yaml` read `current_state: USER_REVIEW`, gate `pending`, for **two days and two approval rounds** after seven flows were approved. §8 rule 1 is defined over that file and nothing was reading it. | P7, V7 |
| **A rule was unevaluable, not failed** | One batch shipped with no traceability matrix, so V2 could not be checked at all; the gate recorded a V3 waiver instead. The backfill later found 26 requirements / 90 ACs — 83 met, 6 superseded, 1 met-with-advisory, **0 unmet**. | P3, V2 |
| **A green audit on superseded bytes** | Five of seven approved flows reached their gate past their audit of record, verified by targeted assertions instead. The eventual re-run on the frozen bytes — PASS 386/386 — found **three more real defects**, including one at 138 instances across 7 flows. | P4, V6 |
| **Rule 6 unevaluable for ten of eleven flows** | The revision log only ever covered one flow; 13 revision rounds lived in prose, not in the artifact this state reads, until a closure entry backfilled it. | P5, V7 |
| **A handoff that did not exist at close** | One flow's handoff — V4's entire subject — was written during the final sweep, after the flow had been recorded as delivered. | P7, V4 |

### C. What worked

- **The two waivers.** Audit currency and a missing traceability matrix were
  waived at the gate *with numbered riders and closing conditions*, and both were
  closed the next day — one by an audit re-run that found three more real defects,
  the other by a backfill reporting 0 unmet. A waiver is a working part of the
  machine; an unrecorded shortcut is not.
- **The last handoff written.** Freeze hashes, a review packet listing every
  deep-link hook, and a *Known limitations* table carrying a real canon conflict
  between two approved deliverables — **deliberately unpatched** rather than
  silently reconciled. It is a deliverable that can still be driven, and audited,
  after the loop closed.
- **A requirements document's acceptance section**, which records the five
  qualifications on the acceptance instead of presenting it as clean.
- **The final audit as the model for P4** — re-run against the final frozen bytes
  of every flow, 386/386, stable over two consecutive runs, 37 screens driven,
  every check rendering-class per `skills/08` M1.
