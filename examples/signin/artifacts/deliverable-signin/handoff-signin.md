# Sign In — Design Handoff

_Feature: **signin** · State: **DONE** (Primary User Approval granted 2026-08-07, 1st pass, scoped to `proto-signin-03`) · Developer Handoff Gate granted 2026-08-07 · Date: 2026-08-07_

> **Standing caveats that apply to everything below.** Every string in this flow is **placeholder and unreviewed** — nobody has claimed copy ownership. Every response is **simulated**; there is no network call anywhere in the frozen bytes, and that is measured rather than asserted. The lockout window shown to the user is an **assumed number**. The design system is a minimal reference system built for this run, not a production one.

## What this delivers

| Screen | ID | Built |
|---|---|---|
| Sign in | `S-SIGN-01` | Email + password entry with correct autofill declaration, an inert submit until both fields carry content, in-place recovery from a rejected attempt, a rate-limited state, and an offline state. One tap to the reset route from **every** state. |
| Reset password | `S-SIGN-02` | Reset request carrying the identifier already typed. Malformed-identifier error. **No account-exists branch.** |
| Check your email | `S-SIGN-03` | Acknowledgement naming the address, a resend that is genuinely throttled, and an explicit route back to sign in. |

**States:** 11, every one drivable by URL —
`S-SIGN-01`: `happy` · `loading` · `error{invalid-credentials}` · `locked{rate-limited}` · `offline`
`S-SIGN-02`: `happy` · `loading` · `error{invalid-email}`
`S-SIGN-03`: `happy` · `success{resent}` · `error{resend-throttled}`

## Requirement source

A three-sentence brief, written for this reference run. **This flow was built to a spec, not to an external requirement document** — the receiving team should know that, because a flow built with no user brief is a different object from one built to a stakeholder's document.

The brief, verbatim: *"Users sign in with an email and a password. If they have forgotten their password they can request a reset link. Wrong credentials should be recoverable without losing what they typed. Mobile first."*

## Key decisions

- **D-f2 — There is no `account exists?` branch anywhere in the reset flow.** A well-formed identifier always reaches the acknowledgement, whether or not it belongs to an account. Adding the branch would satisfy a helpfulness instinct and build an account-enumeration oracle. **Do not add it during implementation.**
- **D-s4 — Password paste is not blocked.** Blocking it removes the mechanism WCAG 2.2 SC 3.3.8 relies on.
- **`o-s4` — The interactive target floor is 44 × 44, not 24 × 24.** Ruled at the Direction Approval Gate. This is **stricter than WCAG 2.2 AA** and matches the AAA criterion. An element that passes an external AA audit can still fail this product's audit. Every element ships at 48px.
- **D-f3 — `S-SIGN-02 → S-SIGN-03` is a `replace`, not a `push`.** Back into a submitted request invites a duplicate. `S-SIGN-03` therefore has **no toolbar back**; the only way out is the explicit route at the foot of the screen. `S-SIGN-02` keeps its toolbar back because it is reached by `push`.
- **`o-s5` — On a rejected attempt: reveal the banner into a `role="alert"` container that already exists in the DOM, and move focus to the password field in the same frame.** A live region created together with its content is unreliably announced. Both AC2.2 and AC2.3 hold without the two interrupting each other.
- **D-s2 — The live resend countdown was cut.** The design system has no countdown primitive. The throttle ships as static copy plus a disabled control.

## Pipeline artifacts

```
requirements-signin (7R / 26 ACs) → research-signin (12 cited sources, 2 contradictions
preserved) → product-review-signin (proceed, D-s1..D-s4) → ux-plan-signin →
flows-signin (0 unreachable, 0 unjustified dead ends) → ui-plan-signin-02 →
traceability-signin-02 → prototype proto-signin-03 →
audit-report-signin-03 (PASS 26/26) → review-record-signin-01 (APPROVED) →
flow-visualization-signin (navmap-signin-01, READY FOR DEVELOPMENT)
```

One revision cycle: `audit-signin-01` **failed** on three screenshot-only defects → `rev-signin-01` → `ui-signin-02` + `proto-signin-02` → `audit-signin-02` passed. `L_REVISION 1 / 3`.

**Figma:** none. The navigation model is delivered as `navgraph.json` + reports rather than as a design file — see `flow-visualization-signin.md` for why.

## Acceptance criteria

- **`audit-signin-03` PASS — 26 / 26 ACs**, run against the frozen bytes (P4).
- **138 / 138 rendering-class assertions**, stable over two consecutive full runs, 22 runs each.
- **22 screenshots** captured and read, across `base` and `reduced-motion`.
- Console sweep: **0 errors**. Hex conformance: **12 tokens, 0 off-palette, 0 new hex**. Duplicate keys: **0**. Network call sites: **0**.
- Superseded ACs: **0**.

## Freeze

| File | sha256 |
|---|---|
| `prototype/signin.html` | `ac31e27100c8c729a1173ee6252ada8f8663ecd46e6a4e15c2c130aa163eb56f` |
| `prototype/play.html` | `3277901ea9f3365ca6a068e6a60588683254b4e940f04c46f0c852f462828462` |
| `prototype/serve.py` | `11c6df40390bbd05ec88d0051d6a78ccc7e2b5a34f3756f3da418ed69d0c8d15` |
| `prototype/run-local.sh` | `02173bbd3c1a9fa1c7401fe4f5a316e02c2e970070389f05d3d42e047d50eabb` |

