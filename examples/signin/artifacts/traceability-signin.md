---
artifact: traceability
version: trace-signin-02
supersedes: trace-signin-01
produced_by: prototype
reads_versions:
  requirements-signin.md: req-signin-01
  ux-plan-signin.md: ux-signin-01
  flows-signin.md: flow-signin-01
  ui-plan-signin.md: ui-signin-02
feature: signin
---

# Traceability — signin (`proto-signin-02`)

Every prototype element traces to a spec entry (V2), and every flow state is represented (V1). File: `artifacts/prototype/signin.html`.

## Requirement → task → flow → component → prototype element

| Req | Task | Flow | UI component | Prototype element / hook |
|---|---|---|---|---|
| R1 | TASK-A | F1 | `ds-field` ×2 | `#f-email`, `#f-pass` · `?view=signin` |
| R1 | TASK-A | F1 | `ds-button primary` | `#b-signin`, gated by `gate(['f-email','f-pass'],'b-signin')` |
| R2 | TASK-B | F1 | `ds-banner error` | `.sn-banner-invalid` · `?view=signin&state=invalid` |
| R2 | TASK-B | F1 | focus ruling `o-s5` | `show()` → `pass.focus()` + `aria-invalid=true` |
| R3 | TASK-A | F1 | `ds-button` `loading` | `#b-signin[aria-busy]` · `?view=signin&state=loading` |
| R4 | TASK-C | F1→F2 | `ds-link block` | `#b-forgot` — copies `f-email.value` into `f-reset-email` (AC4.2) |
| R4 | TASK-C | F2 | `ds-field` | `#f-reset-email` · `?view=reset` |
| R5 | TASK-C | F2 | `ds-button ghost` | `#b-resend` · `?view=sent` |
| R5 | TASK-C | F2 | `ds-link block` | `#b-to-signin` (AC5.3) |
| R6 | all | F1, F2 | `ds-banner` ×6 | one per non-happy state, each with its own hook |
| R7 | all | — | layout rules | every interactive box `min-height:48px` against a 44px floor |

## Flow state → prototype representation (V1)

| `flow-signin-01` node | Representation | Hook |
|---|---|---|
| `S-SIGN-01 (happy)` | default entry, `.view[data-view=signin]` | `?view=signin` |
| `S-SIGN-01 (loading)` | `data-state=loading` → `#b-signin[aria-busy=true]` | `?view=signin&state=loading` |
| `S-SIGN-01 (error{invalid-credentials})` | `data-state=invalid` → `.sn-banner-invalid` | `?view=signin&state=invalid` |
| `S-SIGN-01 (locked{rate-limited})` | `data-state=locked` → `.sn-banner-locked` | `?view=signin&state=locked` |
| `S-SIGN-01 (offline)` | `data-state=offline` → `.sn-banner-offline` | `?view=signin&state=offline` |
| `S-SIGN-02 (happy)` | `.view[data-view=reset]` | `?view=reset` |
| `S-SIGN-02 (loading)` | `data-state=loading` → `#b-send[aria-busy=true]` | `?view=reset&state=loading` |
| `S-SIGN-02 (error{invalid-email})` | `data-state=bademail` → `.sn-banner-bademail` | `?view=reset&state=bademail` |
| `S-SIGN-03 (happy)` | `.view[data-view=sent]` | `?view=sent` |
| `S-SIGN-03 (success{resent})` | `data-state=resent` → `.sn-banner-resent` | `?view=sent&state=resent` |
| `S-SIGN-03 (error{resend-throttled})` | `data-state=throttled` → `.sn-banner-throttled` | `?view=sent&state=throttled` |

_All 11 nodes represented. Every one carries a deep-link hook (V5) — a state that cannot be driven cannot be audited by STATE 08 or demonstrated at the STATE 09 gate, and **this table is the review packet**._

