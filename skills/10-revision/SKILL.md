---
name: revision
description: >-
  State 10 of the AI Product Design Agent workflow, and the only state that
  writes work into other states. Merges self-audit findings and user change
  requests into one change set, triages each item to the state where the fault
  was introduced, dispatches in dependency order, and tracks every item to
  `resolved` or explicitly `deferred`. Use when a prototype fails audit or a
  review gate returns `request-changes`: each item is routed by root cause
  rather than by where the symptom is visible, the defect *class* is swept
  rather than the reported instance, conflicts go to the Conflict Mini-Gate
  instead of being settled inside the bytes, superseded components are stripped
  as part of the change, the rebuild returns through `SELF_AUDIT`, and the loop
  counter is written down every cycle so the ceiling is real. Reads
  audit-report.md and review-record.md; writes revision-log.md. Depends on
  self-audit or user-review. Approval gate: none to start; Conflict Mini-Gate
  before dispatching a conflict.
---

# Revision (STATE 10)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 10,
> §3 Transitions, §5 Approval Gates, §6 Retry Logic, §7 Loop Logic, §8 Completion
> Rules.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests a revision. It communicates
> only through the artifact store (`artifacts/`), never directly with other
> skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | `artifacts/audit-report*.md` and/or `artifacts/review-record*.md`, all artifacts, `machine_state` |
| Writes | `artifacts/revision-log*.md` |
| Depends on | `self-audit` (verdict `fail`) **or** `user-review` (`request-changes`) — a change set with no named source is scope creep, not a revision |
| Approval gate | **None to start.** **Conflict Mini-Gate** blocks dispatch of conflicting change requests. Re-approval happens when the loop returns to `USER_REVIEW` |
| Retry ceiling | `L_REVISION` **3 full cycles** → `HALT_BLOCKED` + escalation summary. `L_AUDIT_FIX` **3** (`SELF_AUDIT` ↔ `REVISION`) → escalates *into* `L_REVISION` accounting |
| Next states | any upstream state (root-cause dispatch) / `SELF_AUDIT` (rebuild complete) / `HALT_BLOCKED` (ceiling exceeded) |

## Purpose

Apply audit findings and/or user change requests by routing work back to the
correct upstream state(s), tracking each change to closure.

Every other state produces its own artifact. This one **produces work for other
states**, which makes it the only place where a misrouted fault becomes three
wasted cycles instead of one. It is also the primary product loop: §7 requires
`L_REVISION` to terminate by user `approve` or by ceiling, and forbids it
continuing silently.

On the run this toolkit was extracted from, this state ran **13 times across five
flows** with no written dispatch rule — which upstream state owned an incoming ask
was decided ad hoc each round. The method below is that rule.

## Processing steps

1. **Merge** findings + change requests into a single change set.
2. **Triage** each change to its root-cause state (requirements? flow? UI?
   prototype?).
3. **Order** changes by dependency (upstream before downstream).
4. **Dispatch** to target state(s) via back-transition; on return, re-run
   downstream states as needed.
5. **Track** each change item to `resolved` / `deferred` with reason.

## Revision method (hardened)

Steps 1–5 say *what*. This section is the contract for *how*, and each rule was
written by something that went wrong in a real revision round. Codes are cited
from logs — index in [`docs/method-rules.md`](../../docs/method-rules.md).

### R1 — Merge first, dedup against `seen_changes`

One change set per cycle, drawn from both sources at once. §7's loop invariant
requires deduplication against a `seen_changes` set so a rejected change cannot
re-enter the loop endlessly. When an item returns, classify it:

- **Same item, no new evidence** → drop it and cite the prior decision.
- **Same item, new evidence** → re-open it and name the evidence.

An item that reappears with no evidence and no citation is the loop running on
its own exhaust.

### R2 — Route the class, not the instance

The reported defect is a sample. Before dispatch, state the **class** and sweep
for it.

One defect was diagnosed as six selectors rendering a script on the wrong font
stack in one file. Three were patched; **the class was never swept**. The actual
root cause — the script token was an *opt-in* layer under a foreign base —
surfaced **24 days later at 138 instances across 7 flows**, and behind it a second
defect: the base stack carried no face for that script at all. One class, one root
cause, three patched selectors, twenty-four days.

The class may also live in the **machine** rather than the artifact. One change
request read "colours deviate from the DS"; the root cause was that the audit had
*no token-conformance rule* — it checked DS presence, never non-DS absence. The
dispatch was therefore **two** states: `SELF_AUDIT` (a new permanent rule) and
`PROTOTYPE` (the values). Fixing only the values would have left the class open.

Record the sweep count in the log. "Fixed in 1 file" and "fixed in 11 files" are
different claims.

### R3 — Root cause is where the fault was introduced, not where it is visible

