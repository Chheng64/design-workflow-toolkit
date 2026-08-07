---
artifact: ui-plan
version: ui-signin-02
supersedes: ui-signin-01
produced_by: ui-planning
reads_versions:
  flows-signin.md: flow-signin-01
  ux-plan-signin.md: ux-signin-01
  research-signin.md: res-signin-01
  design-system: "Toolkit Reference DS · src:toolkit-ref-ds-0.1 · reference/design-system.md"
feature: signin
inherits: "nothing — this is the first flow in this product; there is no shell to inherit"
---

# UI Plan — signin

## Inherited, reused verbatim

**Nothing.** This is the first flow in the product, so there is no shell, no prior token layer and no established chrome to inherit. Everything below is either a design-system primitive or a `new` composition that argues for itself.

Recorded explicitly because on a later flow this section is where the reader learns what a plan is *not* claiming to introduce — and an empty one here is a fact, not an omission.

## Design-system adoption check

Before anything else, because a plan built on the wrong design system validates perfectly against it:

| The DS assumes | This product is | Match |
|---|---|---|
| mobile web | mobile web | ✅ |
| 393 × 852 | 393 × 852 (`product.viewport`) | ✅ |
| light theme only | light theme only (A1) | ✅ |
| Latin only | Latin only (`product.scripts` empty) | ✅ |
| LTR only | LTR only (A1) | ✅ |
| target floor 48px | product floor **44px** (`o-s4`, ruled) | ✅ — DS is stricter, so DS primitives clear the product floor by 4px |

Source id `toolkit-ref-ds-0.1` recorded in `reads_versions.design-system` **and** in `toolkit.config.json` → `designSystem.sourceId`.

## STRICT colour allowlist (V5)

```
brand      #2B3FD6  #EEF1FE  #FFFFFF
gray       #141821  #5A6274  #8A93A6  #F4F6FA  #DDE2EC
semantic   #B3261E  #FDECEA  #1B6E3C  #E7F4EC
exempt     .demo  .phone        (harness chrome, not app surface)

BANNED
  #FF0000  — the "just use red" default. --danger is #B3261E and it is contrast-checked.
  #0000FF  — likewise for links. --brand is #2B3FD6.
  #000000  — pure black is not in this system. --ink is #141821.
  #CCCCCC  — the ad-hoc border grey. --line is #DDE2EC.
```

Written into `toolkit.config.json` → `audit.colorAllowlist` / `colorBanned` in the same edit as this document. **An allowlist that lives only here is an allowlist nothing enforces** — STATE 08's harness reads the config, not this file.

The **BANNED** list is not optional. An allowlist alone cannot catch a value that was never supposed to exist: the audit must check **non-DS absence**, not just DS presence.

> Naming note: this "V5" is the `SELF_AUDIT` hex-conformance rule id. It is not a validation rule of this state — this state's rules are V1–V4 — and it is a different V5 from the rendering-class rule in `skills/08`.

**All colour is declared once, in `:root`, as custom properties.** Every usage is `var(--token)`. New hex introduced by this plan: **0**.

## Component inventory → DS mapping (reuse-first)

| Comp | Surface | DS mapping | new? |
|---|---|---|---|
| Screen container | all 3 screens | `ds-screen` | reuse |
| Top bar with back | reset request **only** | `ds-toolbar` + `back` | reuse |
| Title | all 3 screens | `--t-display` on `ds-screen` | reuse |
| Identifier field | sign in, reset request | `ds-field` + `default` / `error` | reuse+variant |
| Secret field | sign in | `ds-field` + `default` / `error` | reuse+variant |
| Submit control | all 3 screens | `ds-button` + `primary`, with `loading` state | reuse+variant |
| Reset route | sign in | `ds-link` + `block` | reuse+variant |
| Back-to-sign-in route | acknowledgement | `ds-link` + `block` | reuse+variant |
| Resend control | acknowledgement | `ds-button` + `ghost` | reuse+variant |
| Error banner | sign in, reset request | `ds-banner` + `error` | reuse |
| Locked banner | sign in | `ds-banner` + `error` | reuse |
| Offline banner | sign in, reset request | `ds-banner` + `error` | reuse — see Extension Note |
| Resent banner | acknowledgement | `ds-banner` + `success` | reuse |
| Sent-to address | acknowledgement | `--t-body` + `600` weight on `ds-screen` | reuse |
| Demo bar | harness only | — | **new**, justified: review chrome, not product surface. It exists so STATE 09 can drive the states that no data can produce, and it is declared in `audit.paletteExemptSelectors` so its own colours are not swept as app palette. It ships in the prototype and **not** in any deliverable claim about the product. |

