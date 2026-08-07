# `reference/` — product-owned inputs

[← Repository root](../README.md) · [Artifact Flow](../ARTIFACT_FLOW.md) · [Validation Engine](../VALIDATION_ENGINE.md)

---

## Purpose

Product-owned inputs. **Not** produced by the pipeline — the pipeline reads them.

Everything in [`artifacts/`](../artifacts/) is written by a state. Everything here is written by you, or by a state acting on your product's behalf, and it persists across runs.

| File | Owner | Seed from | Read by |
|---|---|---|---|
| `screen-registry.csv` | the product; rows added as flows are designed | [`templates/screen-registry.csv`](../templates/screen-registry.csv) | `navgraph.mjs`, `stategraph.mjs`, STATE 12 |
| `nav-lanes.json` | STATE 12 (E1) | [`templates/nav-lanes.json`](../templates/nav-lanes.json) | `navgraph.mjs` |
| `state-vocabulary.md` | STATE 12 (E5) | [`templates/state-vocabulary.md`](../templates/state-vocabulary.md) | `navgraph.mjs`, `stategraph.mjs` |
| `state-machines.json` | STATE 12 (E5) | [`templates/state-machines.json`](../templates/state-machines.json) | `stategraph.mjs`, `stateprobe.mjs`, `audit.mjs` fallback |
| `edge-annotations.json` | STATE 12 (E6) | [`templates/edge-annotations.json`](../templates/edge-annotations.json) | `annotate.mjs` |
| `audit-plan.json` | STATE 08 (optional) | [`templates/audit-plan.json`](../templates/audit-plan.json) | `audit.mjs` |
| design-system export, brand assets, research sources | the product | — | STATE 06 |

Paths are declared in [`toolkit.config.json`](../toolkit.config.json) → `paths`; move a file and update that, never a tool.

## Inputs

Yours. The registry grows as flows are designed; the lane file, vocabulary, state machines and annotations are authored by STATE 12 as the navigation layer is built; the audit plan is optional and written when you need passes the state machines cannot express.

## Outputs

Nothing directly. These files are the **source** the derivations read. `navgraph.json`, `stategraph.json` and `annotations.json` are all downstream of what is in this folder.

---

## The registry is the spine

`tools/navgraph.mjs` derives the **entire** navigation model from the registry's cells. That has two consequences worth internalising:

1. **If the diagram and the derivation disagree, the diagram is wrong.** A connector drawn by hand is an assertion nobody can re-check.
2. **A registry cell carrying prose where an id belongs is a finding** (`N10-unparsed`), not a stylistic quibble — it silently drops an edge.

Two separators, and they are not interchangeable: **`states` is comma-separated** (`happy, error{invalid-input}, loading`) and **`entry_from` / `navigates_to` are pipe-separated** (`S-FLOW-02 | S-OTHER-01 (condition)`). Getting them backwards makes `navgraph` read one cell as a single label — reported as `N11-state-syntax`, not silently swallowed.

`entry_from` is the column that rots. It gets written when a screen is designed and never updated when a *later* flow starts routing to it. The forward edge (`navigates_to`) is authoritative and the map draws correctly regardless — but `entry_from` is what a developer reads to answer "who can send me here", so it is worth repairing when `N3b-backedge` reports it.

---

## Examples

**Seeding a new product:**

```bash
cp templates/screen-registry.csv  reference/screen-registry.csv
cp templates/nav-lanes.json       reference/nav-lanes.json
cp templates/state-vocabulary.md  reference/state-vocabulary.md
```

**A registry row:**

```csv
screen_id,flow,screen_name,purpose,data_content,key_components,states,entry_from,navigates_to,status,notes
S-SIGN-01,01 Sign in,Sign in,Credential entry,"email + password fields","input, button","happy, error{invalid-credentials}, loading",app launch,S-SIGN-02 | S-HOME-01 (success),designed,""
```

**A lane assignment** — a single-actor product is the honest degenerate case, with the other lanes declared and empty:

```json
{
  "order": ["customer", "admin", "system", "api"],
  "lanes": {
    "customer": ["S-SIGN-01", "S-SIGN-02", "S-HOME-01"],
    "admin": [],
    "system": [],
    "api": []
  }
}
```

**A state label, normalized:**

```
error{invalid-credentials}      ✓  canon term + qualifier
empty{new-user}                 ✓
"empty for a new user"          ✗  N11-state-vocab, N11-state-syntax
```

**Adding a screen to the registry, then re-deriving:**

```bash
node tools/navgraph.mjs --fail-on major
# a re-derivation whose edge set differs from the committed one IS the sync signal
```

---

## Best practices

- **Add registry rows as flows are designed, not up front.** The *columns* are fixed because the derivation depends on them; the rows follow the work.
- **Fix the registry, not the map.** If a route belongs in the diagram and not in the registry, the registry is what is wrong.
- **Never guess a swimlane.** An unassigned screen is reported as `N8` and left unassigned, because a wrong lane reads as a ruling about who owns a screen.
- **Normalize the state vocabulary before generating anything.** On the extraction run the registry carried **59 distinct free-text labels across 48 screens**, including three spellings of "empty for a new user". Generating first freezes N private vocabularies into a deliverable. Normalized, 58 qualified labels resolved to 12 canon terms with 0 findings — and the originals were preserved in the mapping table, so the rewrite lost nothing.
- **Keep the qualifier; never drop it.** `error{wrong-otp}` and `error{unchecked-terms}` are different screens' different recoveries.
- **Adding a canon term costs a justification**, written into `state-vocabulary.md`. A term only one screen would ever use is a qualifier, not a canon term. Note that the canonical set is carried in both the vocabulary file **and** `tools/navgraph.mjs` / `tools/stategraph.mjs` — adding a term means editing all of them.
- **A boundary status is a dated claim.** Re-derive every port at each sync and record the date it was checked. A status with no date is not a status.
- **`UNKNOWN` is a legal annotation value and a guessed one is not.** An `api` field filled with a plausible endpoint is worse than an empty one, because the developer will build it.
- **Cite, do not restate.** `state-machines.json` transitions and `edge-annotations.json` `nav` / `guard` fields carry `file:line` into the frozen bytes, and the tools resolve them. A citation that no longer lands is a finding — which is what stops these files from quietly aging.
- **Commit this folder.** It is the input every derivation is checked against.

## Related

- [`ARTIFACT_FLOW.md § 6`](../ARTIFACT_FLOW.md#6--reference-inputs--read-but-never-produced) — the reference layer in the pipeline
- [`VALIDATION_ENGINE.md`](../VALIDATION_ENGINE.md) — the finding codes each of these files can produce
- [`WORKFLOW_GUIDE.md § STATE 12`](../WORKFLOW_GUIDE.md#state-12--flow_visualization) — who authors what, and when
- [`templates/`](../templates/) — the seeds
