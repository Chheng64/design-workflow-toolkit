---
artifact: flow-visualization
version: navmap-signin-01
produced_by: flow-visualization
reads_versions:
  screen-registry.csv: "3 rows · S-SIGN-01, S-SIGN-02, S-SIGN-03"
  flows-signin.md: flow-signin-01
  prototype: proto-signin-03
  state-machines.json: "3 machines · 11 states · 17 transitions"
  edge-annotations.json: "4 edges · 3 frames"
scope: "signin only — S-SIGN-01, S-SIGN-02, S-SIGN-03. This map covers one flow and makes no claim about any other."
figma: { file: null, pages: [] }
gate: { developer_handoff: granted, date: "2026-08-07", granted_by: user }
---

# Navigation Map — signin

**Status: READY FOR DEVELOPMENT**, scoped to the flows named in `scope` — never a bare "handoff ready".

## What was produced, and what was not

The **derivations** are the product of this state: `navgraph.json`, `stategraph.json`, `stateprobe.json` and `annotations.json`, each with a report and an exit code. **No Figma layer was generated.** That is recorded as a scope statement, not omitted: a design file is a *rendering* of `navgraph.json`, and in a Design file a connector is a vector that does not reflow — a stale arrow is indistinguishable from a fresh one. The derivations are what a build team can re-check; the picture is what would go stale.

## Sections built

| Section | Journey | Screens | Edges | Figma node |
|---|---|---|---|---|
| `FLOW-001 • Sign In and Password Reset` | credential entry → recovery → reset request → acknowledgement | 3 | 4 | — (no design file this run) |

One Section, because there is one journey. A Section named after a *feature* becomes a bucket, and a bucket answers no question.

## Findings at gate

| Severity | Code | Subject | Status |
|---|---|---|---|
| — | — | — | **none outstanding** |

Four validators, four clean exits. The gate passed on **this report and these exit codes**, not on a picture.

```
navgraph    3 screens · 4 edges · 0 cross-feature
            0 blocking / 0 major / 0 advisory              exit 0
stategraph  3 machines · 11 states · 17 transitions · 11 hooked
            0 blocking / 0 major / 0 advisory              exit 0
stateprobe  11 urls · 11 painted · 0 failed · 0 id-drift   exit 0
annotate    4 edges · 3 frames · 0 network call sites
            0 blocking / 0 major / 0 advisory              exit 0
```

### Findings that were raised and closed during this state

Recorded because a report showing only the final state hides the work.

| Code | What it caught | Resolution |
|---|---|---|
| `S7-dead-end` (advisory) | `locked{rate-limited}` had no outbound transition and was not marked terminal. | **Correct finding.** The way out of that state leaves the screen — the reset route goes to `S-SIGN-02`, which is `navgraph`'s edge to draw, not this machine's. Marked `terminal: true` with the reason written down. Flagged rather than left to re-report every run: a suppressed advisory teaches a reader to skim. |
| `E11-api-claim` (**blocking**) | 4 edges claimed `none (simulated)` while the sweep found a network call site at `signin.html:262`. | **Confirmed at source: the "call site" was the comment claiming there were no network calls.** The sweep is deliberately broad and matched `XMLHttpRequest` in prose. Fixed in the prototype — the disclaimer no longer names the APIs it disclaims. **A rule fell out of it: do not write the name of the thing you are claiming not to use, inside the file being swept for it.** |

The `E11` fix moved bytes after the Primary gate, which reverted it to `pending`, which is the stale-approval rule doing its job. The delta was classified **bug-fix-only** with byte-level evidence and ratified by a scope confirm. See `review-signin-01`.

## Boundary status (W8)

| Port | Owning flow | Status | Checked on |
|---|---|---|---|
| `⟂HOME-01` | the authenticated area — not in this run's scope | **mocked** — the absence of a destination | 2026-08-07 |

**A boundary is a dated claim.** `⟂HOME-01` is correct as a mock today and becomes silently wrong the moment the authenticated area ships. Re-derive this table whenever any other feature reaches `FINAL_OUTPUT`. A status with no date is not a status.

## Sync record (W7)

