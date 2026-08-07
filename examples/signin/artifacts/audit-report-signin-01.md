---
artifact: audit-report
version: audit-signin-01
produced_by: self-audit
reads_versions:
  prototype: proto-signin-01
  requirements-signin.md: req-signin-01
  ux-plan-signin.md: ux-signin-01
  flows-signin.md: flow-signin-01
  ui-plan-signin.md: ui-signin-01
  traceability-signin.md: trace-signin-01
feature: signin
verdict: fail
---

# audit-signin-01 — signin — verdict: **FAIL**

## Verdict

**fail** — 24 / 26 acceptance criteria met. **138 / 138 machine checks passed and the screenshots found three real defects.**

That sentence is the whole point of this state. The harness returned a clean exit code on every driven state across two passes; reading the images found two `major` defects it structurally cannot see and one it was never asked about. **"138/138 passed" is a statement about the checks, not about the product.**

## Method

- **22 runs** — 11 flow states × 2 passes (`base`, `reduced-motion`).
- **138 assertions**, all **rendering-class** per M1: computed `display` / `visibility` / `opacity` and measured `getBoundingClientRect` geometry. No assertion in this report is satisfied by DOM presence.
- Per driven state: paints · no console errors · 44px targets · no horizontal overflow · no content spill · composited contrast · registry-id match.
- **22 screenshots captured and read** per M2 — `artifacts/shots/`.
- **3 source sweeps** per M4: off-palette hex against the 12-token allowlist, duplicate keys across every object literal (`product.locales` = 1), and network call sites (`fetch` / `XMLHttpRequest` / `WebSocket` / `sendBeacon` / `EventSource`).
- Script-font check **not run** — `product.scripts` is empty, which is correct for a single-script product and is recorded rather than silently skipped.

```
138 / 138 checks · 22 runs · 22 screenshots · exit 0
```

## Findings

| ID | Sev | Finding | Caught by | Status |
|---|---|---|---|---|
| **AF-1** | **major** | `S-SIGN-01 error{invalid-credentials}` renders with an **empty email field**. AC2.1 requires the entered identifier to survive a rejected attempt — and the hook that drives this state seeds the *view* state without seeding the *data* state, so the criterion **cannot be demonstrated from the review packet at all**. | **screenshot** | open → revision |
| **AF-2** | **major** | `S-SIGN-03 error{resend-throttled}` shows the banner *"Already sent. You can ask again in 60 seconds"* **above a fully live "Send it again" button**. The copy claims a throttle the control does not enforce. AC5.2 requires the control to *be* throttled, not to say it is. | **screenshot** | open → revision |
| **AF-3** | **major** | `S-SIGN-03` carries a toolbar **Back** control. `ux-signin-01`'s navigation model rules the opposite: *"Back from acknowledgement is disabled in favour of an explicit route"*, because the screen is reached by **replace** (D-f3). `ui-signin-01`'s inventory assigned `ds-toolbar + back` to the acknowledgement screen anyway, and the prototype implemented the plan faithfully. **The build matches its spec; the spec contradicts the one above it.** | **screenshot** | open → revision |
| **AF-4** | minor | The `locked{rate-limited}` banner renders *"Try again in 15 minutes"* — the **assumed** value from `o-s1`, presented to the user as fact. Recorded, not silently accepted: an unruled number reaching the surface is exactly how a placeholder gets frozen into an approved deliverable. | screenshot | recorded → debt #1 |

### Why the assertions could not see AF-1 and AF-2

Both are **agreement** defects, and the harness has no concept of agreement:

- AF-1: the field **paints**, has correct geometry, meets the target floor and passes contrast. Every property the probe measures is correct. What is wrong is that its *contents* do not demonstrate the behaviour the acceptance criterion names.
- AF-2: the banner paints, the button paints, both meet 44px, both pass contrast. What is wrong is that one **contradicts** the other.

This is the same class as the recorded *"label and glyph out of sync"* defect: a rendered claim disagreeing with the state it describes. No structural assertion catches it. A person looking at the image catches it immediately.

## Conformance matrix

