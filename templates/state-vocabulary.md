# State Vocabulary — <product>

_Owner: STATE 12 `flow-visualization` (E5). Established <date>._

The registry's `states` column is a **closed vocabulary**, not free text. This file
is the term set, the qualifier rule, and the original → normalized mapping.

**Why a closed set.** On the run this toolkit was extracted from, the registry
carried 59 distinct free-text labels across 48 screens — including three spellings
of "empty for a new user". Each was locally sensible. The set was not a state
machine, and no tool could tell whether two labels meant one concept or two.
**Normalize first, then generate**: generating first freezes N private
vocabularies into a deliverable.

## Syntax

```
<canon>                    a state with no further distinction
<canon>{<qualifier>}       the same state, with the case that produced it
```

The qualifier is kebab-case and is **never dropped**: `error{wrong-code}` and
`error{unchecked-terms}` are different screens' different recoveries, and a
developer needs both.

`tools/navgraph.mjs` enforces the term set (`N11-state-vocab`) and the syntax
(`N11-state-syntax`). `tools/stategraph.mjs` carries the same set — adding a term
requires editing both this file and that tool.

## Canonical states (14)

| State | Means |
|---|---|
| `happy` | the normal path for this screen |
| `loading` | content in flight, screen already committed |
| `empty` | screen is correct and has nothing to show |
| `error` | an operation failed and the user can retry or correct |
| `fail` | a terminal negative outcome (not retryable in place) |
| `success` | a terminal positive outcome |
| `in-progress` | work in flight that the user started and can watch |
| `timeout` | an operation exceeded its window |
| `guest` | signed-out degradation of the screen |
| `locked` | the user is blocked from the content by a gate (level, purchase, capacity, quota) |
| `confirm` | a blocking confirmation awaiting a user decision |
| `filtered` | a list narrowed by user filter or search, **with** results |
| `offline` | no connectivity |
| `permission-denied` | an OS or role permission blocks the screen |

A vocabulary is a set of **permitted** terms, not an inventory of used ones —
declaring a term with zero uses is correct.

`filtered` means **narrowed with results**. A filter that returns nothing is
`empty`, with the filter as the qualifier (`empty{category}`).

## Adding a term

**Adding a canon term costs a justification, written here.** Fold it into an
existing term unless doing so would be a false statement about the screen. A term
only one screen would ever use is a **qualifier**, not a canon term.

| Term added | Date | Why folding it in would have been false |
|---|---|---|
| | | |

## Mapping — original → normalized

Preserve the originals. The rewrite must lose nothing.

| Original label | Normalized | Screens |
|---|---|---|
| | | |
