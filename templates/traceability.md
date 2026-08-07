<!-- TEMPLATE — traceability
     Written by STATE 07 · full contract: skills/07-prototype/SKILL.md
     Copy into artifacts/ (per-feature name) and fill in. Angle brackets are
     placeholders; every heading below is load-bearing for a downstream check. -->

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