**14 of 15 entries are reuse or a reuse+variant. One `new`, and it is harness chrome rather than product surface.** That is V2's evidence.

### Selector namespace claimed

This plan claims `.sn-*` and scopes every descendant rule with `>`. Declared here because the inventory is where a collision is cheap to see, and because generic class names collide silently across screens in a single-file prototype — a list-row class once repainted a hero on another screen, and a descendant selector inflated unrelated icons to ~340px.

Reserved: `.sn-screen .sn-field .sn-label .sn-input .sn-help .sn-btn .sn-link .sn-banner .sn-title .sn-bar .sn-addr`. Harness chrome uses `.demo` and `.phone`, which are palette-exempt.

## Layout rules (393 × 852)

**Vertical budget, sign in:** 852 − 44 (status) − 34 (home indicator) = **774 usable**.

| Region | Height | Notes |
|---|---|---|
| Top padding | 32 | `--sp-6` |
| Title | 34 | `--t-display`, one line |
| Gap | 24 | `--sp-5` |
| Banner slot | 0 or 64 | present only in error / locked / offline states; it **pushes** content rather than overlaying it |
| Identifier field | 76 | 20 label + 8 gap + 48 input |
| Gap | 16 | `--sp-4` |
| Secret field | 76 | same |
| Gap | 24 | `--sp-5` |
| Submit | 48 | `ds-button` min height |
| Gap | 16 | `--sp-4` |
| Reset route | 48 | `ds-link` **`block`** variant |
| Remaining | ≥ 388 | slack even with the banner present — no state scrolls at 393 × 852 |

**Reset request:** toolbar 56 + title + one field + submit + helper. **Acknowledgement:** toolbar 56 + title + address line + resend + back route.

### Interactive target sizes — checked against the floor

`o-s4` ruled the floor at **44px**. Every interactive element in this plan is specified at **48px**, which clears it by 4px:

| Element | Box | Floor | Clears |
|---|---|---|---|
| Identifier input | 393−32 × **48** | 44 | ✅ |
| Secret input | 393−32 × **48** | 44 | ✅ |
| Submit | 393−32 × **48** | 44 | ✅ |
| Reset route | 393−32 × **48** | 44 | ✅ |
| Resend | 393−32 × **48** | 44 | ✅ |
| Back-to-sign-in route | 393−32 × **48** | 44 | ✅ |
| Toolbar back | **48 × 48** | 44 | ✅ |

**Decision: every link in this flow uses the `block` variant, not `inline`.** The `inline` variant meets 44px through an `::after` hit-area expansion, and STATE 08's harness measures the **box**, not the hit area — so an `inline` link would report as a 20px target and be a confirmed-at-source false positive on every single audit run. Choosing the variant whose box is already 48px removes a recurring instrument argument at no design cost. This is a plan decision, recorded, not a prototype improvisation.

## Motion spec

| Element | Default | Reduced |
|---|---|---|
| View change | `--m-base` 200ms opacity+translateY(8px) | static — apply end state immediately |
| Banner appear | `--m-fast` 120ms opacity | static |
| Submit → busy | `--m-fast` 120ms label swap | static |
| Rejected attempt | `--m-shake` 300ms | **static — the banner alone carries the signal** |

Every row is forked for `prefers-reduced-motion`. **No state is signalled by motion alone**: the shake carries nothing the announced banner does not, which is what makes removing it under reduced motion lossless rather than degrading.

## Contrast

Decided here, on the token pair, from `reference/design-system.md`'s audited table. Every pair used in this flow:

| Use | Pair | Ratio | Needs | Verdict |
|---|---|---|---|---|
| Title, field text, address line | `--ink` on `--bg` | 17.8:1 | 4.5 | ✅ |
| Labels, helper copy | `--ink-2` on `--bg` | 6.1:1 | 4.5 | ✅ |
| Submit label | `--brand-ink` on `--brand` | 7.5:1 | 4.5 | ✅ |
| Links, focus ring | `--brand` on `--bg` | 7.5:1 | 4.5 | ✅ |
| Error banner copy | `--danger` on `--danger-weak` | 5.7:1 | 4.5 | ✅ |
| Success banner copy | `--ok` on `--ok-weak` | 5.5:1 | 4.5 | ✅ |

`--ink-3` (3.1:1) is used **only** for placeholder text, which is never the accessible name of a field and never carries load-bearing copy. Any plan that puts real copy on `--ink-3` is a plan change.

