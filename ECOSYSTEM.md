# Ecosystem

Design Toolkit works with your existing tools for a structural reason, not a partnership one: everything it reads and writes is an open artifact. This page is about compatibility, not connectors — what fits today because the artifacts are open, and what the [roadmap](PUBLIC_ROADMAP.md) will add.

[← README](README.md) · [Setup](SETUP.md) · [Artifact Flow](ARTIFACT_FLOW.md) · [FAQ](FAQ.md)

---

The toolkit ships no connectors and asks for no accounts. Every artifact it produces is markdown, HTML, JSON or CSV on disk; every check it runs is a zero-dependency Node script with an exit code. Anything that can read a file or run a command can participate — which is what "works with your existing workflow" means here, and all it means.

You don't replace the software your team already knows. The toolkit is the orchestration layer; the tools stay, and the artifacts give them something shared to agree on.

## Contents

- [AI models](#ai-models)
- [Documentation](#documentation)
- [Design](#design)
- [Development](#development)
- [Communication](#communication)
- [Automation](#automation)
- [Future connectors](#future-connectors)
- [Why this matters](#why-this-matters)

---

## AI models

A state is a document contract — what to read, what to write, what must be true on exit, what to do on failure. Nothing in it is vendor-specific, and the validators are plain Node that know nothing about any model ([FAQ § Does this only work with Claude?](FAQ.md#does-this-only-work-with-claude)). Any agent that can read files, write files and run Node can execute a state:

- Claude — the smoothest path; the skills are written as Claude Skills
- ChatGPT
- Gemini
- Local LLMs
- Any MCP-compatible AI agent

---

## Documentation

The artifacts are markdown. They render in any documentation tool without conversion — paste, import, or mirror them into:

- Notion
- Confluence
- Google Docs
- Markdown repositories
- GitHub Wiki

One rule survives the trip: the [artifact store](ARTIFACT_FLOW.md) remains the source of truth. A mirror in Notion is a view; what is not in the artifact did not happen.

---

## Design

Your design system is an input, not a casualty — the UI plan maps it reuse-first ([FAQ § Can I use my own design system?](FAQ.md#can-i-use-my-own-design-system)). Figma is required only for STATE 12, and only when `handoff_required` is true; that layer uses the official Figma MCP tooling ([FAQ § Is Figma required?](FAQ.md#is-figma-required)). Works with:

- Figma
- Figma MCP
- Penpot
- Your existing design system

---

## Development

The deliverable is a frozen folder — markdown, HTML, a traceability matrix, sha256 hashes. It attaches to, links from, or lives inside whatever your build team already runs:

- GitHub
- GitLab
- Azure DevOps
- Jira
- Linear

The traceability matrix maps requirements to screens, which is the shape a ticketing system wants.

---

## Communication

Reports and gate records are readable files. Drop an audit report into a channel; nobody needs a login to grade it. An approval is a record naming the sha256 of every approved file — it forwards as cleanly as it stores ([DIFFERENTIATORS § 2](DIFFERENTIATORS.md#2--the-axis-that-actually-separates-them)).

- Slack
- Discord
- Microsoft Teams
- Email

---

## Automation

Every tool speaks one contract: `--root`, the `blocking` / `major` / `advisory` severity ladder, and `0` / `1` / `2` exit semantics ([VALIDATION_ENGINE.md](VALIDATION_ENGINE.md)). Anything that can run a command and branch on an exit code can automate a check. This repository already does it: [`checks.yml`](.github/workflows/checks.yml) re-derives [`examples/signin/`](examples/signin/README.md) with the browser-free validators on every push.

- GitHub Actions
- n8n
- Make
- Zapier
- MCP servers
- Custom APIs and scripts

---

## Future connectors

Everything above works today, by shelling out to files and exit codes. What follows does **not exist yet**. Each item is on the [public roadmap](PUBLIC_ROADMAP.md), and this section exists so the line between the two stays visible.

| Planned | What it adds | Where |
|---|---|---|
| **`dtk` CLI** | `dtk validate --fail-on major` as a first-class pipeline step — CI integration becomes a command, not a shell script you maintain. | [Phase 2 · CLI](PUBLIC_ROADMAP.md#phase-2--cli) |
| **Shared artifact store + durable review links** | Hosted runs, team gates, and a report link that outlives the chat message it was pasted into. | [Phase 4 · Cloud Platform](PUBLIC_ROADMAP.md#phase-4--cloud-platform) |
| **Design-system adapters** | Token and component resolvers that turn "token references resolve to the provided design system" into a machine check for *your* system. | [Phase 5 · Marketplace](PUBLIC_ROADMAP.md#phase-5--marketplace) |
| **Validator packs** | New checks on the same `0` / `1` / `2` contract — a11y rule sets, i18n expansion, performance budgets. | [Phase 5 · Marketplace](PUBLIC_ROADMAP.md#phase-5--marketplace) |
| **Artifact templates** | Alternative handoff shapes for the same contracts — a format your build team already reads. | [Phase 5 · Marketplace](PUBLIC_ROADMAP.md#phase-5--marketplace) |

Two roadmap invariants bound all of it: artifacts stay markdown, JSON, CSV, YAML and HTML, and the engine keeps running offline — a hosted service is never required ([What is deliberately not on this roadmap](PUBLIC_ROADMAP.md#what-is-deliberately-not-on-this-roadmap)). A future connector can make an integration smoother; it cannot become the only way in.

---

## Why this matters

Your existing tools already solve specific problems, and they solve them well. The toolkit does not compete with them and does not wrap them — it coordinates them, from idea to developer handoff, through artifacts every one of them can read.

That is a deliberate boundary. A toolkit that shipped its own doc store, its own tracker and its own chat would make your workflow *its* workflow. This one stays a folder of files with contracts, so the workflow stays yours.

---

[← README](README.md) · [Differentiators](DIFFERENTIATORS.md) · [Public Roadmap](PUBLIC_ROADMAP.md)
