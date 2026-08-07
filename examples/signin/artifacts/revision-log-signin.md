---
artifact: revision-log
version: rev-signin-01
produced_by: revision
reads_versions:
  audit-report-signin.md: audit-signin-01
iteration: 1
loop: L_REVISION (1/3)
feature: signin
---

# Iteration 1 — source: audit verdict `fail`, 2026-08-07

No `review-record` exists yet — this loop was entered from `SELF_AUDIT`, not from the gate. The user has not seen the prototype.

## Change set

| # | Change item | Raised by | Class + sweep | Root cause | Target state | Status |
|---|---|---|---|---|---|---|
| **CR1** | *"`error{invalid-credentials}` renders with an empty email field, so AC2.1 cannot be demonstrated"* | self-audit AF-1 | **Class: a hook that seeds a VIEW state does not seed the DATA the criterion is about.** Swept all 11 hooks: **4 instances** — `signin&state=invalid`, `signin&state=locked`, `signin&state=offline`, `reset&state=bademail`. A fifth, `?view=sent`, showed the *placeholder* address rather than a submitted one — same class, different symptom. **5 fixed, not 1.** | `PROTOTYPE` — the spec was right; the assembly seeded the view and not the data | `PROTOTYPE` | **resolved** |
| **CR2** | *"`error{resend-throttled}` shows 'ask again in 60 seconds' above a live resend button"* | self-audit AF-2 | **Class: rendered copy contradicting the state it describes.** Swept every state that makes a claim about a control: 3 candidates (`throttled`, `loading` ×2). `loading` already enforced it via `aria-busy` + `disabled`; **`throttled` was the only unenforced one.** 1 instance, sweep recorded. | `PROTOTYPE` — AC5.2 says the control *is* throttled; the build said so and did not do so | `PROTOTYPE` | **resolved** |
| **CR3** | *"`S-SIGN-03` carries a toolbar Back that `ux-signin-01` explicitly rules out"* | self-audit AF-3 | **Class: a downstream plan contradicting the plan above it.** Swept `ui-signin-01`'s inventory against `ux-signin-01`'s navigation model row by row: **1 instance** — the `ds-toolbar + back` assignment to the acknowledgement screen. `S-SIGN-02`'s toolbar is correct (that screen is reached by **push**). | **`UI_PLANNING`** — *not* `PROTOTYPE`. The build faithfully implemented its spec; the spec was wrong. Dispatching this to `PROTOTYPE` would have fixed the symptom and left `ui-plan` still saying the opposite | `UI_PLANNING` → `PROTOTYPE` | **resolved** |
| **CR4** | *"The prototype's own version readout still said `proto-signin-01` after the rebuild"* | screenshot re-read, iteration 1 | **Class: an artifact that cannot say which bytes it is.** Swept for version strings in the prototype: **2 instances** — `<title>` and the demo bar label. Both bumped. | `PROTOTYPE` | `PROTOTYPE` | **resolved** |
| CR5 | *"`locked{rate-limited}` renders the assumed 15-minute window as fact"* | self-audit AF-4 | Single instance, one string. Not a build defect — an **open decision reaching the surface**, which is the thing `o-s1` exists to track. | — | **not dispatched** | **deferred** — debt #1, ships in Known limitations |

_Every item carries a target state and a status (V1). Nothing exits `open` (V2)._

## Conflicts — Conflict Mini-Gate

| # | Conflict | Side A | Side B | Ships as | Gate outcome |
|---|---|---|---|---|---|
| — | none this iteration | — | — | — | — |

CR3 looks like a conflict and is not one: `ux-signin-01` and `ui-signin-01` are not peers. The UX plan is upstream, so this is a **misrouted spec**, resolved by correcting the downstream document — not a contradiction between two ratified decisions needing a user ruling.

## Dependency order (upstream → downstream)

1. `UI_PLANNING` → **`ui-signin-02`** (supersedes `ui-signin-01`) — CR3. The acknowledgement screen's inventory row loses `ds-toolbar + back`.
2. `PROTOTYPE` → **`proto-signin-02`** — CR1, CR2, CR3 (implementation), CR4.
3. `SELF_AUDIT` → **`audit-signin-02`**, re-run on the rebuilt bytes.
4. `USER_REVIEW` → first presentation. The Primary gate has never been granted, so there is no approval to revert.

