---
name: user-review
description: >-
  State 09 of the AI Product Design Agent workflow, and the machine's central
  human gate. Presents the audited prototype to the user against a running local
  server and captures a structured approve / request-changes / reject decision.
  Use when a prototype has passed self-audit and needs a human verdict: the
  prototype is served with Run Local and reviewed through the player, known
  limitations from audit-report.md are presented rather than laundered, every
  change request is structured into a spec-linked item with a target state, and
  the outcome is recorded against the exact frozen bytes it saw — an approval is
  scoped to the artifact versions it reviewed, and any later change reverts the
  gate to pending. Reads prototype/ and audit-report.md; writes review-record.md.
  Depends on self-audit. Approval gate: Primary User Approval Gate.
---

# User Review (STATE 09)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 09,
> §5 Approval Gates, §7 Loop Logic, §8 Completion Rules.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests a review. It communicates
> only through the artifact store (`artifacts/`), never directly with other
> skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | `artifacts/prototype/`, `artifacts/audit-report*.md`, `machine_state` |
| Writes | `artifacts/review-record*.md` |
| Depends on | `self-audit` (must precede — the machine gates itself before spending user attention) |
| Approval gate | **Primary User Approval Gate** — the central human gate of the machine |
| Retry ceiling | Clarification sub-prompt bounded to **2 rounds**; the surrounding `L_REVISION` loop is **3 full cycles** → `HALT_BLOCKED` |
| Next states | `FINAL_OUTPUT` (`approve`) / `REVISION` (`request-changes`) / `REQUIREMENT_ANALYSIS` (`reject` — direction wrong at root) / `HALT_BLOCKED` (user unavailable) |

## Purpose

Present the audited prototype to the user and capture structured approval or
change requests.

This state spends the one resource the machine cannot manufacture: human
attention. Everything upstream exists to make that attention cheap — the audit
runs first so the user never debugs, and the packet is built so the user never
hunts. Everything downstream depends on this record being **exact**: `REVISION`
routes from it, and `FINAL_OUTPUT` §8 rule 2 requires an `approve` *scoped to
the final frozen versions*.

## Processing steps

1. **Run Local (default).** Serve `prototype/` over local HTTP and open the
   player entry point. If a server is already listening → **Refresh Run Local**:
   reuse it and reopen the player. Standard command:
   `prototype/run-local.sh [port]` (default **8765**). **Record the player URL.**
2. **Package** prototype + audit summary for human review. Review happens
   against the *running* prototype, never static files.
3. **Present known limitations** transparently, from `audit-report.md`.
4. **Capture** the user response: `approve` / `request-changes` / `reject`.
5. **Structure** change requests into actionable, spec-linked items with a
   target state.
6. **Record** the review outcome.

## Review method (hardened)

Steps 1–6 say *what*. This section is the contract for *how*, and each rule was
written by something that went wrong at a real gate. Codes are cited from logs
and records — index in [`docs/method-rules.md`](../../docs/method-rules.md).

### G1 — Run Local, never a static preview

`run-local.sh` serves the prototype tree through `serve.py` on the port named in
`toolkit.config.json` → `review.port` (default **8765**) and opens **`play.html`**
— the player with the sidebar (feature list, walkthrough progress, *open
standalone*). The sidebar **is** the intended review chrome; opening a raw page
bypasses it. The script is idempotent and replaces a plain server on the port
with the live-reload one. All three files ship in
[`templates/prototype/`](../../templates/prototype/); STATE 07 copies them into
the prototype directory.

Two operational facts that silently degrade the review if missed:

- **A new prototype page must be registered in `play.html`'s `FEATURES` array**
  or it never appears in the sidebar and the user reviews the flow set minus
  the new flow.
- **Live reload is gated on workflow state** — active only while the top-level
  `current_state` in `state/machine_state.yaml` is `USER_REVIEW`. Outside review
  the same server serves plain pages. Do not diagnose "reload is broken" without
  checking the state file.

Deep-link into a flow with `play.html#<feature>`; the player splits
`#id?query` so a hook survives into the stage iframe.

### G2 — The packet is the hook list

State 07's traceability table (B2) already names a deep-link hook for every flow
state, variant and error case. **That table is the review packet.** Ship it with
the verdict request so the user can reach the non-happy-path states directly
instead of clicking toward them. A state the user cannot reach in one step is a
state that gets approved unseen.

### G3 — An approval is scoped to the bytes it saw

§5: *"An approval is scoped to the artifact versions it saw. If artifacts change
after approval, the gate reverts to `pending`."* §8 rule 2 says the same at
completion. Therefore:

