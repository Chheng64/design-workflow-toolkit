# `state/` — the machine's own record

[← Repository root](../README.md) · [Architecture § 3](../ARCHITECTURE.md#3--the-orchestrator) · [Contracts spec](../docs/artifact-contracts.md)

---

## Purpose

One file: `machine_state.yaml`.

**It is not an artifact.** Artifacts are produced by states and consumed by later states; this is the machine's record of itself — where it is, what has been approved, how many loop iterations have been spent, and what has been frozen.

Completion rule 1 is defined over this file. So is the live-reload behaviour of the review server.

## Inputs

Seeded from [`templates/machine_state.yaml`](../templates/machine_state.yaml):

```bash
cp templates/machine_state.yaml state/machine_state.yaml
```

Written by the **orchestrator** — a person, an agent, or (roadmap phase 2) a CLI. **No skill writes it.** Skills do one state's work and stop; deciding what happens next is not their job.

Path is configured in [`toolkit.config.json`](../toolkit.config.json) → `paths.state`.

## Outputs

Read by:

| Reader | What it needs |
|---|---|
| The orchestrator | `current_state`, `entry_count`, `loop_count`, `approvals`, `handoff_required` — to evaluate guards and fire transitions |
| Every skill | its own entry conditions, and whether an upstream gate is granted |
| [`templates/prototype/serve.py`](../templates/prototype/serve.py) | the top-level `current_state` — live reload is active **only** while it is `USER_REVIEW` |
| STATE 11 | `freeze`, `flows`, `completion_check` — the six completion rules are checked and closed here |

## What it holds

```yaml
machine_state:
  project: <slug>
  current_state: <STATE_NAME>
  scope: <the feature this run is about>
  gate: pending                 # pending | granted | denied
  handoff_required: false       # true → STATE 12 runs before FINAL_OUTPUT
  blocked_reason: null
  last_transition: { from, to, trigger, ts }
  entry_count: {}               # per-state visit counter → C_RETRY_OK
  loop_count:                   # per-loop counter → C_LOOP_OK
    L_CLARIFY: 0
    L_RESEARCH: 0
    L_UX_EDGE: 0
    L_REVISION: 0
    L_AUDIT_FIX: 0
  approvals:                    # per-gate; resumable
    ClarificationGate: pending
    DirectionApprovalGate: pending
    PrimaryUserApprovalGate: pending
    ConflictMiniGate: pending
    DeveloperHandoffGate: pending
  artifact_versions: {}
  flows: []                     # one row per feature; `deliverable` names the freeze folder
  freeze: {}                    # sha256 per frozen file
  completion_check:             # a boolean AND a one-line reason, each
    C1_state_is_done: false
    C2_approval_scoped_to_final_frozen_versions: false
    C3_all_criteria_met: false
    C4_audit_pass_on_final_version: false
    C5_deliverables_complete: false
    C6_no_open_revision_items: false
```

## Examples

**Recording a transition** — written in the same edit as the thing it records:

```yaml
  current_state: SELF_AUDIT
  last_transition:
    from: PROTOTYPE
    to: SELF_AUDIT
    trigger: "validation pass — traceability complete, smoke 8/8"
    ts: "2026-08-07"
  entry_count: { PROTOTYPE: 2, SELF_AUDIT: 1 }
```

**Granting a gate:**

```yaml
  approvals:
    DirectionApprovalGate: granted     # user, 2026-08-07, scoped to pr-checkout-01
```

**Counting a loop, out loud:**

```yaml
  loop_count:
    L_REVISION: 2      # of 3 — one more before HALT_BLOCKED
    L_AUDIT_FIX: 1
```

**Closing the machine** — in the same edit as the freeze:

```yaml
  current_state: DONE
  freeze:
    "deliverable-checkout/prototype/checkout.html": "a3f1…"
  completion_check:
    C1_state_is_done: true                            # written this edit
    C2_approval_scoped_to_final_frozen_versions: true # review-checkout-02 reads_versions = proto-checkout-05 = frozen sha
    C3_all_criteria_met: true                         # traceability: 22 met / 1 waived / 0 unmet
    C4_audit_pass_on_final_version: true              # audit-checkout-04 ran on proto-checkout-05
    C5_deliverables_complete: true                    # deliverable-checkout/ + handoff present
    C6_no_open_revision_items: true                   # rev-checkout-03, 0 open
```

## Best practices

- **Write it at decision time, in the same edit as the thing it records.** A record written later is a reconstruction. On the extraction run this file sat **two days and two approval rounds stale** — still reading `current_state: USER_REVIEW`, gate `pending` — while seven flows had been approved and the machine was reporting itself as shipping. Nothing detected it, because nothing was reading the file the completion rule is defined over.
- **Count the loop every cycle.** A ceiling nobody counts is not a ceiling. One flow was recorded at `L_REVISION = 2` and then delivered three more rounds — five against a ceiling of three.
- **A gate reverts to `pending` when approved artifacts change.** That reversion is a consequence of a revision's dispatch; record it in the revision log's dependency order and here.
- **Every completion rule gets a boolean *and* a one-line reason.** `C3: true` with no reason is silence, and silence is what the waiver rules forbid.
- **`designed` and `delivered` are different claims.** A flow's row names the deliverable folder its freeze landed in, or it was not delivered.
- **Do not let a parked flow's nested fields be mistaken for the machine's own.** `serve.py` reads the **first** two-space-indented `current_state`, which is `machine_state`'s own field; parked flows nest deeper. Keep that indentation.
- **Ceilings live in the config, counters live here.** `toolkit.config.json` → `loops` sets the limits; this file records the spend.
- **Commit it.** It is the record the completion rules are defined over.

## Related

- [`ARCHITECTURE.md § 3`](../ARCHITECTURE.md#3--the-orchestrator) — what the orchestrator does with this file
- [`WORKFLOW_GUIDE.md`](../WORKFLOW_GUIDE.md) — the entry conditions and ceilings per state
- [`templates/machine_state.yaml`](../templates/machine_state.yaml) — the annotated template
- [`docs/workflow.md`](../docs/workflow.md) §6 retry, §7 loops, §8 completion rules
