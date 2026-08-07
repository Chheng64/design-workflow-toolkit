<!-- TEMPLATE — research
     Written by STATE 02 · full contract: skills/02-research/SKILL.md
     Copy into artifacts/ (per-feature name) and fill in. Angle brackets are
     placeholders; every heading below is load-bearing for a downstream check. -->

---
artifact: research
version: <hash-or-incrementing-id>
produced_by: research
reads_version: <requirements.md version consumed>
coverage: <mapped-or-waived % of goals>
---

## Themes
- T1: <theme statement>
  - sources: [S1, S3]
  - relevance: <which acceptance criteria / goals this informs>
  - maps_to: [G1, G2]        # goal IDs from requirements.md
- T2: ...

## Evidence & citations
- S1 [resolvable]: <claim/finding> — <source: url or reference>
- S2 [resolvable]: <claim/finding> — <source>

## Competitor notes
- <competitor>: <observation> (sources: [S2])

## Pattern catalog
- P1: <interaction/design pattern> — <where observed> (sources: [S4])

## Constraints
- <technical / domain / regulatory constraint> (sources: [S5])

## Contradictions
- C1: <finding A> vs <finding B> — <both sources cited, left unresolved>

## Goal coverage
- G1 → [T1] | G2 → [T2] | G3 → no-research-needed

## Gaps
- GAP1: <unresolved evidence gap or downgraded theme> [reason]
