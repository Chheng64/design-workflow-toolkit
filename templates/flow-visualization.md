<!-- TEMPLATE — flow-visualization
     Written by STATE 12 · full contract: skills/12-flow-visualization/SKILL.md
     Copy into artifacts/ (per-feature name) and fill in. Angle brackets are
     placeholders; every heading below is load-bearing for a downstream check. -->

---
artifact: flow-visualization
version: navmap-<scope>-NN
produced_by: flow-visualization
reads_versions: { screen-registry.csv: <sha>, flows-<feature>.md: <version>, prototype: proto-<feature>-NN }
scope: <the flows this map covers — stated as scope, per skills/05>
figma: { file: <key>, pages: [<name · node-id>] }
gate: { developer_handoff: granted|pending|waived, date: <date> }
---

# Navigation Map — <scope>

## Sections built
| Section | Journey | Screens | Edges | Figma node |

## Findings at gate
| Severity | Code | Subject | Status (cleared / waived + rider debt) |

## Boundary status (W8)
| Port | Owning flow | Status | Checked on |

## Sync record (W7)
| Date | Trigger | Edge-set delta | Actions taken |

## Extensions
| Ext | Status | Evidence |
| E1 swimlanes | <n>/<n> screens laned | reference/nav-lanes.json |
| E3 heatmap | derived | navgraph.json.heat |
| E4 deep links | <n>/<n> flows addressable | navgraph.json.deepLinks |
