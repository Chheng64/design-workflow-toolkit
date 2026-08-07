# Example — `signin`

**The toolkit's own reference run.** One feature, brief to frozen deliverable, all twelve states, all seven validators.

[← examples/](../README.md) · [Repository root](../../README.md) · [Start Here](../../START_HERE.md)

---

## What this is

This is not a borrowed example. It is this repository running its own pipeline on a small feature, so that the artifact shapes in [`templates/`](../../templates/) can be seen filled in, and so that the claims in the documentation are backed by a run rather than by assertion.

It is a **self-contained project**: its own `toolkit.config.json`, its own `reference/`, its own `state/`. The toolkit's root config is untouched. Every tool was run against it with `--root` resolution from this directory.

```bash
cd examples/signin
node ../../tools/audit.mjs --shots artifacts/shots
node ../../tools/navgraph.mjs --fail-on major
```

## The brief, verbatim

> "Users sign in with an email and a password. If they have forgotten their password they can request a reset link. Wrong credentials should be recoverable without losing what they typed. Mobile first."

Three sentences. Three screens, 11 flow states, 7 requirements, 26 acceptance criteria.

## Outcome

| | |
|---|---|
| Final state | **`DONE`** — 7 / 7 completion rules, each with a reason |
| Audit of record | `audit-signin-03` — **PASS 26 / 26 ACs**, 138 / 138 rendering-class checks, 22 runs, 2 passes |
| Revision cycles | **1 / 3** (`L_REVISION`) |
| Gates granted | Direction Approval · Primary User Approval · Developer Handoff — all three by a human |
| Waivers | **0** |
| Open debt at close | **1** — the assumed lockout window |
| Validators run | 7 / 7, all exiting 0 |

## What actually happened

```
01 requirements      7R / 26 ACs · 0 blocking questions · 3 opens carried
02 research          12 cited sources · 2 contradictions preserved · 1 gap declared
03 product review    proceed · 1 sub-clause cut · DIRECTION GATE granted, o-s4 ruled
04 ux plan           3 tasks · 11 states · edge-case matrix with reasoned n/a
05 flows             6 decision points · 0 unreachable · 0 unjustified dead ends
06 ui plan           15 components, 14 reuse · 0 new hex · contrast decided on the pair
07 prototype         11 states, 11 hooks · smoke 3/3
08 self-audit  #1    138/138 checks PASSED and the screenshots FAILED it  ← the point
10 revision          3 items reported, swept to 9 instances across 4 classes
06+07 rebuild        root cause of 1 item was UI_PLANNING, not PROTOTYPE
08 self-audit  #2    PASS 26/26
09 user review       APPROVED, 1st pass · sha256 recorded · 6 limitations presented
   (delta)           bytes moved → gate reverted → classified → scope confirm
12 flow visualization 4 validators clean · HANDOFF GATE granted on the report
11 final output      freeze = hash · 7/7 rules · machine closed in the same edit
```

## Which rules fired, and what each caught

This is the part worth reading. Every rule below is one the documentation claims matters; each row is what it actually caught here.

| Rule | What it caught in this run |
|---|---|
| **M2 — look at the render** | **The single most valuable rule in the toolkit.** `audit-signin-01` returned **138/138 checks passed, exit 0**. Reading the 22 screenshots found **three `major` defects**: an empty email field where the acceptance criterion demanded a preserved one, a throttle banner sitting above a live button, and a back control the UX plan explicitly ruled out. None is visible to a structural assertion — all three are *agreement* defects, and the harness has no concept of agreement. |
| **M3 — a failing probe is a hypothesis** | Fired **twice**. (1) The palette sweep reported 11 off-palette hexes; all 11 were in `play.html`, the review player. **A toolkit defect, fixed in `tools/audit.mjs`** — `annotate.mjs` already excluded those files and `audit.mjs` did not. (2) `annotate` E11 blocked on a "network call site" at `signin.html:262` — which was **the comment claiming there were no network calls**. Both confirmed at source; neither waived. |
| **R2 — route the class, not the instance** | Three reported items swept to **nine instances**. The empty-field defect was reported as one state and was true of **five**. And the rule landed on me: I recorded the stale-version-string sweep as 2 instances, and a *different tool* found a third. An item recorded as a single count asserts the class was checked — mine was not checked well enough. |
| **R3 — root cause is where the fault was introduced** | The toolbar-back defect was visible in the prototype and **belonged to `UI_PLANNING`**: the UI plan's inventory contradicted the UX plan's navigation model, and the build implemented its spec faithfully. Dispatching it to `PROTOTYPE` would have fixed the symptom and left `ui-plan` still saying the opposite. |
| **G4 — classify a post-approval delta before asking** | Bytes moved **after** the Primary gate. The gate reverted to `pending` automatically. The delta was classified **bug-fix-only** and proved: identical hex inventory, diff confined to one named region, and the pre-fix file **reconstructed from the inverse delta hashing back to the approved sha exactly**. It earned a one-line scope confirm, not a re-ruling. |
| **P4 — the audit must run on the bytes being frozen** | That delta forced a **third** full audit run. Targeted assertions would have been evidence inside the loop and not the audit. |
| **B7 — supersession deletes** | Removing the toolbar removed its click handler too, itemised in traceability. A leftover listener bound to a removed id is an un-specced element and fails V2 exactly as an addition does. |
| **skills/06 — name the DS by source id** | `toolkit-ref-ds-0.1`, with its own assumptions (mobile, 393×852, light, Latin, LTR) checked line by line against the product's. The check is cheap and it is the only thing that catches a wrong-document adoption, because a plan built on the wrong design system validates perfectly against it. |
| **E5 — normalize the vocabulary, then generate** | 11 states, all `canon` or `canon{qualifier}`, 0 findings. Authored that way from the start, which is the whole point of the ordering. |
| **E6 — `UNKNOWN` is legal, a guess is not** | Every `api` field reads `none (simulated)` — and that column is only worth reading because the tool **re-greps for request APIs itself on every run** and fails if the claim and the sweep disagree. It did. |
| **The stale-approval rule** | Worked without anyone invoking it. The gate reverted the moment the bytes changed; nothing had to remember to do it. |
| **`o-` opens carried, not defaulted** | Five open decisions. Three were ruled (at the Direction Gate, at STATE 06 twice). Two ship as known limitations with closing conditions. **Zero were quietly defaulted at build time.** |

