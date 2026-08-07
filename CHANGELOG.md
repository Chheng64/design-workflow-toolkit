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
- **Two documentation checks, on the standard tool contract.** `tools/linkcheck.mjs` (`D1`–`D3`) and `tools/mermaidcheck.mjs` (`D4`–`D7`) — same flags, same severity ladder, same `0` / `1` / `2` exit semantics as every other tool, zero dependencies. Documented in `VALIDATION_ENGINE.md § 13`, including the two false positives that shaped them.
- **`.github/workflows/checks.yml`.** Three jobs: documentation integrity, tool and config syntax, and a re-derivation of `examples/signin` by the three browser-free validators — with `git diff --exit-code` on the run's committed artifacts, because a validator that rewrites the run it is validating is not validating it. The browser-driven checks are deliberately **not** in CI, and the workflow says why.
- **`review.harnessFiles`.** The files in the prototype directory that are review chrome, not product surface. `audit.mjs`'s palette sweep and `annotate.mjs`'s network sweep now read one list, resolved once in `config.mjs` with `review.player` always included.
- **[`examples/signin/`](examples/signin/) — the toolkit's own reference run.** One feature, brief to frozen deliverable: all twelve states, all seven validators, three human gates, one revision cycle, zero waivers, machine closed at `DONE` with 7/7 completion rules. Includes the **failing** audit (`audit-signin-01`, 138/138 checks passed and the screenshots failed it on three `major` defects) preserved alongside the passing one.

### Fixed

- **`tools/audit.mjs` swept the review player as product surface.** Its `M4` source sweep read every `.html` / `.js` / `.css` in the prototype directory including `play.html`, reporting 11 off-palette hexes on every run. `tools/annotate.mjs` in the same toolkit already excluded `{review.player, run-local.sh, serve.py}`; `audit.mjs` now does too. Found by running the pipeline for real. **This is the first behavioural change to a tool in this release, and it is a fix, not a relaxation** — the check still runs, on the surface it was always meant to cover.
- `templates/ui-plan.md` linked to `../08-self-audit/SKILL.md`, which resolves outside `templates/` and does not exist. Corrected to `../skills/08-self-audit/SKILL.md`.
- `README.md` and `VALIDATION_ENGINE.md` linked to files under `reference/` that do not exist until a user seeds them. Repointed to `reference/README.md` and `templates/state-vocabulary.md`.
- Three in-document anchors used a double hyphen where the target heading produces a single one.
- **`tools/cdp.mjs` ignored `--root` (TK-3).** It called `loadConfig()` with no argument, so the viewport, the device-metrics override and the Chrome path resolved from the working directory while every path in the calling tool resolved from `--root`. Two configs that agree until they do not — and the symptom is an audit measuring the wrong viewport with nothing to show for it. It now reads `--root` from the same argv its caller parsed. `tools/smoke.mjs` had the same defect and now takes `--root` too; its positional `<page>:<view>` specs are parsed after the flag is removed, so a path containing a colon cannot be mistaken for a spec.
- **`audit.paletteExemptSelectors` was dead config (TK-2).** It was documented in four places as the mechanism that exempts harness chrome from the palette sweep, and no tool read it — nor could it have worked, because the sweep is file-level and the key named selectors. **Removed**, and replaced by `review.harnessFiles`, which is what the sweep actually does. Under the definitions above this is not a breaking change: no tool read the old key, so no behaviour depended on it. The four documentation sites now describe the file-level exclusion accurately, including the part that matters — chrome embedded *inside* a product file is not exempt, and should not be.

### Changed