| AC | Requirement | Met | Evidence |
|---|---|---|---|
| AC1.1 | Correct `autocomplete` / `type` / `inputmode` tokens | **met** | source: `type=email inputmode=email autocomplete=username`; `type=password autocomplete=current-password` |
| AC1.2 | Field text ≥ 16px | **met** | computed `font-size: 16px` on `.sn-input`, both fields, both passes |
| AC1.3 | Submit inert while a field is empty, conveyed by more than colour | **met** | `disabled` attribute present — conveyed to AT structurally, not by colour. Screenshot `s-sign-01-happy` |
| **AC2.1** | **Entered email survives a rejected attempt** | **unmet** | **AF-1** — `s-sign-01-invalid-credentials` shows an empty field. Not failed-by-behaviour; **unevaluable from the packet**, which P3 treats as unmet |
| AC2.2 | Focus moves to the secret field | **met** | `f-pass.focus()` fires in the same frame as the banner reveal (`o-s5` ruling); `aria-invalid=true` set. Screenshot shows the danger border on the password field |
| AC2.3 | Announced, and does not say which credential was wrong | **met** | `role="alert"` container pre-exists in the DOM. Copy: *"That email and password did not match"* — names neither |
| AC3.1 | Busy state, `aria-busy`, no double submit | **met** | `s-sign-01-loading`: label swaps to *"Working…"*, `aria-busy=true`, `disabled=true` |
| AC3.2 | Busy state reachable by hook and paints | **met** | `?view=signin&state=loading` — painted in both passes |
| AC4.1 | Reset reachable in one tap | **met** | `b-forgot` on `S-SIGN-01`, 48px box |
| AC4.2 | Reset pre-fills the typed identifier | **met** | `b-forgot` handler copies `f-email.value` into `f-reset-email` before the view change |
| AC4.3 | Same confirmation regardless of registration | **met** | **there is no account-exists branch anywhere in the source.** D-f2 held through assembly. Helper copy states it out loud |
| AC5.1 | Confirmation names the address | **met** | `s-sign-03-happy` — `t-addr` renders the submitted value |
| **AC5.2** | **Resend is throttled, and the wait is stated** | **unmet** | **AF-2** — the wait is stated; the control is not throttled |
| AC5.3 | Route back to sign in from the confirmation | **met** | `b-to-signin`, 48px box |
| AC6.1 | All 6 non-happy states reachable by hook and painting | **met** | 11/11 hooks drove and painted across both passes |
| AC6.2 | Every non-happy state offers a control that leads somewhere | **met** | invalid → correct+submit · locked → reset route · offline → retry · bademail → correct+submit · throttled → wait+resend · resent → resend / back |
| AC7.1 | Every interactive element ≥ 44 × 44 hit area | **met** | 0 findings across 22 runs at floor **44** (`o-s4` ruling). Every element is specified at 48px, so the box itself clears — no hit-area-expansion argument arises |
| AC7.2 | Contrast ≥ 4.5:1 (≥ 3:1 at ≥ 18.66px) | **met** | 0 findings, composited backgrounds, 22 runs |
| AC7.3 | Every motion has a static equivalent | **met** | `reduced-motion` pass drove all 11 states; `@media (prefers-reduced-motion:reduce)` zeroes the view animation and the button transition |
| AC7.4 | No console errors; no horizontal overflow | **met** | 0 console errors and 0 overflow findings across 22 runs |
| — | *(6 further sub-criteria rolled into the rows above)* | met | — |

**24 met · 2 unmet · 0 waived.**

## Harness corrections

Per M3 — a failing probe is a hypothesis. One failure was reported on the first run, confirmed at source, and turned out to be the instrument.

| Reported | Confirmed at source | Correction |
|---|---|---|
| `sweep off-palette · (set)` — 11 hexes outside the allowlist: `#D8DFFA #171717 #33406B #1F2E6E #5A6798 #EEF2FE #EDF0F7 #FFF3D6 #8A6400 #DDF5E4 #177A3E` | **All 11 live in `play.html`** — the Run Local review player. Review chrome, not product surface. Verified by `grep -rlo` per hex. | **`tools/audit.mjs` corrected**, not waived. Its source sweep read every `.html` / `.js` / `.css` in the prototype directory including the player. `tools/annotate.mjs` in the same toolkit already excludes exactly `{review.player, run-local.sh, serve.py}`; `audit.mjs` now does too. Re-run: **138/138, exit 0.** |

**This is a defect in the toolkit, found by running it**, and it is filed as one — see [Toolkit findings](#toolkit-findings). It is recorded here rather than waived because an uncorrected harness re-reports the same noise every run, and a report a reader learns to skim is worse than no report.

## Toolkit findings

Defects in the toolkit itself, surfaced by this run. Neither is a defect in `signin`.

- **TK-1 (fixed) — `tools/audit.mjs` swept the review player as product surface.** Root cause is a **check gap**, so per R2/R3 the dispatch is two things: the tool (fixed, above) and the rule (`skills/08` should state that the harness files are excluded from the source sweep, the way `annotate.mjs` already implements). The narrower fix — patching only this run's allowlist — would have left the class open for every future product.
- **TK-2 (open) — `audit.paletteExemptSelectors` is referenced by no tool.** `toolkit.config.json`, `tools/config.mjs` defaults, `VALIDATION_ENGINE.md` and `skills/08` all name it as the mechanism that exempts harness chrome from the palette check. `grep -n paletteExempt tools/*.mjs` returns only the default declaration. The sweep is **file**-level, so a *selector* list could not exempt anything even if it were read. Either the key is dead and should go, or the check it implies does not exist yet. **Recorded, not resolved** (M6) — removing a documented config key is a decision, not an audit finding.

## Known limitations

Carried to `USER_REVIEW` for transparent presentation. Not laundered.

1. **`o-s1` reaches the surface as fact.** The locked banner renders *"15 minutes"*, which is an assumed value (AF-4). Ships as debt #1. **Closes when** whoever owns the auth service states the real window.
2. **Every string is placeholder and unreviewed** (`o-s3`). Nobody has claimed copy ownership for this flow.
3. **Every response is simulated** (A2). The source sweep confirms zero network call sites, so the claim is measured — but nothing here proves the real service behaves as designed.
4. **The competitor scan was never performed** (`res-signin-01` GAP1). The design rests on standards and pattern evidence, not on what comparable products do.
5. **`ds-banner` has no `offline` variant** (Extension Note 1). *"We could not reach the service"* and *"the service said no"* are carried apart by **copy**, not by structure — the distinction `ux-signin-01` asks the design to preserve is one revision away from being lost.

## Exit

`fail` → **`REVISION`**, with AF-1, AF-2, AF-3 attached. AF-4 is recorded as debt and is **not** dispatched.

A `fail` verdict is a normal outcome of this state, not an error. The machine gating itself here is what makes the next state's human attention cheap.