## What I would do differently

1. **Sweep before claiming a count.** I reported the version-string class as 2 instances. It was 3. `annotate` found the third. The rule says *record the sweep count* precisely because a count asserts a check happened.
2. **Do not name an API inside a file being swept for it.** The prototype's disclaimer recited the request APIs and the sweep matched the disclaimer. The claim belongs in the traceability record, not in a source comment. This is a genuine new rule candidate.
3. **Author the state machines earlier.** `reference/state-machines.json` was written at STATE 12, after the prototype was frozen. Writing it at STATE 07 — when the hooks are being built — would have made the `file:line` citations free instead of an archaeology exercise.

## Honest caveats about this example

Stated because a scope claim belongs inside the claim.

- **`navgraph` opened at 0 findings, and that is not typical.** This registry is 3 rows, authored in one sitting from a ratified flow graph, never hand-edited. The extraction run's first derivation opened at **2 blocking · 8 major · 52 advisory** across 48 screens, and every finding was real. A clean first derivation here is evidence about the registry's age, not about the tool.
- **No Figma layer was produced.** STATE 12's derivations are the product; the design file would be a rendering of them, and a stale connector is indistinguishable from a fresh one. The four validators are what a build team can re-check.
- **One flow means E2 (cross-feature) and E3 (heatmap) are nearly trivial here.** They earn their place at the scale where the seams are not obvious by eye — roughly half the edge set crosses a feature boundary on a real product.
- **The design system is minimal and built for this run.** It is real enough to make the `V4`-token-resolution rule checkable, and it is not a production system.
- **Every string is placeholder.** That is limitation 2 in the handoff, and it is true of this example too.

## Where to look

| Question | File |
|---|---|
| What was asked for, testably? | [`artifacts/requirements-signin.md`](artifacts/requirements-signin.md) |
| What evidence, and what disagreed? | [`artifacts/research-signin.md`](artifacts/research-signin.md) |
| What was approved, and what was cut? | [`artifacts/product-review-signin.md`](artifacts/product-review-signin.md) |
| Every non-happy state, before any screen existed | [`artifacts/ux-plan-signin.md`](artifacts/ux-plan-signin.md) |
| The graph, its guards, and the reachability proof | [`artifacts/flows-signin.md`](artifacts/flows-signin.md) |
| Components, tokens, contrast, and the 0-new-hex accounting | [`artifacts/ui-plan-signin.md`](artifacts/ui-plan-signin.md) |
| **The audit that failed** — and why 138/138 was not enough | [`artifacts/audit-report-signin-01.md`](artifacts/audit-report-signin-01.md) |
| The audit that passed, on the frozen bytes | [`artifacts/audit-report-signin.md`](artifacts/audit-report-signin.md) |
| Routing, sweeps, and the loop counter | [`artifacts/revision-log-signin.md`](artifacts/revision-log-signin.md) |
| The gate record, with sha256 and the ratified delta | [`artifacts/review-record-signin.md`](artifacts/review-record-signin.md) |
| The navigation map, and why there is no Figma file | [`artifacts/flow-visualization-signin.md`](artifacts/flow-visualization-signin.md) |
| **What a build team receives** | [`artifacts/deliverable-signin/handoff-signin.md`](artifacts/deliverable-signin/handoff-signin.md) |
| The machine's own closed record | [`state/machine_state.yaml`](state/machine_state.yaml) |

## Re-driving it

```bash
cd examples/signin/artifacts/prototype
./run-local.sh            # → http://localhost:8765/play.html#signin
```

Every one of the 11 states is one URL away — the hook table is in the handoff's review packet. That is what makes a deliverable re-drivable after the loop closes.

> **Live reload is gated on workflow state.** `state/machine_state.yaml` now reads `current_state: DONE`, so `serve.py` serves plain pages. That is correct behaviour, not a broken reload.
