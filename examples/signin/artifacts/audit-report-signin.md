---
artifact: audit-report
version: audit-signin-03
supersedes: audit-signin-02
produced_by: self-audit
reads_versions:
  prototype: proto-signin-03
  requirements-signin.md: req-signin-01
  ux-plan-signin.md: ux-signin-01
  flows-signin.md: flow-signin-01
  ui-plan-signin.md: ui-signin-02
  traceability-signin.md: trace-signin-02
  revision-log-signin.md: rev-signin-01
feature: signin
verdict: pass
---

# audit-signin-03 — signin — verdict: **PASS**

Re-run on the rebuilt bytes after `rev-signin-01`, then **re-run again on `proto-signin-03`** after a post-approval bug-fix delta — because P4 requires the audit of record to have run on **the bytes being frozen**, and a green audit on superseded bytes is not a green audit. Both runs returned identical results; only the version named changed. The superseded verdict is preserved at [`audit-report-signin-01.md`](audit-report-signin-01.md) — a `fail` that found three real defects, and deleting it would make the artifact set agree with itself by removing the disagreement.

## Verdict

**pass** — **26 / 26 acceptance criteria met**, 0 unmet, 0 waived. 0 unresolved `blocker` findings.

The three `major` findings from `audit-signin-01` are closed against `proto-signin-02`, each verified by re-reading the screenshot that found it. One new `minor` was found **during the re-read** and fixed in the same round.

## Method

Identical to `audit-signin-01`, re-run in full rather than as targeted assertions — per R6, targeted verification is evidence *inside* the loop and is not the audit.

- **22 runs** — 11 flow states × 2 passes (`base`, `reduced-motion`).
- **138 assertions**, all rendering-class (M1): computed `display` / `visibility` / `opacity`, measured geometry. No assertion here is satisfied by DOM presence.
- **22 screenshots captured and re-read** (M2).
- **3 source sweeps** (M4): off-palette hex, duplicate keys, network call sites.
- Stable across **two consecutive full runs**.

```
138 / 138 checks · 22 runs · 22 screenshots · exit 0
```

`reads_versions.prototype` = `proto-signin-03`, which is the version being frozen. **A green audit on superseded bytes is not a green audit** (V6) — this one ran on the bytes it names.

## Findings

| ID | Sev | Finding | Caught by | Status |
|---|---|---|---|---|
| AF-1 | major | Empty email field in `error{invalid-credentials}` | screenshot | **closed** — `s-sign-01-invalid-credentials.png` now shows `sam@example.com` preserved with focus and the danger border on the password field. AC2.1 demonstrable from the packet. Class swept to **5 instances**, all fixed. |
| AF-2 | major | Throttle claimed by copy, not enforced by the control | screenshot | **closed** — `s-sign-03-resend-throttled.png` now shows *"Send it again"* visibly disabled beneath the banner. Copy and control agree. |
| AF-3 | major | `S-SIGN-03` toolbar back contradicted the UX navigation model | screenshot | **closed** — toolbar removed from the acknowledgement screen, along with its click handler (B7). Root cause corrected upstream at `ui-signin-02`, not patched in the prototype alone. |
| **AF-5** | **minor** | **The prototype's own version readout still said `proto-signin-01` after the rebuild** — in both the `<title>` and the demo bar. An artifact that cannot say which bytes it is cannot be checked against them; drift becomes undetectable rather than merely undetected. | **screenshot re-read** | **fixed in-round** — 2 instances, both bumped to `proto-signin-02` |
| AF-4 | minor | `locked{rate-limited}` renders the assumed 15-minute window as fact | screenshot | **deferred → debt #1**, not dispatched. It is an open decision (`o-s1`) reaching the surface, which is what `o-s1` exists to track. Ships in Known limitations. |

**0 blocker · 0 open major · 1 open minor (deferred with a rider).**

AF-5 is worth naming plainly: **it was found by re-reading a screenshot taken to verify a different fix.** The re-read is not a formality.

## Conformance matrix