## `o-s5` — announcement versus focus, RULED here

`ux-signin-01` U1 and `res-signin-01` C2 left the ordering open. This state owns it.

**Ruling:** on a rejected attempt —

1. Render the banner into a container that already carries `role="alert"` in the DOM before the content arrives. A live region that is *created* with its content is unreliably announced; one that already exists and receives content is not.
2. Move focus to the secret field **in the same frame**, not after a delay.
3. The banner copy is the announcement. The secret field's own label is unchanged, so moving focus does not re-announce the error and interrupt it.

Both AC2.2 (focus on the secret field) and AC2.3 (announced, non-specific) are satisfied without the two fighting. **STATE 08 verifies this rather than assuming it** — `o-s5` closes only when the audit records it.

## `o-s2` — reveal-the-secret affordance, RULED here

**Out of scope for this cycle.** The design system has no primitive, so it would be a `new` component with its own state, icon, announcement policy and reduced-motion behaviour — against a `should`-band requirement that does not exist. Recorded in the Extension Note so a DS owner can see the product asked for it.

## Token reference resolution (V4)

| Category | Referenced | Resolve in DS | Extension needed |
|---|---|---|---|
| Colour | 12 tokens | 12 | 0 |
| Spacing | `--sp-1`…`--sp-6` | 6 | 0 |
| Type | `--t-display`, `--t-body`, `--t-label`, `--t-small`, `--ui-font` | 5 | 0 |
| Radius | `--r-field`, `--r-btn`, `--r-card` | 3 | 0 |
| Motion | `--m-fast`, `--m-base`, `--m-shake` | 3 | 0 |
| Focus | `--focus-ring` | 1 | 0 |

**New hex introduced: 0.** Every value resolves in `toolkit-ref-ds-0.1`. Nothing was added to the allowlist to make this plan true.

## Superseded

| Component | Replaced by | Strip in prototype |
|---|---|---|
| `ds-toolbar` + `back` on the **acknowledgement** screen | the explicit `Back to sign in` route already at the foot of the screen | **yes** — `.sn-bar` markup *and* the `#b-back-reset` click handler |

**Superseded by `rev-signin-01` / CR3.** `ux-signin-01`'s navigation model rules that back from the acknowledgement screen is disabled in favour of an explicit route, because the screen is reached by **replace** (D-f3). `ui-signin-01` assigned a toolbar back to it anyway, and `proto-signin-01` implemented the plan faithfully — the build matched its spec and the spec contradicted the one above it. The reset-request screen keeps its toolbar: that screen is reached by **push**, where back is correct.

## Extension Note (informational, non-blocking)

Recorded so a design-system owner can see what this product needed and the system did not have. None of these blocks the transition to `PROTOTYPE`.

1. **`ds-banner` has no `offline` variant.** The offline state reuses `error`, which is correct in tone but conflates "we could not reach the service" with "the service said no" — precisely the distinction `ux-signin-01` asks the design to preserve. It is carried by **copy** in this flow. A dedicated variant would carry it by **structure**.
2. **No countdown / resend-timer primitive.** This is why R5.2 was cut at the Direction Gate. The throttle ships as static copy stating the wait.
3. **No reveal-the-secret primitive** (`o-s2`). Ruled out of scope above.
4. **No inline field-validation timing rule.** This flow validates on submit only, which sidesteps it. A flow with live validation would have to invent the rule.

## Open decisions

- **`o-s1`:** attempt threshold — appears in exactly one string on the locked banner. Ruled by: auth service owner.
- **`o-s3`:** copy ownership — every string here is placeholder. Ruled by: content design.

_`o-s2` and `o-s5` are closed above. `o-s4` was closed at the Direction Gate._

## Validation self-check

- **V1** ✅ — all 11 flow states from `flow-signin-01` map to a component set: `S-SIGN-01` happy/loading/error/locked/offline, `S-SIGN-02` happy/loading/error, `S-SIGN-03` happy/success/error.
- **V2** ✅ — 14 of 15 inventory entries are reuse or reuse+variant. The single `new` is harness chrome and carries its justification.
- **V3** ✅ — no one-off styling where a primitive exists. Every surface maps to `ds-screen`, `ds-field`, `ds-button`, `ds-banner`, `ds-link` or `ds-toolbar`.
- **V4** ✅ — 30 token references, 30 resolve in `toolkit-ref-ds-0.1`, 0 extensions required, **0 new hex**.

**Exit:** validation passes → `PROTOTYPE` (`proto-signin-01`).
