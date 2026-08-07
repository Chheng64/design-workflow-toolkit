<!-- TEMPLATE — audit-report
     Written by STATE 08 · full contract: skills/08-self-audit/SKILL.md
     Copy into artifacts/ (per-feature name) and fill in. Angle brackets are
     placeholders; every heading below is load-bearing for a downstream check. -->

---
artifact: audit-report
version: <audit-<feature>-NN>
produced_by: self-audit
reads_versions:
  prototype: <proto-<feature>-NN — the exact bytes audited>
  requirements.md: <version>
  flows.md: <version>
  ui-plan.md: <version>
  traceability.md: <version>
feature: <feature/flow id>
verdict: pass | fail
---

# <audit id> — <feature> — verdict: <PASS | FAIL>

## Verdict

<pass|fail> — <N> / <N> acceptance criteria met. <rationale>

## Method

<what was actually run: screens driven, runs, assertion count, screenshots
captured, sweeps executed. Name the check class per M1 — computed visibility
and geometry, not DOM presence.>

## Findings

| ID | Sev | Finding | Caught by | Status |
|---|---|---|---|---|
| AF-1 | blocker | <defect> | screenshot \| assertion \| sweep | fixed in-loop |
| AF-2 | major | <defect> | <method> | open |
| AF-3 | minor | <defect> | <method> | recorded → debt #N |

## Conformance matrix

| AC | Requirement | Met | Evidence |
|---|---|---|---|
| AC1 | <text> | met | <screen + probe or screenshot ref> |
| AC7 | <text> | unmet | <what is missing> |
| AC9 | <text> | waived | <who waived, why, recorded where> |

## Harness corrections

<per M3 — probes that failed and turned out to be the instrument's fault, with
the correction made. Recorded, because an uncorrected harness re-reports them
next run.>

## Known limitations

<carried to USER_REVIEW for transparent presentation>
