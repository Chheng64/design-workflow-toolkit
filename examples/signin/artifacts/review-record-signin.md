---
artifact: review-record
version: review-signin-01
produced_by: user-review
reads_versions:
  prototype: proto-signin-02            # the bytes REVIEWED
  audit-report-signin.md: audit-signin-03
  traceability-signin.md: trace-signin-02
  revision-log-signin.md: rev-signin-01
scoped_to: proto-signin-03              # the bytes the approval COVERS, after one ratified bug-fix delta
feature: signin
date: "2026-08-07"
gate: PrimaryUserApprovalGate
verdict: APPROVED
player_url: http://localhost:8765/play.html#signin
---

# Gate record — signin

## Decision

**APPROVED** on the **1st presentation**, 2026-08-07.

User instruction, verbatim: *"Approve"* — with the accompanying ruling *"Run STATE 12 too"*, setting `handoff_required: true`.

| Field | Value |
|---|---|
| Flow | `signin` — `S-SIGN-01`, `S-SIGN-02`, `S-SIGN-03` |
| Prototype at decision | `proto-signin-02` |
| Approval **scoped to** | `proto-signin-03` — one bug-fix-only delta, ratified below |
| Audit of record | `audit-signin-03` — **PASS 26 / 26 ACs**, re-run on `proto-signin-03` |
| Reviewed at | `http://localhost:8765/play.html#signin` (Run Local, V4) |
| Passes to approval | **1** — `pass N = 1 + revision rounds delivered`; one revision cycle was consumed **before** first presentation, so nothing had been shown before this |

The prototype was served through `run-local.sh` / `serve.py` and reviewed through the player, not as file previews. Live reload was confirmed active, which is itself evidence the machine record was current: `serve.py` gates it on the top-level `current_state` being `USER_REVIEW`, and it was.

## What was approved

- **Credential entry** with correct autofill declaration, 16px field text, and a submit control inert until both fields carry content.
- **In-place recovery**: a rejected attempt preserves the entered identifier, moves focus to the secret field, and announces a message that names neither credential.
- **A self-service reset route** reachable in one tap, carrying the typed identifier forward, with **no account-exists branch anywhere in the flow** — the same acknowledgement is shown whether or not the address is registered.
- **A throttled resend** whose control is disabled while the throttle holds, with the wait stated in visible copy.
- **Eleven flow states**, each reachable by a deep-link hook and each proven to paint.
- **A 44px interactive floor**, ruled at the Direction Gate over WCAG 2.2 AA's 24px, and enforced by the audit at that number.
- **`handoff_required: true`** — STATE 12 runs before delivery.

This is what `REVISION` and `FINAL_OUTPUT` treat as settled.

## Verification at approval

| Check | Result |
|---|---|
| Audit | `audit-signin-03` — **PASS 26 / 26 ACs**, 0 unmet, 0 waived, re-run on the scoped bytes |
| Assertions (rendering-class) | **138 / 138**, stable over two consecutive full runs |
| Runs | 22 — 11 flow states × 2 passes (`base`, `reduced-motion`) |
| Console | **0 errors** (`favicon.ico` filtered by name, not wholesale) |
| Screenshots | **22 captured and read.** The re-read after the rebuild is what found AF-5 |
| Source sweeps | off-palette **0** · duplicate keys **0** · network call sites **0** |
| Revision loop | `L_REVISION` **1 / 3** |

## Change requests

**None.** The verdict was `approve`, so no change request was raised (V2 is inapplicable, V3 is vacuously satisfied — there was nothing to drop).

## Deltas ratified by this decision

| # | Delta | Class | Evidence |
|---|---|---|---|
| 1 | Reworded one source comment. It recited the request-API names, so `annotate`'s network sweep matched the **disclaimer claiming there were no network calls** (`E11`, blocking). Plus a third stale version string the AF-5 sweep missed. | **bug-fix only** | hex/token inventory **identical** (12 tokens) · diff confined to **one named region**, a source comment · the pre-fix file **reconstructed from the inverse delta hashes back to `04f2c92…c0512`**, the approved sha — exact match · full audit re-run on the new bytes: **138/138** |

