---
artifact: research
version: res-signin-01
produced_by: research
reads_versions:
  requirements-signin.md: req-signin-01
coverage: 4/4 goals mapped-or-waived (100%)
feature: signin
---

# Research — signin

## Themes

- **T1: Autofill only works if the fields are declared for it.** Browser and password-manager autofill keys off `autocomplete` tokens and input types. `username` + `current-password` is the pair a sign-in form is expected to expose; getting it wrong silently disables the single largest reduction in typing on a phone.
  - sources: [S1, S2]
  - relevance: AC1.1, AC1.2 — and, indirectly, G2, because the cheapest way not to lose what the user typed is not to make them type it
  - maps_to: [G1, G2]

- **T2: An authentication error must not identify which credential was wrong.** Distinguishing "no such account" from "wrong password" turns the sign-in form into an account-enumeration oracle. The same rule drives the reset flow: the response must be identical whether or not the address is registered.
  - sources: [S3, S4]
  - relevance: AC2.3, AC4.3
  - maps_to: [G2, G3]

- **T3: Error recovery is a focus-management problem, not a copy problem.** An error that is visible but not announced is invisible to a screen-reader user; an error that clears the form costs the user everything they typed. The pattern is: preserve input, move focus to the field to correct, announce the message in a live region.
  - sources: [S5, S6]
  - relevance: AC2.1, AC2.2, AC2.3
  - maps_to: [G2, G4]

- **T4: The 44px target floor is a product decision above the external standard, not a restatement of it.** WCAG 2.2 SC 2.5.8 sets a **24 × 24** minimum; SC 2.5.5 sets **44 × 44** at AAA. This product's own acceptance criterion is 44px, which is stricter than the AA conformance target — so an element can conform to AA and still fail this product's audit.
  - sources: [S7, S8]
  - relevance: AC7.1
  - maps_to: [G4]

- **T5: Requiring the user to reproduce a memorised secret is itself an accessibility concern.** WCAG 2.2 SC 3.3.8 requires that a cognitive function test not be the only way through authentication unless an alternative exists — and it names password-manager paste support as a qualifying mechanism. Blocking paste on a password field breaks it.
  - sources: [S9]
  - relevance: AC1.1, AC7.2, and the decision **not** to block paste
  - maps_to: [G1, G4]

- **T6: Rate-limiting is server policy; the design owns only the state the user sees.** Guidance is consistent that throttling belongs at the service, and that the user-facing message should not leak how close the account is to a limit.
  - sources: [S4, S10]
  - relevance: AC6.1 `locked{rate-limited}`, and assumption A3
  - maps_to: [G2]

## Evidence & citations

- **S1 [resolvable]:** The `autocomplete` attribute's token list, including `username`, `current-password` and `new-password`, and the behaviour user agents key off — MDN, *HTML attribute: autocomplete*: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
- **S2 [resolvable]:** `inputmode` and input-type behaviour on touch keyboards — MDN, *inputmode*: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode
- **S3 [resolvable]:** Authentication responses must be generic and must not permit username enumeration — OWASP *Authentication Cheat Sheet*: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **S4 [resolvable]:** The reset flow must return an identical response regardless of account existence, and reset requests should be throttled — OWASP *Forgot Password Cheat Sheet*: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- **S5 [resolvable]:** `role="alert"` is an assertive live region; content added to it is announced without moving focus — WAI-ARIA Authoring Practices, *Alert pattern*: https://www.w3.org/WAI/ARIA/apg/patterns/alert/
- **S6 [resolvable]:** SC 3.3.1 Error Identification — the item in error must be identified and described in text — WCAG 2.2: https://www.w3.org/TR/WCAG22/#error-identification
- **S7 [resolvable]:** SC 2.5.8 Target Size (Minimum), AA, 24 × 24 CSS px — WCAG 2.2: https://www.w3.org/TR/WCAG22/#target-size-minimum
- **S8 [resolvable]:** SC 2.5.5 Target Size (Enhanced), AAA, 44 × 44 CSS px — WCAG 2.2: https://www.w3.org/TR/WCAG22/#target-size-enhanced
- **S9 [resolvable]:** SC 3.3.8 Accessible Authentication (Minimum), AA — a cognitive function test must not be required unless an alternative or a mechanism to assist exists; password-manager support qualifies — WCAG 2.2: https://www.w3.org/TR/WCAG22/#accessible-authentication-minimum
- **S10 [resolvable]:** Guidance on throttling authentication attempts and on not disclosing lockout proximity — NIST SP 800-63B, *Digital Identity Guidelines: Authentication and Lifecycle Management*: https://pages.nist.gov/800-63-3/sp800-63b.html
- **S11 [resolvable]:** SC 1.4.3 Contrast (Minimum), AA, 4.5:1 and 3:1 for large text — WCAG 2.2: https://www.w3.org/TR/WCAG22/#contrast-minimum
- **S12 [resolvable]:** SC 2.3.3 Animation from Interactions and the `prefers-reduced-motion` media query — WCAG 2.2: https://www.w3.org/TR/WCAG22/#animation-from-interactions · MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

