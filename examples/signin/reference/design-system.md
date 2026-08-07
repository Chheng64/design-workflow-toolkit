# Toolkit Reference DS

**Source id:** `toolkit-ref-ds-0.1`
**Platform:** mobile web · **Base viewport:** 393 × 852
**Owner:** this reference run. Not a real product design system.

> **Why this file exists.** STATE 06 requires a design system named **by source id**, because a plan built on the wrong design system validates perfectly against it — one such mix-up survived four revision cycles and reached `HALT_BLOCKED` before the tell was spotted (a desktop-first viewport assumption inside a mobile product).
>
> A reference run with no design system would skip the rule it most needs to demonstrate. So this is a real, minimal system, and its own assumptions are stated so they can be checked against the product's: **mobile, 393 × 852, single-script, light theme only.**

---

## Tokens

### Colour

| Token | Value | Use |
|---|---|---|
| `--ink` | `#141821` | Primary text |
| `--ink-2` | `#5A6274` | Secondary text, helper copy |
| `--ink-3` | `#8A93A6` | Placeholder, disabled label |
| `--bg` | `#FFFFFF` | Screen background |
| `--surface` | `#F4F6FA` | Inset surface, field background |
| `--line` | `#DDE2EC` | Hairline border |
| `--brand` | `#2B3FD6` | Primary action, focus ring, links |
| `--brand-ink` | `#FFFFFF` | Text on `--brand` |
| `--brand-weak` | `#EEF1FE` | Brand-tinted surface |
| `--danger` | `#B3261E` | Error text and error border |
| `--danger-weak` | `#FDECEA` | Error banner background |
| `--ok` | `#1B6E3C` | Success text |
| `--ok-weak` | `#E7F4EC` | Success banner background |

**Audited pairs** — decided here, on the token pair, not at audit time.

| Foreground | Background | Ratio | Needs | Verdict |
|---|---|---|---|---|
| `--ink` `#141821` | `--bg` `#FFFFFF` | **17.8:1** | 4.5 | pass |
| `--ink-2` `#5A6274` | `--bg` `#FFFFFF` | **6.1:1** | 4.5 | pass |
| `--ink-3` `#8A93A6` | `--bg` `#FFFFFF` | **3.1:1** | 4.5 | **fail — placeholder only, never load-bearing text** |
| `--brand-ink` `#FFFFFF` | `--brand` `#2B3FD6` | **7.5:1** | 4.5 | pass |
| `--brand` `#2B3FD6` | `--bg` `#FFFFFF` | **7.5:1** | 4.5 | pass |
| `--danger` `#B3261E` | `--bg` `#FFFFFF` | **6.5:1** | 4.5 | pass |
| `--danger` `#B3261E` | `--danger-weak` `#FDECEA` | **5.7:1** | 4.5 | pass |
| `--ok` `#1B6E3C` | `--ok-weak` `#E7F4EC` | **5.5:1** | 4.5 | pass |

Ratios computed from the sRGB relative-luminance formula, not estimated. They are written down here so a pairing that fails is a **plan** change rather than a prototype patch discovered at audit time.

`--ink-3` fails 4.5:1 by design and is **restricted to placeholder text**, which is not the accessible name of any field. A plan that puts real copy on `--ink-3` is a plan change, not a prototype patch.

### Spacing

4pt base. `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 24 · `--sp-6` 32 · `--sp-7` 48

### Typography

Base stack is set on the container, never per component — the token layer is the **base**, not an opt-in.

```css
--ui-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `--t-display` | 28 / 34 | 700 | Screen title |
| `--t-body` | 16 / 24 | 400 | Body, field text |
| `--t-label` | 14 / 20 | 600 | Field label |
| `--t-small` | 13 / 18 | 400 | Helper, error copy |

16px is the minimum field font size: below it, mobile Safari zooms on focus.

### Radius and elevation

`--r-field` 12 · `--r-btn` 12 · `--r-card` 16 · `--focus-ring` `0 0 0 3px rgba(43,63,214,.35)`

### Motion

| Token | Value | Reduced-motion equivalent |
|---|---|---|
| `--m-fast` | 120ms ease-out | none — apply the end state immediately |
| `--m-base` | 200ms ease-out | none |
| `--m-shake` | 300ms shake keyframe | none — the error banner alone carries the signal |

Every motion token has a static equivalent. Motion is never the sole carrier of meaning.

---

## Primitives

| Primitive | Variants | Notes |
|---|---|---|
| `ds-field` | `default` · `error` · `disabled` | Label + input + helper slot. Min height **48px**. Error variant swaps border to `--danger` and reveals the helper slot with `role="alert"`. |
| `ds-button` | `primary` · `ghost` · `link` | Min height **48px**, min width 48px. `primary` fills `--brand`. `loading` state swaps the label for a spinner and sets `aria-busy`. |
| `ds-banner` | `error` · `success` · `info` | Full-width inset surface, icon + copy. `role="alert"` on `error`. |
| `ds-link` | `inline` · `block` | `--brand`, underlined. The `inline` variant expands its hit area to 48px via `::after{inset:-14px}` — the **box** stays smaller than the hit area, which is a known audit false-positive class. The `block` variant is `inline-flex` with `min-height:48px` and needs no expansion. |
| `ds-screen` | — | The 393 × 852 container. Sets `--ui-font` on itself. Safe-area padding via `env(safe-area-inset-*)`. |
| `ds-toolbar` | `back` · `none` | Top bar, 56px, optional back affordance. |

### Interactive target floor

**48px**, which exceeds this product's stated acceptance floor of 44px. Stated here so STATE 06 can check its layout numbers against `audit.tapTargetFloorPx` — the last state where the number is free to change.

---

## What this system does not have

Recorded so STATE 06 raises an **Extension Note** rather than inventing a primitive:

- No password-visibility toggle primitive.
- No countdown / resend-timer primitive.
- No inline field-level validation timing rule.
- No offline banner variant (`ds-banner` has `error`, not `offline`).

---

## Assumptions this system makes

Check these against the product before adopting it — this list is the tell that catches a wrong-document adoption:

| Assumption | Value |
|---|---|
| Platform | mobile web |
| Viewport | 393 × 852 |
| Theme | light only |
| Scripts | Latin only |
| Direction | LTR only |
| Density | single (no compact variant) |
