# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[← README](README.md) · [Roadmap](PUBLIC_ROADMAP.md) · [Contributing](CONTRIBUTING.md)

---

## What counts as a breaking change here

This repository's public interface is not an API. It is the **contracts**, and those are what versioning tracks:

| Breaking | Not breaking |
|---|---|
| A state's Reads or Writes change | A state's prose is clarified |
| A transition, guard, gate or loop ceiling changes | A duration estimate is revised |
| A `V1`–`V4` rule changes | A `V5+` rule is **added** |
| An artifact's required frontmatter changes | A new optional frontmatter field is added |
| A tool's exit-code semantics change | A tool's report formatting changes |
| A `toolkit.config.json` key is renamed or removed | A key is added with a working default |
| A rule code is renumbered | A rule's statement is sharpened |

A **new hardened rule** is a minor version, not a major one — it adds a check, it does not change a contract. Renumbering an existing code is major, because it invalidates citations in existing plans, logs and gate records.

---

## [Unreleased]

### Added

- **Documentation layer for public launch.**
  - `START_HERE.md` — zero-knowledge onboarding, targeting a finished first project in under thirty minutes.
  - `ARCHITECTURE.md` — six-layer architecture, full state machine, orchestrator, artifact store, validation engine, gates, configuration, outputs, dependency graph.
  - `WORKFLOW_GUIDE.md` — all twelve states, each with goal, purpose, inputs, reads, outputs, writes, validation, human approval, exit criteria, common mistakes, related artifacts, expected duration and dependencies.
  - `ARTIFACT_FLOW.md` — every artifact, naming and versioning, load-bearing frontmatter, what a revision does to the store, the freeze, and a consumption matrix.
  - `VALIDATION_ENGINE.md` — every validator: checks, rationale, usage, typical output, common failures and fixes, plus the false-positive catalogue and the waiver rules.
  - `DESIGN_PRINCIPLES.md` — twelve principles, each with purpose, origin, enforcement, a real example and the failure if ignored.
  - `DIFFERENTIATORS.md` — comparison against eight adjacent categories, on methodology.
  - `PUBLIC_ROADMAP.md` — six phases, with what each unlocks and what it explicitly does not change.
  - `DIAGRAMS.md` — eleven Mermaid diagrams in one place, with colour conventions.
  - `GLOSSARY.md` — canonical terminology, terms deliberately not used, and the rule-code prefix index.
  - `DOCS_AUDIT.md` — pre-launch documentation audit: 0 blocking, 3 major, 9 advisory findings.