`⟂HOME-01` is a boundary, not a node in this prototype. Success on `S-SIGN-01` leaves this flow; the mock is the absence of a destination, and it is declared in `flows-signin.md`'s boundary table with the date it was checked.

## Transition → wiring (V4)

| Flow transition | Wired as | Destination paints |
|---|---|---|
| `S-SIGN-01 → S-SIGN-01 (loading)` (D1, D2) | `#b-signin` click → `show('signin','loading')` | yes — `s-sign-01-loading.png`, both passes |
| `S-SIGN-01 → S-SIGN-02` (reset route) | `#b-forgot` click → `show('reset',null)` | yes — `s-sign-02-happy.png` |
| `S-SIGN-02 → S-SIGN-01` (back) | `#b-back-signin` → `show('signin',null)` | yes |
| `S-SIGN-02 → S-SIGN-03` (D4 yes, D5 yes) | `#b-send` → sets `#t-addr`, `show('sent',null)` | yes — `s-sign-03-happy.png` |
| `S-SIGN-03 → S-SIGN-03 (resent)` (D6 no) | `#b-resend` → `show('sent','resent')` | yes |
| `S-SIGN-03 → S-SIGN-01` (back to sign in) | `#b-to-signin` → `show('signin',null)` | yes |

Each destination was driven headlessly and asserted **computed-visible with geometry**, not merely present (B6, M1).

## Decision → implementation

| Decision | Where it lives |
|---|---|
| **D-f2** — no `account exists?` branch | The absence itself. There is no such branch anywhere in the source, and `.sn-help` says so on the surface. |
| **D-f3** — `S-SIGN-02 → S-SIGN-03` is a replace | `#b-to-signin`, an explicit route, rather than reliance on browser back. |
| **D-s4** — paste is not blocked | No `paste` handler exists on `#f-pass`. |
| **`o-s5`** — announce, then focus, same frame | `.sn-banner` containers carry `role="alert"` **in the markup**, before content arrives; `pass.focus()` runs in the same `show()` call. |
| **ui-signin-01** — `ds-link` `block` variant only | `.sn-link{min-height:48px}` — no `::after` hit-area expansion anywhere. |
| **B5** — token layer is the base | `.screen{font:… var(--ui-font)}` on the container, never per component. |

## Superseded — stripped, not left dead (B7)

| Removed | Superseded by | Selectors / keys stripped |
|---|---|---|
| `ds-toolbar` + `back` on `S-SIGN-03` | the explicit `#b-to-signin` route | `.sn-bar` block in the `sent` view · `#b-back-reset` element · its `addEventListener` handler |

**Itemised per B7 — supersession deletes.** A leftover listener bound to a removed id is an un-specced element and fails V2 exactly as an addition does. Strip verified by grep: the only surviving occurrence of `b-back-reset` is the comment recording that it was removed.

## Un-specced additions

**One, declared:** the `.demo` bar. It is harness chrome, listed as the single `new` entry in `ui-signin-01`'s inventory with its justification, and declared in `audit.paletteExemptSelectors`. It exists so STATE 09 can reach states no data can produce. It is **not** part of any claim about the product.

Everything else in the prototype maps to an inventory row.

## Verification record (B8)

- `node --check` on the extracted `<script>` — **clean**.
- Hex inventory — **12 hexes, all in `:root`, all allowlisted, 0 new**.
- `node tools/smoke.mjs "signin:signin,reset,sent"` — **3 pass / 0 fail**, all painted, printed ids match the registry.
- All 11 hooks driven headlessly across 2 passes — **22 runs**, all painted.
- **22 screenshots captured and read.** Three defects found by reading them (AF-1, AF-2, AF-3) that all 138 assertions passed over.
- Console sweep — **0 errors**, `favicon.ico` filtered by name.
- Duplicate-key sweep — **0**.
- Network call-site sweep — **0**. The "everything is simulated" claim is measured, not asserted.
- Per-glyph font sweep — **not run**; `product.scripts` is empty, which is correct for a single-script product and is recorded rather than skipped silently.