- Freeze at the moment of approval and **record the sha256 of every approved
  file** in `review-record.md`.
- Record `reads_versions` in frontmatter — the exact prototype version and the
  audit of record. A record that names its versions only in prose is not
  machine-checkable.
- If the audit of record pre-dates the reviewed bytes, that is a **waiver**, not
  a detail. Name it and give it a rider debt item (see G6).

### G4 — Classify a post-approval delta before you ask about it

Bytes will move after approval. Classify first, because the two classes need
different things from the user:

| Class | Evidence required | What to ask for |
|---|---|---|
| **Bug-fix only** | Byte-level proof: token/hex inventory identical, diff confined to named regions, and the pre-fix file **reconstructed from the inverse delta hashing back to the approved sha** | A one-line **scope confirm** |
| **Feature delta** | The new behaviour, plus what it changes in the approved surface | A **ruling** — the gate is `pending` until it lands |

Do not present a feature delta as a bug fix to avoid re-opening a gate. The model
to copy is a record whose frontmatter names the bytes it *reviewed* and states
plainly, in the outcome, the version the approval is *scoped to* when the two
differ. That is the correct shape; it is the **silent re-freeze** that is the
defect.

### G5 — Present limitations; do not launder them

The `Known limitations` section of `audit-report.md` is this state's input, not
its embarrassment. An acceptance that carries qualifications is recorded **with
its qualifications**. A clean-looking record of a qualified acceptance is a
false record, and it is the artifact `FINAL_OUTPUT` will later be checked
against.

### G6 — Every waiver names its rider

A validation may be waived at the gate. It may not be waived *silently*. Each
waiver records: which rule, why, who granted it, and **the debt item it rides
on**. On the extraction run, `FINAL_OUTPUT` V2 (audit currency) and V3
(traceability) were both waived at one gate; both became tracked debt and both
were closed the next day — that worked **because they were written down**.

### G7 — Keep the pass count honest

`pass N = 1 + revision rounds delivered`. One round is one prototype rebuild,
however many sub-lettered asks it folds. Bump it in **every** place that states
it — the progress snapshot, the flow row and the recommendation list — in the
same edit, or they drift. Three pass counts were found stale at one gate and had
to be corrected before it could close.

### G8 — Ambiguity is bounded, not absorbed

Ambiguous feedback → a targeted clarification sub-prompt, **bounded to 2
rounds**. After that, record it as a `non-blocking` note rather than guessing.
A guess recorded as a requirement becomes a spec nobody chose.

## Output — `artifacts/review-record.md`

Write with structured frontmatter + body so downstream skills and the machine can
validate mechanically. **This frontmatter is canonical** — on the extraction run
the records drifted into two different shapes, and the later one dropped
`reads_versions` entirely, which is exactly the field `FINAL_OUTPUT` needs to
check §8 rule 2.

```markdown
---
artifact: review-record
version: review-<feature>-NN
produced_by: user-review
reads_versions:
  prototype: <proto-<feature>-NN — the exact bytes reviewed>
  audit-report.md: <audit-<feature>-NN>
feature: <feature/flow id>
date: <YYYY-MM-DD>
gate: PrimaryUserApprovalGate
verdict: APPROVED | REQUEST-CHANGES | REJECTED
player_url: http://localhost:8765/play.html#<feature>
---

# Gate record — <feature>

## Decision

**<VERDICT>** on the **Nth presentation**, <date>.

User instruction, verbatim: *"<quote>"*.

| Field | Value |
|---|---|
| Flow | <flow + screen ids> |
| Prototype at decision | `<proto-…>` |
| Audit of record | `<audit-…>` — <PASS N / N> |
| Reviewed at | `<player URL>` (Run Local rule V4) |
| Passes to approval | <N> |

## What was approved

<the ratified behaviour, decision by decision — this is what REVISION and
FINAL_OUTPUT will treat as settled.>

## Verification at approval

| Check | Result |
|---|---|
| Audit | <PASS N / N ACs> |
| Assertions (rendering-class) | <N / N> |
| Console | <N errors> |
| Screenshots | <N> |

## Change requests (if `request-changes`)

| ID | Verbatim ask | Target state | Spec link | Status |
|---|---|---|---|---|
| CR1 | *"<quote>"* | `UI_PLANNING` | R-x3 / F2 | open → revision-log |

_No request is dropped (V3). Anything not actioned is recorded as `deferred`
with a reason._

## Deltas ratified by this decision

| # | Delta | Class | Evidence |
|---|---|---|---|
| 1 | <change on top of frozen bytes> | bug-fix only \| **feature** | <inverse-delta hash / behaviour> |

## Known limitations presented

<verbatim from audit-report.md — carried, not laundered (G5).>

## Opens carried forward

| ID | Question | Ships as |
|---|---|---|

## Validations waived

| Rule | Why | Granted by | Rides on |
|---|---|---|---|

## Freeze hashes

| Deliverable file | sha256 |
|---|---|
```

