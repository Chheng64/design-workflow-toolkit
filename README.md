<div align="center">

# Design Toolkit

**Turn a product brief into a validated, developer-ready deliverable — with AI doing the work and proving it.**

A structured AI design workflow that takes you from brief to:

✓ Requirements · ✓ UX flows · ✓ UI plan · ✓ Interactive prototype · ✓ Audit with evidence · ✓ Developer handoff

[![checks](https://github.com/Chheng64/design-workflow-toolkit/actions/workflows/checks.yml/badge.svg)](https://github.com/Chheng64/design-workflow-toolkit/actions/workflows/checks.yml)
[![Status](https://img.shields.io/badge/status-public%20preview-blue)](PUBLIC_ROADMAP.md)
[![Node](https://img.shields.io/badge/node-%E2%89%A522-informational)](SETUP.md)
[![Dependencies](https://img.shields.io/badge/dependencies-0-success)](tools/)
[![License](https://img.shields.io/badge/license-Apache--2.0-green)](LICENSE)
[![Model](https://img.shields.io/badge/AI%20model-agnostic-8A2BE2)](DIFFERENTIATORS.md)

### [🚀 Build your first project →](START_HERE.md)

*First project in under 30 minutes. No dependencies, no account, no network.*

</div>

> **Operating documentation, not an execution trigger.** Reading this repository does not start a run. An agent executes a state only when a request explicitly asks for that state's work.

---

## Who is this for?

| Built for | Not built for |
|---|---|
| Product designers | Graphic design |
| UX designers | Marketing design |
| Product managers | Logo design |
| Startup founders | Presentation design |
| Agencies and product teams | One-off napkin sketches |

If you need to take a product idea to something a build team can implement — and you want proof, not promises, that the output holds — this is for you. Honest detail on when *not* to use it: [DIFFERENTIATORS.md § When not to use this](DIFFERENTIATORS.md#13--when-not-to-use-this).

---

## What you'll build

```
Product brief
   ↓
Requirements          falsifiable acceptance criteria, open questions surfaced
   ↓
Research              evidence with citations, contradictions preserved
   ↓
UX plan + flows       tasks, IA, edge cases, directed flow graphs
   ↓
UI plan               your design system, mapped reuse-first
   ↓
Interactive prototype every state reachable by deep link
   ↓
Audit report          screenshots read by a human, not just checks
   ↓
Developer package     frozen prototype · handoff doc · traceability
                      matrix · navigation map · sha256 hashes
```

The deliverable is a folder of markdown, HTML and hashes — readable, gradable and re-runnable anywhere. Two decisions stay with you: the product direction, and the approval to ship.

---

## Build your first project

```bash
# 1. Get the repository (Node ≥ 22, nothing to install)
git clone <this-repo> design-toolkit && cd design-toolkit

# 2. Name your product — the only file you must edit to begin
$EDITOR toolkit.config.json

# 3. Seed the working files
cp templates/screen-registry.csv  reference/screen-registry.csv
cp templates/nav-lanes.json       reference/nav-lanes.json
cp templates/state-vocabulary.md  reference/state-vocabulary.md
cp templates/machine_state.yaml   state/machine_state.yaml

# 4. Run STATE 01 against your brief, in your agent of choice:
#    "Run STATE 01 requirement-analysis on this brief: <your brief>"

# 5. Continue one state per request — the workflow tells you what's next
```

**[START_HERE.md](START_HERE.md)** walks every step with a real feature. Configuring for a real product? **[SETUP.md](SETUP.md)** is the field guide.

---

## Example project

The toolkit ran its own pipeline on its own product. One three-sentence brief — email sign-in with password reset — became:

| | |
|---|---|
| Scope | 3 screens · 11 flow states · 7 requirements · 26 acceptance criteria |
| Final state | `DONE` — 7/7 completion rules, each with a reason |
| Gates | Direction · User Approval · Developer Handoff — all three granted by a human |
| Revision cycles | 1 of 3 allowed |
| Waivers | 0 |

The moment worth reading: the first audit returned **138/138 checks passed, exit 0** — and reading the screenshots failed it on three real defects. That gap between "checks pass" and "it's right" is what this toolkit is built around.

Full run, every artifact: **[examples/signin/](examples/signin/README.md)**.

---

## Key features

| Feature | What you get |
|---|---|
| **Structured workflow** | Twelve states in a fixed order. No improvised sequencing, no lost steps. |
| **Reproducible outputs** | Same brief, same inputs → same artifacts. A second run agrees with the first. |
| **Validation engine** | Design quality checked by tools with exit codes before handoff — not asserted in prose. |
| **Human approval gates** | Direction and shipping are your calls. The machine cannot ratify its own work. |
| **Artifact store** | Skills communicate through versioned files, not chat memory. What is not in the artifact did not happen. |
| **Developer handoff** | A navigation map derived from data — swimlanes, deep links, per-screen state machines, cited annotations. |
| **Resumable anywhere** | State persists after every transition. Halt today, resume at the exact state tomorrow. |
| **Product and model agnostic** | One config file holds everything product-specific. Any agent that reads files, writes files and runs Node can execute the states. |

---

## Why it's different

| Traditional AI design | Design Toolkit |
|---|---|
| Prompt | Structured workflow with contracts |
| Manual QA | Validation engine with exit codes |
| Chat memory | Versioned artifact store |
| Static documents | Reproducible outputs |
| "Looks done" | Evidence, hashes, human gates |

Every rule here was written by a defect from a real product run — 11 flows, 48 screens, 4 shipped deliverables. The catalogue: [`docs/method-rules.md`](docs/method-rules.md). Full comparison against eight adjacent categories: **[DIFFERENTIATORS.md](DIFFERENTIATORS.md)**.

---

## 📚 Documentation

| | |
|---|---|
| 🚀 [Start Here](START_HERE.md) | Zero to first finished project in 30 minutes |
| 🔧 [Setup](SETUP.md) | Pointing the toolkit at a real product |
| 📖 [Workflow Guide](WORKFLOW_GUIDE.md) | All twelve states, in full |
| 🏗 [Architecture](ARCHITECTURE.md) | Engine, store, validators, gates |
| 📦 [Artifact Flow](ARTIFACT_FLOW.md) | What each artifact is and who consumes it |
| 🧪 [Validation Engine](VALIDATION_ENGINE.md) | Every validator, output, failure and fix |
| 🧠 [Design Principles](DESIGN_PRINCIPLES.md) | The philosophy, with failure modes |
| ⚖️ [Differentiators](DIFFERENTIATORS.md) | How this differs from adjacent tools |
| 🔌 [Ecosystem](ECOSYSTEM.md) | What works with your tools today, and what the roadmap adds |
| 🗺 [Diagrams](DIAGRAMS.md) | Every diagram in one place |
| 📚 [Glossary](GLOSSARY.md) | Canonical terminology |
| ❓ [FAQ](FAQ.md) | The questions people actually ask |

The README summarizes; the documentation explains. Where a skill and [`docs/workflow.md`](docs/workflow.md) disagree, the document wins and the skill is the bug.

---

## Community

- 💬 [Discussions](https://github.com/Chheng64/design-workflow-toolkit/discussions) — questions, ideas, show your runs
- 🐛 [Issues](https://github.com/Chheng64/design-workflow-toolkit/issues) — bugs and **rule reports** (a defect that got past a green check is a contribution)
- 🤝 [Contributing](CONTRIBUTING.md) — the bar for a rule, a validator, a spec change
- 🔒 [Security](SECURITY.md) — report privately, not in a public issue

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Roadmap

**Phase 1 · Open Source Toolkit** (current) → **2 · CLI** → **3 · Visual Workflow** → **4 · Cloud Platform** → **5 · Marketplace** → **6 · Enterprise**

The engine stays open, artifacts stay portable, gates stay human — across every phase. Detail: **[PUBLIC_ROADMAP.md](PUBLIC_ROADMAP.md)**.

---

<div align="center">

**[🚀 Build your first project →](START_HERE.md)**

[Apache-2.0](LICENSE) · [Changelog](CHANGELOG.md) · [Roadmap](PUBLIC_ROADMAP.md)

</div>