| Date | Trigger | Edge-set delta | Actions taken |
|---|---|---|---|
| 2026-08-07 | first derivation | 4 edges, from 0 | Derived from the registry, reconciled against `flow-signin-01`, annotated, probed. |
| 2026-08-07 | `proto-signin-02` → `proto-signin-03` | **0** — no edge changed | Re-ran all four validators. The prototype delta was a comment; the navigation model was unaffected, and *the derivation proving that* is the sync record. |

*"We updated the file"* is not a sync record. A diff of the edge set is.

## Extensions

| Ext | Status | Evidence |
|---|---|---|
| **E1** swimlanes | **3 / 3 screens laned** — all `customer`; `admin`, `system`, `api` declared and empty | `reference/nav-lanes.json`. The **honest degenerate case** for a single-actor product: three empty lanes say *checked, nothing here*; a missing file says nothing at all. `navgraph` reports `N8` for any unlaned screen and never guesses a lane. |
| **E2** cross-feature map | **0 cross-feature edges** | `navgraph.json.crossFlow`. Every edge is intra-flow because this run is one flow. Expect ~half the edge set to cross a boundary once a second flow exists — that is the half no single flow document owns. |
| **E3** heatmap | derived, **measured not assigned** | `navgraph.json.heat`. `S-SIGN-01` is the hub: **in-degree 2** from 1 source flow. On a one-flow product a heatmap is nearly trivial; it earns its place at the scale where hubs are not obvious by eye. |
| **E4** deep links | **1 / 1 flows addressable · 11 / 11 states** | Hooks read **out of the implementation**, not out of a doc claiming them. `?view` and `?state` both confirmed read by the page. `stateprobe` then drove all 11 and asserted each paints — because proving a hook is *read* is not proving the state is *shown*. |
| **E5** state machines | **3 / 3 screens · 11 states · 17 transitions · 0 findings** | Node set derived from the registry; edge set authored with `file:line` evidence, every citation resolved against the frozen bytes. **0 states declared-but-unbuilt**, 1 terminal, 0 entry-only. |
| **E6** annotations | **4 / 4 edges · 3 / 3 frames · 0 blank · 0 UNKNOWN** | `nav` and `guard` authored with evidence; `anim` and `api` derived and re-swept every run. Every `api` value reads `none (simulated)` — **and that column is only worth reading because the tool re-greps for request APIs itself and fails if the claim and the sweep disagree. It did exactly that.** |
| **E7** overview page | **not built** | No design file this run. The counts, coverage, heatmap, QA paths, findings and legend all exist in the reports above; the **provenance block** is this document's frontmatter. |

## What a first derivation found here, and why that is not the general case

`navgraph` opened at **0 blocking / 0 major / 0 advisory**. That is unusual and worth stating plainly rather than presenting as typical: this registry is **3 rows, authored in one sitting directly from a ratified flow graph, never hand-edited**. The extraction run's first derivation opened at **2 blocking · 8 major · 52 advisory across 48 screens**, and every finding was a real registry defect.

Finding count scales with registry size and with how many hands have edited it. **A clean first derivation on 3 rows is evidence about the registry's age, not about the tool's usefulness.** The layer that found real problems here was `stategraph`/`annotate` — the two that check authored claims against the frozen bytes.

## Developer Handoff Gate

| Requirement | Held by |
|---|---|
| navigation visualization complete (V1, V2, V6, V7) | every registry entry in the Section; every derived path annotated; entry screen marked; `FLOW-001 • Sign In and Password Reset` |
| screen contract synchronized (V13) | `navgraph.json` re-derives identically from the current registry — verified by re-running after the prototype delta |
| connectors validated (V4, V8) | derived, not drawn; direction matches the derived edge direction by construction |
| Sections organized (V3, V5) | 0 orphans; every branch terminates or is a declared boundary |
| no broken navigation | all four validators **exit 0** at `--fail-on major` |
| flow diagrams up to date (W7) | sync record above, dated, with the edge-set delta |

**Granted** by the user, 2026-08-07, on the report and the exit codes.

**Versions the gate saw:** registry `reference/screen-registry.csv` (3 rows) · derivation `navgraph.json`, this run · prototype `proto-signin-03`. A gate that cannot name its bytes is the defect one real gate record shipped — it dropped `reads_versions` entirely, which is the exact field delivery is checked against.

## Exit

Developer Handoff Gate `granted` → **`FINAL_OUTPUT`**.
