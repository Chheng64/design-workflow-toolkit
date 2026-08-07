# `tools/` — the validation engine

[← Repository root](../README.md) · [Validation Engine](../VALIDATION_ENGINE.md) · [Architecture](../ARCHITECTURE.md)

---

## Purpose

Turn claims into exit codes. Seven Node ≥22 scripts, **zero dependencies**, all config-driven.

Nothing product-specific lives in this folder. Every tool reads [`toolkit.config.json`](../toolkit.config.json) through [`config.mjs`](config.mjs). **Change a convention in the config, never in a tool.**

| File | Runs at | Answers |
|---|---|---|
| [`smoke.mjs`](smoke.mjs) | 07 | Does this view paint, any console errors, any target under the floor? |
| [`audit.mjs`](audit.mjs) | 08 | The rendering-class audit: paint, targets, overflow, spill, contrast, script fonts, source sweeps. |
| [`navgraph.mjs`](navgraph.mjs) | 12 | Which screen leads to which screen — derived from the registry. |
| [`stategraph.mjs`](stategraph.mjs) | 12 | Within a screen, which states exist and what moves between them. |
| [`stateprobe.mjs`](stateprobe.mjs) | 12 | Does each state's hook actually **paint**? |
| [`annotate.mjs`](annotate.mjs) | 12 | Per edge: nav kind, motion, API call, guard — each with a resolved citation. |
| [`cdp.mjs`](cdp.mjs) | — | Headless Chrome driver. Not a validator. |
| [`config.mjs`](config.mjs) | — | Root resolution, defaults merge, absolute paths, shared arg parsing. Not a validator. |
| [`config.schema.json`](config.schema.json) | — | JSON Schema for `toolkit.config.json`, for editor completion. |

## Inputs

| Source | What comes from it |
|---|---|
| [`toolkit.config.json`](../toolkit.config.json) | viewport · paths · ports · Chrome path · tap-target floor · colour allowlist and ban list · palette exemptions · benign console entries · locales · scripts · the prototype harness contract |
| [`artifacts/prototype/`](../artifacts/) | the bytes being driven or swept |
| [`reference/screen-registry.csv`](../reference/) | the navigation model's single source |
| [`reference/state-machines.json`](../reference/) | per-screen transitions with `file:line` evidence, and the hook per state |
| [`reference/edge-annotations.json`](../reference/) | the six annotation fields per edge and frame |
| [`reference/audit-plan.json`](../reference/) | what STATE 08 drives, and the pass matrix. Optional — falls back to the state machines' hooks |
| `artifacts/navgraph.json` | `annotate.mjs` reads the derived edge set |

## Outputs

| Tool | JSON | Markdown | Other |
|---|---|---|---|
| `smoke.mjs` | — | — | stdout PASS/FAIL per view |
| `audit.mjs` | `artifacts/audit-data.json` | — | `artifacts/shots/*.png` |
| `navgraph.mjs` | `artifacts/navgraph.json` | `artifacts/navmap-report.md` | — |
| `stategraph.mjs` | `artifacts/stategraph.json` | `artifacts/statemap-report.md` | — |
| `stateprobe.mjs` | `artifacts/stateprobe.json` | — | optional screenshots |
| `annotate.mjs` | `artifacts/annotations.json` | `artifacts/annotate-report.md` | — |

**Exit codes, universally:** `0` no findings at or above `--fail-on` · `1` findings · `2` tool error.

The `1` / `2` distinction is load-bearing. A `2` means the check **did not run**, which is unevaluable, not passing.

## Examples

```bash
# STATE 07 — before handing anything to the audit
node tools/smoke.mjs "signin:main,error,reset" "home:dash,stack"

# STATE 08 — then READ artifacts/shots/
node tools/audit.mjs --shots artifacts/shots

# STATE 12 — order matters: annotate reads navgraph.json
node tools/navgraph.mjs   --fail-on major
node tools/stategraph.mjs --fail-on major
node tools/stateprobe.mjs
node tools/annotate.mjs   --fail-on major
```

**Running against a different project root:**

```bash
node tools/navgraph.mjs --root ../other-product --fail-on major
TOOLKIT_ROOT=../other-product node tools/audit.mjs
```

**As a gate check:**

```bash
set -e
node tools/navgraph.mjs   --fail-on major --quiet
node tools/stategraph.mjs --fail-on major --quiet
node tools/stateprobe.mjs --quiet
node tools/annotate.mjs   --fail-on major --quiet
echo "READY FOR DEVELOPMENT — scoped to: <the flows named in scope>"
```

**Typical output:**

```
navgraph: 48 screens · 106 edges · 46 cross-feature · findings 0 blocking / 2 major / 7 advisory
  → artifacts/navgraph.json
  → artifacts/navmap-report.md
  MAJOR N9-deeplink SET: set.html exposes no query hook at all
```

## Best practices

- **A failing probe is a hypothesis, not a finding.** Confirm at source before writing anything into a report. One audit's first run reported 60 failures with 3 real; one state probe reported 37 and **all 37 were the harness**. The catalogue of known false positives is in [VALIDATION_ENGINE.md § 10](../VALIDATION_ENGINE.md#10--the-false-positive-catalogue).
- **Correct the instrument; never waive an unconfirmed failure.** Record the correction, because an uncorrected harness re-reports the same noise next run.
- **Read the screenshots.** `audit.mjs` prints the reminder for a reason: four of one flow's six real defects were screenshot-only finds.
- **Keep `minVisibleNodes` low.** An empty state is sparse by design. A threshold tuned to a busy screen reports correct empty states as failures and blinds the check that catches genuinely blank ones.
- **Filter benign console entries by name**, never wholesale. `audit.benignConsole` exists so a missing favicon does not read as a product defect and a real 404 still does.
- **New product-specific value?** It goes in `toolkit.config.json` and comes through `config.mjs`. A hardcoded value in a tool is how a toolkit fossilises around its first product.
- **Keep dependencies at zero.** A verification layer that rots because of a transitive dependency is not a verification layer.
- **A new validator must**: take `--root`, read its config through `config.mjs`, use the shared `SEVERITIES` ladder, distinguish exit `1` from exit `2`, and write both a JSON and a human-readable output.

## Related

- [`VALIDATION_ENGINE.md`](../VALIDATION_ENGINE.md) — every tool in detail: checks, output, failure classes, fixes
- [`WORKFLOW_GUIDE.md`](../WORKFLOW_GUIDE.md) — which state runs which tool, and what its exit criteria are
- [`docs/method-rules.md`](../docs/method-rules.md) — the M, W and E rules these tools enforce
- [`toolkit.config.json`](../toolkit.config.json) — everything the tools read
