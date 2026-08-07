---
artifact: product-review
version: pr-signin-01
produced_by: product-review
reads_versions:
  requirements-signin.md: req-signin-01
  research-signin.md: res-signin-01
feature: signin
recommendation: proceed
gate: direction-approval
gate_state: approved
gate_granted_by: user
gate_date: "2026-08-07"
gate_rulings:
  o-s4: "hold 44px — audit.tapTargetFloorPx stays 44"
---

# Product Review — signin

## Recommendation

**proceed** — with one scope cut and one contradiction going to the gate unresolved.

Three findings drove it:

1. **The evidence supports every `must` item, and none of them is speculative.** Autofill declaration (T1), non-enumerating errors (T2) and preserve-and-refocus recovery (T3) are all cited, all cheap, and all in the same three screens. There is no requirement here whose value rests on an assumption.
2. **The one genuinely contested number is the product's own, not an external one.** C1 — the 44px floor against WCAG 2.2 AA's 24px — is a decision this product already made and wrote into `toolkit.config.json`. It is presented at the gate as unresolved because it is a **product** ruling, and STATE 08 will enforce whichever answer the gate gives.
3. **The cut is real and it removes the only high-effort item.** R5's resend throttle wants a countdown primitive the design system does not have (`o-s2`'s neighbour). Cutting the live countdown to a static message keeps the requirement and removes the extension.

The scope is three screens and eleven flow states. Nothing below was introduced here; every id resolves in `req-signin-01`.

## Prioritized requirements

| ID | Requirement | Value | Effort | Risk | Band | Evidence |
|---|---|---|---|---|---|---|
| R1 | Credential entry is correct on a phone | H | L | L | **must** | [T1, T5] |
| R2 | A failed sign-in is recoverable in place | H | L | L | **must** | [T2, T3] |
| R3 | Work in flight is visible and cannot be double-submitted | M | L | L | **must** | [T3] |
| R4 | A forgotten password has a self-service route | H | M | M | **must** | [T2] |
| R6 | Every non-happy path is reachable and leads somewhere | H | M | L | **must** | [T3, T6] |
| R7 | The accessibility floor is met, not approximated | H | M | **M** | **must** | [T4, T5] |
| R5 | The reset confirmation is actionable, not a dead end | M | M | L | **should** | [T2, T6] |
| — | *(no `could` items)* | | | | | |
| R5.2 | Live countdown on the resend throttle | L | **H** | M | **cut** | [T6] — see cut list |

Seven of seven requirements retained. One **sub-clause** cut, named explicitly rather than folded silently into its parent.

## Risk register

| ID | Risk | Sev | Mitigation **or** accept-risk | Owner |
|---|---|---|---|---|
| K1 | The 44px floor is stricter than the AA standard the team may believe it is conforming to. An element can pass an external audit and fail this one. | **high** | Present C1 at this gate for an explicit ruling. Whichever way it goes, the number lives in exactly one place — `audit.tapTargetFloorPx` — and STATE 08 enforces it mechanically. | product · this gate |
| K2 | The reset confirmation could be made to differ by account existence during build, reintroducing an enumeration oracle. | **high** | AC4.3 is a falsifiable criterion, and the single confirmation screen is the design that makes the failure hard to build. STATE 08 marks it met or unmet with evidence. | design + build |
| K3 | The lockout threshold (A3, `o-s1`) is an assumed number that will appear in shipped copy. | med | Carried as an open decision, not defaulted at build time. It occupies one string; changing it is a copy change, not a design change. | auth service owner |
| K4 | Every string in this flow is placeholder and unreviewed (`o-s3`). | med | **ACCEPTED** — this is a reference run, not a shipping product. Accepted by: the person granting this gate. It ships inside the deliverable's Known limitations at full strength. | product |
| K5 | The prototype simulates all responses (A2), so nothing here proves the real service behaves as designed. | med | **ACCEPTED** — explicit non-goal. STATE 08's source sweep confirms no network call exists, so the claim "simulated" is measured rather than asserted. Accepted by: the person granting this gate. | product |

Both `high`-severity risks carry a mitigation. Both `med` acceptances name who accepts them.

## Scope contradictions

- **X1 — the target-size floor.** `req-signin-01` AC7.1 requires **44 × 44** hit area. Research theme **T4** shows WCAG 2.2 **AA** requires **24 × 24** (S7) and that 44 × 44 is the **AAA** criterion (S8). Both are correct; they answer different questions. This is a product ruling, not a research finding, and it **goes to the gate unresolved**. Recorded as **`o-s4`**.

  The consequence of each answer, stated so the ruling is informed:
  - **Hold 44px** — the design system's own primitives are already 48px, so nothing in this flow is at risk. The cost is that a future screen conforming to AA can still fail this audit.
  - **Relax to 24px** — matches the external standard, and immediately makes the `ds-link` hit-area expansion (`::after{inset:-14px}`) unnecessary.

  **Ships as, if unruled:** 44px, because it is the reversible reading — lowering a floor later is a config change, raising one restyles approved screens.

  > **RULED at this gate, 2026-08-07 — hold 44px.** Grantor: user. `audit.tapTargetFloorPx` stays `44`. STATE 08 enforces 44, not 24, and an element conforming to WCAG 2.2 AA can still fail this audit. That is the intended behaviour, not a defect. `o-s4` is closed.

- **X2 — announce versus refocus.** Research contradiction **C2**. `role="alert"` announces without moving focus (S5); SC 3.3.1 wants the item in error identified (S6). AC2.2 asks for focus on the password field and AC2.3 asks for the announcement. Doing both naively can make a screen reader interrupt itself.

  **Not a direction question** — the ordering is a STATE 06 decision and STATE 08 verifies it. Deferred, not resolved here, and recorded so it is not discovered during assembly.

## Decision record

- **D-s1: Proceed at three screens, eleven flow states.** — trigger that would reverse it: a ruling that the reset link target is in scope, which changes this from a three-screen flow to a five-screen one and re-opens this gate.
- **D-s2: The live resend countdown is cut; the throttle ships as static copy.** — trigger: the design system gaining a countdown primitive, at which point it returns as a `should` at no extra cost.
- **D-s3: The design system is `toolkit-ref-ds-0.1`, and its own assumptions were checked against this product's** — mobile, 393 × 852, light, Latin, LTR — and match. — trigger: any of those diverging. This check exists because a plan built on the wrong design system validates perfectly against it.
- **D-s4: Password paste is not blocked.** — trigger: none foreseen; blocking it would break the mechanism SC 3.3.8 relies on (T5).

**Deferred to later states, with ids:**

| Open | Question | Owning state |
|---|---|---|
| `o-s1` | Lockout threshold and window (assumed 5 / 15 min) | copy, at STATE 06 |
| `o-s2` | Password-visibility toggle in scope? DS has no primitive → Extension Note | STATE 06 |
| `o-s3` | Copy ownership — every string is placeholder | ships as a known limitation |
| `o-s4` | **44px versus AA's 24px** — X1 above | **this gate** |
| `o-s5` | Announce-versus-refocus ordering — X2 above | STATE 06, verified at STATE 08 |

## Cut list

- **R5.2 — live countdown on the resend throttle.** Out for this cycle. The design system has no countdown primitive, so building it is a new component with a justification, a timer, a reduced-motion equivalent and an announcement policy — high effort against low value on a screen the user sees once. **What brings it back:** the design system gaining the primitive, or evidence that users retry the resend before the window expires often enough to matter.

  R5 itself is retained. AC5.2 is satisfied by static copy stating the wait, which is also what T6 recommends: a control that silently stops working reads as broken; one that says why does not.
