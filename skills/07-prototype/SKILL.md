---
name: prototype
description: >-
  State 07 of the AI Product Design Agent workflow. Assembles the planned UI and
  flows into a coherent, interactive prototype and the traceability map that
  proves it matches the specs. Use when ui-plan.md, flows.md and ux-plan.md are
  validated and the flow needs to become bytes: every flow state is instantiated
  from the component inventory, every transition is wired per flows.md including
  recovery routes, DS tokens are applied per ui-plan.md, cross-state consistency
  is enforced, and every prototype element is traced back to a spec entry with
  no un-specced additions. Every flow state ships a deep-link hook, because a
  state that cannot be driven cannot be audited by state 08 or demonstrated at
  the state 09 gate. Reads ui-plan.md, flows.md, ux-plan.md; writes prototype/
  and traceability.md. Depends on ui-planning. No approval gate.
---

# Prototype (STATE 07)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 07.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests an assembly. It communicates
> only through the artifact store (`artifacts/`), never directly with other
> skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | `artifacts/ui-plan*.md`, `artifacts/flows*.md`, `artifacts/ux-plan*.md`, `machine_state` |
| Writes | `artifacts/prototype/` (assembled artifact), `artifacts/traceability*.md` |
| Depends on | `ui-planning` (must precede) |
| Approval gate | None |
| Retry ceiling | 3 (unnamed self-loop, assembly fix), then back-transition to `UI_PLANNING` |
| Next states | `SELF_AUDIT` (normal) / `UI_PLANNING` (back-transition: spec insufficient to assemble) / `PROTOTYPE` (self-loop: assembly fix) |

## Purpose

Assemble the planned UI + flows into a coherent prototype artifact per the
specifications produced upstream.

