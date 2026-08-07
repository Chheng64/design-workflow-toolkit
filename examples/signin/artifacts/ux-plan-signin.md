---
artifact: ux-plan
version: ux-signin-01
produced_by: ux-planning
reads_versions:
  requirements-signin.md: req-signin-01
  research-signin.md: res-signin-01
  product-review-signin.md: pr-signin-01
feature: signin
coverage: 3/3 tasks with full state enumeration
---

# UX Plan — signin

> **This document is screen-free (V4).** No screen id, no layout, no component name, no colour appears below. It describes the states a user is in and what they experience there. Naming a screen here would pre-commit STATE 06 to a layout nobody chose.

## Primary tasks (→ requirements)

Derived from the `must` / `should` bands of `pr-signin-01`, not from the raw requirement set.

| Task | User intent | Reqs |
|---|---|---|
| **TASK-A** | Get into the product with credentials I know | R1, R3, R7 |
| **TASK-B** | Fix a credential I got wrong, without starting over | R2, R3, R6, R7 |
| **TASK-C** | Get back in when I have forgotten the password | R4, R5, R6, R7 |

Every task traces to at least one prioritized requirement (V3).

## Information architecture

Three regions, and the model is deliberately shallow — an unauthenticated user has one job.

```
Unauthenticated area
├── Credential entry           the default landing place for a returning user
├── Reset request              reachable only from credential entry
└── Reset acknowledgement      reachable only from reset request
```

- **Credential entry** is the entry point of the whole area. Everything else is downstream of it.
- **Reset request** carries forward whatever identifier the user already typed. It is not a fresh start.
- **Reset acknowledgement** is an end-of-branch, not a dead end: it always offers a way back to credential entry and a way to try the request again.

Nothing in this area is deep-linkable from outside it in the product sense. The deep-link hooks STATE 07 will add are a **review and audit affordance**, not a user-facing route — the distinction matters because a route that is navigable only by URL is a different claim from one a user can reach.

## Navigation model

- **Entry points:** cold start into the unauthenticated area; return from an expired session.
- **Persistent navigation:** none. This area has no chrome beyond a back affordance on the two downstream regions.
- **Push vs replace:** moving to the reset request is a **push** — the user expects back to return them to credential entry with what they typed intact. Moving from reset request to acknowledgement is a **replace**: going "back" into a request already submitted invites a duplicate submission.
- **Back semantics:** back from reset request returns to credential entry, identifier preserved. Back from acknowledgement is disabled in favour of an explicit route.
- **Exit:** success leaves this area entirely, into the authenticated product. That transition is a boundary — it belongs to another flow, and it is marked as one rather than assumed.

## State enumeration

### TASK-A — sign in with known credentials

| State | Kind | Trigger | Strategy |
|---|---|---|---|
| happy | happy | area entered | Both identifier and secret are requested together. The submit affordance is inert until both carry content, and its inertness is conveyed by more than colour. |
| loading | non-happy | submit | The submit affordance becomes busy and cannot be triggered again. The user is told work is happening; the fields stay visible so nothing appears to have been discarded. |
| offline | non-happy | submit with no connectivity | Distinguished from a failed credential: the user is told the attempt did not reach anywhere, and is offered a retry. Nothing they typed is cleared. |
| interrupted | non-happy | the area is left and returned to mid-attempt | Treated as a fresh happy state. Nothing half-submitted is retained, and nothing implies a submission is still in flight. |
| permission-denied | n/a | — | No OS permission is required anywhere in this area. Recorded as inapplicable rather than omitted. |

### TASK-B — recover from a failed attempt

| State | Kind | Trigger | Strategy |
|---|---|---|---|
| happy | happy | correction accepted | Indistinguishable from TASK-A's success. Recovery is not a different destination. |
| error (credential rejected) | non-happy | rejected submit | **The identifier survives.** Focus moves to the secret. The message is announced to assistive technology, and it does not reveal which of the two was wrong — that is a security property, not a copy preference. |
| locked (attempts exhausted) | non-happy | repeated rejection | The user is told they must wait and for how long, without being told how close they were. The route to the reset branch stays available — being locked out is the single strongest reason to want it. |
| empty | n/a | — | Neither field can be meaningfully empty *after* an attempt; the inert submit affordance prevents the attempt. Recorded as inapplicable. |
| offline | non-happy | retry with no connectivity | As TASK-A. A failed reach is never presented as a failed credential. |

### TASK-C — request a reset link

| State | Kind | Trigger | Strategy |
|---|---|---|---|
| happy | happy | reset branch entered | The identifier already typed is carried in. The user is not asked to retype something they just typed. |
| loading | non-happy | request submitted | As TASK-A: busy, non-repeatable, nothing appears discarded. |
| error (identifier malformed) | non-happy | submit with an unusable identifier | The only error this branch may show. **A well-formed identifier always succeeds**, whether or not it belongs to an account — anything else is an enumeration oracle. |
| success (acknowledged) | happy | request accepted | Names the identifier the link went to, so a typo is visible without checking a mailbox. Offers a repeat and a route back. |
| error (repeat throttled) | non-happy | repeat requested too soon | The repeat affordance states the wait in visible copy. A control that silently stops working reads as broken. |
| offline | non-happy | submit with no connectivity | As TASK-A. |

