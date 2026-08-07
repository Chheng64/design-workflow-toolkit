---
name: ui-planning
description: >-
  State 06 of the AI Product Design Agent workflow. Turns flow graphs into a UI
  specification — a component inventory mapped to the design system reuse-first,
  layout and hierarchy rules per state, motion and contrast decided on the token
  pair, and every value referenced to a token rather than invented. Use when
  flows exist and the prototype needs a spec instead of an improvisation: each
  flow state gets a component set, every component maps to a DS primitive or
  carries a written justification for being new, no one-off styling is introduced
  where a primitive exists, and a token that does not resolve becomes an
  extension request or an open decision — never a new hex. Reads flows.md,
  ux-plan.md and research.md plus the design-system reference; writes ui-plan.md.
  Depends on flow-generation. No approval gate — may raise an informational
  Extension Note.
---

# UI Planning (STATE 06)

> Source of truth: [../../docs/workflow.md](../../docs/workflow.md) §STATE 06.
> This skill is one state of the workflow state machine. It runs only when the
> orchestrator (or an explicit user task) requests UI planning. It communicates
> only through the artifact store (`artifacts/`), never directly with other
> skills.

## Contract

| Field | Value |
|-------|-------|
| Reads | `artifacts/flows.md`, `artifacts/ux-plan.md`, `artifacts/research.md`, `machine_state`, design-system reference |
| Writes | `artifacts/ui-plan.md` (per feature: `ui-plan-<feature>.md`) |
| Depends on | `flow-generation` (must precede) |
| Approval gate | None — may raise an informational, non-blocking **Extension Note** |
| Retry ceiling | 2 (unnamed `UI_PLANNING` self-loop, §6), then unavoidable new components route through an Extension Note |
| Next states | `PROTOTYPE` (normal) / `FLOW_GENERATION` (back-transition, UI planning reveals a flow gap) / `UI_PLANNING` (self-loop, reuse or mapping fix) |

## Purpose

Define UI structure, component inventory and design-system usage — **still
specification, not rendered UI** — so `PROTOTYPE` assembles a plan instead of
improvising one.

The boundary that defines this state: it names components, tokens, geometry and
motion **by reference**, and builds nothing. Everything it writes must be
checkable against the design system before a line of the prototype exists. A
decision deferred to build time is a decision made by whoever builds fastest.

## Processing steps

1. **Decompose each flow state** from `flows.md` into its required UI regions
   and components.
2. **Map components to existing DS primitives first**; flag the gaps that need
   an extension. Reuse is the default, `new` is the exception that argues for
   itself.
3. **Define layout and hierarchy rules per state** — at the real viewport, with
   real numbers.
4. **Specify tokens** (spacing, colour, typography, motion) **by reference**.
   Values are not invented here.
5. **Produce the component inventory** with a reuse-vs-new classification, and
   a written justification against every `new`.

## Output — `artifacts/ui-plan.md`

Structured frontmatter + body so downstream skills and the machine can validate
mechanically. Per-feature file naming (`ui-plan-checkout.md`, `ui-plan-onboarding.md`)
is the toolkit convention; the contract is identical.

```markdown
---
artifact: ui-plan
version: ui-<feature>-NN
produced_by: ui-planning
reads_versions:
  flows-<feature>.md: <version>
  ux-plan-<feature>.md: <version>
  research-<feature>.md: <version>
  design-system: "<DS name + the source id it came from>"
feature: <feature/flow id>
inherits: <prior ui-plan / shell this one builds on, and what it takes verbatim>
supersedes: <prior version, if any>
---

# UI Plan — <feature>

## Inherited, reused verbatim

<the token layer, chrome primitives, i18n pattern, asset resolvers, effects and
guards taken unchanged from the shell — named explicitly, because anything not
listed here is something this plan is claiming to introduce>

## STRICT colour allowlist (V5)

```
<the exact hex set, grouped: brand / gray / semantic / exempt classes>
BANNED: <hexes that must not appear, and where they came from>
```

Write the same set into `toolkit.config.json` → `audit.colorAllowlist` /
`colorBanned`. That is where STATE 08's harness reads it; an allowlist that lives
only in this document is an allowlist nothing enforces.

The **BANNED** list is not optional. `SELF_AUDIT` enforces this allowlist by
machine hex-extraction, and the permanent lesson attached to that rule is that
an audit must check **non-DS absence, not just DS presence** — an allowlist
alone cannot catch a value that was never supposed to exist.

Naming note: this "V5" is the **`SELF_AUDIT` hex-conformance rule id**. It is not
a validation rule of this state — this state's rules are
V1–V4 — and it is a different V5 from the rendering-class rule defined in
[`skills/08`](../08-self-audit/SKILL.md).

## Component inventory → DS mapping (reuse-first)

| Comp | Surface | DS mapping | new? |
|---|---|---|---|
| <component> | <flow state / screen> | `<primitive>` | reuse |
| <component> | <state> | `<primitive>` + <variant> | reuse+variant |
| <component> | <state> | <what it is assembled from> | **new**, justified: <why no primitive covers it, and what it is built out of> |

<count line: N of M entries are reuse or variants; every `new` carries a
justification — this is V2's evidence>

## Layout rules (<viewport>)

<per state: the vertical budget in px, the grid of each repeated row, the
minimum tap target of every interactive element, scroll vs pinned, sheet
geometry, safe-area and small-viewport behaviour>

## Motion spec

| Element | Default | Reduced |
|---|---|---|
| <element> | <duration + curve, by token> | <static equivalent> |

<every row forked for `.reduce` and `prefers-reduced-motion` — the ux-plan's
motion opt-out is an acceptance criterion, not a nicety>

## Contrast

<the audited pairs, with ratios. Decided here on the token pair, not at audit
time. A pairing that fails is a plan change.>

## Token reference resolution (V4)

<every value resolves to a token or a documented exemption. State the count of
new hex introduced — the target is zero.>

## Superseded

| Component | Replaced by | Strip in prototype |
|---|---|---|
| <old component + its selectors> | <new one> | yes |

## Extension Note (informational, non-blocking)

<the `new` compositions, why the DS has no primitive, what they are built from,
and whether they are recommended for promotion into the DS>

## Open decisions

- o-<id>: <question> — <what it leaves unresolved> — <who can rule>

## Validation self-check

- **V1** ✅/❌ <every flow state maps to a component set — list the states>
- **V2** ✅/❌ <reuse ratio + every `new` justified>
- **V3** ✅/❌ <no one-off styling where a primitive exists>
- **V4** ✅/❌ <token references resolve; new hex count>

**Exit:** validation passes → `PROTOTYPE` (<proto id>).
```