**A freeze is a hash, not a copy.** These are what the next gate, the next audit and the next revision compare against.

## Review packet

```
prototype/run-local.sh → play.html#signin
```

Every state, in one step — this is what makes the deliverable re-drivable after the loop closed:

| State | URL |
|---|---|
| `S-SIGN-01 happy` | `signin.html?view=signin` |
| `S-SIGN-01 loading` | `signin.html?view=signin&state=loading` |
| `S-SIGN-01 error{invalid-credentials}` | `signin.html?view=signin&state=invalid` |
| `S-SIGN-01 locked{rate-limited}` | `signin.html?view=signin&state=locked` |
| `S-SIGN-01 offline` | `signin.html?view=signin&state=offline` |
| `S-SIGN-02 happy` | `signin.html?view=reset` |
| `S-SIGN-02 loading` | `signin.html?view=reset&state=loading` |
| `S-SIGN-02 error{invalid-email}` | `signin.html?view=reset&state=bademail` |
| `S-SIGN-03 happy` | `signin.html?view=sent` |
| `S-SIGN-03 success{resent}` | `signin.html?view=sent&state=resent` |
| `S-SIGN-03 error{resend-throttled}` | `signin.html?view=sent&state=throttled` |

All 11 verified to **paint** by `stateprobe`, not merely to be reachable.

## Waivers

| Rule | Waived because | Rider | What closes it |
|---|---|---|---|
| — | **none** | — | — |

**No validation was waived.** The audit of record ran on the bytes being frozen, the traceability matrix exists and is current, and the revision log covers the one cycle that happened. Recorded as an empty table rather than omitted — an absent waiver section and a table stating *none* are different claims.

## Known limitations

Shipped at full strength, in the terms they were discovered in. The receiving team otherwise discovers them in build, at a much higher price.

| ID | Limitation |
|---|---|
| **`o-s1` / debt #1** | The locked state tells the user *"Try again in 15 minutes"*. **That number is assumed, not ruled** — the real threshold is the auth service's. It ships as a concrete number in user-facing copy because a design has to say something. **Closes when** whoever owns the auth service states the real window; it is a one-string change. |
| **`o-s3`** | **Every string in this flow is placeholder and unreviewed.** No content designer has seen them. Treat all copy as provisional. **Closes when** copy ownership is claimed. |
| **A2** | **Every response is simulated.** The source sweep confirms **0 network call sites**, so the claim is measured rather than asserted — but nothing here proves the real service behaves as designed. In particular, the enumeration-safety property (AC4.3) is a property of *this design*; the service must also honour it. |
| **`res-signin-01` GAP1** | **No competitor scan was performed.** The design rests on standards and pattern evidence (WCAG 2.2, OWASP, NIST SP 800-63B, MDN) and on nothing about what comparable products actually do. **Closes when** three comparable mobile sign-in flows are inspected at the invalid-credentials and reset-acknowledgement moments. |
| **Extension Note 1** | **`ds-banner` has no `offline` variant.** *"We could not reach the service"* and *"the service said no"* are held apart by **copy alone**, not by structure — which is one careless revision away from being lost. The UX plan explicitly asks the design to preserve that distinction. |
| **`o-s2`** | **A reveal-the-password affordance was ruled out of scope**, not evaluated and rejected. The design system has no primitive for it. |
| **TK-2** *(toolkit, not product)* | `audit.paletteExemptSelectors` is documented as the mechanism that exempts harness chrome from the palette sweep and is **referenced by no tool**. Recorded during this run, not resolved. |

## §8 Completion Rules

| # | Rule | Holds | Evidence |
|---|---|---|---|
| 1 | `current_state` = `DONE` | ✅ | `machine_state.yaml`, written **in this same edit** as the freeze |
| 2 | approval scoped to the final frozen versions | ✅ | `review-signin-01` `reads_versions` = `proto-signin-02`, `scoped_to` = `proto-signin-03`; freeze sha `ac31e271…` matches. The one post-approval delta was classified bug-fix-only with inverse-delta evidence and ratified by scope confirm |
| 3 | `C_ALL_CRITERIA_MET` | ✅ | `trace-signin-02` + `audit-signin-03`: **26 met / 0 waived / 0 superseded / 0 unmet** |
| 4 | `C_AUDIT_PASS` on the final version | ✅ | `audit-signin-03`, re-run on `proto-signin-03` — the bytes in the table above |
| 5 | deliverable + handoff + traceability + decision log exist | ✅ | this folder; `traceability-signin.md`; decision log in `flows-signin.md` and `product-review-signin.md` |
| 6 | no `open` items in the latest `revision-log.md` | ✅ | `rev-signin-01`: 4 resolved, 1 explicitly deferred with a reason and a debt id, **0 open** |
| 7 | Developer Handoff Gate granted + `C_NAVMAP_CLEAN` | ✅ | `navmap-signin-01`; all four validators exit 0 at `--fail-on major`, 0 waivers |
