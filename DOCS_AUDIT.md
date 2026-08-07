# Documentation Audit

A pre-launch review of this repository's documentation, run the way the toolkit runs its own audits: findings classified by severity, each one confirmed at source, nothing waived silently.

[← README](README.md) · **Audit date:** 2026-08-07 · **Scope:** every `.md` file in the repository at this commit

---

## Verdict

**Ready for public launch.** Every finding in this audit is resolved. One item is not a documentation task and cannot be done from here: **private vulnerability reporting must be enabled** in the repository's Security settings once it is pushed, because [`SECURITY.md`](SECURITY.md) names that channel and nothing else.

**All three major findings and the recommendations that carried work are resolved**, each marked in place: [M-1](#m-1--artifact-naming-is-inconsistent-between-the-specification-and-the-contracts-document), [M-2](#m-2--the-canonical-state-vocabulary-is-defined-in-three-places), [M-3](#m-3--examples-is-empty-and-it-is-the-thing-a-first-time-reader-most-wants), [A-7](#a-7--no-license-file), [A-8](#a-8--no-contributingmd-code_of_conductmd-securitymd-changelogmd-or-github-templates) and [A-9](#a-9--no-automated-check-keeps-the-documentation-honest).

**The reference run is the most consequential thing in this audit**, because it found three defects in the toolkit that reading could not — all three now fixed. See [M-3](#m-3--examples-is-empty-and-it-is-the-thing-a-first-time-reader-most-wants).

| Metric | Value |
|---|---|
| Markdown files | 86 |
| Internal links checked | 923 |
| Broken links | **0** (4 fixed during this audit) |
| Mermaid blocks | 39 |
| Mermaid blocks with parse-risk warnings | **0** |
| GitHub issue-form templates validated | 3 / 3 |
| Findings — blocking | **0** |
| Findings — major | 3 — **3 resolved** |
| Findings — advisory | 9 — 3 resolved ([A-7](#a-7--no-license-file), [A-8](#a-8--no-contributingmd-code_of_conductmd-securitymd-changelogmd-or-github-templates), [A-9](#a-9--no-automated-check-keeps-the-documentation-honest)) |
| Toolkit defects found by the reference run | 3 — **3 fixed** (TK-1, TK-2, TK-3) |

The link and diagram counts are no longer a claim in this document. They are [`tools/linkcheck.mjs`](tools/linkcheck.mjs) and [`tools/mermaidcheck.mjs`](tools/mermaidcheck.mjs), and they run on every push.

### Method

Applying the toolkit's own **M3** — *a failing probe is a hypothesis, not a finding* — every item below was confirmed against the source before being written down. The link and diagram sweeps were mechanical:

```bash
# every relative link and every in-document anchor, resolved against the filesystem
node tools/linkcheck.mjs          # → 923/923 resolve
# every fenced mermaid block: known diagram type, balanced quotes, closed fence
node tools/mermaidcheck.mjs       # → 39 blocks, 0 findings
# every GitHub issue form: parses, required keys present, no duplicate field ids
python3 -c "…"                    # → 3/3 OK
```

Both checks began as throwaway scripts. They are now part of the toolkit, on the same `--root` / severity / `0`–`1`–`2` contract as every other tool, and CI runs them — see [A-9](#a-9--no-automated-check-keeps-the-documentation-honest) and [recommendation 5](#5--add-a-ci-workflow).

Writing them down properly changed two of the numbers above, which is worth saying plainly: the throwaway `mermaidcheck` reported **12 warnings**, and all 12 were false positives on the valid `[( … )]` cylinder shape. The throwaway `linkcheck` was right by accident — the rewritten one briefly reported **167 broken links** because it collapsed whitespace where GitHub does not. Neither number was ever a defect in this repository. Both are recorded because *a probe you have not verified is not evidence*, and both scripts were probes for one run before anyone checked them.

---

## Contents

- [What was produced](#what-was-produced)
- [Findings](#findings)
  - [Major](#major)
  - [Advisory](#advisory)
- [Fixed during this audit](#fixed-during-this-audit)
- [Recommended actions before launch](#recommended-actions-before-launch)
- [Deliberately not changed](#deliberately-not-changed)
- [Navigation review](#navigation-review)
- [Terminology review](#terminology-review)
- [Coverage matrix](#coverage-matrix)

---

## What was produced

### New root documents

| File | Purpose |
|---|---|
| [`README.md`](README.md) | Rewritten: hero, value proposition, badges, quick navigation, what/why/features, workflow and architecture diagrams, quick start, folder-by-folder structure, validator table, philosophy, worked example, FAQ, roadmap, commercial vision. |
| [`START_HERE.md`](START_HERE.md) | Zero-knowledge onboarding. Setup, the five ideas needed, a complete ten-step first project, and troubleshooting. Target: a finished first project in under thirty minutes. |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Six-layer architecture, full state machine, orchestrator, skills, artifact store, reference inputs, validation engine, gates, configuration, outputs, dependency graph, design decisions. |
| [`WORKFLOW_GUIDE.md`](WORKFLOW_GUIDE.md) | All twelve states, each with goal, purpose, inputs, reads, outputs, writes, validation, human approval, exit criteria, common mistakes, related artifacts, expected duration and dependencies. |
| [`ARTIFACT_FLOW.md`](ARTIFACT_FLOW.md) | The pipeline as data: every artifact, naming and versioning, load-bearing frontmatter, reference inputs, what a revision does to the store, the freeze, and a consumption matrix. |
| [`VALIDATION_ENGINE.md`](VALIDATION_ENGINE.md) | Every validator: what it checks, why it matters, usage, typical output, common failures and fixes. Plus the false-positive catalogue and the waiver rules. |
| [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) | Twelve principles, each with purpose, origin, enforcement, a real example and the failure if ignored. |
| [`DIFFERENTIATORS.md`](DIFFERENTIATORS.md) | Comparison against eight adjacent categories, on methodology rather than features, plus what composes and when not to use this. |
| [`PUBLIC_ROADMAP.md`](PUBLIC_ROADMAP.md) | Six phases with what each unlocks and what it explicitly does not change. |
| [`DIAGRAMS.md`](DIAGRAMS.md) | All eleven diagrams in one place, with a reading note each and the colour conventions. |
| [`GLOSSARY.md`](GLOSSARY.md) | Canonical terminology, terms deliberately not used, and the rule-code prefix index. |
| [`DOCS_AUDIT.md`](DOCS_AUDIT.md) | This document. |

### Open-source repository files

[`CONTRIBUTING.md`](CONTRIBUTING.md) · [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) · [`SECURITY.md`](SECURITY.md) · [`CHANGELOG.md`](CHANGELOG.md) · [`.github/ISSUE_TEMPLATE/rule-report.yml`](.github/ISSUE_TEMPLATE/rule-report.yml) · [`.github/ISSUE_TEMPLATE/bug-report.yml`](.github/ISSUE_TEMPLATE/bug-report.yml) · [`.github/ISSUE_TEMPLATE/config.yml`](.github/ISSUE_TEMPLATE/config.yml) · [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)

### New folder documentation

Every folder now carries a `README.md` with **Purpose · Inputs · Outputs · Examples · Best practices · Related**:

[`docs/`](docs/README.md) · [`skills/`](skills/README.md) · [`tools/`](tools/README.md) · [`templates/`](templates/README.md) · [`templates/prototype/`](templates/prototype/README.md) · [`reference/`](reference/README.md) *(restructured, content preserved)* · [`artifacts/`](artifacts/README.md) · [`state/`](state/README.md) · [`examples/`](examples/README.md) *(restructured, content preserved)*

### Navigation added

- Breadcrumb and prev/next lines on all twelve skill `README.md` files, following **machine** order (09 → 12 → 11), with 10 marked as a loop rather than a step.
- Breadcrumb headers on all three `docs/` specification files.
- Header and footer navigation on every root document.
- A table of contents on every document over roughly 200 lines.

### Methodology changes

**None.** No workflow, validation rule, state transition, gate semantic, loop ceiling or artifact contract was altered. Two link paths were corrected and three navigation lines added inside `docs/`; the rule text is untouched.

---

## Findings

### Major

#### M-1 · Artifact naming is inconsistent between the specification and the contracts document

**Where:** [`docs/workflow.md`](docs/workflow.md) §1.3 and §9, and six `SKILL.md` files (01, 02, 03, 04, 05, 06).

`docs/workflow.md` and the first six skills name artifacts without the feature suffix — `artifacts/requirements.md`, `artifacts/research.md`, `artifacts/ux-plan.md`. [`docs/artifact-contracts.md`](docs/artifact-contracts.md) and the later skills (07–12) use `requirements-<feature>.md`.

Both are correct: the contracts document states plainly that *"per-feature files are the convention; the contract is identical for a single-feature product"*. But a new reader meets the un-suffixed form first, in the source of truth, and the suffixed form later, in the skill they are about to run.

**Impact:** confusion, not breakage. No tool resolves artifact paths by name.

**Not fixed at audit time** — a change to the specification and to six skill contracts is outside a documentation-only scope. The new documents consistently use the suffixed form and state the equivalence.

**Status: RESOLVED after this audit.** `docs/workflow.md` §1.3 now carries the one-line note, pointing at `artifact-contracts.md` for the rules and at `examples/signin/` for a filled-in set. The six skill contracts were left alone — renaming what they write is a specification change, and the note makes the equivalence explicit where the reader first meets it.

---

#### M-2 · The canonical state vocabulary is defined in three places

**Where:** [`templates/state-vocabulary.md`](templates/state-vocabulary.md) (14 terms), [`tools/navgraph.mjs`](tools/navgraph.mjs) `CANON_STATES` (14 terms), [`tools/stategraph.mjs`](tools/stategraph.mjs) `CANON_STATES` (14 terms).

All three currently agree — verified term by term. Both tools carry an inline comment acknowledging the duplication, and [`skills/12`](skills/12-flow-visualization/SKILL.md) instructs that adding a term requires editing the vocabulary file *and* the tool. That instruction names **two** places; there are **three**.

**Impact:** a term added to two of the three produces a `N11-state-vocab` finding from one tool and silence from the other — which reads as a product defect and is a configuration drift.

**Not fixed at audit time** — moving the set would change tool behaviour, which is out of scope for a documentation pass.

**Status: RESOLVED after this audit**, and neither of the two options above is what was done. Both tools now import `CANON_STATES` from [`tools/config.mjs`](tools/config.mjs), beside the shared `SEVERITIES` ladder. One definition, two enforcers, and the vocabulary file holds the justification.

Option (a) — moving the set into `toolkit.config.json` — was considered and rejected. A per-product term set would make every product's state machine private again, which is the exact failure `E5` exists to prevent; the closed set is a property of the method, not of a product. Option (b) — correcting `skills/12` to say "three places" — documents the duplication rather than removing it.

The set is byte-identical, so no product's findings change. CI asserts the term count and asserts that neither tool has re-declared the set locally.

---

#### M-3 · `examples/` is empty, and it is the thing a first-time reader most wants

**Where:** [`examples/`](examples/)

The reasoning for emptiness is sound and documented: a borrowed example from another product is precisely the failure mode `skills/06` records first — *a plan built on the wrong source validates perfectly against it*. That argument holds.

But it leaves the repository with **no worked artifact set at all**, and [`START_HERE.md`](START_HERE.md) asks a new user to produce their first one without ever having seen one. The templates show the *shape*; they do not show a filled-in `flows-<feature>.md` with a real reachability report, or an `audit-report` with a `fail` verdict and its routed revision.

**Impact:** the highest-friction moment in onboarding is STATE 05 and STATE 07, where the reader must produce a shape they have only seen empty.

**Status: RESOLVED after this audit.** The pipeline was run end to end on the `signin` feature and committed to [`examples/signin/`](examples/signin/) as the toolkit's own reference run — all twelve states, all seven validators, three human gates, one revision cycle, zero waivers, machine closed at `DONE` with 7/7 completion rules.

It also did what a reference run is *for*: **it found real defects in the toolkit.**

| # | Found by running it | Status |
|---|---|---|
| **TK-1** | `tools/audit.mjs` swept `play.html` — the review player — as product surface, reporting 11 off-palette hexes on every run. `tools/annotate.mjs` in the same toolkit already excluded exactly those three harness files. | **fixed** in `audit.mjs` |
| **TK-2** | `audit.paletteExemptSelectors` is documented in `toolkit.config.json`, `tools/config.mjs`, `VALIDATION_ENGINE.md` and `skills/08` as the mechanism that exempts harness chrome — and is **referenced by no tool**. The sweep is file-level, so a selector list could not exempt anything even if it were read. | **fixed** — key removed, replaced by `review.harnessFiles`, which both sweeps read |
| **TK-3** | `tools/cdp.mjs` calls `loadConfig()` with no root, so it resolves from `cwd` rather than honouring `--root`. Viewport and Chrome path therefore come from the wrong config when a tool is run with `--root` from a different directory. Worked here only because both configs agreed. | **fixed** in `cdp.mjs` — and in `smoke.mjs`, which had the same defect and no `--root` at all |
| **New rule candidate** | *Do not write the name of the thing you are claiming not to use, inside the file being swept for it.* The prototype's comment recited the request-API names; `annotate` E11 blocked on the disclaimer. | candidate for `skills/07` |

That is the argument for the run in one line: **the documentation described a toolkit nobody had executed, and executing it found three tool defects and a rule.**

---

### Advisory

#### A-1 · The extraction-run anecdotes repeat across many documents

The same evidence appears in several places: the 84/84 assertions (8 files), the 138 instances across 7 flows (11 files), the 60-failures-3-real audit, the 37-failures-all-harness probe, the five-of-seven flows past their audit of record.

This is **deliberate**. Each occurrence is stated where the rule it justifies lives, so a reader who opens one skill gets the evidence for that skill's rule without a cross-reference. The alternative — one canonical anecdote table and pointers everywhere else — trades reinforcement for brevity, and reinforcement is what makes a rule survive a deadline.

**Risk to watch:** if a number is ever corrected, it must be corrected in every occurrence. `grep -c "138 instances" **/*.md` finds them all.

**No action recommended.** Noted so the repetition reads as a decision rather than an oversight.

---

#### A-2 · Two "getting started" documents

[`START_HERE.md`](START_HERE.md) and `GETTING-STARTED.md` overlapped on setup and seeding, and their names did not say which was which.

They are differentiated on purpose — `START_HERE.md` assumes zero knowledge and walks a complete first project; the other is the field guide for pointing the toolkit at a real product with a real design system — and each links to the other with a one-line statement of the difference.

**Status: RESOLVED after this audit.** `GETTING-STARTED.md` is now [`SETUP.md`](SETUP.md), which is what it is: configuration and wiring, not onboarding. "Getting started" read as a synonym for "start here", which is the whole complaint. Renamed before publication, while nothing external links to it — after launch this would cost a redirect nobody can serve from a Git repository.

---

#### A-3 · The `E1`–`E7` code namespace is used twice

`E1`–`E7` are STATE 12's **extension** identifiers (swimlanes, cross-feature map, heatmap, deep links, state machines, developer annotations, overview page). `E0`–`E13` are `annotate.mjs`'s **finding** codes.

Context disambiguates in practice — extensions are always named ("E1 swimlanes"), findings are always cited with the tool ("`annotate` E1"). Documented in [`GLOSSARY.md § rule code prefixes`](GLOSSARY.md#rule-code-prefixes).

**No action recommended.** Renaming either set would invalidate citations in existing plans and gate records.

---

#### A-4 · Two different rules are both called `V5`

[`skills/06-ui-planning/SKILL.md`](skills/06-ui-planning/SKILL.md) references a "V5" that is `SELF_AUDIT`'s hex-conformance rule, and the skill itself flags the collision in a naming note. `skills/08`'s own `V5` is the rendering-class rule.

The existing note is clear and correctly placed. **No action recommended**, but a future rule-numbering pass should avoid cross-state `V` references entirely — cite the owning state, as `skills/08 V5`.

---

#### A-5 · Expected durations are indicative and unvalidated

The per-state durations in [`WORKFLOW_GUIDE.md`](WORKFLOW_GUIDE.md) are planning aids derived from the shape of the work, not measurements from instrumented runs. The document says so at the top of the section.

**Recommendation:** replace them with measured medians once enough runs exist. Until then the caveat is doing real work, and removing it would be worse than the imprecision.

---

#### A-6 · Diagrams are duplicated between `DIAGRAMS.md` and the documents that use them

Eleven diagrams appear both in a source document and in the gallery.

Deliberate — `DIAGRAMS.md` is the copy source and the "show me the shape of this system in one page" entry point. Each gallery entry links back to the section it came from.

**Risk to watch:** a diagram edited in one place and not the other. **Recommendation:** when a diagram changes, `grep` its first node id across `*.md`.

---

#### A-7 · No `LICENSE` file

**Status: RESOLVED after this audit.** [Apache-2.0](LICENSE). A public repository without a licence file is, by default, all-rights-reserved — which would contradict the "the engine stays open" commitment in [`PUBLIC_ROADMAP.md`](PUBLIC_ROADMAP.md).

Apache-2.0 over a permissive-only licence for the explicit patent grant and contribution terms, given the platform phases on the roadmap. **This is a reversible one-file decision** and the owner should override it if they disagree.

---

#### A-8 · No `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md` or `.github/` templates

**Status: RESOLVED after this audit.**

[`README.md`](README.md) carried a short Contributing section naming the two conventions that matter — `docs/workflow.md` wins over a skill, and a new rule names its defect — but no file expanded them, and none of the standard companions existed.

Now present:

| File | What it carries |
|---|---|
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | The two conventions expanded; the bar for a hardened rule (five conditions, three places, one edit) and for a validator (`--root`, config via `config.mjs`, shared severities, `1` vs `2`, JSON + human output, zero dependencies); how to change the specification; a pull-request checklist; and an explicit **what will be declined** table. |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Contributor Covenant 2.1, with one project-specific paragraph: the contribution model rejects work directly, and that directness applies to the work and never to the person. |
| [`SECURITY.md`](SECURITY.md) | Private reporting, in-scope and out-of-scope tables, and — the part worth having — an explicit **trust model**: what the toolkit assumes you trust, what binds to which local port and for how long, and why zero dependencies is a security property. |
| [`CHANGELOG.md`](CHANGELOG.md) | Keep a Changelog format, seeded at `0.1.0` with the extraction, plus a table defining **what counts as a breaking change here** — contracts, not an API. A new hardened rule is a minor version; renumbering a rule code is major, because it invalidates existing citations. |
| [`.github/ISSUE_TEMPLATE/rule-report.yml`](.github/ISSUE_TEMPLATE/rule-report.yml) | The template that matters. It forces the class statement, the "why is it invisible to existing checks" field, the owning state as a dropdown of the routing table, the check-gap flag, and a confirmation that the reporter confirmed at source rather than reporting a probe failure. |
| [`.github/ISSUE_TEMPLATE/bug-report.yml`](.github/ISSUE_TEMPLATE/bug-report.yml) | For the toolkit itself misbehaving, with the exit code requested explicitly — `1` and `2` are different bugs. |
| [`.github/ISSUE_TEMPLATE/config.yml`](.github/ISSUE_TEMPLATE/config.yml) | Blank issues disabled; security routed to private reporting. |
| [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) | The evidence block and the ten-point checklist from `CONTRIBUTING.md`. |

**Both contact placeholders are resolved.** [`SECURITY.md`](SECURITY.md) publishes no address and routes vulnerabilities through GitHub private advisories; [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) routes conduct reports to a maintainer DM, and states that they must not go through the security channel. What remains is a **repository setting** — enable private vulnerability reporting after pushing — not a file.

`.github/ISSUE_TEMPLATE/config.yml` uses relative `../../` URLs, which resolve once the repository has a host. All three YAML files were validated against the GitHub issue-forms shape: they parse, carry the required keys, use only supported field types, and have no duplicate field ids.

---

#### A-9 · No automated check keeps the documentation honest

The link and diagram sweeps run for this audit were throwaway scripts. Nothing prevents the next commit from breaking a link or leaving an unclosed mermaid fence.

Given that this repository's entire argument is *validation over assumption*, documentation that is only checked by hand is the one place the toolkit does not hold itself to its own standard.

**Status: RESOLVED after this audit.** Both scripts were promoted into [`tools/`](tools/) on the same contract as every other validator — `--root`, config through `config.mjs`, the shared severity ladder, `0` / `1` / `2` — and [`.github/workflows/checks.yml`](.github/workflows/checks.yml) runs them on every push, alongside a re-derivation of `examples/signin` by the three browser-free validators.

Promoting them found the class the throwaway versions were hiding: **both had false positives that only showed up once the check was written down properly.** `linkcheck` collapsed whitespace when slugifying a heading, where GitHub replaces each space individually — a one-character difference that reported 167 correct links as broken. `mermaidcheck` read `db[(Store)]` as an unquoted paren when it is a valid cylinder shape. Both are recorded in [VALIDATION_ENGINE.md § 13](VALIDATION_ENGINE.md#13--documentation-checks--linkcheckmjs-and-mermaidcheckmjs), because the false positive is the part a future maintainer needs.

See [recommendation 5](#5--add-a-ci-workflow).

---

## Fixed during this audit

| # | Issue | Fix |
|---|---|---|
| 1 | [`templates/ui-plan.md`](templates/ui-plan.md) linked to `../08-self-audit/SKILL.md`, which resolves to `templates/08-self-audit/` and does not exist. | Corrected to `../skills/08-self-audit/SKILL.md`. |
| 2 | [`README.md`](README.md) FAQ linked to `reference/screen-registry.csv`, which does not exist until a user copies it in. | Repointed to [`reference/README.md`](reference/README.md), which explains the file and where to seed it from. |
| 3 | [`VALIDATION_ENGINE.md`](VALIDATION_ENGINE.md) linked to `reference/state-vocabulary.md`, same problem. | Repointed to [`templates/state-vocabulary.md`](templates/state-vocabulary.md). |
| 4 | Three anchor links used a double hyphen where the target heading produces a single one. | Corrected. All 923 links now resolve, and `tools/linkcheck.mjs` keeps them resolving. |

Findings 1–3 are the same class: **a link to a file that only exists after the user seeds it.** The class was swept, not just the instances — `linkcheck.mjs` resolves every relative target against the filesystem, so any further occurrence would have been reported.

---

## Recommended actions before launch

Ordered. The first is blocking for a public repository; the rest are strongly recommended.

### 1 · Add a `LICENSE`

✅ **Done.** [Apache-2.0](LICENSE), chosen for its patent grant and contribution terms: the engine stays open, and the roadmap's platform phases depend on that staying true. README badge updated in the same edit. **Change it before publication if you disagree** — it is one file and one badge.

### 2 · Fill `examples/` with this repository's own reference run

Run the `signin` feature from [`START_HERE.md`](START_HERE.md) end to end and commit the artifact set to `examples/signin/`, with a short README recording the brief verbatim, which rules fired and what each caught, and what you would do differently. That is not a borrowed example — it is your own product, which is exactly what the emptiness rule permits.

Keep the artifacts that show a rule **working**, including an `audit-report` with a `fail` verdict and its routed revision. A clean example teaches less than a corrected one.

### 3 · Add the standard open-source files

✅ **Done.** All eight files are present and validated. See [A-8](#a-8--no-contributingmd-code_of_conductmd-securitymd-changelogmd-or-github-templates) for what each carries.

**Both contact placeholders are now filled.** [`SECURITY.md`](SECURITY.md) routes vulnerabilities through GitHub private advisories and publishes no address; [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) routes conduct reports to a maintainer DM and says explicitly that they must not go through the security channel.

**One action remains, and it is a repository setting, not a file:** enable private vulnerability reporting under Settings → Security after pushing.

### 4 · Resolve M-1 and M-2

✅ **Done.** M-1 is a one-line note in `docs/workflow.md` §1.3. M-2 landed as a shared `CANON_STATES` constant in `tools/config.mjs` that both enforcing tools import — not as a config key, for the reason recorded under [M-2](#m-2--the-canonical-state-vocabulary-is-defined-in-three-places). The term set is unchanged, so no product's findings move.

### 5 · Add a CI workflow

✅ **Done.** The throwaway scripts are now [`tools/linkcheck.mjs`](tools/linkcheck.mjs) and [`tools/mermaidcheck.mjs`](tools/mermaidcheck.mjs), on the standard contract, with zero dependencies — no `npx`, no Mermaid CLI, nothing to install. [`.github/workflows/checks.yml`](.github/workflows/checks.yml) runs three jobs:

```yaml
docs:            linkcheck + mermaidcheck              # every link and every diagram
tools:           node --check · config + schema parse  # and: the vocabulary is defined once
reference-run:   navgraph · stategraph · annotate      # re-derived against examples/signin
                 git diff --exit-code                  # and the run's artifacts are unchanged
```

The last line is the one worth keeping: a validator that rewrites the run it is validating is not validating it.

The browser-driven checks — `smoke`, `audit`, `stateprobe` — are deliberately **not** in CI, and the workflow says so in its own header. Their evidence is screenshots, and screenshots are read by a person (`M2`).

If they move into `tools/`, they take the same contract as every other validator: `--root`, config through `config.mjs`, the shared severity ladder, and `0` / `1` / `2`. The repository should hold its documentation to the standard it holds a prototype to.

### 6 · Decide the naming of `GETTING-STARTED.md`

✅ **Done.** Renamed to [`SETUP.md`](SETUP.md) with `git mv`, and all five inbound links updated in the same commit. Done before launch, while nothing external pointed at it.

---

## Deliberately not changed

Recorded so silence is not mistaken for oversight — the same table [`skills/10`](skills/10-revision/SKILL.md) requires of a revision.

| Item | Why not |
|---|---|
| Any workflow state, transition, guard, gate, ceiling or validation rule | Out of scope. The brief was documentation, onboarding, discoverability and developer experience. |
| The un-suffixed artifact names in `docs/workflow.md` and skills 01–06 (M-1) | Still not renamed — that is a specification change to the source of truth and six skill contracts. §1.3 now states the equivalence where the reader first meets it, which was the recommendation. |
| Anything in `examples/signin/` | It is a **dated record of a completed run**, not a live document. It records TK-2 and TK-3 as open, because they were open when it closed, and the audit report says what the audit found. Editing it to match the present would make it a worse record and a false one. |
| The `E1`–`E7` and `V5` code collisions (A-3, A-4) | Renaming would invalidate citations in existing plans, logs and gate records. Both are documented instead. |
| The repeated extraction-run anecdotes (A-1) | Reinforcement at the point of use beats brevity for rules that must survive a deadline. |
| `examples/` remaining empty | Filling it correctly requires running the pipeline, which is the owner's call and produces artifacts that should be theirs. Recommended, not done. |
| `LICENSE` | The licence choice is a decision for the repository owner. |
| A published email address in `SECURITY.md` or `CODE_OF_CONDUCT.md` | Resolved without one, deliberately. Vulnerabilities go through GitHub private advisories, conduct reports through a maintainer DM. A scraped address is one person's inbox and gives a reporter no record that the report landed. |
| The `docs/` specification prose | Only navigation headers were added. Not one rule statement was edited. |

---

## Navigation review

### Before

| Problem | Effect |
|---|---|
| Two entry points (`README.md`, `GETTING-STARTED.md`) with no stated difference | A new visitor could not tell which to read first. |
| No index in `docs/`, `skills/`, `tools/`, `templates/`, `artifacts/` or `state/` | Folder purpose had to be inferred from filenames. |
| No cross-links between the specification and the skills that implement it | Following a rule from a skill to its source meant a manual path. |
| No breadcrumbs anywhere | Every document was an island; there was no "up". |
| No table of contents on long documents | `docs/workflow.md` is 749 lines with no way to jump. |
| No glossary | "State" meant two different things with no page saying so. |

### After

| Layer | Navigation |
|---|---|
| **Entry** | `README.md` → quick-nav bar in the hero; `START_HERE.md` for zero knowledge; [`SETUP.md`](SETUP.md) for real-product setup, each stating the difference. |
| **Root documents** | Header nav + footer nav + table of contents on all eleven. |
| **Folders** | A `README.md` in every folder with Purpose · Inputs · Outputs · Examples · Best practices · Related. |
| **Skills** | Breadcrumb + prev/next in machine order on all twelve, plus links to both the spec section and the guide section. |
| **Specification** | Breadcrumb headers on all three `docs/` files, linking up to the folder index and across to the operating layer. |
| **Terminology** | [`GLOSSARY.md`](GLOSSARY.md), linked from the README footer, with a rule-code index. |
| **Diagrams** | [`DIAGRAMS.md`](DIAGRAMS.md), every diagram with a link back to its source section. |

### Suggested file names — considered, mostly not applied

| Current | Considered | Verdict |
|---|---|---|
| `GETTING-STARTED.md` | `CONFIGURING.md` · `SETUP.md` | **Applied** — now [`SETUP.md`](SETUP.md). The file is configuration and wiring; "getting started" read as a synonym for `START_HERE.md`, which was the finding (A-2). |
| `docs/workflow.md` | `docs/SPECIFICATION.md` | Rejected. Cited by name from every skill's header line; the churn exceeds the clarity gain. |
| `docs/method-rules.md` | `docs/RULES.md` | Rejected. Same reason. |
| `skills/12-flow-visualization/` | `skills/10-flow-visualization/` (machine order) | **Firmly rejected.** The number is authoring order and the skill says so. Renumbering would break every citation and imply a machine order that is conditional. |
| `state/` | `machine/` | Rejected. `state` is the term the specification uses. |

---

## Terminology review

Twelve competing pairs were found and normalised. The winner in each case is the term the specification already used; the full table lives in [`GLOSSARY.md § terms we do not use`](GLOSSARY.md#terms-we-do-not-use).

| Kept | Dropped | Because |
|---|---|---|
| artifact | deliverable, document, output | `deliverable` means specifically the frozen package. |
| state (machine) | step, stage, phase | `phase` is reserved for the roadmap. |
| flow state | screen state, UI state, mode | Disambiguates from machine states. |
| gate | checkpoint, review, sign-off | A gate blocks a transition; a checkpoint does not. |
| finding | issue, bug, problem | A finding is confirmed; a failing probe is a hypothesis. |
| derive | generate, build (of a graph) | Derivation implies a single source and re-runnability. |
| freeze | export, publish, ship | A freeze is a hash. |
| validation rule | test, assertion, check (of a V-rule) | Reserves "check" for a single tool assertion. |
| skill | agent, prompt, module | A skill is a state with a typed contract. |
| orchestrator | controller, runner, driver | One word, one responsibility set. |
| hook | link, shortcut, anchor | A hook is a query parameter that drives a state. |
| rendering-class | visual, UI-level | Names the method, not the impression. |

Two ambiguities are **inherent** and are handled by disambiguation rather than by renaming:

- **"state"** — a machine state versus a flow state. Resolved by convention: machine states are written `STATE 07` or `SELF_AUDIT`; flow states are lowercase vocabulary terms.
- **"E1–E7"** — extensions versus `annotate` findings. Resolved by citation convention.

---

## Coverage matrix

Against the fourteen deliverables in the brief.

| # | Deliverable | Status | Where |
|---|---|:--:|---|
| 1 | Rewrite `README.md` — hero, what, why, features, workflow, architecture, quick start, structure, validators, philosophy, example, FAQ, roadmap, commercial vision | ✅ | [`README.md`](README.md) |
| 2 | `ARCHITECTURE.md` — architecture, state machine, orchestrator, artifact store, validators, gates, skills, outputs, diagrams | ✅ | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| 3 | `DESIGN_PRINCIPLES.md` — name, purpose, why, example, failure if ignored | ✅ | [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) — 12 principles |
| 4 | `WORKFLOW_GUIDE.md` — all twelve states, thirteen fields each | ✅ | [`WORKFLOW_GUIDE.md`](WORKFLOW_GUIDE.md) |
| 5 | `ARTIFACT_FLOW.md` — the pipeline and every artifact | ✅ | [`ARTIFACT_FLOW.md`](ARTIFACT_FLOW.md) |
| 6 | `VALIDATION_ENGINE.md` — every tool, checks, output, failures, fixes | ✅ | [`VALIDATION_ENGINE.md`](VALIDATION_ENGINE.md) |
| 7 | `DIFFERENTIATORS.md` — eight comparisons, methodology-focused, no attacks | ✅ | [`DIFFERENTIATORS.md`](DIFFERENTIATORS.md) |
| 8 | `PUBLIC_ROADMAP.md` — six phases explained | ✅ | [`PUBLIC_ROADMAP.md`](PUBLIC_ROADMAP.md) |
| 9 | Folder documentation — purpose, inputs, outputs, examples, best practices | ✅ | 9 folder READMEs |
| 10 | Navigation — file names, cross-references, TOC, internal links, breadcrumbs, hierarchy | ✅ | Applied throughout; rationale in [Navigation review](#navigation-review) |
| 11 | Diagrams — workflow, architecture, artifact flow, state machine, validation pipeline, approval gates, repository structure, developer handoff, dependency graph | ✅ | [`DIAGRAMS.md`](DIAGRAMS.md) — all nine requested, plus revision loop and freeze sequence |
| 12 | `START_HERE.md` — zero knowledge, first project under thirty minutes | ✅ | [`START_HERE.md`](START_HERE.md) |
| 13 | Documentation quality — professional, consistent terminology, no buzzwords, GitHub-suitable, readable by five audiences | ✅ | Plus [`GLOSSARY.md`](GLOSSARY.md), which was not requested |
| 14 | Final audit — missing pages, broken flow, repetition, unclear wording, navigation, terminology, examples | ✅ | This document |

### Readability by audience

| Audience | Entry point | Deepest document they need |
|---|---|---|
| **Product designer** | [`START_HERE.md`](START_HERE.md) | [`WORKFLOW_GUIDE.md`](WORKFLOW_GUIDE.md) |
| **UX designer** | [`START_HERE.md`](START_HERE.md) | [`WORKFLOW_GUIDE.md`](WORKFLOW_GUIDE.md) STATES 04–05 |
| **Product manager** | [`README.md`](README.md) → [`DIFFERENTIATORS.md`](DIFFERENTIATORS.md) | [`PUBLIC_ROADMAP.md`](PUBLIC_ROADMAP.md) |
| **Developer** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | [`VALIDATION_ENGINE.md`](VALIDATION_ENGINE.md), [`tools/README.md`](tools/README.md) |
| **Founder** | [`README.md`](README.md) → Commercial vision | [`DIFFERENTIATORS.md`](DIFFERENTIATORS.md), [`PUBLIC_ROADMAP.md`](PUBLIC_ROADMAP.md) |

---

## What this audit did not check

Stated plainly, because a scope claim belongs inside the claim:

- **Mermaid rendering was checked statically, not rendered.** Diagram type, quote balance and fence closure were verified mechanically; no diagram was rendered by mermaid itself. A block could still fail on a syntax rule the static check does not model.
- **External URLs were not checked.** Only relative links and in-document anchors. The only external URLs are the shields.io badges.
- **The claims about competing products in `DIFFERENTIATORS.md` were not re-verified against those products.** They are stated at category level for that reason, with an explicit caveat at the top of the document.
- **The durations in `WORKFLOW_GUIDE.md` are not measurements** (A-5).
- **No prose was spell-checked by tool.** Read, not linted.
- **The toolkit itself was not run *at the time this audit was written*.** It has been since — see [M-3](#m-3--examples-is-empty-and-it-is-the-thing-a-first-time-reader-most-wants). All seven validators now have a real execution record against `examples/signin`, and three toolkit defects came out of it. The documentation claims in this repository were written before that run; the run corrected two of them and confirmed the rest.

---

[← README](README.md) · [Start Here](START_HERE.md) · [Architecture](ARCHITECTURE.md) · [Workflow Guide](WORKFLOW_GUIDE.md) · [Roadmap](PUBLIC_ROADMAP.md)