Everything is visible in the prototype. That is not evidence it belongs to
`PROTOTYPE`.

| The ask is… | Root-cause state |
|---|---|
| a goal, scope, persona or constraint that was never captured | `REQUIREMENT_ANALYSIS` |
| a convention, benchmark or platform claim that turned out wrong | `RESEARCH` |
| a change in *what* to build or its priority (direction, not execution) | `PRODUCT_REVIEW` — the Direction Approval Gate re-opens |
| a missing journey, an unserved user need, an uncovered edge | `UX_PLANNING` |
| a missing or unreachable state, a wrong branch/guard, a boundary that no longer holds | `FLOW_GENERATION` |
| a component, token, layout, motion, contrast or density spec | `UI_PLANNING` |
| the spec was right and the build does not match it | `PROTOTYPE` |
| the defect passed a green check | `SELF_AUDIT` **and** the owning artifact state — the check gap is its own item (R2) |

**A repeat is evidence of misrouting.** If an item is dispatched to a state,
returns, and comes back again, the root cause is upstream of where it was sent.
Four consecutive change requests dispatched palette work to `UI_PLANNING` and
`PROTOTYPE`; the machine ran to `HALT_BLOCKED` before it was established that the
real fault was **wrong-document adoption at `UI_PLANNING`** — a design-system spec
belonging to a different project. Three cycles were spent on colour values because
the routing was never re-examined after the first return.

### R4 — Dispatch a bounded scope

Each dispatched item carries what changes **and what must not**.

One request asked for a palette change on a single screen. `PROTOTYPE`
over-applied it and remixed the brand mark. The next cycle's first item was
*"restore the original mark"*, and the log gained a permanent constraint: **the
logo is an untouchable brand asset** (composition, colours, order, wordmark). A
revision that does more than the item asked manufactures the next revision item.

Constraints discovered this way are recorded in the log, not carried in memory.

### R5 — Supersession is part of the change; aged items are re-verified

When a revision replaces a component, the replaced one **leaves in the same
change**. One round superseded a whole card component outright; two later rebuilds
deleted entire selector families and string-key sets. A leftover selector or
string is an un-specced element and fails `skills/06` and `skills/07` V-rules
exactly as an addition does. The log carries a **Superseded** table.

The mirror of this: **an open change item ages against a moving prototype.** By
the time one carried defect was fixed, three of its six reported selectors *no
longer existed* — two intervening rounds had deleted them. Re-verify every carried
item against current bytes before dispatch; an item that no longer applies is
closed as `superseded`, with the round that removed it named, not silently
dropped.

### R6 — Re-validate through `SELF_AUDIT`, or record a waiver

§3 gives this state exactly one return edge: `REVISION` → rebuild complete →
`SELF_AUDIT` → `USER_REVIEW`.

The extraction run shortcut that edge repeatedly, verifying rebuilds with targeted
headless assertions and returning straight to the gate. Result: **five of seven
approved flows arrived at their approval gate past their audit of record**, one of
them four rounds past. That became tracked debt, waived at the gate, and when the
audit was finally re-run against the frozen bytes (PASS 386/386) it immediately
found **three more real defects**, including the font root cause above.

Targeted verification is evidence *inside* the loop. It is not the audit.
Returning to `USER_REVIEW` without a current audit is a **waiver**, and per
`skills/09` G6 a waiver names its rider debt item.

An in-review delta that claims to be audit-neutral must **say what makes it
neutral**. One did: asset wiring only, no layout or copy change, screenshots
re-verified — so the existing audit still held. That is a defensible claim because
it was written down.

### R7 — Count the loop, out loud, every cycle

`L_REVISION` is per feature. `L_AUDIT_FIX` is per audit round and, on breach,
**escalates into `L_REVISION` accounting** — it does not reset it.

On the extraction run the counters stopped being written after the second round
of the first flow. That flow was recorded at `L_REVISION=2` and then delivered
three more rounds — **five against a ceiling of three**. The inner audit-fix loop
ran ×4 on one flow and ×8 on another against a ceiling of three, neither
escalating. **A ceiling nobody counts is not a ceiling.** Every log entry carries
`iteration` and `loop: L_REVISION (n/3)` in frontmatter. Ceilings live in
`toolkit.config.json` → `loops`.

What counts as one cycle: **one round = one prototype rebuild, however many
sub-lettered asks it folds** — a round folding nine sub-asks is still one round.
This is the same rule as `skills/09` G7 — bump the count in the log, the progress snapshot and the flow
row in the same edit, or they drift.

The ceiling resets **only** by explicit user authorization, recorded in the log.
One flow did this correctly: 3/3 consumed → `HALT_BLOCKED` with an escalation
summary → the user authorized a fresh bounded window → reset to 1/3, written
down.

### R8 — A conflict goes to the Mini-Gate, never into the bytes