**Classified before it was asked about** (G4). The class earned a **one-line scope confirm**, not a ruling.

User instruction, verbatim: *"Extend previous approval. Only bug fixes were made. Reuse the previous approval for this revision."*

The gate reverted to `pending` the moment the bytes moved — that reversion is automatic, and it is the rule that stops a deliverable and a prototype disagreeing about what shipped. It re-scoped to `proto-signin-03` on the confirm above.

No user-visible surface changed: the screenshots taken against `proto-signin-03` are indistinguishable from the ones reviewed against `proto-signin-02`.

## Known limitations presented

Verbatim from `audit-signin-03`, carried rather than laundered. The approval is **scoped to a deliverable that carries all six**.

1. **The lockout window is an assumed number rendered as fact** — *"Try again in 15 minutes"* (`o-s1`, AF-4). **Rides on debt #1.** Closes when the auth service owner states the real window.
2. **Every string is placeholder and unreviewed** (`o-s3`). Nobody has claimed copy ownership for this flow.
3. **Every response is simulated** (A2). The network sweep **measures** this — 0 call sites — but nothing here proves the real service behaves as designed.
4. **No competitor scan was performed** (`res-signin-01` GAP1). The design rests on standards and pattern evidence, not on what comparable products do.
5. **`ds-banner` has no `offline` variant** (Extension Note 1). *"Could not reach"* and *"was refused"* are held apart by **copy**, not by structure — one revision away from being lost.
6. **`o-s2` (reveal-the-secret) was ruled out of scope**, not built and rejected. The design system has no primitive.

**This is an acceptance with qualifications, and it is recorded with its qualifications.** A clean-looking record of a qualified acceptance is a false record, and it is the artifact delivery is checked against.

## Opens carried forward

| ID | Question | Ships as |
|---|---|---|
| `o-s1` | Lockout threshold and window — assumed 5 attempts / 15 minutes | The assumed value in one string, plus **debt #1** and Known limitation 1 |
| `o-s3` | Copy ownership | Placeholder strings, plus Known limitation 2 |

`o-s2`, `o-s4` and `o-s5` are **closed** — at STATE 06, at the Direction Gate, and at STATE 06-verified-by-STATE-08 respectively.

## Validations waived

| Rule | Why | Granted by | Rides on |
|---|---|---|---|
| — | **none** | — | — |

No validation was waived at this gate. The audit of record ran on the bytes being approved (V6 satisfied without a rider), and the traceability matrix exists and is current (`trace-signin-02`).

Recorded as an empty table rather than omitted: an absent waiver section and a table stating *none* are different claims.

## Freeze hashes

Recorded at the moment of approval, **re-recorded after the ratified delta**. An approval is scoped to the bytes it saw — these are those bytes, as re-scoped.

The reviewed sha for `signin.html` was `04f2c9288d2c6e180a238247ca91a8c30e8636c89ef2fabc72a7f862463c0512` (`proto-signin-02`). Both are named, because a record that quietly re-freezes under a new hash is the **silent re-freeze** that G4 exists to prevent — the shape to copy is one that says out loud when the bytes moved between review and approval.

| Deliverable file | sha256 |
|---|---|
| `prototype/signin.html` | `ac31e27100c8c729a1173ee6252ada8f8663ecd46e6a4e15c2c130aa163eb56f` |
| `prototype/play.html` | `3277901ea9f3365ca6a068e6a60588683254b4e940f04c46f0c852f462828462` |
| `prototype/serve.py` | `11c6df40390bbd05ec88d0051d6a78ccc7e2b5a34f3756f3da418ed69d0c8d15` |
| `prototype/run-local.sh` | `02173bbd3c1a9fa1c7401fe4f5a316e02c2e970070389f05d3d42e047d50eabb` |

`FINAL_OUTPUT` compares these against the bytes it freezes. If they differ, the gate reverts to `pending` and the delta is classified before anything is packaged.

## Exit

`approve` **+** `C_HANDOFF_REQUIRED` → **`FLOW_VISUALIZATION`**, then `FINAL_OUTPUT`.