## Superseded by this revision

| Component / rule / string | Superseded by | Removed from |
|---|---|---|
| `ds-toolbar + back` on the acknowledgement screen | the explicit `Back to sign in` route already present | `ui-signin-01` inventory row → `ui-signin-02`; `.sn-bar` markup and the `#b-back-reset` **click handler** in `signin.html` |

**The handler went with the markup.** A leftover listener bound to a removed id is an un-specced element and fails V2 exactly as an addition does (B7). Strip verified by grep: the only remaining occurrence of `b-back-reset` is the comment recording that it was removed.

## Constraints recorded

- **A hook must seed the data its state implies, not only the view.** Discovered by CR1 and now a standing constraint for this prototype: any future state reachable only after a submit seeds the values that submit carried. Otherwise the review packet shows the state and hides the criterion.
- **A control that a banner describes must enforce what the banner claims.** From CR2. The copy is not the mechanism.

## Deliberately not changed

| Item | Why not |
|---|---|
| CR5 — the 15-minute lockout string | It is an **open decision** (`o-s1`), not a defect. Replacing an assumed number with a different assumed number changes nothing and hides that nobody has ruled it. Ships as debt #1 with a stated closing condition. |
| `ds-banner` having no `offline` variant | Extension Note 1. The distinction is carried by copy in this pass. Adding a variant is a design-system change, not a revision item, and inventing one here would be a `new` component with no justification. |
| The competitor-scan gap (`GAP1`) | Recorded in `res-signin-01`. Filling it is a research round, not a revision. |
| `paletteExemptSelectors` being dead config (TK-2) | A toolkit finding, not a `signin` finding. Removing a documented config key is a decision, not an audit outcome. Recorded in `audit-signin-01`. |

_Recorded so silence is not mistaken for oversight (V2)._

## Impact analysis

| Artifact | Effect |
|---|---|
| `requirements-signin.md` | unchanged — `req-signin-01` |
| `research-signin.md` | unchanged — `res-signin-01` |
| `product-review-signin.md` | unchanged — `pr-signin-01`, Direction Gate still granted (nothing it approved moved) |
| `ux-plan-signin.md` | unchanged — `ux-signin-01`. **It was right.** |
| `flows-signin.md` | unchanged — `flow-signin-01` |
| `ui-plan-signin.md` | **`ui-signin-02`** (supersedes `ui-signin-01`) |
| `prototype/` | **`proto-signin-02`** |
| `traceability-signin.md` | **`trace-signin-02`** |
| `audit-report-signin.md` | **`audit-signin-02`** |

## Re-validation

| Check | Result |
|---|---|
| Re-audit on the rebuilt bytes | **`audit-signin-02` PASS 26 / 26 ACs** — run against `proto-signin-02`, not waived (R6, V7) |
| Rendering-class assertions | **138 / 138**, stable across two consecutive runs, 22 runs each |
| Screenshots re-read | **22**, and the re-read is what found CR4 |
| Class sweeps from R2 | CR1: 5 instances, all fixed · CR2: 3 candidates, 1 unenforced, fixed · CR3: 1 instance · CR4: 2 instances |
| `node --check` | clean |
| Supersession strip | verified by grep — 0 dead references |

## Validation self-check

- **V1** ✅ — every item has a target state and a status.
- **V2** ✅ — no item left `open`. CR5 is `deferred` **with a reason** and a debt id.
- **V3** ✅ — iteration 1; `L_REVISION 1/3` written in frontmatter, in `machine_state.loop_count`, and here. `L_AUDIT_FIX 0/3` — this was a full rebuild, not an in-place audit fix.
- **V4** ✅ — every item names its **class** and its sweep result. CR1 was reported as one instance and swept to **five**.
- **V5** ✅ — the superseded toolbar was removed with its handler; no carried items existed to re-verify (first iteration).
- **V6** ✅ — no conflicts this iteration, and the CR3 near-miss is explained rather than left implicit.
- **V7** ✅ — the return edge passes through `SELF_AUDIT` on the rebuilt bytes. **No waiver required.**

**Exit:** dispatch to `UI_PLANNING` → `PROTOTYPE` → `SELF_AUDIT` → `USER_REVIEW`.