## Validation rules (machine-checkable on output)

- **V1:** Outcome ∈ {`approve`, `request-changes`, `reject`}.
- **V2:** If `request-changes`, **≥1** change request, each linked to a target
  state.
- **V3:** **No change request silently dropped** — every captured ask appears as
  `resolved`, `open` or explicitly `deferred` with a reason.
- **V4:** **Run Local executed** — the review was conducted against a served
  prototype and the **player URL is recorded in `review-record.md`**, not
  against file previews.
- **V5** *(hardened, per G3)*: `reads_versions` names the exact
  prototype and audit versions, and **freeze hashes are recorded** for every
  approved file. An approval that cannot name its bytes cannot satisfy §8
  rule 2.
- **V6** *(hardened, per G6)*: Every waived validation names its rider
  debt item. A waiver with no rider is a silent waiver.

## Exit conditions

User decision captured and structured.

## Failure recovery

- **User unavailable** → `HALT_BLOCKED`. State is fully persisted and resumable
  at the exact state; this is not a failure.
- **Ambiguous feedback** → targeted clarification sub-prompt, bounded to **2
  rounds**, else record as a `non-blocking` note (G8).
- **Conflicting change requests** → they are surfaced at the **Conflict
  Mini-Gate** in `REVISION`, not resolved here. This state records the conflict
  faithfully, including both sides.
- **`reject`** → `REQUIREMENT_ANALYSIS`. Reject means the direction is wrong at
  the root, which is an upstream fault, not a revision.
- **`L_REVISION` ceiling (3 full cycles)** → `HALT_BLOCKED` with an escalation
  summary of unresolved items. The loop can never silently continue.

## Approval gate

**Primary User Approval Gate** — `USER_REVIEW` → `FINAL_OUTPUT`. It blocks
shipping an unapproved deliverable. Grantor: the **user**, never the machine.
On deny: → `REVISION` or `REQUIREMENT_ANALYSIS`.

Gate rules that bind this state:

- No forward transition through the gate without `C_APPROVED(gate)`.
- Gate state persists in `machine_state.approvals` and is resumable.
- **The gate reverts to `pending` when approved artifacts change** — the
  stale-approval anti-pattern is one of five the machine explicitly forbids.

## Recorded failure modes

### A. Gate integrity

| Case | What happened | Rule |
|---|---|---|
| **Bytes moved after approval, three times in one session** | Two bug-fix deltas and one **feature** delta — a whole screen rebuilt as a new surface — all landed on top of already-frozen deliverables. Each needed a scope confirm that **no written contract required** at the time; the feature one needed a ruling, not a confirm. | G3, G4 |
| **A stale machine record while the machine reported shipping** | `machine_state.yaml` sat **two days stale** — still naming an earlier flow at `USER_REVIEW / gate: pending` — while four §8 conditions were unmet. The gate record is what `FINAL_OUTPUT` trusts; if it is not written at decision time it is written from memory later. | G3 |
| **Pass counts stale in three places at once** | Three flows each understated their presentation count by two to four rounds. All three had to be corrected before the gate could close. | G7 |
| **Frontmatter drift** | The records split into two shapes; the most recent one **dropped `reads_versions` entirely**, naming its prototype and audit only in a body table. That is the exact field `FINAL_OUTPUT` needs to check "approval scoped to the final frozen versions". | V5 |
| **V4 evidence not actually recorded** | Three of six records named the player and hook in prose; **none recorded a player URL**. V4 asks for the URL specifically, so the rule was satisfied in practice and unevidenced in the artifact. | V4, G1 |

### B. Packaging

- **A flow missing from the player sidebar** is a flow the user does not review.
  New pages must be registered in `play.html`'s `FEATURES` array, in the same edit
  that creates the page.
- **Live reload gated on `current_state`** — outside `USER_REVIEW` the server
  serves plain pages. Check the state file before calling reload broken.
- **Reviewing raw pages bypasses the player chrome.** This was a direct user
  correction, and it is why V4 exists.

### C. Waivers that worked

`FINAL_OUTPUT` **V2** (five flows past their audit of record) and **V3** (no
traceability matrix for one batch) were both waived at a gate and both recorded as
debt with a named owner and a fix. Both were closed the next day — the audit
re-run against the frozen bytes, the matrix backfilled. **The waiver was not the
problem; it would have been the silence.** That is the whole of G6.
