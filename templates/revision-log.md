<!-- TEMPLATE — revision-log
     Written by STATE 10 · full contract: skills/10-revision/SKILL.md
     Copy into artifacts/ (per-feature name) and fill in. Angle brackets are
     placeholders; every heading below is load-bearing for a downstream check. -->

---
artifact: revision-log
version: rev-<feature>-NN
produced_by: revision
reads_versions:
  review-record.md: review-<feature>-NN
  audit-report.md: audit-<feature>-NN
iteration: <n>
loop: L_REVISION (<n>/3)          # L_AUDIT_FIX (<n>/3) if this is an audit-fix cycle
feature: <feature/flow id>
---

# Iteration <n> — <source: audit verdict `fail` | user `request-changes`>, <date>

## Change set

| # | Change item | Raised by | Class + sweep | Root cause | Target state | Status |
|---|---|---|---|---|---|---|
| CR1 | *"<verbatim ask or finding>"* | user-review \| self-audit | <class — N instances found across M files, or "single instance"> | <where the fault was introduced> | `UI_PLANNING` → `PROTOTYPE` | resolved \| deferred \| superseded |

_Every item carries a target state and a status (V1). Nothing exits `open` (V2)._

## Conflicts — Conflict Mini-Gate

| # | Conflict | Side A | Side B | Ships as | Gate outcome |
|---|---|---|---|---|---|
| o-x1 | <the contradiction, both sides stated> | <new ask> | <ratified decision + its id> | <the reversible reading> | pending user ruling \| ruled <date> |

_No conflict is resolved inside the prototype (R8, V6)._

## Dependency order (upstream → downstream)

1. `<STATE>` → <artifact vNN> (<items>)
2. `PROTOTYPE` → proto-<feature>-NN (<items>)
3. `SELF_AUDIT` → audit-<feature>-NN
4. `USER_REVIEW` → gate reverts to `pending` (stale-approval rule §5)

## Superseded by this revision

| Component / rule / string | Superseded by | Removed from |
|---|---|---|

## Constraints recorded

<discovered scope limits — untouchable assets, decisions that must not move.>

## Deliberately not changed

| Item | Why not |
|---|---|

_Recorded so silence is not mistaken for oversight (V2)._

## Impact analysis

| Artifact | Effect |
|---|---|
| requirements.md | unchanged |
| ui-plan.md | **ui-<feature>-NN** (supersedes -NN) |
| prototype | **proto-<feature>-NN** |
| audit-report.md | **audit-<feature>-NN** |

## Re-validation

| Check | Result |
|---|---|
| Re-audit on the rebuilt bytes | `audit-<feature>-NN` PASS N / N — or **WAIVED**, rider: debt #<n> |
| Rendering-class assertions | N / N |
| Class sweeps from R2 | <class: N instances, all fixed> |

## Validation self-check

- **V1** ✅ / ❌ — every item has a target state and a status.
- **V2** ✅ / ❌ — no item left `open`.
- **V3** ✅ / ❌ — iteration incremented; `L_REVISION <n>/3`, `L_AUDIT_FIX <n>/3`.
- **V4** ✅ / ❌ — every item names its class and sweep result.
- **V5** ✅ / ❌ — superseded components removed; carried items re-verified against current bytes.
- **V6** ✅ / ❌ — conflicts recorded with both sides; none resolved in the bytes.
- **V7** ✅ / ❌ — return edge passes through `SELF_AUDIT`, or a waiver names its rider.

**Exit:** dispatch to <states> → `SELF_AUDIT` → `USER_REVIEW`.