- **The canonical state vocabulary is defined once (M-2).** The 14 canon terms lived in `templates/state-vocabulary.md`, `tools/navgraph.mjs` and `tools/stategraph.mjs`; all three agreed, and `skills/12` told a contributor to edit two. Both tools now import `CANON_STATES` from `tools/config.mjs`, next to the shared `SEVERITIES` ladder. The set is unchanged, so no product's findings change; a CI step asserts the count and asserts that neither tool has restated the set locally. It stays a toolkit constant rather than a config key on purpose — a per-product term set would make every product's state machine private again, which is the failure `E5` exists to prevent.
- `docs/workflow.md` § 1.3 now states in one line that its artifact ids are written without the feature suffix while the on-disk convention is `<artifact>-<feature>.md` (M-1). Both forms were correct and documented; a reader met both without being told they were the same thing.
- **`GETTING-STARTED.md` is now `SETUP.md`** (A-2). The file is configuration and wiring for a real product; "getting started" read as a synonym for `START_HERE.md`, which is the zero-knowledge tutorial. Renamed with `git mv` and all five inbound links updated in the same commit, before anything external could point at the old name.
- **`SECURITY.md` names a real channel.** GitHub private vulnerability reporting, with no email address published — a scraped address is one person's inbox and gives a reporter no record that the report landed. The document now also says what to do if that channel is unavailable, without inviting details into a public issue.
- **`CODE_OF_CONDUCT.md` names a real contact.** Conduct reports go by GitHub DM to the maintainer, and the document states explicitly that they must not be routed through security advisories — that is a different queue.

### Unchanged

**No methodology change.** No workflow state, transition, guard, gate semantic, loop ceiling, validation rule or artifact contract was altered in this release. No rule statement was edited. The changes inside `docs/` and `skills/` are navigation headers, one naming note, and corrections to descriptions of tool behaviour that had become false.

**Four tools changed behaviour**, each scoped precisely, and each listed under *Fixed* or *Changed* rather than buried here — a behaviour change that goes unannounced is the thing this section exists to prevent:

| Tool | What changed | Breaking? |
|---|---|---|
| `audit.mjs` | No longer sweeps the review chrome for palette conformance; the excluded set now comes from `review.harnessFiles` | No. No exit-code semantics changed, and the check still covers every file it was meant to. |
| `annotate.mjs` | Same list, same source. It already excluded these files; it no longer keeps its own copy | No. Identical set, identical findings. |
| `cdp.mjs` | Honours `--root` | No — it restores documented behaviour. A run that passed `--root` from a directory whose config differed was reading two configs; now it reads one. |
| `smoke.mjs` | Accepts `--root` | No. New flag, unchanged default. |

**No product's findings change.** The canon-term set is identical, the harness exclusion default is identical to the previous hardcode, and the reference run re-derives to the same verdicts — which CI now asserts on every push rather than leaving to memory.

### Known issues

Carried from `DOCS_AUDIT.md`, with the recommendation for each:

- ~~**M-1** — the artifact-id naming convention is stated two ways.~~ **Resolved** — one-line note in `docs/workflow.md` § 1.3.
- ~~**M-2** — the state vocabulary is defined in three places.~~ **Resolved** — one definition in `tools/config.mjs`, asserted by CI.
- ~~**M-3** — `examples/` is empty.~~ **Resolved** — see `examples/signin/`.
- ~~**A-7** — no `LICENSE` file.~~ **Resolved** — Apache-2.0.
- ~~**A-9** — the documentation checks are throwaway scripts and nothing in CI keeps the documentation honest.~~ **Resolved** — `tools/linkcheck.mjs`, `tools/mermaidcheck.mjs` and `.github/workflows/checks.yml`.
- ~~**TK-2** — `audit.paletteExemptSelectors` is dead config.~~ **Resolved** — removed, replaced by `review.harnessFiles`.
- ~~**TK-3** — `tools/cdp.mjs` ignores `--root`.~~ **Resolved** — and `smoke.mjs`, which had the same defect.
- ~~**The contact addresses.**~~ **Resolved** — GitHub advisories for security, a maintainer DM for conduct. **One repository setting is still required:** private vulnerability reporting must be enabled under Settings → Security after the repository is pushed. Until it is, `SECURITY.md` names a channel that is not switched on.
- **Still open — the rule candidate.** *Do not write the name of the thing you are claiming not to use, inside the file being swept for it.* The reference prototype's comment recited the request-API names, and `annotate` E11 blocked on the disclaimer. Candidate for `skills/07`; not yet written, because one occurrence is an anecdote and a hardened rule needs a class.
- **Note on the reference run.** `examples/signin/` records TK-2 and TK-3 as open, because they were open when that run closed. It is a dated record of a completed run, not a live document, and it is deliberately not being edited to match. The audit report says what the audit found.

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
