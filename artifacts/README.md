# `artifacts/` — the runtime artifact store

[← Repository root](../README.md) · [Artifact Flow](../ARTIFACT_FLOW.md) · [Contracts spec](../docs/artifact-contracts.md)

---

## Purpose

Everything the pipeline produces lands here. It is also the **only** channel through which skills communicate: a skill's contract is its Reads and its Writes, and nothing reaches into another skill's internals.

The blunt form of the rule: **if it is not in the artifact, it did not happen.**

Empty on a fresh clone, except for `.gitkeep`.

## Inputs

Written by the skills, one artifact per state. Read by later skills and by the validators in [`tools/`](../tools/).

Paths are configured in [`toolkit.config.json`](../toolkit.config.json) → `paths.artifacts`, `paths.prototype`, `paths.shots`. Move a directory and update the config, never a tool.

## Outputs

### Pipeline artifacts

| File | From | Consumed by |
|---|---|---|
| `requirements-<f>.md` | 01 | 02, 03, 04, 08, 11 |
| `research-<f>.md` | 02 | 03, 04, 06 |
| `product-review-<f>.md` | 03 | 04 |
| `ux-plan-<f>.md` | 04 | 05, 06, 08 |
| `flows-<f>.md` | 05 | 06, 07, 12 |
| `ui-plan-<f>.md` | 06 | 07, 08 |
| `prototype/` | 07 | 08, 09, 12, 11 |
| `traceability-<f>.md` | 07 | 08, 09, 11, 12 |
| `audit-report-<f>.md` | 08 | 09, 10, 11 |
| `review-record-<f>.md` | 09 | 10, 11 |
| `revision-log-<f>.md` | 10 | 11 |
| `flow-visualization-<scope>.md` | 12 | 11 |
| `deliverable-<f>/` | 11 | — terminal |

### Tool output

| File | From |
|---|---|
| `navgraph.json` · `navmap-report.md` | `navgraph.mjs` |
| `stategraph.json` · `statemap-report.md` | `stategraph.mjs` |
| `stateprobe.json` | `stateprobe.mjs` |
| `annotations.json` · `annotate-report.md` | `annotate.mjs` |
| `audit-data.json` | `audit.mjs` |
| `shots/` | `audit.mjs`, `stateprobe.mjs` |

## What is committed, and what is not

```gitignore
artifacts/shots/          # regenerate, do not commit
artifacts/*.json          # derived — regenerate, do not commit
!artifacts/.gitkeep
```

Everything else **is** committed, and that includes `artifacts/deliverable-*/`:

> **A freeze that is not in version control is not a freeze.**

The derived JSON is excluded because it re-derives byte-identically from the registry — that is STATE 12's V13, and a drifted derivation is itself the signal that the map is stale.

## Examples

**A typical mid-run store:**

```
artifacts/
├── requirements-checkout.md
├── research-checkout.md
├── product-review-checkout.md
├── ux-plan-checkout.md
├── flows-checkout.md
├── ui-plan-checkout.md
├── traceability-checkout.md
├── audit-report-checkout.md
├── review-record-checkout.md
├── revision-log-checkout.md
├── prototype/
│   ├── checkout.html
│   ├── play.html
│   ├── run-local.sh
│   └── serve.py
├── shots/                      (gitignored)
├── navgraph.json               (gitignored)
├── navmap-report.md
└── deliverable-checkout/
    ├── prototype/
    └── handoff-checkout.md
```

**Frontmatter every artifact opens with:**

```yaml
---
artifact: ui-plan
version: ui-checkout-02
produced_by: ui-planning
reads_versions:
  flows-checkout.md: flow-checkout-03
  ux-plan-checkout.md: ux-checkout-01
  design-system: "Acme DS · src:acme-ds-mobile-2.4"
supersedes: ui-checkout-01
feature: checkout
---
```

**Naming:** `<artifact>-<feature>.md` for the file, `<abbrev>-<feature>-NN` for the version id. Per-feature naming is the convention; the contract is identical for a single-feature product.

## Best practices

- **Versions increment, never overwrite.** An artifact is immutable once written. A revision creates a new version and records what it supersedes.
- **Put load-bearing fields in frontmatter.** A field a downstream rule is defined over is not machine-checkable in a body table. `reads_versions` is the one a real gate record dropped, and it is exactly what completion rule 2 is checked against.
- **Name exact versions, never "the latest".** "The latest" is a claim about the moment it was written.
- **Never hand-edit derived output.** `navgraph.json` is machine-derived and regenerated. If the diagram and the derivation disagree, the diagram is wrong.
- **A missing artifact is a back-transition**, not a gap to work around. Route to the state that owed it.
- **Do not delete an artifact to make a report clean.** A superseded version records what replaced it; deleting it makes the set agree with itself by removing the disagreement.
- **A missing log reads as no evidence, not as no open items.** Completion rule 6 is *failed*, not passed, when the revision log for a feature does not exist.
- **Commit the deliverable.** A frozen deliverable that only exists on one laptop is not a freeze — and `designed` and `delivered` are different claims.

## Related

- [`ARTIFACT_FLOW.md`](../ARTIFACT_FLOW.md) — every artifact in detail, and the consumption matrix
- [`docs/artifact-contracts.md`](../docs/artifact-contracts.md) — the specification
- [`templates/`](../templates/) — the shape for each one
- [`state/README.md`](../state/README.md) — `machine_state.yaml`, which is **not** an artifact
