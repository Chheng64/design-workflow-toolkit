# Artifact contracts

Skills communicate **only** through the artifact store. A skill's contract is its
Reads and its Writes; nothing reaches into another skill's internals. This file is
the index of what exists, who owns it, and the frontmatter that makes it
machine-checkable.

Templates for every artifact live in [`../templates/`](../templates/).

## The store

| Artifact | Produced by | Consumed by |
|---|---|---|
| `requirements-<feature>.md` | 01 requirement-analysis | 02, 03, 04, 08, 11 |
| `research-<feature>.md` | 02 research | 03, 04, 06 |
| `product-review-<feature>.md` | 03 product-review | 04 |
| `ux-plan-<feature>.md` | 04 ux-planning | 05, 06, 08 |
| `flows-<feature>.md` | 05 flow-generation | 06, 07, 12 |
| `ui-plan-<feature>.md` | 06 ui-planning | 07, 08 |
| `prototype/` | 07 prototype | 08, 09, 12 |
| `traceability-<feature>.md` | 07 prototype | 08, 09, 11, 12 |
| `audit-report-<feature>.md` | 08 self-audit | 09, 10, 11 |
| `review-record-<feature>.md` | 09 user-review | 10, 11 |
| `revision-log-<feature>.md` | 10 revision | 11 (completion rule 6) |
| `navgraph.json` · `navmap-report.md` | 12 flow-visualization | 12, 11 |
| `flow-visualization-<scope>.md` | 12 flow-visualization | 11 |
| `deliverable-<feature>/` | 11 final-output | — (terminal) |

Reference inputs — **not** produced by the pipeline, owned by the product:
`reference/screen-registry.csv`, `reference/nav-lanes.json`,
`reference/state-vocabulary.md`, `reference/state-machines.json`,
`reference/edge-annotations.json`, and the design-system reference.

## Naming

`<artifact>-<feature>.md` for the file; `<abbrev>-<feature>-NN` for the version id
(`proto-checkout-03`, `audit-checkout-01`, `review-checkout-02`). Per-feature files
are the convention; the contract is identical for a single-feature product.

Versions **increment, never overwrite**. An artifact is immutable once written;
a revision creates a new version and records what it supersedes.

## Frontmatter — the load-bearing fields

Every artifact opens with YAML frontmatter. Three fields carry weight beyond
bookkeeping, and each was added because its absence broke a downstream check:

```yaml
---
artifact: <type>                 # what this is
version: <id>                    # what to cite it as
produced_by: <skill name>        # which state owns it
reads_versions:                  # the EXACT versions consumed — not "the latest"
  ui-plan-<feature>.md: ui-<feature>-02
  prototype: proto-<feature>-05
supersedes: <prior version>      # when this replaces one
---
```

- **`reads_versions`** is what `FINAL_OUTPUT` checks completion rule 2 against.
  A record that names its inputs only in a body table is not machine-checkable.
  This is the field a real gate record dropped, and it is the one that mattered.
- **`version`** on a prototype is the id every audit, gate and freeze must agree on.
- **`supersedes`** is how an artifact set stays readable after a revision loop.

## Machine state

`state/machine_state.yaml` is not an artifact — it is the machine's own record, and
completion rule 1 is defined over it. It holds `current_state`, per-state
`entry_count`, per-loop `loop_count`, `approvals`, `handoff_required`,
`blocked_reason`, `last_transition` and `artifact_versions`.

Write it **at decision time, in the same edit as the thing it records.** A record
written later is a reconstruction. It once sat two days stale while the machine
reported itself shipping, and nothing detected it, because nothing was reading the
file the completion rule is defined over.

Side effect worth knowing: `templates/prototype/serve.py` gates live reload on the
top-level `current_state` being `USER_REVIEW`.

## Gate records

An approval is scoped to the artifact versions it saw. That makes three things
mandatory in `review-record-<feature>.md`:

1. `reads_versions` naming the exact prototype and audit versions,
2. the **sha256 of every approved file**,
3. the player URL the review was actually conducted at.

If artifacts change after approval, the gate reverts to `pending`. Classify the
delta before asking about it: a bug-fix-only change asks for a scope confirm and
carries byte-level evidence; a feature delta asks for a ruling.

## Validation

Each skill states its own V-rules and how they are evidenced. The general shape:

- **V1–V4** come from the workflow specification and hold for every product.
- **V5+** are project-hardened rules — each one written by a defect that passed
  V1–V4. They are indexed in [`method-rules.md`](method-rules.md).

A rule may be **waived**, never skipped. A waiver records which rule, why, who
granted it, the debt item it rides on, and what would close it.