Two classes reach this state:

1. **Two change requests contradicting each other.**
2. **A change request contradicting an already-ratified decision** — the class the
   extraction run actually hit, three times:
   - a supplied spec asked for a control whose ownership had already been ruled
     onto a different screen, twice;
   - a supplied mockup's navigation contradicted a logged user decision, across
     six files;
   - a spec asked for two colours the token allowlist does not contain.

Neither class is a build decision. When the user is not at the gate: ship the
**reversible** reading, open an `o-` item naming both sides and what each would
cost, and put it to the gate. Never silently pick a side inside the prototype —
`skills/07` states the same rule from the build side.

The same applies to canon conflicts between two *approved* deliverables. On the
extraction run two approved flows shipped contradictory values for the same
user-visible fact, and it was deliberately **not** patched: silently editing one
approved deliverable to hide a disagreement with another is worse than the
disagreement, and it moves frozen bytes without a ruling.

## Output — `artifacts/revision-log.md`

Append per iteration; newest first. The frontmatter is what `FINAL_OUTPUT` §8
rule 6 reads.

```markdown
---
artifact: revision-log
version: rev-<feature>-NN
produced_by: revision
reads_versions:
  review-record.md: review-<feature>-NN
  audit-report.md: audit-<feature>-NN
iteration: <n>
loop: L_REVISION (<n>/3)          # L_AUDIT_FIX (<n>/3) if this is an audit-fix cycle
feature: <feature/flow id>
---

# Iteration <n> — <source: audit verdict `fail` | user `request-changes`>, <date>

## Change set

| # | Change item | Raised by | Class + sweep | Root cause | Target state | Status |
|---|---|---|---|---|---|---|
| CR1 | *"<verbatim ask or finding>"* | user-review \| self-audit | <class — N instances found across M files, or "single instance"> | <where the fault was introduced> | `UI_PLANNING` → `PROTOTYPE` | resolved \| deferred \| superseded |

_Every item carries a target state and a status (V1). Nothing exits `open` (V2)._

## Conflicts — Conflict Mini-Gate

| # | Conflict | Side A | Side B | Ships as | Gate outcome |
|---|---|---|---|---|---|
| o-x1 | <the contradiction, both sides stated> | <new ask> | <ratified decision + its id> | <the reversible reading> | pending user ruling \| ruled <date> |

_No conflict is resolved inside the prototype (R8, V6)._

## Dependency order (upstream → downstream)

1. `<STATE>` → <artifact vNN> (<items>)
2. `PROTOTYPE` → proto-<feature>-NN (<items>)
3. `SELF_AUDIT` → audit-<feature>-NN
4. `USER_REVIEW` → gate reverts to `pending` (stale-approval rule §5)

## Superseded by this revision

| Component / rule / string | Superseded by | Removed from |
|---|---|---|

## Constraints recorded

<discovered scope limits — untouchable assets, decisions that must not move.>

## Deliberately not changed

| Item | Why not |
|---|---|

_Recorded so silence is not mistaken for oversight (V2)._

## Impact analysis

| Artifact | Effect |
|---|---|
| requirements.md | unchanged |
| ui-plan.md | **ui-<feature>-NN** (supersedes -NN) |
| prototype | **proto-<feature>-NN** |
| audit-report.md | **audit-<feature>-NN** |

## Re-validation

| Check | Result |
|---|---|
| Re-audit on the rebuilt bytes | `audit-<feature>-NN` PASS N / N — or **WAIVED**, rider: debt #<n> |
| Rendering-class assertions | N / N |
| Class sweeps from R2 | <class: N instances, all fixed> |

## Validation self-check

- **V1** ✅ / ❌ — every item has a target state and a status.
- **V2** ✅ / ❌ — no item left `open`.
- **V3** ✅ / ❌ — iteration incremented; `L_REVISION <n>/3`, `L_AUDIT_FIX <n>/3`.
- **V4** ✅ / ❌ — every item names its class and sweep result.
- **V5** ✅ / ❌ — superseded components removed; carried items re-verified against current bytes.
- **V6** ✅ / ❌ — conflicts recorded with both sides; none resolved in the bytes.
- **V7** ✅ / ❌ — return edge passes through `SELF_AUDIT`, or a waiver names its rider.

**Exit:** dispatch to <states> → `SELF_AUDIT` → `USER_REVIEW`.
```

## Validation rules (machine-checkable on output)

- **V1:** Every change item has a target state and a status.
- **V2:** No change item left `open` at state exit — `resolved`, `superseded`, or
  explicitly `deferred` **with a reason**.
- **V3:** Iteration number incremented; loop ceilings not exceeded **and the
  counters actually written** (`L_REVISION`, `L_AUDIT_FIX`).
