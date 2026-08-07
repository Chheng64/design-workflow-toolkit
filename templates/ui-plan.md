<!-- TEMPLATE — ui-plan
     Written by STATE 06 · full contract: skills/06-ui-planning/SKILL.md
     Copy into artifacts/ (per-feature name) and fill in. Angle brackets are
     placeholders; every heading below is load-bearing for a downstream check. -->

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
