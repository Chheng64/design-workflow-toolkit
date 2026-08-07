# reference/

Product-owned inputs. **Not** produced by the pipeline — the pipeline reads them.

| File | Owner | Seed from |
|---|---|---|
| `screen-registry.csv` | the product; rows added as flows are designed | `templates/screen-registry.csv` |
| `nav-lanes.json` | STATE 12 (E1) | `templates/nav-lanes.json` |
| `state-vocabulary.md` | STATE 12 (E5) | `templates/state-vocabulary.md` |
| `state-machines.json` | STATE 12 (E5) | `templates/state-machines.json` |
| `edge-annotations.json` | STATE 12 (E6) | `templates/edge-annotations.json` |
| `audit-plan.json` | STATE 08 (optional) | `templates/audit-plan.json` |
| design-system export, brand assets, research sources | the product | — |

Paths are declared in `toolkit.config.json` → `paths`; move a file and update that,
never a tool.

## The registry is the spine

`tools/navgraph.mjs` derives the **entire** navigation model from the registry's
cells. That has two consequences worth internalising:

1. **If the diagram and the derivation disagree, the diagram is wrong.** A
   connector drawn by hand is an assertion nobody can re-check.
2. **A registry cell carrying prose where an id belongs is a finding**
   (`N10-unparsed`), not a stylistic quibble — it silently drops an edge.

Two separators, and they are not interchangeable: **`states` is comma-separated**
(`happy, error{invalid-input}, loading`) and **`entry_from` / `navigates_to` are
pipe-separated** (`S-FLOW-02 | S-OTHER-01 (condition)`). Getting them backwards
makes `navgraph` read one cell as a single label — reported as
`N11-state-syntax`, not silently swallowed.

`entry_from` is the column that rots. It gets written when a screen is designed
and never updated when a *later* flow starts routing to it. The forward edge
(`navigates_to`) is authoritative and the map draws correctly regardless — but
`entry_from` is what a developer reads to answer "who can send me here", so it is
worth repairing when `N3b-backedge` reports it.