- **V4** *(hardened, per R2)*: Every item names its **defect class** and
  the sweep result. An item recorded as a single instance asserts that the class
  was checked, not that it was not looked for.
- **V5** *(hardened, per R5)*: Components replaced by this revision are
  removed, not left as dead style/strings; and every carried item was re-verified
  against current bytes before dispatch.
- **V6** *(hardened, per R8)*: Every conflict is recorded with **both
  sides** and its Mini-Gate outcome. No conflict is resolved inside the
  prototype.
- **V7** *(hardened, per R6)*: The return edge to `USER_REVIEW` passes
  through `SELF_AUDIT` on the rebuilt bytes. If it does not, a waiver is recorded
  and it names its rider debt item.

## Exit conditions

All change items `resolved` or `deferred`; downstream states re-validated.

## Failure recovery

- **`L_REVISION` ceiling (3 full cycles)** → `HALT_BLOCKED` with an **escalation
  summary** of unresolved items — never a 4th unbounded cycle. Fully persisted
  and resumable; not a failure terminal.
- **`L_AUDIT_FIX` ceiling (3)** → escalate into `L_REVISION` accounting. It does
  not reset the outer loop.
- **Conflicting change requests** → **Conflict Mini-Gate** before dispatch (R8).
- **A change request with no content** (`request-changes` with nothing specified)
  → the loop cannot be entered on an empty change set. Halt, write the escalation
  summary, and state the resume path — the concrete change list plus an explicit
  authorization that resets the window.
- **Missing input artifact** (no `audit-report.md` or `review-record.md`) →
  back-transition to the state that owed it. A revision with no source is not a
  revision.

## Approval gate

**None required to start a revision.** Re-approval happens when the loop returns
to `USER_REVIEW`, and per §5 the Primary User Approval Gate **reverts to
`pending`** the moment approved artifacts change — that reversion is a
consequence of this state's own dispatch, so record it in the dependency order.

**Conflict Mini-Gate** — location `REVISION`; blocks *dispatching conflicting
change requests*; grantor: the **user**; on deny: the user resolves the conflict,
then dispatch proceeds.

## Recorded failure modes

### A. Routing

| Case | What happened | Rule |
|---|---|---|
| **Class never swept** | A defect reported as six selectors in one file; three were patched and the class was dropped. The root cause — an opt-in token layer — resurfaced 24 days later at **138 instances across 7 flows**, with a second defect behind it. | R2, V4 |
| **Root cause in the machine, not the artifact** | Invented colours passed a green audit because the audit checked DS *presence*, never non-DS *absence*. The fix had to be two dispatches: a new permanent `SELF_AUDIT` rule, and the values. | R2, R3 |
| **Three cycles on a misrouted root cause** | Four change requests dispatched palette work downstream; the real fault was **wrong-document adoption at `UI_PLANNING`** — a design-system spec belonging to a different project. The machine reached `HALT_BLOCKED` before the routing was re-examined. | R3 |
| **Over-application creating the next item** | A one-screen palette change was applied so broadly that the brand mark was remixed; the next item was *"restore the mark"*. | R4 |
| **Items aged against a moving prototype** | Three of one carried defect's six reported selectors no longer existed when it was actioned — two intervening rounds had deleted them. | R5 |

### B. Loop accounting

| Case | What happened | Rule |
|---|---|---|
| **The counter stopped being written** | `L_REVISION` was last recorded at **2** for a flow that then delivered three more rounds — **five against a ceiling of three**, with no breach ever detected. | R7, V3 |
| **`L_AUDIT_FIX` breached twice with no escalation** | ×4 on one flow and ×8 on another against a ceiling of 3. Neither escalated into `L_REVISION` accounting. | R7 |
| **The return edge skipped** | Rebuilds went back to the gate on targeted assertions instead of a re-run audit; **five of seven approved flows** were past their audit of record at approval. The eventual re-run found three more real defects. | R6, V7 |
| **The log covered one flow out of eleven** | The revision log only ever recorded the first flow, so §8 rule 6 (*no `open` change items*) was unevaluable for the other ten until a consolidated entry backfilled it at closure. | V1, V2 |

### C. What worked

- **The `HALT_BLOCKED` escalation.** A fourth `request-changes` arrived with no
  change items, against a consumed 3/3 ceiling. The machine halted, wrote the
  escalation summary (everything resolved, the unresolved set, the standing
  disclosed minors) and a three-step resume path, then reset the window **only**
  on explicit user authorization — recorded in the log. That is exactly what §7's
  *"can never silently continue"* is asking for.
- **The `Deliberately NOT changed` table.** Four items — a canon conflict between
  two approved deliverables, a tap-target gap, a progress readout that was visible
  at approval, and six superseded ACs — each with the reason it was left. V2 is
  satisfiable by silence; this table is what makes it *honest*.
