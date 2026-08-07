---
artifact: requirements
version: req-signin-01
produced_by: requirement-analysis
scope_class: small
effort_tier: 1 flow · 3 screens · 11 flow states
feature: signin
---

## Problem statement

A returning user on a phone has no reliable way back into the product: a mistyped
credential currently costs them everything they typed, and a forgotten password
has no self-service route at all. This feature covers credential entry, in-place
recovery from a failed attempt, and a request for a password-reset link — mobile
first, on a 393 × 852 viewport.

## Goals

- **G1:** A returning user with correct credentials reaches the authenticated area from a cold start on a phone.
- **G2:** A user who mistypes a credential can correct and retry **without re-entering what was already right**.
- **G3:** A user who has forgotten their password can request a reset link without contacting support.
- **G4:** The whole flow is operable one-handed at 393 × 852 and meets the product's own accessibility floor.

## Actors

- **Returning user** — primary. Knows they have an account; may or may not remember the password.
- **Support agent** — secondary and indirect. Every self-service reset is a ticket that does not arrive.

## Constraints

- Mobile-first. 393 × 852 is the review and capture viewport.
- Single locale (`en`), Latin script only, light theme only — matching the design system's own stated assumptions.
- **No live backend.** Every response in the prototype is simulated; no network call exists anywhere in it.
- **Account enumeration must not be possible from the reset flow** — the confirmation cannot differ by whether the address is registered.
- Design system: `toolkit-ref-ds-0.1`, named by source id in `toolkit.config.json`.

## Non-goals

- Sign-up and account creation.
- Social login, SSO, or any third-party identity provider.
- The reset **link target** — the set-a-new-password screen. Out of scope for this run.
- Biometric authentication, remembered devices, and multi-factor.
- Server-side rate-limiting policy. The design shows the user-facing state; the threshold is the server's.

## Requirements & acceptance criteria

- **R1: Credential entry is correct on a phone.**
  - **AC1.1:** The email field carries `type="email"`, `inputmode="email"` and `autocomplete="username"`; the password field carries `type="password"` and `autocomplete="current-password"`.
  - **AC1.2:** Field text renders at ≥ 16px, so mobile Safari does not zoom the viewport on focus.
  - **AC1.3:** The submit control is disabled while either field is empty, and its disabled state is conveyed by more than colour alone.

- **R2: A failed sign-in is recoverable in place.**
  - **AC2.1:** After an invalid-credentials response, the entered email is **still present** in the email field.
  - **AC2.2:** After an invalid-credentials response, focus moves to the password field.
  - **AC2.3:** The error is announced to assistive technology (`role="alert"`) and **does not state which of the two credentials was wrong**.

- **R3: Work in flight is visible and cannot be double-submitted.**
  - **AC3.1:** While a submit is in flight the control shows a busy state, sets `aria-busy`, and a second submit is impossible.
  - **AC3.2:** The busy state is reachable by a deep-link hook and paints.

- **R4: A forgotten password has a self-service route.**
  - **AC4.1:** A control on the sign-in screen reaches the reset-request screen in **one tap**.
  - **AC4.2:** The reset screen pre-fills the email already typed on the sign-in screen, when one was typed.
  - **AC4.3:** Submitting a reset request shows the **same** confirmation regardless of whether the address is registered.

- **R5: The reset confirmation is actionable, not a dead end.**
  - **AC5.1:** The confirmation names the address the link was sent to.
  - **AC5.2:** A resend control exists, is throttled after first use, and the throttle is stated in visible copy rather than implied by a disabled control.
  - **AC5.3:** A route back to sign-in exists from the confirmation.

- **R6: Every non-happy path is reachable and leads somewhere.**
  - **AC6.1:** Each of `loading`, `error{invalid-credentials}`, `locked{rate-limited}`, `offline`, `error{invalid-email}` and `error{resend-throttled}` is reachable by a deep-link hook and paints.
  - **AC6.2:** Each of those states offers at least one control that leads somewhere the user can act — none is terminal.

- **R7: The accessibility floor is met, not approximated.**
  - **AC7.1:** Every interactive element measures **≥ 44 × 44 CSS px of hit area** at 393 × 852. Hit area, not box — an expanded `::after` target counts.
  - **AC7.2:** Every text/background pair carrying load-bearing copy measures ≥ 4.5:1, or ≥ 3:1 at ≥ 18.66px.
  - **AC7.3:** Every motion has a static equivalent under `prefers-reduced-motion`, and no state is signalled by motion alone.
  - **AC7.4:** No page produces console errors, and no page scrolls horizontally at 393px.

## Assumptions

- **A1 [assumed]:** Single locale `en`, Latin script, LTR, light theme only. `product.scripts` is therefore empty and the per-glyph font check is off — correct here, and wrong for any product that renders a second script.
- **A2 [assumed]:** The prototype simulates every response. No `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` or `EventSource` exists in it. STATE 08's source sweep is expected to confirm this rather than take it on trust.
- **A3 [assumed]:** The lockout the user sees is **5 failed attempts, 15-minute window**. The real threshold is server policy and is not this design's to set. Accepted explicitly here rather than left as a blocking question; carried forward as `o-s1` and reversible before build.
- **A4 [assumed]:** The reset **link target** is a separate flow, per non-goals. The confirmation screen is where this feature ends.
- **A5 [confirmed]:** 393 × 852 viewport and a 44px interactive floor — both set in `toolkit.config.json` (`product.viewport`, `audit.tapTargetFloorPx`) and checked by STATE 08.
- **A6 [confirmed]:** Design system `toolkit-ref-ds-0.1`, whose own assumptions (mobile, 393 × 852, light, Latin, LTR) were checked against this product's and match.

## Open questions

_No `blocking` question remains. Each item below is `non-blocking` and carried forward as an open decision rather than defaulted silently at build time._

- **Q1 [non-blocking] `o-s1`:** Exact lockout threshold and window. Assumed 5 / 15 min per **A3**. Blocks nothing; the number appears in one string. Ruled by: whoever owns the auth service.
- **Q2 [non-blocking] `o-s2`:** Is a password-visibility toggle in scope? The design system has **no primitive** for it, so adding one is an Extension Note at STATE 06, not a free addition. Ruled by: product.
- **Q3 [non-blocking] `o-s3`:** Copy ownership. Every string here is placeholder and unreviewed. Ships as a known limitation unless someone claims it. Ruled by: content design.
