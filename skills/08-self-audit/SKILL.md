---
name: self-audit
description: >-
  State 08 of the AI Product Design Agent workflow. Adversarially reviews the
  built prototype against every upstream spec and quality dimension before any
  user attention is spent on it, and emits a pass/fail verdict with findings
  classified blocker/major/minor. Use when a prototype exists and has not yet
  been shown: conformance to requirements → flows → UI plan is checked, the
  accessibility and reduced-motion audit is executed against the UX strategy,
  non-happy-path states are proven reachable, and every acceptance criterion is
  marked met or unmet with evidence. Every check is rendering-class — computed
  visibility and geometry, never DOM presence — and every failing probe is
  treated as a hypothesis until confirmed. Reads prototype/ plus all upstream
  artifacts; writes audit-report.md. Depends on prototype. No approval gate —
  this is the machine gating itself.
---

# Self-Audit (STATE 08)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 08.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests a self-audit. It
> communicates only through the artifact store (`artifacts/`), never directly
> with other skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | `artifacts/prototype/`, `artifacts/traceability*.md`, all upstream artifacts, `machine_state` |
| Writes | `artifacts/audit-report*.md` |
| Depends on | `prototype` (must precede) |
| Approval gate | None — the machine gates itself here, before spending user attention |
| Retry ceiling | 3 (`L_AUDIT_FIX`, `SELF_AUDIT` ↔ `REVISION`), then escalate into `L_REVISION` accounting |
| Next states | `USER_REVIEW` (verdict `pass`) / `REVISION` (verdict `fail`) / `SELF_AUDIT` (self-loop, bounded re-audit after in-place minor fix) |

## Purpose

Machine self-review of the prototype against all upstream specs and quality
dimensions **before showing the user**. A `fail` verdict is a normal outcome,
not an error.