## Validation rules (machine-checkable on output)

- **V1:** Every flow state maps to a component set.
- **V2:** Component-to-DS mapping **prefers reuse**; every `new` component has a
  justification.
- **V3:** No isolated one-off styling introduced where a DS primitive exists.
- **V4:** Token references **resolve** to the provided design system, or are
  flagged as an extension.

V4 is the one that fails quietly. "Resolves" means the token exists in the named
design system — not that a plausible-looking `var()` name was written down. A
token the DS does not have is an extension request or an open decision; it is
never a hex quietly added to the allowlist.

## Exit conditions

All validation rules pass.

## Failure recovery

- On **V2 / V3** failure: re-map the offending components **toward DS reuse**.
  Fix the mapping, not the justification — a better-argued one-off is still a
  one-off.
- On **V1** failure: check whether the unmapped state is a *missing state*
  rather than a missing component set. If `flows.md` is short a state →
  back-transition to `FLOW_GENERATION`. Do not invent the state here.
- On **V4** failure: raise an **extension request**. If the missing token
  encodes an unruled product decision (a colour nobody owns, a size nobody set),
  it is an **open decision** carried forward, not a value chosen here.
- Retry ceiling **2**. Unavoidable new components route through an **Extension
  Note** appended to `ui-plan.md` — informational, non-blocking. The Note is the
  escalation edge, not a back-transition.

## Approval gate

None. The Extension Note is informational: it exists so a DS owner can later see
what the product needed and the system did not have. It does not block the
transition to `PROTOTYPE`.

## Recorded failure modes

Defect classes that shipped past a plausible-looking UI plan on the run this
toolkit was extracted from. Each is a rule, not an anecdote.

| Class | What happened | Rule |
|---|---|---|
| **Wrong design system** | A spec belonging to a **different project** was adopted and survived four revision cycles; the machine reached **`HALT_BLOCKED` at the revision ceiling** before the tell was spotted (a desktop-first viewport assumption inside a mobile product). A plan built on the wrong system validates **perfectly** against it, so no downstream rule can catch it. | Name the DS **by source id** in `reads_versions.design-system` and in `toolkit.config.json` → `designSystem.sourceId`, then sanity-check that the system's own assumptions (viewport, platform, brand) match this product's. A DS reference without an id is unverifiable — and every rule in this state is only as true as that one line. |
| **Token that does not exist** | A spec asked for two hues the palette does not contain. The nearest allowlisted ramps shipped and an open was raised — correctly. The failure mode is the alternative: adding two hexes to the allowlist to make the spec true. | A token that does not resolve is an **extension request or an open**, never a new hex. The counter-example in the same run: a five-rung tier ladder that resolved inside the existing allowlist with **zero additions**. |
| **Contrast decided after the fact** | A progress bar failed **3:1 against its own track**, so it shipped as the theme accent — contradicting the same spec's one-colour-per-category rule. The later flow avoided the repeat by rejecting a gradient at plan time, because neither ink nor white cleared 4.5:1 at its midpoint. | Contrast is decided **here, on the token pair**, with the ratio written down. A pairing that fails is a **plan** change, not a prototype patch. |
| **Selector namespace not claimed** | A descendant selector on a new card also matched status and lock icons elsewhere and inflated them to ~340px; an inline-span badge overflowed its card and clipped the lines below it. Both were **new compositions dropped into an inherited shell**. | A `new` entry declares the **selector namespace it claims** and scopes its descendants (`> svg`). The inventory is where a collision is cheap to see. |
| **Inventory only added** | One revision superseded an entire component outright; two rebuilds later required stripping whole selector families and their string keys by hand. | When a revision replaces a component, record the **supersession** so the prototype strips it. An inventory that only grows accumulates dead style that no audit reads. |
| **Token layer as opt-in** | The script→font token was **opt-in per component** over a foreign base, so any element that did not opt in rendered on an arbitrary OS fallback — **138 instances across 7 flows** — and the base stack turned out to carry no face for that script at all. | Script → font mapping is a **base rule of the token layer**, not a per-component choice. Anything a component can forget to do, some component will forget to do. |
| **Shared component, no owner** | The bottom navigation drifted into three variants across files; a re-cut then relabelled a slot while every file kept the old glyph, so the tab read one thing under the icon for another. | A component used by more than one flow is a **cross-flow contract**. The inventory names its owning plan, or each file re-decides it. |
| **Geometry that contradicts the strategy** | Layout rules set four interactive elements between 29 and 38px against a `ux-plan` floor of **44px**. ~140 elements on 20 screens passed the external AA standard but missed the project's own acceptance criterion, and raising them would have restyled four approved gates. | The `ux-plan`'s accessibility floor is an **acceptance criterion**, and it is `toolkit.config.json` → `audit.tapTargetFloorPx`. State target sizes as numbers here and check them against it — this is the last state where the number is free to change. |