## Competitor notes

**None gathered.** See `GAP1`. No competitor product was inspected during this run, so nothing is recorded here rather than a plausible-sounding summary. **V4 forbids a fabricated citation, and an unsourced competitor observation is the same defect wearing different clothes.**

## Pattern catalog

- **P1: Preserve-and-refocus on credential error.** Keep the identifier, clear or keep the secret, move focus to the field to correct, announce in a live region. (sources: [S5, S6])
- **P2: Identical confirmation for every reset request.** One confirmation screen, naming the address the user typed, shown whether or not the account exists. (sources: [S3, S4])
- **P3: Throttle the resend, and say so.** A resend control that silently stops working reads as broken. State the wait in copy. (sources: [S4, S10])
- **P4: Declare the field, do not fight the browser.** Correct `autocomplete` and `type` tokens, 16px minimum text, paste permitted. (sources: [S1, S2, S9])

## Constraints

- Reset-flow responses must not vary by account existence. (sources: [S3, S4])
- Password paste must not be blocked — blocking it removes the mechanism SC 3.3.8 relies on. (sources: [S9])
- Field text ≥ 16px on iOS, or the viewport zooms on focus. (sources: [S2])
- Load-bearing text ≥ 4.5:1, or ≥ 3:1 at ≥ 18.66px. (sources: [S11])
- Every motion needs a static equivalent under `prefers-reduced-motion`. (sources: [S12])

## Contradictions

_Listed, not resolved. Each is carried to STATE 03 as-is._

- **C1: The product's own target floor is stricter than the standard it cites.** This product's AC7.1 requires 44 × 44 (S8, AAA); WCAG 2.2 AA requires 24 × 24 (S7). An element measuring 32px conforms to AA and **fails this product's audit**. Both sources are correct; they are answering different questions. Left unresolved here — it is a product decision, and STATE 03 owns it.
- **C2: "Announce the error" and "move focus to the field" can conflict.** `role="alert"` announces without moving focus (S5); SC 3.3.1 requires the item in error be identified (S6). Doing both naively can cause a screen reader to interrupt itself. Left unresolved: the ordering is a STATE 06 decision, and STATE 08 is where it is verified.

## Goal coverage

- **G1** → [T1, T5] · **G2** → [T1, T2, T3, T6] · **G3** → [T2] · **G4** → [T3, T4, T5]

4 of 4 goals mapped. **0 waived.** Coverage threshold met at 100%.

## Gaps

- **GAP1 [competitor scan not performed]:** No live competitor inspection was carried out in this run, so the **Competitor notes** section is empty rather than populated. This is recorded as a gap, not filled with a plausible summary — a fabricated observation is a V4 failure and is more expensive than an empty section, because it looks like evidence. **What would close it:** inspect three comparable mobile sign-in flows and record what each does at the invalid-credentials and reset-confirmation moments.
- **GAP2 [server policy unavailable]:** The real lockout threshold and window are the auth service's, and were not available during this run. Assumption A3 (5 / 15 min) stands in, carried as `o-s1`. **What would close it:** one line from whoever owns the auth service.