This is the state where specs become bytes, and therefore the state where most
defects are **born** — nearly every audit finding traces to an assembly decision
made here. State 08 exists to catch them; this state exists to not make them. The
two rule sets are complements, not duplicates:
[Build method](#build-method-hardened) below is written from the same defect
record as `skills/08`'s verification method, stated as construction rules rather
than detection rules.

## Processing steps

1. **Instantiate** each flow state using the component inventory from
   `ui-plan.md`.
2. **Wire transitions** per `flows.md` — including the recovery routes, not just
   the happy path.
3. **Apply DS tokens/primitives** per `ui-plan.md`.
4. **Ensure cross-state consistency** — naming, hierarchy, motion.
5. **Produce a traceability map**: prototype element → source spec entry.

## Build method (hardened)

Steps 1–5 say *what* to assemble. This section is the contract for *how*, and
each rule below was written by a defect that shipped. Do not substitute a cheaper
method. Codes are cited from plans and logs — index in
[`docs/method-rules.md`](../../docs/method-rules.md).

### B1 — Emit in chunks, never one giant write

A whole flow file is ~1,300–2,000 lines. Write the head, then append sections
(~≤300 lines each). Every parallel builder that tried to emit a full file in one
write **crashed mid-response** and lost the work.

### B2 — Every flow state ships a deep-link hook

A state reachable only by clicking through four screens is a state that state 08
cannot drive and the state 09 gate cannot demonstrate. Give every flow state,
variant and error case a query hook (`?view=`, `?state=`, `?sheet=`, `?load=`)
and **record the hook in `traceability.md`** — that table is what makes V1
checkable instead of assertable. The hook is also the review packet: state 09
hands the user the same list.

### B3 — Claim the selector namespace before you use it

A single-file prototype has one global CSS namespace across every screen.
Prefix per section and scope descendant rules with `>`. Generic names collide
silently and repaint an unrelated panel: a list-row class repainted a hero on
another screen; a descendant selector on one card also matched status and lock
icons elsewhere and inflated them to ~340px; an inline-span badge overflowed its
card and clipped the lines below it. All three were **geometry or screenshot
finds**, invisible to structure.

### B4 — String and config keys are a namespace too

Duplicate keys in a locale or config object do not error — the later definition
silently wins. On the extraction run this happened three times to navigation
labels clobbered by later-added categories, and **one locale hid the defect
entirely** because both labels happened to read the same. Sweep for duplicate
keys across every file **and** every locale object before handoff
(`node tools/audit.mjs` runs this sweep; `product.locales` tells it how many
legitimate repeats to expect).

### B5 — The token layer is the base, not an opt-in

Set the token on the container (`.screen{font-family:var(--ui-font)}`), never
per-component. An opt-in token layer means anything that forgets to opt in falls
through to whatever the platform picks — that is how **138 instances across 7
flows** rendered a script on a stack that had no face for it. Then check the
stack itself: CSS falls back **per glyph**, so a stack carrying no face for a
script it must render is a defect even where the token was applied correctly.
Declare every script in `toolkit.config.json` → `product.scripts` so STATE 08 can
check it.

The same completeness rule holds for **asset registries**. A slug with no crop
entry falls back to the default entry, which frames the wrong part of the asset.
Every slug you reference needs a real entry.

### B6 — A transition is not wired until its destination paints

Two failure shapes, both of which pass structural assertions:

- **Boundary mocks that outlived their boundary.** Eleven live boundary call
  sites still routed to a placeholder after every destination existed. Re-check
  the whole set whenever another flow ships — a "no mocks left" claim is a dated
  claim about one flow, not a property of the set.
- **A state that exists but never becomes visible.** `.view` is
  `visibility:hidden` until `.active`; nothing added `.active`; **84/84 DOM
  assertions passed against a screen that displayed nothing**, because
  `visibility:hidden` keeps layout boxes and accepts programmatic clicks.

Verify each wired transition by driving it and asserting the destination
**paints** — computed visibility and geometry.

### B7 — Supersession deletes

When a revision rebuilds a component, strip the old CSS, strings and JS rather
than leaving them dead. `ui-plan.md`'s **Superseded** table names what goes; the
prototype is where it actually goes. Leftovers are un-specced elements and
violate V2 exactly as much as additions do. Record the strip in
`traceability.md`, **itemised** — the removed selector and string-key list is the
evidence, and a rebuild that cannot produce one did not do the strip.

### B7b — Honour the harness contract

Three harnesses read the prototype — `tools/smoke.mjs`, `tools/audit.mjs`,
`tools/stateprobe.mjs` — and they all read it the same way, through
`toolkit.config.json` → `prototype`:

| Config key | Default | What the prototype must do |
|---|---|---|
| `viewSelector` | `.view` | one element per flow state |
| `activeClass` | `active` | added to exactly the view being shown |
| `screenSelector` | `.screen` | the viewport-sized container |
| `sidSelector` | `#sid` | prints the active view's screen id |
| `minVisibleNodes` | `3` | paint floor — keep it low; an empty state is sparse by design |

Plus `data-view` and `data-sid` on every view. `data-sid` is what makes registry ↔
prototype id drift **measurable rather than asserted**: the probe reads what the
page prints and compares it to the id the registry claims.

Change the convention in the config, not in a tool. A prototype whose views are
invisible to the contract reports as *blank* — which is indistinguishable from the
defect B6 exists to catch.

### B8 — Self-check before handing to `SELF_AUDIT`

Do not spend the audit's budget on defects assembly can find:

```bash
node tools/smoke.mjs "<page>:<view>,<view>" ...
```

- `node --check` on the extracted `<script>`.
- Hex inventory against the `ui-plan.md` allowlist — CSS **id selectors**
  (`#feed`) are not colours, and declared harness chrome is palette-exempt
  (`toolkit.config.json` → `audit.paletteExemptSelectors`).
- Drive every view headless and **read the screenshots**. Renders break with
  zero console errors.
- Console sweep, with known-benign entries filtered **by name**
  (`audit.benignConsole`) rather than ignored wholesale.
- Read every rendered number and ceremony icon against its own copy once. A
  progress fill computed from a 0-based index shows empty on step 1; an
  "unlocked!" ceremony drew a **closed** padlock. Both were faithful to their
  code and wrong on the screen.

## Figma assembly — plugin-API traps

When this state's output includes pushing frames or variables into Figma, three
API behaviours cost a full rebuild once and will again:

- **F1 — `setBoundVariableForPaint()` silently drops `paint.opacity`** (0.25 → 1,
  verified). A binding sweep flattened every alpha in the file. Working recipe:
  assign the bound paint → **re-read `node.fills[0]`** → spread the opacity on →
  reassign. Spreading the object *returned by* the bind call does not survive
  assignment.
- **F2 — a bad lookup fails silently, it does not throw.**
  `getVariableByIdAsync('1:3')` returns `null` — it needs the `VariableID:`
  prefix — and `setBoundVariableForPaint(p,'color',null)` returns the paint
  *unbound* rather than erroring. A wrong id therefore yields unbound paints with
  zero errors. Re-read and assert the binding.
- **F3 — `paint.opacity` round-trips as float32** (`0.12` → `0.11999999…`).
  Compare with an epsilon.

## Output

### `artifacts/prototype/`

The assembled artifact. Conventions the toolkit settled on: one self-contained
file per flow, a shared player for review packaging (`templates/prototype/` —
copy `run-local.sh`, `serve.py` and `play.html` in, and register the page in
`play.html`'s `FEATURES` array in the same edit), deep-link hooks per B2, and a
demo bar for the states that cannot be reached by data alone.

### `artifacts/traceability.md`

Write with structured frontmatter + body so downstream skills and the machine
can validate mechanically.

```markdown
---
artifact: traceability
version: trace-<feature>-NN
produced_by: prototype
reads_versions:
  requirements-<feature>.md: <version>
  ux-plan-<feature>.md: <version>
  flows-<feature>.md: <version>
  ui-plan-<feature>.md: <version>
feature: <feature/flow id>
---

# Traceability — <feature> (<proto-<feature>-NN>)

Every prototype element traces to a spec entry (V2), and every flow state is
represented (V1). Files: `artifacts/prototype/<file>`.

## Requirement → task → flow → component → prototype element

| Req | Task | Flow | UI component | Prototype element / hook |
|---|---|---|---|---|
| R-x1 | TK1 | F1 | <component from ui-plan inventory> | `<selector>`, `<fn()>`, `?hook=` |

## Flow state → prototype representation (V1)

| <flow id> node | Representation | Hook |
|---|---|---|
| <state name> | <default entry \| selector \| overlay> | `?view=…` |

_Every node in `flows.md`, including recovery and non-happy-path states._

## Transition → wiring (V4)

| Flow transition | Wired as | Destination paints |
|---|---|---|
| <from> → <to> (D<n>) | `<fn()>` / `goFlow(...)` | yes — <evidence> |

## Decision → implementation

| Decision | Where it lives |
|---|---|
| D-x1 <text> | `<const / selector / guard>` |

## Superseded — stripped, not left dead (B7)

| Removed | Superseded by | Selectors / keys stripped |
|---|---|---|
| <component> | <revision> | `.a`, `.b`, `strKey1`, `fnName()` |

## Un-specced additions

<none — or each one named, with the spec entry it needs before V2 can pass.>

## Verification record (B8)

<node --check · hex inventory · views driven · screenshots read · sweeps run
(duplicate keys, boundary call sites, per-glyph font) · console sweep.>
```

## Validation rules (machine-checkable on output)

- **V1:** Every flow state from `flows.md` is represented in the prototype.
- **V2:** Every prototype element traces to a spec entry — **no un-specced
  additions**.
- **V3:** DS token usage matches `ui-plan.md` references.
- **V4:** All wired transitions correspond to defined flow transitions.
- **V5** *(project-hardened, per B2)*: Every flow state in the V1 table carries a
  **deep-link hook**. A state that cannot be driven cannot be audited, so V1 is
  otherwise unverifiable.
- **V6** *(project-hardened, per B7)*: A superseded component leaves **no dead
  selectors, strings or handlers** behind. Leftovers are un-specced elements and
  fail V2.

## Exit conditions

Validation passes; traceability complete.

## Failure recovery

- **V1/V2 failure** → assemble the missing states, or remove the un-specced
  additions, then re-validate. **Retry ceiling: 3** on the self-loop.
- **Repeated spec insufficiency** → back-transition to `UI_PLANNING`. "The spec
  does not say" is a routing signal, not a licence to invent. An invented value
  assembled here becomes a frozen number nobody owns.
- A missing upstream artifact → back-transition to the state that owed it. Do
  not assemble around a missing spec.

## Approval gate

None. The prototype is not shown to the user from this state — `SELF_AUDIT`
gates it first, and `USER_REVIEW` owns the presentation.

## Recorded failure modes

Each entry is a defect class that actually shipped from this state on the run
this toolkit was extracted from. They are the evidence for
[Build method](#build-method-hardened).

### A. Assembly defects

| Case | What happened | Build rule |
|---|---|---|
| **View never activated** | The screen never became visible; **84/84 DOM assertions passed** against a screen displaying nothing. `visibility:hidden` keeps layout boxes and accepts programmatic clicks. | B6 |
| **11 stale boundary call sites** | Boundary mocks still routed to a placeholder although every destination existed. One carried a source comment naming the destination flow as "still todo" — written before that flow shipped, never revisited. | B6 |
| **Class collisions** | A list-row class repainted a hero on another screen; a descendant selector inflated status/lock icons to ~340px; an inline badge overflowed its card and clipped the lines below. | B3 |
| **Duplicate string keys** | Navigation labels silently clobbered by later definitions in the same object, twice. **One locale hid the second one completely**; only the other showed it. | B4 |
| **Opt-in token layer** | The script→font token applied per component over a foreign base → **138 instances across 7 flows** on an arbitrary platform fallback. Then the base stack itself carried **no face for that script at all**. | B5 |
| **Incomplete asset registry** | Asset slugs with no crop entry fell back to the default frame — twice, in two different flows, with different slugs. | B5 |
| **Off-by-one and reversed semantics** | Progress fill computed as `i / N` showed empty on step 1; an unlock ceremony drew a **closed** padlock under "🔓 unlocked!". | B8 |
| **Sheet and scroll geometry** | `translateY(105%)` failed to clear a sheet shorter than its `max-height`, so a *closed* sheet bled back in; `scrollIntoView()` scrolled an `overflow:hidden` ancestor and pushed the header out of frame; a card ellipsized its most important word. All **screenshot-only** finds. | B8 |

**The lesson, stated once:** the assertions you write test the structure you
were thinking about. The screenshot tests the screen.

### B. Build-ops

| Case | What happened | Build rule |
|---|---|---|
| **Parallel builder crash** | Every agent emitting a whole file in one write died with *"connection closed mid-response"*; the chunked retry succeeded. | B1 |
| **Figma alpha flattening** | A binding sweep silently dropped `paint.opacity` on every bound paint — all base frames had to be rebuilt. | F1 |
| **Silently unbound paints** | A `VariableID:`-less lookup returned `null` and the bind call accepted it without throwing, producing unbound paints and zero errors. | F2 |

### C. Scope discipline

- **Chrome that a ruling scoped to specific screens stays on those screens.** On
  the extraction run the locale toggle was ruled onto three surfaces only, while
  the locale itself inherited through the shared state record. Adding the control
  elsewhere because it is convenient in a builder is an un-specced addition and
  fails V2.
- **A spec that contradicts a ruled decision is not resolved here.** Assemble the
  ruled behaviour, ship the alternative behind a demo toggle, and raise the open
  for `USER_REVIEW`. Deciding it in the assembly hides the conflict inside bytes.