- **Folder documentation.** A `README.md` in `docs/`, `skills/`, `tools/`, `templates/`, `templates/prototype/`, `artifacts/` and `state/`, each with Purpose · Inputs · Outputs · Examples · Best practices · Related. `reference/` and `examples/` restructured to the same shape with their content preserved.
- **Navigation.** Breadcrumbs and prev/next links on all twelve skill READMEs in machine order; breadcrumb headers on all three `docs/` specification files; header and footer navigation plus a table of contents on every root document.
- **Open-source repository files.** `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, this changelog, and `.github/` issue and pull-request templates — including a **rule report** template, which is how hardened rules scale past this repository.

- **`LICENSE` — Apache-2.0.** Chosen for the explicit patent grant and contribution terms; the README badge points at it.
- **[`examples/signin/`](examples/signin/) — the toolkit's own reference run.** One feature, brief to frozen deliverable: all twelve states, all seven validators, three human gates, one revision cycle, zero waivers, machine closed at `DONE` with 7/7 completion rules. Includes the **failing** audit (`audit-signin-01`, 138/138 checks passed and the screenshots failed it on three `major` defects) preserved alongside the passing one.

### Fixed

- **`tools/audit.mjs` swept the review player as product surface.** Its `M4` source sweep read every `.html` / `.js` / `.css` in the prototype directory including `play.html`, reporting 11 off-palette hexes on every run. `tools/annotate.mjs` in the same toolkit already excluded `{review.player, run-local.sh, serve.py}`; `audit.mjs` now does too. Found by running the pipeline for real. **This is the first behavioural change to a tool in this release, and it is a fix, not a relaxation** — the check still runs, on the surface it was always meant to cover.
- `templates/ui-plan.md` linked to `../08-self-audit/SKILL.md`, which resolves outside `templates/` and does not exist. Corrected to `../skills/08-self-audit/SKILL.md`.
- `README.md` and `VALIDATION_ENGINE.md` linked to files under `reference/` that do not exist until a user seeds them. Repointed to `reference/README.md` and `templates/state-vocabulary.md`.
- Three in-document anchors used a double hyphen where the target heading produces a single one.

### Unchanged

**No methodology change.** No workflow state, transition, guard, gate semantic, loop ceiling, validation rule or artifact contract was altered in this release. Only navigation headers were added inside `docs/`; no rule statement was edited.

**One tool changed behaviour**, and it is scoped precisely: `tools/audit.mjs` no longer sweeps `play.html`, `run-local.sh` and `serve.py` for palette conformance. Under the definitions above this is **not breaking** — no exit-code semantics changed, no config key moved, and the check still covers every file it was meant to. It is listed under *Fixed* rather than buried here, because a behaviour change that goes unannounced is the thing this section exists to prevent.

### Known issues

Carried from `DOCS_AUDIT.md`, with the recommendation for each:

- **M-1** — `docs/workflow.md` and skills 01–06 name artifacts without the feature suffix; `docs/artifact-contracts.md` and skills 07–12 use it. Both are correct and the equivalence is documented, but a reader meets both. A one-line note in §1.3 resolves it.
- **M-2** — the canonical state vocabulary is defined in three places: `templates/state-vocabulary.md`, `tools/navgraph.mjs` and `tools/stategraph.mjs`. All three currently agree. `skills/12` says to edit two.
- ~~**M-3** — `examples/` is empty.~~ **Resolved** — see `examples/signin/`.
- ~~**A-7** — no `LICENSE` file.~~ **Resolved** — Apache-2.0.
- **A-9** — the link and diagram checks used in the audit are throwaway scripts. Nothing in CI keeps the documentation honest.
- **TK-2** — `audit.paletteExemptSelectors` is documented in four places as the mechanism that exempts harness chrome from the palette sweep, and is referenced by no tool. The sweep is file-level, so a selector list could not exempt anything even if it were read. Either the key is dead or the check it implies does not exist.
- **TK-3** — `tools/cdp.mjs` calls `loadConfig()` with no root, so it resolves from `cwd` rather than honouring `--root`. Viewport and Chrome path come from the wrong config when a tool is run with `--root` from another directory. Worked in the reference run only because both configs agreed.
- **Rule candidate** — *do not write the name of the thing you are claiming not to use, inside the file being swept for it.* The reference prototype's comment recited the request-API names, and `annotate` E11 blocked on the disclaimer. Candidate for `skills/07`.

---

## [0.1.0] — 2026-08-07

The initial extraction. Everything in this release was derived from a complete product design run — 11 flows, 48 screens, 4 shipped deliverables — and every project-hardened rule is a defect that got past a green check on that run.

### Added

- **The state machine.** Twelve states, five approval gates, five bounded loops, three terminals, six completion rules — specified in `docs/workflow.md`, which is the source of truth for the toolkit.
- **Twelve skills.** One folder per state under `skills/`, each with a typed contract: Reads, Writes, Depends on, Approval gate, Retry ceiling, Next states — plus processing steps, a hardened method, the output shape, validation rules, exit conditions, failure recovery and recorded failure modes.
- **The hardened rule catalogue.** `docs/method-rules.md` — every rule indexed by the code it is cited as: `B1`–`B8`, `F1`–`F3`, `M1`–`M6`, `G1`–`G8`, `R1`–`R8`, `P1`–`P8`, `W1`–`W10`, `E1`–`E7`.
- **The artifact contracts.** `docs/artifact-contracts.md` — the store, per-feature naming, immutable versioning, and the load-bearing frontmatter fields `reads_versions`, `version` and `supersedes`.
- **Seven validators** in `tools/`, Node ≥22, zero dependencies, all config-driven, all exiting `0` clean / `1` findings / `2` tool error:
  - `smoke.mjs` — build-time paint, console, tap-target and overflow check.
  - `audit.mjs` — the rendering-class audit: paint, targets, overflow, content spill, composited contrast, per-glyph script fonts, plus source sweeps for duplicate keys, off-palette hexes and undeclared network calls. Captures a screenshot per driven URL per pass.
  - `navgraph.mjs` — the navigation derivation from the screen registry, plus the cross-feature map, the measured heatmap, deep-link hook coverage and state-vocabulary conformance.
  - `stategraph.mjs` — per-screen state machines: node set derived from the registry, edge set authored with `file:line` evidence resolved against the frozen bytes.
  - `stateprobe.mjs` — drives every hook and asserts the state actually paints; measures registry ↔ prototype id drift.
  - `annotate.mjs` — the six developer-annotation fields per edge and frame, each cited and resolved, with the network sweep re-run rather than trusted.
  - `cdp.mjs` — dependency-free headless Chrome driver.
- **`tools/config.mjs`** — root resolution, per-section defaults merge, absolute path resolution, shared argument parsing and the shared severity ladder. The one place a tool learns where a product keeps its files.
- **`toolkit.config.json`** — the only file a new product must edit, with a JSON Schema at `tools/config.schema.json`.
- **Templates** for every artifact and every reference file, with the load-bearing fields marked and the reason each exists recorded inline.
- **The Run Local review player** — `templates/prototype/run-local.sh`, `serve.py` and `play.html`. Idempotent server start, live reload gated on `current_state` being `USER_REVIEW`, and a sidebar that is the intended review chrome.
- **`state/machine_state.yaml`** — the machine's own record, with per-state entry counts, per-loop counters, per-gate approvals, the freeze hash table and the six completion-rule booleans.
- **`GETTING-STARTED.md`** — pointing the toolkit at a new product.

[Unreleased]: https://keepachangelog.com/en/1.1.0/
[0.1.0]: https://keepachangelog.com/en/1.1.0/

---

[← README](README.md) · [Roadmap](PUBLIC_ROADMAP.md) · [Contributing](CONTRIBUTING.md)