## Edge-case matrix

| | loading | empty | error | interrupted | offline | permission-denied |
|---|---|---|---|---|---|---|
| TASK-A | ✅ | n/a — inert submit prevents an empty attempt | ✅ (via TASK-B) | ✅ | ✅ | n/a — no OS permission in this area |
| TASK-B | ✅ | n/a — as above | ✅ ×2 (rejected, locked) | ✅ | ✅ | n/a |
| TASK-C | ✅ | n/a — inert submit prevents an empty request | ✅ ×2 (malformed, throttled) | ✅ | ✅ | n/a |

Every `n/a` names why. An unexplained `n/a` is indistinguishable from an omission.

## Accessibility strategy

- **Interactive target floor: 44 × 44 CSS px of hit area.** Ruled at the Direction Approval Gate (`o-s4`, 2026-08-07) and set in `toolkit.config.json` → `audit.tapTargetFloorPx`. This is **stricter than WCAG 2.2 AA's 24 × 24** and matches the AAA criterion — deliberately. STATE 08 enforces this number, so an element conforming to AA can still fail this audit. **Hit area, not box:** an expanded target counts, and a box smaller than its hit area is a known audit false-positive class, not a defect.
- **Contrast:** 4.5:1 for load-bearing copy, 3:1 at ≥ 18.66px. Decided at STATE 06 on the token pair, with ratios written down — not discovered at audit time.
- **Focus order:** identifier → secret → submit → reset route. Focus is moved deliberately exactly once, on a rejected attempt, and it moves to the field the user has to change.
- **Announcement:** every state change that is not visible where the user is looking is announced through an assertive live region. **Ordering of announcement against focus movement is an open decision** (`o-s5`) — the two can interrupt each other, and the ordering is STATE 06's to rule and STATE 08's to verify.
- **Keyboard reachability:** every affordance is reachable and operable without a pointer. Nothing is reachable only by gesture.
- **Motion opt-out:** every motion has a static equivalent under `prefers-reduced-motion`. **No state is signalled by motion alone** — the rejected-attempt shake carries no information the announced message does not.
- **Script and locale:** single locale, Latin, LTR. `product.scripts` is empty, which turns the per-glyph font check **off**. Correct for this product and wrong for any product rendering a second script — recorded so the emptiness reads as a decision.
- **Text size:** the secret and identifier fields render at ≥ 16px, because below that a mobile browser zooms the viewport on focus and the user loses their place.
- **Paste is not blocked** anywhere, including on the secret. Blocking it removes the mechanism WCAG 2.2 SC 3.3.8 relies on (research T5, D-s4).

## UX risks

- **U1: The rejected-attempt state does two things at once** — announce, and move focus. Done naively they interrupt each other and the user hears neither cleanly. Threatens AC2.2 and AC2.3 together. **Planned response:** rule the ordering at STATE 06 (`o-s5`), verify it at STATE 08 rather than assuming it.
- **U2: The locked state is the one users hit when they are already frustrated**, and it is the state most likely to be built last and reviewed least. Threatens AC6.1 and AC6.2. **Planned response:** it ships with its own deep-link hook like every other state, so it is reachable in one step at the review gate rather than after five deliberate failures.
- **U3: "Simulated" is easy to claim and easy to get wrong.** If any part of this area issues a real request, the whole non-goal collapses quietly. **Planned response:** STATE 08 sweeps the source for network call sites rather than trusting the claim.
- **U4: The reset branch's error space is deliberately tiny**, and the pressure during build will be to add a helpful "we don't recognise that address". Threatens AC4.3 outright. **Planned response:** AC4.3 is falsifiable and marked with evidence at STATE 08; the single acknowledgement state is the design that makes the failure hard to build.

## Open decisions

- **`o-s1`:** Lockout threshold and window — assumed 5 attempts / 15 minutes. Blocks nothing; occupies one string. Ruled by: whoever owns the auth service.
- **`o-s2`:** Is a way to reveal the typed secret in scope? The design system has no primitive for it, so it is an Extension Note at STATE 06, not a free addition. Ruled by: product.
- **`o-s3`:** Copy ownership. Every string in this area is placeholder and unreviewed. Ruled by: content design.
- **`o-s5`:** Announcement-versus-focus ordering on a rejected attempt (U1). Ruled by: STATE 06. Verified by: STATE 08.

_`o-s4` was closed at the Direction Approval Gate — 44px holds._

## Validation self-check

- **V1** ✅ — TASK-A enumerates happy + 4 non-happy (loading, offline, interrupted, + error via TASK-B); TASK-B happy + 4; TASK-C happy + 5. All three exceed the ≥ 3 floor.
- **V2** ✅ — accessibility strategy present, non-empty, and states its target floor as a number.
- **V3** ✅ — TASK-A → R1/R3/R7, TASK-B → R2/R3/R6/R7, TASK-C → R4/R5/R6/R7. All prioritized.
- **V4** ✅ — no screen id, no layout, no component name, no colour value appears in this document.

**Exit:** validation passes → `FLOW_GENERATION`.