The audit's job is to find what the builder missed. That means it must be
adversarial toward its **own instrument** as much as toward the prototype —
see [Verification method](#verification-method-hardened), which is not optional
guidance but part of this state's contract.

The harness is [`tools/audit.mjs`](../../tools/audit.mjs): it drives what
`reference/audit-plan.json` (or the hooks in `reference/state-machines.json`)
names, and reads its floor, palette, viewport and scripts from
`toolkit.config.json`. It produces evidence, not a verdict — the verdict is this
state's, written after the screenshots have been read.

## Processing steps

1. Check prototype **conformance** to requirements → flows → UI plan.
2. Run the **accessibility + reduced-motion** audit against `ux-plan.md`.
3. Verify **non-happy-path coverage** is present **and reachable**.
4. Detect **inconsistencies, orphan elements, unmet acceptance criteria**.
5. Classify findings by severity (`blocker` / `major` / `minor`).
6. Emit a **pass/fail verdict**.

## Verification method (hardened)

Steps 1–4 above say *what* to check. This section is the contract for *how*, and
it exists because each rule below was written by a defect a passing assertion
suite did not see. Do not substitute a cheaper method. Codes are cited from logs
and gate records — index in [`docs/method-rules.md`](../../docs/method-rules.md).

### M1 — Every check is rendering-class

Assert **computed visibility and geometry**, never DOM presence.
`getComputedStyle` visibility/display/opacity, `getBoundingClientRect` width,
height and position inside the viewport. A node can exist, lay out, and accept
a programmatic click while painting nothing.

### M2 — Look at the render

Screenshot review is a **required** audit step, not a supplement. Capture every
screen across locale × theme × reduced-motion × state (one pass per combination
in the audit plan), and review the images. A finding class that only a human eye
catches is not thereby out of scope.

### M3 — A failing probe is a hypothesis, not a finding

Confirm every failure at source before writing it into the report. Correct the
harness and re-run; do not waive, and do not report unconfirmed. See
[Recorded failure modes §B](#b-harness-false-positives) for the known
false-positive classes to rule out first.

### M4 — Sweep the source, not just the surface

Duplicate keys in string/config objects, stale placeholder routes, and per-glyph
font fallback are invisible to both assertions and screenshots in at least one
locale or theme. Run explicit sweeps: duplicate keys across all files **and**
every locale object; every navigation call site resolved to a destination that
**paints**; every element carrying a declared script verified on a stack that
actually contains that script's face.

### M5 — The verdict is scoped to the bytes it audited

An audit of record is invalidated by any later change to the prototype. Targeted
assertions run during a revision round are **not** an audit. Record the exact
version audited in `reads_versions`; if the frozen bytes have moved since,
re-run before any gate depends on the verdict.

### M6 — Record, do not silently resolve

A conflict between a project acceptance criterion and an external standard, or
between two approved artifacts, is **recorded as a finding with a
recommendation** — never silently passed and never silently changed. Silently
editing one of two disagreeing sources hides the disagreement rather than
resolving it.

## Output — `artifacts/audit-report.md`

Write with structured frontmatter + body so downstream skills and the machine
can validate mechanically.

```markdown
---
artifact: audit-report
version: <audit-<feature>-NN>
produced_by: self-audit
reads_versions:
  prototype: <proto-<feature>-NN — the exact bytes audited>
  requirements.md: <version>
  flows.md: <version>
  ui-plan.md: <version>
  traceability.md: <version>
feature: <feature/flow id>
verdict: pass | fail
---

# <audit id> — <feature> — verdict: <PASS | FAIL>

## Verdict

<pass|fail> — <N> / <N> acceptance criteria met. <rationale>

## Method

<what was actually run: screens driven, runs, assertion count, screenshots
captured, sweeps executed. Name the check class per M1 — computed visibility
and geometry, not DOM presence.>

## Findings

| ID | Sev | Finding | Caught by | Status |
|---|---|---|---|---|
| AF-1 | blocker | <defect> | screenshot \| assertion \| sweep | fixed in-loop |
| AF-2 | major | <defect> | <method> | open |
| AF-3 | minor | <defect> | <method> | recorded → debt #N |

## Conformance matrix

| AC | Requirement | Met | Evidence |
|---|---|---|---|
| AC1 | <text> | met | <screen + probe or screenshot ref> |
| AC7 | <text> | unmet | <what is missing> |
| AC9 | <text> | waived | <who waived, why, recorded where> |

## Harness corrections

<per M3 — probes that failed and turned out to be the instrument's fault, with
the correction made. Recorded, because an uncorrected harness re-reports them
next run.>

## Known limitations

<carried to USER_REVIEW for transparent presentation>
```

## Validation rules (machine-checkable on output)

- **V1:** Every acceptance criterion from `requirements.md` is marked
  `met` / `unmet` / `waived` **with evidence**.
- **V2:** Zero unresolved `blocker` findings to pass.
- **V3:** The accessibility audit was **executed**, not skipped.
- **V4:** Verdict ∈ {`pass`, `fail`} with rationale.
- **V5** *(hardened, per M1)*: Every check in the method record is
  rendering-class — computed visibility or geometry. A report whose evidence is
  DOM presence alone does not satisfy V1.
- **V6** *(hardened, per M5)*: `reads_versions.prototype` matches the
  currently frozen prototype bytes. A stale verdict is not a verdict.

## Exit conditions

- `pass` → proceed to `USER_REVIEW`.
- `fail` → route to `REVISION` with findings attached.

## Failure recovery

- A `fail` verdict is a **normal outcome**, not an error → deterministic route
  to `REVISION` with the findings attached.
- Minor findings may be fixed in place and re-audited via the bounded
  `SELF_AUDIT` self-loop (`L_AUDIT_FIX`, ceiling 3), then escalate into
  `L_REVISION` accounting.
- Internal audit error (e.g. a missing input artifact) → back-transition to the
  state that owed the missing artifact. Do not audit around a missing spec.

## Recorded failure modes

Each entry below is a defect class that actually shipped past a green suite on
the run this toolkit was extracted from. They are the evidence for
[Verification method](#verification-method-hardened).

### A. Defects invisible to structural assertions

| Case | What happened | Method rule |
|---|---|---|
| **View never painted** (blocker) | A screen **never became visible** — the view container is `visibility:hidden` until activated and nothing activated it — and **84/84 DOM assertions still passed**, because `visibility:hidden` keeps layout boxes and accepts programmatic clicks. Caught by looking at a screenshot. | M1, M2 |
| **Geometry defects, four in one flow** | A closed sheet bleeding back into the screen; `scrollIntoView()` scrolling an `overflow:hidden` ancestor and pushing the header out of frame; a label ellipsized to its least useful word; an asset crop gap. **Four of that flow's six real defects were screenshot-only finds.** | M2 |
| **Label and glyph out of sync** (major) | A navigation re-cut relabelled a slot but every file kept the **old glyph** — the tab read one thing under the icon for another. Pre-existing in two **already-approved** files, so the re-cut would have propagated it. | M2 |
| **Duplicate keys** (major) | One file defined two navigation labels **twice** per locale object; the later definition silently clobbered them. **One locale hid it entirely** — only the other showed it. | M4 |
| **Stale boundary routes** (major) | **Eleven live boundary call sites** still routed to a placeholder although every destination existed. An earlier *"no boundary mocks left"* claim had been written about one flow's mocks and did not hold for the set. | M4 |
| **Script on the wrong stack** (major) | The base font token was the foreign stack and the script token was **opt-in per component**, so anything that did not opt in rendered on an arbitrary OS fallback — **138 instances across 7 flows**. Then the remaining ~40 explicit cases turned out to be the stack itself: it carried **no face for that script at all**. CSS falls back **per glyph**, so the fix is verified per glyph, in every locale. | M4 |
| **Class collisions** | A descendant selector also matched status and lock icons and inflated them to ~340px; an inline-span badge overflowed its card and clipped the lines below. Both found by **geometry probes**, not by structure. | M1 |

**The lesson, stated once:** a DOM-assertion suite is not a substitute for
looking at the render, and "N/N assertions passed" is a statement about the
suite, not about the product.

### B. Harness false-positives

One final audit's first run reported **60 failures; only 3 were real.** A later
state probe reported **37 failures and all 37 were the harness.** Rule each of
these classes out before reporting:

| Reported | Reality |
|---|---|
| Hundreds of overflow violations | Inside horizontal **scroll rails** — `genuinelyClipped: 0`. Check overflow **ancestry**. |
| Off-palette hexes across 8 files | The demo bar and device bezel — **harness chrome**, not app surface. Chrome that lives in its own file is excluded by `review.harnessFiles`; the sweep is file-level, so chrome embedded in a product file is not exempt and should not be. |
| A `#FEED` colour violation | The CSS **id selector** `#feed`. A hex scanner must not read selectors. |
| A foreign-stack token used 27–47× per file | The intended architecture for numerals; the check itself was wrong. |
| A 20px tap target | `::after{inset:-12px}` — an explicit hit-area expansion, commented in source. Measure the **hit area**, not the box. |
| A clipped `<img>` | A deliberate crop — an oversized asset inside `overflow:hidden`. |
| A screen failing to render in one theme | **Timing flake**; renders at every settle when measured. Re-run before reporting. |
| Console errors on nearly every page | An offline webfont CDN and a missing `favicon.ico` — neither belongs to the build. Filter benign entries **by name** (`audit.benignConsole`), never wholesale. |
| Empty states "fail to paint" | A visible-node threshold tuned to a busy screen. An empty state is **sparse by design**. |
| A hook that renders nothing | The hook named an id the catalogue does not contain and the page threw. A wrong fixture is not a product defect. |

Each was corrected in the harness and the audit re-run — **not waived**.

### C. Recorded, not resolved

- **Interactive targets between the external standard and the project's own
  claim.** ~140 elements on 20 screens passed WCAG 2.5.8 **AA** (24px) and missed
  the project's own acceptance criterion of 44px. Pre-existing across four
  approved gates; raising them would restyle 20 approved screens. A **product
  decision** — recorded as debt with a recommendation, per M6.
- **Two approved deliverables disagreeing on a data value.** Reported as a
  conflict for a one-line ruling. Silently editing one to hide it would be worse
  than the conflict.

## Approval gate

None. This is the machine gating itself before spending user attention. The
`USER_REVIEW` gate is the next state's concern; the **Known limitations**
section of this report is what that gate presents.