| AC | Requirement | Met | Evidence |
|---|---|---|---|
| AC1.1 | `autocomplete` / `type` / `inputmode` tokens | met | source, both fields |
| AC1.2 | Field text ≥ 16px | met | computed `font-size: 16px` |
| AC1.3 | Submit inert while empty, conveyed beyond colour | met | `disabled` attribute — structural, not chromatic |
| **AC2.1** | **Entered email survives a rejected attempt** | **met** | **`s-sign-01-invalid-credentials.png` — `sam@example.com` present after the rejection** |
| AC2.2 | Focus moves to the secret field | met | `f-pass.focus()` + `aria-invalid=true`, same frame as the reveal |
| AC2.3 | Announced, names neither credential | met | pre-existing `role="alert"`; copy names neither |
| AC3.1 | Busy state, `aria-busy`, no double submit | met | `s-sign-01-loading.png` |
| AC3.2 | Busy state reachable by hook and paints | met | 2 passes |
| AC4.1 | Reset reachable in one tap | met | `#b-forgot`, 48px |
| AC4.2 | Reset pre-fills the typed identifier | met | handler copies before the view change |
| AC4.3 | Same confirmation regardless of registration | met | **no account-exists branch exists in the source** |
| AC5.1 | Confirmation names the address | met | `s-sign-03-happy.png` — `sam@example.com` |
| **AC5.2** | **Resend throttled, wait stated** | **met** | **`s-sign-03-resend-throttled.png` — control disabled, wait in copy** |
| AC5.3 | Route back to sign in | met | `#b-to-signin`, and now the **only** back route on that screen |
| AC6.1 | 6 non-happy states reachable by hook and painting | met | 11/11 hooks × 2 passes |
| AC6.2 | Each offers a control that leads somewhere | met | every non-happy state has ≥ 1 live route |
| AC7.1 | ≥ 44 × 44 hit area | met | 0 findings at floor **44** (`o-s4`), 22 runs |
| AC7.2 | Contrast ≥ 4.5:1 / 3:1 | met | 0 findings, composited backgrounds |
| AC7.3 | Static equivalent for every motion | met | `reduced-motion` pass, all 11 states |
| AC7.4 | 0 console errors, 0 horizontal overflow | met | 22 runs |
| — | *(6 sub-criteria rolled into the rows above)* | met | — |

**26 met · 0 unmet · 0 waived.** `C_ALL_CRITERIA_MET` holds.

## Harness corrections

None this run. The single correction from `audit-signin-01` — `tools/audit.mjs` sweeping the review player as product surface — is fixed in the tool and did not recur. **TK-2 remains open and recorded**, not waived: `audit.paletteExemptSelectors` is still referenced by no tool, and the sweep is file-level so a selector list could not exempt anything even if it were read.

## Known limitations

Carried to `USER_REVIEW` at full strength. Not laundered.

1. **The lockout window is an assumed number rendered as fact** — *"Try again in 15 minutes"* (AF-4, `o-s1`). **debt #1. Closes when** the auth service owner states the real window.
2. **Every string is placeholder and unreviewed** (`o-s3`). Nobody has claimed copy ownership.
3. **Every response is simulated** (A2). The network sweep measures this rather than asserting it — 0 call sites — but nothing here proves the real service behaves as designed.
4. **No competitor scan was performed** (`res-signin-01` GAP1). The design rests on standards and pattern evidence.
5. **`ds-banner` has no `offline` variant** (Extension Note 1). *"Could not reach"* and *"was refused"* are held apart by **copy**, not structure — one revision away from being lost.
6. **`o-s2` (reveal-the-secret) was ruled out of scope**, not built and rejected. The design system has no primitive.

## Post-approval delta re-run

After the Primary gate was granted against `proto-signin-02`, two source-comment changes were made and the gate reverted to `pending` per the stale-approval rule.

| | |
|---|---|
| **AF-6** | `annotate` E11 fired **blocking**: 4 edges claimed `none (simulated)` and the sweep found 1 network call site at `signin.html:262`. **Confirmed at source: the "call site" was the comment claiming there were no network calls.** The sweep is deliberately broad and matched `XMLHttpRequest` in prose. |
| **AF-5 sweep was under-scoped** | AF-5 was recorded as **2** instances of the stale version string. `annotate` surfaced a **third**, in that same comment. An item recorded as a single count asserts the class was checked — mine was not checked thoroughly enough, and a different tool caught it. That is R2 landing on this run rather than on the extraction run. |

Both fixed in `proto-signin-03`. **Full audit re-run on the new bytes: 138/138, 22 runs, 0 defects** — not targeted assertions, which are evidence inside the loop and are not the audit.

## Exit

`pass` → **`USER_REVIEW`**, carrying `proto-signin-02`, this report, the six known limitations, and the 11-hook review packet from `trace-signin-02`.
