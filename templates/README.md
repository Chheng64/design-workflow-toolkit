# `templates/` — artifact shapes

[← Repository root](../README.md) · [Artifact Flow](../ARTIFACT_FLOW.md) · [Contracts spec](../docs/artifact-contracts.md)

---

## Purpose

An empty, correctly-shaped starting point for every artifact the pipeline produces and every reference file it reads — with the load-bearing fields marked and the reason each one exists written next to it.

A template is not decoration. Several of these files carry inline notes recording **why** a field exists, and those notes are the difference between filling a table in and understanding what the table is checked against.

| Template | Shape for | Produced by |
|---|---|---|
| [`requirements.md`](requirements.md) | `requirements-<f>.md` | 01 |
| [`research.md`](research.md) | `research-<f>.md` | 02 |
| [`product-review.md`](product-review.md) | `product-review-<f>.md` | 03 |
| [`ux-plan.md`](ux-plan.md) | `ux-plan-<f>.md` | 04 |
| [`flows.md`](flows.md) | `flows-<f>.md` | 05 |
| [`ui-plan.md`](ui-plan.md) | `ui-plan-<f>.md` | 06 |
| [`traceability.md`](traceability.md) | `traceability-<f>.md` | 07 |
| [`audit-report.md`](audit-report.md) | `audit-report-<f>.md` | 08 |
| [`review-record.md`](review-record.md) | `review-record-<f>.md` | 09 |
| [`revision-log.md`](revision-log.md) | `revision-log-<f>.md` | 10 |
| [`handoff.md`](handoff.md) | `handoff-<f>.md` inside the deliverable | 11 |
| [`flow-visualization.md`](flow-visualization.md) | `flow-visualization-<scope>.md` | 12 |
| [`prototype/`](prototype/) | the Run Local review player | 07 copies it in |

### Reference-file templates — copy these into `reference/`

| Template | Becomes | Owner |
|---|---|---|
| [`screen-registry.csv`](screen-registry.csv) | `reference/screen-registry.csv` | the product — **the spine** |
| [`nav-lanes.json`](nav-lanes.json) | `reference/nav-lanes.json` | STATE 12 (E1) |
| [`state-vocabulary.md`](state-vocabulary.md) | `reference/state-vocabulary.md` | STATE 12 (E5) |
| [`state-machines.json`](state-machines.json) | `reference/state-machines.json` | STATE 12 (E5) |
| [`edge-annotations.json`](edge-annotations.json) | `reference/edge-annotations.json` | STATE 12 (E6) |
| [`audit-plan.json`](audit-plan.json) | `reference/audit-plan.json` | STATE 08, optional |

### Machine and tracking templates

| Template | Becomes | Notes |
|---|---|---|
| [`machine_state.yaml`](machine_state.yaml) | `state/machine_state.yaml` | Not an artifact — the machine's own record |
| [`PROGRESS.md`](PROGRESS.md) | wherever you track work | The priority tracker: alignment snapshot, blocked vs actionable, open decisions, debt, loop accounting |

## Inputs

None. Templates are static.

## Outputs

Nothing directly. They are copied — into `reference/`, into `state/`, or used as the shape a skill writes to in `artifacts/`.

## Examples

**Seeding a new product** (the four files every run needs):

```bash
cp templates/screen-registry.csv  reference/screen-registry.csv
cp templates/nav-lanes.json       reference/nav-lanes.json
cp templates/state-vocabulary.md  reference/state-vocabulary.md
cp templates/machine_state.yaml   state/machine_state.yaml
```

**Standing up the review player** (STATE 07):

```bash
cp templates/prototype/{run-local.sh,serve.py,play.html} artifacts/prototype/
chmod +x artifacts/prototype/run-local.sh
```

**Adding the audit plan** when you need passes the state machines cannot express — locale × theme × reduced-motion:

```bash
cp templates/audit-plan.json reference/audit-plan.json
```

**What a load-bearing field looks like in a template.** From `templates/machine_state.yaml`:

```yaml
  # Each gets a boolean AND a one-line reason. `true` with no reason is the
  # silence skills/11 P6 forbids.
  completion_check:
    C1_state_is_done: false                            # <reason>
```

The comment is the rule. Deleting it does not remove the requirement.

## Best practices

- **Copy, then fill. Never edit a template in place.** The template is the shape for the *next* product too.
- **Keep the frontmatter.** A field a downstream rule is defined over belongs in frontmatter, not in a body table. `reads_versions` is the specific one a real gate record dropped, and it is exactly what delivery is checked against.
- **Keep the inline notes while you are learning the shape.** They record why a field exists. Strip them once the shape is second nature — not before.
- **Do not remove a table because it is empty.** An empty *Deliberately not changed* table and a missing one are different claims. The empty one says "nothing was left out"; the missing one says nothing at all.
- **Two separators in the registry, and they are not interchangeable.** `states` is comma-separated; `entry_from` and `navigates_to` are pipe-separated. Getting them backwards is reported as `N11-state-syntax`, not silently swallowed.
- **Register every new prototype page in `play.html`'s `FEATURES` array, in the same edit that creates the page.** A flow missing from the sidebar is a flow the user does not review.
- **Improving a template is a contribution.** Improving it by removing a required field is not.

## Related

- [`ARTIFACT_FLOW.md`](../ARTIFACT_FLOW.md) — what each artifact is, who consumes it, and which part is load-bearing
- [`docs/artifact-contracts.md`](../docs/artifact-contracts.md) — the naming scheme and the frontmatter contract
- [`templates/prototype/README.md`](prototype/README.md) — the Run Local review player
- [`reference/README.md`](../reference/README.md) — where the reference templates end up
