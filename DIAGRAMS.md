# Diagrams

Every diagram in the toolkit, in one place. Each is also embedded where it is used; this page is the gallery and the copy source.

[← README](README.md) · [Architecture →](ARCHITECTURE.md) · [Workflow Guide →](WORKFLOW_GUIDE.md)

---

## Contents

1. [Workflow](#1--workflow)
2. [Architecture](#2--architecture)
3. [Artifact flow](#3--artifact-flow)
4. [State machine](#4--state-machine)
5. [Validation pipeline](#5--validation-pipeline)
6. [Approval gates](#6--approval-gates)
7. [Repository structure](#7--repository-structure)
8. [Developer handoff flow](#8--developer-handoff-flow)
9. [Dependency graph](#9--dependency-graph)
10. [Revision loop](#10--revision-loop)
11. [Freeze sequence](#11--freeze-sequence)

All diagrams are Mermaid, rendered natively by GitHub. To reuse one, copy the fenced block.

---

## 1 · Workflow

The twelve states in machine order. Also in [README § Workflow overview](README.md#workflow-overview).

```mermaid
flowchart TD
    S01["01 · REQUIREMENT_ANALYSIS<br/><i>brief → requirements</i>"]
    S02["02 · RESEARCH<br/><i>evidence with citations</i>"]
    S03["03 · PRODUCT_REVIEW<br/><i>proceed / re-scope / stop</i>"]
    S04["04 · UX_PLANNING<br/><i>tasks, IA, edge cases</i>"]
    S05["05 · FLOW_GENERATION<br/><i>directed flow graphs</i>"]
    S06["06 · UI_PLANNING<br/><i>components, tokens, layout</i>"]
    S07["07 · PROTOTYPE<br/><i>bytes + traceability</i>"]
    S08["08 · SELF_AUDIT<br/><i>machine gates itself</i>"]
    S09["09 · USER_REVIEW<br/><i>human verdict</i>"]
    S12["12 · FLOW_VISUALIZATION<br/><i>navigation map</i>"]
    S11["11 · FINAL_OUTPUT<br/><i>freeze + handoff</i>"]
    S10["10 · REVISION<br/><i>route by root cause</i>"]
    DONE(["DONE"])

    S01 --> S02 --> S03
    S03 -->|"Direction Gate"| S04
    S04 --> S05 --> S06 --> S07 --> S08
    S08 -->|"pass"| S09
    S08 -->|"fail"| S10
    S09 -->|"approve + handoff required"| S12
    S09 -->|"approve, no handoff"| S11
    S09 -->|"request-changes"| S10
    S12 -->|"Developer Handoff Gate"| S11
    S11 --> DONE
    S10 -.->|"dispatch to root cause"| S04
    S10 -.-> S06
    S10 -.-> S07
    S10 -->|"rebuild complete"| S08

    style S03 fill:#fff3cd,stroke:#856404
    style S09 fill:#fff3cd,stroke:#856404
    style S12 fill:#fff3cd,stroke:#856404
    style S10 fill:#e2e3e5,stroke:#383d41
    style DONE fill:#d4edda,stroke:#155724
```

**Reads as:** yellow states carry a blocking human gate. The grey state is a loop, not a step. `12` runs only when `handoff_required` is true.

---

## 2 · Architecture

Six layers, each with one job. Also in [ARCHITECTURE.md § 1](ARCHITECTURE.md#1--high-level-architecture).

```mermaid
flowchart TD
    subgraph L0["Input"]
        BRIEF["Product brief"]
        CFG["toolkit.config.json"]
        REF["reference/"]
    end
    subgraph L1["Control"]
        ORCH["Orchestrator"]
        MS[("state/machine_state.yaml")]
    end
    subgraph L2["Execution"]
        SK["skills/ · 12 states"]
    end
    subgraph L3["Data"]
        STORE[("artifacts/")]
    end
    subgraph L4["Verification"]
        TOOLS["tools/ · 7 validators"]
    end
    subgraph L5["Decision"]
        GATE{{"Approval gates"}}
    end
    subgraph L6["Output"]
        DELIV["deliverable-&lt;feature&gt;/"]
    end

    BRIEF --> ORCH
    CFG -.-> ORCH
    CFG -.-> SK
    CFG -.-> TOOLS
    ORCH <--> MS
    ORCH --> SK
    SK <--> STORE
    REF --> SK
    REF --> TOOLS
    STORE --> TOOLS
    TOOLS --> SK
    SK --> ORCH
    ORCH --> GATE
    GATE -->|"granted"| DELIV
    GATE -.->|"denied"| ORCH
    STORE --> DELIV

    style ORCH fill:#cfe2ff,stroke:#084298
    style TOOLS fill:#d4edda,stroke:#155724
    style GATE fill:#fff3cd,stroke:#856404
    style DELIV fill:#e7d6f5,stroke:#5a2a82
```

**Reads as:** skills never talk to each other — every edge between them passes through the artifact store. The orchestrator is the only thing holding machine state.

---

## 3 · Artifact flow

The pipeline as data. Also in [ARTIFACT_FLOW.md § 1](ARTIFACT_FLOW.md#1--the-pipeline-in-one-picture).

```mermaid
flowchart TD
    BRIEF["Brief"]
    REQ["requirements-&lt;f&gt;.md"]
    RES["research-&lt;f&gt;.md"]
    PR["product-review-&lt;f&gt;.md"]
    UX["ux-plan-&lt;f&gt;.md"]
    FL["flows-&lt;f&gt;.md"]
    UI["ui-plan-&lt;f&gt;.md"]
    PROTO["prototype/"]
    TR["traceability-&lt;f&gt;.md"]
    AUD["audit-report-&lt;f&gt;.md"]
    REVIEW["review-record-&lt;f&gt;.md"]
    RVL["revision-log-&lt;f&gt;.md"]
    NAV["navgraph.json + navmap-report.md"]
    DEL["deliverable-&lt;f&gt;/"]

    BRIEF --> REQ --> RES --> PR --> UX --> FL --> UI --> PROTO
    PROTO --> TR --> AUD
    PROTO --> AUD --> REVIEW
    AUD -.->|"fail"| RVL
    REVIEW -.->|"request-changes"| RVL
    RVL -.->|"dispatch"| UX
    RVL -.-> UI
    RVL -.-> PROTO
    REVIEW --> NAV --> DEL
    REVIEW --> DEL
    TR --> DEL
    AUD --> DEL
    RVL --> DEL
    PROTO --> DEL

    style PROTO fill:#cfe2ff,stroke:#084298
    style AUD fill:#d4edda,stroke:#155724
    style REVIEW fill:#fff3cd,stroke:#856404
    style DEL fill:#e7d6f5,stroke:#5a2a82
```

**Reads as:** solid edges are the forward pipeline; dashed edges are the only way work travels backwards.

---

## 4 · State machine

Every transition, including self-loops and terminals. Also in [ARCHITECTURE.md § 2.1](ARCHITECTURE.md#21-full-transition-graph).

```mermaid
stateDiagram-v2
    direction TB
    [*] --> REQUIREMENT_ANALYSIS

    REQUIREMENT_ANALYSIS --> RESEARCH: validation pass · no blocking ambiguity
    REQUIREMENT_ANALYSIS --> REQUIREMENT_ANALYSIS: clarification answered · L_CLARIFY ≤ 3
    REQUIREMENT_ANALYSIS --> HALT_BLOCKED: blocking ambiguity · user unavailable

    RESEARCH --> PRODUCT_REVIEW: validation pass · coverage met
    RESEARCH --> RESEARCH: coverage gap · L_RESEARCH ≤ 2
    RESEARCH --> REQUIREMENT_ANALYSIS: requirement malformed

    PRODUCT_REVIEW --> UX_PLANNING: proceed + Direction Gate granted
    PRODUCT_REVIEW --> REQUIREMENT_ANALYSIS: re-scope · or gate denied
    PRODUCT_REVIEW --> HALT_STOPPED: stop · gate confirms

    UX_PLANNING --> FLOW_GENERATION: validation pass
    UX_PLANNING --> UX_PLANNING: edge-case gap · L_UX_EDGE ≤ 2
    UX_PLANNING --> PRODUCT_REVIEW: priorities unviable

    FLOW_GENERATION --> UI_PLANNING: validation pass
    FLOW_GENERATION --> FLOW_GENERATION: dead-end / reachability fix
    FLOW_GENERATION --> UX_PLANNING: missing state discovered

    UI_PLANNING --> PROTOTYPE: validation pass
    UI_PLANNING --> UI_PLANNING: reuse / mapping fix
    UI_PLANNING --> FLOW_GENERATION: flow gap discovered

    PROTOTYPE --> SELF_AUDIT: validation pass
    PROTOTYPE --> PROTOTYPE: assembly fix
    PROTOTYPE --> UI_PLANNING: spec insufficient

    SELF_AUDIT --> USER_REVIEW: verdict pass
    SELF_AUDIT --> REVISION: verdict fail
    SELF_AUDIT --> SELF_AUDIT: re-audit after minor fix · L_AUDIT_FIX ≤ 3

    USER_REVIEW --> FLOW_VISUALIZATION: approve + C_HANDOFF_REQUIRED
    USER_REVIEW --> FINAL_OUTPUT: approve + not C_HANDOFF_REQUIRED
    USER_REVIEW --> REVISION: request-changes
    USER_REVIEW --> REQUIREMENT_ANALYSIS: reject
    USER_REVIEW --> HALT_BLOCKED: user unavailable

    REVISION --> SELF_AUDIT: rebuild complete
    REVISION --> HALT_BLOCKED: L_REVISION ceiling exceeded

    FLOW_VISUALIZATION --> FINAL_OUTPUT: Developer Handoff Gate granted
    FLOW_VISUALIZATION --> FLOW_GENERATION: unratified registry route
    FLOW_VISUALIZATION --> REVISION: registry ↔ prototype route conflict
    FLOW_VISUALIZATION --> FLOW_VISUALIZATION: sync / connector regeneration

    FINAL_OUTPUT --> DONE: validation pass
    FINAL_OUTPUT --> REVISION: completeness regression

    DONE --> [*]
    HALT_STOPPED --> [*]
    HALT_BLOCKED --> REQUIREMENT_ANALYSIS: resumed
```

**Reads as:** three terminals. `DONE` and `HALT_STOPPED` end the machine; `HALT_BLOCKED` is fully persisted and resumes at the exact state. `REVISION` additionally dispatches to any upstream state by root cause — those edges are in [diagram 10](#10--revision-loop).

---

## 5 · Validation pipeline

What each tool reads, and what it produces. Also in [ARCHITECTURE.md § 7](ARCHITECTURE.md#7--the-validation-engine).

```mermaid
flowchart TD
    CFG["toolkit.config.json"] --> CONF["config.mjs<br/><i>root · defaults · absolute paths</i>"]
    CONF --> SMOKE["smoke.mjs · 07"]
    CONF --> AUDIT["audit.mjs · 08"]
    CONF --> NAV["navgraph.mjs · 12"]
    CONF --> STG["stategraph.mjs · 12"]
    CONF --> STP["stateprobe.mjs · 12"]
    CONF --> ANN["annotate.mjs · 12"]
    CDP["cdp.mjs<br/><i>headless Chrome</i>"] --> SMOKE
    CDP --> AUDIT
    CDP --> STP

    PROTO[("artifacts/prototype/")] --> SMOKE
    PROTO --> AUDIT
    PROTO --> STP
    PROTO --> STG
    PROTO --> ANN
    REG[("reference/screen-registry.csv")] --> NAV
    REG --> STG
    SM[("reference/state-machines.json")] --> STG
    SM --> STP
    SM -.->|"fallback plan"| AUDIT
    EA[("reference/edge-annotations.json")] --> ANN
    NAV -->|"navgraph.json"| ANN

    SMOKE --> EXIT{{"0 clean · 1 findings · 2 tool error"}}
    AUDIT --> EXIT
    NAV --> EXIT
    STG --> EXIT
    STP --> EXIT
    ANN --> EXIT

    style CONF fill:#cfe2ff,stroke:#084298
    style EXIT fill:#d4edda,stroke:#155724
```

**Reads as:** no tool contains a product-specific value; everything arrives through `config.mjs`. `annotate` depends on `navgraph`, so run order matters in STATE 12.

### The instrument discipline

```mermaid
flowchart LR
    A["A probe fails"] --> B{"Confirmed<br/>at source?"}
    B -->|"no"| C["It is a HYPOTHESIS.<br/>Check the false-positive catalogue."]
    C --> D["Correct the instrument"]
    D --> E["Re-run"]
    E --> B
    B -->|"yes"| F["It is a FINDING.<br/>Write it into the report<br/>with its severity."]
    C -.->|"never"| G["Waive it"]

    style C fill:#fff3cd,stroke:#856404
    style F fill:#d4edda,stroke:#155724
    style G fill:#f8d7da,stroke:#721c24
```

**Reads as:** one audit's first run reported 60 failures and 3 were real; one state probe reported 37 and all 37 were the harness. Corrections are recorded, because an uncorrected harness re-reports them next run.

---

## 6 · Approval gates

Five gates, three of them blocking. Also in [ARCHITECTURE.md § 8](ARCHITECTURE.md#8--approval-gates).

```mermaid
flowchart TD
    S01["01 REQUIREMENT_ANALYSIS"] -.->|"blocking ambiguity"| G1{{"Clarification Gate"}}
    G1 -->|"answered"| S01
    G1 -->|"user unavailable"| HB1(["HALT_BLOCKED"])

    S03["03 PRODUCT_REVIEW"] --> G2{{"Direction Approval Gate<br/><b>mandatory</b>"}}
    G2 -->|"granted"| S04["04 UX_PLANNING"]
    G2 -->|"denied"| S01
    G2 -->|"stop confirmed"| HS(["HALT_STOPPED"])

    S09["09 USER_REVIEW"] --> G3{{"Primary User Approval Gate<br/><b>the central human gate</b>"}}
    G3 -->|"approve + handoff"| S12["12 FLOW_VISUALIZATION"]
    G3 -->|"approve, no handoff"| S11["11 FINAL_OUTPUT"]
    G3 -->|"request-changes"| S10["10 REVISION"]
    G3 -->|"reject"| S01

    S10 -.->|"contradictory requests"| G4{{"Conflict Mini-Gate"}}
    G4 -->|"ruled"| S10

    S12 --> G5{{"Developer Handoff Gate"}}
    G5 -->|"granted"| S11
    G5 -->|"denied"| S12

    style G1 fill:#fff3cd,stroke:#856404
    style G2 fill:#ffe08a,stroke:#856404
    style G3 fill:#ffe08a,stroke:#856404
    style G4 fill:#fff3cd,stroke:#856404
    style G5 fill:#ffe08a,stroke:#856404
```

### Gate lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> granted: user approves,<br/>record names the sha256s
    pending --> denied: user denies,<br/>denial names the failing rule
    granted --> pending: approved artifacts changed<br/><b>(stale-approval rule)</b>
    denied --> pending: the owning state re-runs
    granted --> [*]: consumed by the forward transition
```

**Reads as:** the darker gates block a forward transition. The reversion edge is the one that matters most — an approval is scoped to the bytes it saw, and it does not follow them when they move.

---

## 7 · Repository structure

```mermaid
flowchart TD
    ROOT["design-toolkit/"]
    ROOT --> CFG["toolkit.config.json<br/><i>the only file a new product must edit</i>"]
    ROOT --> DOCS["docs/<br/><i>the specification layer</i>"]
    ROOT --> SKILLS["skills/<br/><i>12 states · one folder each</i>"]
    ROOT --> TOOLS["tools/<br/><i>7 validators · zero dependencies</i>"]
    ROOT --> TPL["templates/<br/><i>artifact shapes + review player</i>"]
    ROOT --> REF["reference/<br/><i>product-owned inputs</i>"]
    ROOT --> ART["artifacts/<br/><i>runtime output</i>"]
    ROOT --> ST["state/<br/><i>machine_state.yaml</i>"]
    ROOT --> EX["examples/<br/><i>empty by design</i>"]

    DOCS --> D1["workflow.md · SOURCE OF TRUTH"]
    DOCS --> D2["method-rules.md · the rule catalogue"]
    DOCS --> D3["artifact-contracts.md · the store"]

    SKILLS --> SK1["01-requirement-analysis/ … 11-final-output/"]
    SKILLS --> SK2["12-flow-visualization/"]

    TOOLS --> T1["smoke · audit"]
    TOOLS --> T2["navgraph · stategraph · stateprobe · annotate"]
    TOOLS --> T3["cdp · config · config.schema.json"]

    TPL --> TP1["one .md per artifact type"]
    TPL --> TP2["prototype/ · run-local.sh · serve.py · play.html"]

    REF --> R1["screen-registry.csv · THE SPINE"]
    REF --> R2["nav-lanes · state-vocabulary · state-machines · edge-annotations · audit-plan"]

    ART --> A1["pipeline artifacts"]
    ART --> A2["prototype/ · shots/"]
    ART --> A3["deliverable-&lt;feature&gt;/ · COMMITTED"]

    style CFG fill:#cfe2ff,stroke:#084298
    style D1 fill:#fff3cd,stroke:#856404
    style R1 fill:#fff3cd,stroke:#856404
    style A3 fill:#e7d6f5,stroke:#5a2a82
```

**Reads as:** two files are load-bearing beyond their size — `docs/workflow.md` (where a skill disagrees with it, the skill is the bug) and `reference/screen-registry.csv` (the entire navigation model is derived from its cells).

---

## 8 · Developer handoff flow

What happens between approval and freeze when `handoff_required` is true. Also in [ARCHITECTURE.md § 10.2](ARCHITECTURE.md#102-the-handoff-flow).

```mermaid
flowchart TD
    APPR["USER_REVIEW · approve<br/><i>sha256 recorded</i>"] --> Q{"handoff_required?"}
    Q -->|"no"| FREEZE
    Q -->|"yes"| DERIVE["navgraph.mjs derives the graph<br/><i>from the registry, never drawn</i>"]
    DERIVE --> RECON["Reconcile against the ratified flows<br/><i>disagreements are findings, not merges</i>"]
    RECON --> DRAW["Lay out Sections · connectors ·<br/>decision nodes · metadata · E1–E7"]
    DRAW --> VALIDATE["V1–V13 + tool exit code"]
    VALIDATE --> DHG{{"Developer Handoff Gate<br/><i>passes on the REPORT,<br/>not on the picture</i>"}}
    DHG -->|"granted"| FREEZE["FINAL_OUTPUT<br/>freeze = hash, not copy"]
    DHG -->|"findings"| DERIVE
    FREEZE --> PKG["deliverable-&lt;feature&gt;/"]
    FREEZE --> MS["machine_state.yaml · DONE<br/><i>same edit · 6 rules, each with a reason</i>"]

    style DHG fill:#fff3cd,stroke:#856404
    style PKG fill:#e7d6f5,stroke:#5a2a82
    style MS fill:#e7d6f5,stroke:#5a2a82
```

### What the developer receives

```mermaid
flowchart LR
    subgraph PKG["deliverable-&lt;feature&gt;/"]
        P1["prototype/<br/><i>frozen bytes, each hashed</i>"]
        P2["handoff-&lt;feature&gt;.md"]
    end
    subgraph SUPP["Plus, when handoff_required"]
        S1["navgraph.json · navmap-report.md"]
        S2["Figma Sections · cross-feature map ·<br/>overview page · legend"]
    end
    P2 --> Q1["Which screens ship, in which states"]
    P2 --> Q2["Which decisions were ruled, and why"]
    P2 --> Q3["Which limitations ship knowingly"]
    P2 --> Q4["Which URL drives each state"]
    S1 --> Q5["Which screens reach which, and which are hubs"]
    S2 --> Q6["What kind of navigation each route is,<br/>with a citation"]

    style PKG fill:#e7d6f5,stroke:#5a2a82
```

**Reads as:** the deliverable answers the six questions a build team otherwise asks a designer. Every answer carries the artifact it came from.

---

## 9 · Dependency graph

What must exist before what. Also in [ARCHITECTURE.md § 11](ARCHITECTURE.md#11--dependency-graph).

```mermaid
flowchart TD
    CFG["toolkit.config.json"]
    REG["reference/screen-registry.csv"]
    DS["design-system reference"]
    VOC["reference/state-vocabulary.md"]

    REQ["requirements-&lt;f&gt;.md"] --> RES["research-&lt;f&gt;.md"]
    REQ --> PR["product-review-&lt;f&gt;.md"]
    RES --> PR
    REQ --> UX["ux-plan-&lt;f&gt;.md"]
    RES --> UX
    PR --> UX
    UX --> FL["flows-&lt;f&gt;.md"]
    REQ --> FL
    FL --> UI["ui-plan-&lt;f&gt;.md"]
    UX --> UI
    RES --> UI
    DS -.-> UI
    UI --> PROTO["prototype/ + traceability-&lt;f&gt;.md"]
    FL --> PROTO
    UX --> PROTO
    PROTO --> AUD["audit-report-&lt;f&gt;.md"]
    REQ --> AUD
    UI --> AUD
    UX --> AUD
    AUD --> REV["review-record-&lt;f&gt;.md"]
    PROTO --> REV
    AUD --> RVL["revision-log-&lt;f&gt;.md"]
    REV --> RVL
    REG --> NAV["navgraph.json + navmap-report.md"]
    VOC -.-> NAV
    FL --> NAV
    PROTO --> NAV
    REV --> NAV
    NAV --> DEL["deliverable-&lt;f&gt;/"]
    REV --> DEL
    RVL --> DEL
    PROTO --> DEL
    AUD --> DEL
    CFG -.-> PROTO
    CFG -.-> AUD
    CFG -.-> NAV

    style DEL fill:#e7d6f5,stroke:#5a2a82
    style CFG fill:#cfe2ff,stroke:#084298
```

**Reads as:** the answer to "what breaks if I skip a state" — every downstream node loses an input, and the skill that owed it is where a missing-artifact error back-transitions to.

---

## 10 · Revision loop

Root-cause routing, and the only way work travels backwards. Also in [ARCHITECTURE.md § 2.4](ARCHITECTURE.md#24-the-revision-loop).

```mermaid
flowchart TD
    UR["USER_REVIEW"] -->|"request-changes"| REV["REVISION"]
    SA["SELF_AUDIT"] -->|"verdict fail"| REV
    REV --> TRIAGE{{"Triage each item to<br/>where the fault was INTRODUCED"}}
    TRIAGE -->|"goal / scope never captured"| S01["REQUIREMENT_ANALYSIS"]
    TRIAGE -->|"convention or benchmark wrong"| S02["RESEARCH"]
    TRIAGE -->|"what to build, or its priority"| S03["PRODUCT_REVIEW<br/><i>Direction Gate re-opens</i>"]
    TRIAGE -->|"missing journey or uncovered edge"| S04["UX_PLANNING"]
    TRIAGE -->|"missing state, wrong guard, stale boundary"| S05["FLOW_GENERATION"]
    TRIAGE -->|"component, token, layout, motion, contrast"| S06["UI_PLANNING"]
    TRIAGE -->|"spec was right, build does not match"| S07["PROTOTYPE"]
    TRIAGE -->|"the defect passed a green check"| S08["SELF_AUDIT<br/><i>+ the owning state</i>"]
    S01 & S02 & S03 & S04 & S05 & S06 & S07 & S08 --> REBUILD["rebuild downstream"]
    REBUILD --> SA
    SA -->|"pass"| UR
    REV -->|"L_REVISION 3/3 consumed"| HB(["HALT_BLOCKED<br/><i>escalation summary</i>"])
    HB -.->|"explicit user authorisation,<br/>recorded in the log"| REV

    style TRIAGE fill:#fff3cd,stroke:#856404
    style HB fill:#f8d7da,stroke:#721c24
```

**Reads as:** everything is visible in the prototype, and that is not evidence it belongs to `PROTOTYPE`. A repeat is evidence of misrouting.

---

## 11 · Freeze sequence

What `FINAL_OUTPUT` actually checks. Also in [ARTIFACT_FLOW.md § 9](ARTIFACT_FLOW.md#9--the-freeze).

```mermaid
flowchart TD
    A["review-record-&lt;f&gt;.md<br/><i>approve · reads_versions · sha256 per file</i>"] --> B{"Any bytes moved<br/>since approval?"}
    B -->|"no"| E["Freeze"]
    B -->|"bug-fix only"| C["Scope confirm<br/><i>identical hex inventory · diff confined ·<br/>inverse delta hashes back to approved sha</i>"]
    B -->|"feature delta"| D["Ruling required<br/><i>gate is pending;<br/>nothing to package yet</i>"]
    C --> E
    D -.-> A
    E --> F["Every frozen file listed with its sha256<br/><i>in the handoff AND in machine_state.freeze</i>"]
    F --> G["V2 checked against the traceability matrix<br/><i>met · waived · superseded · anything else = unmet</i>"]
    G --> H["Audit of record confirmed to have run<br/>on the bytes being frozen"]
    H --> I["Six completion rules,<br/>each a boolean AND a one-line reason"]
    I --> J["machine_state.yaml closed<br/><b>in the same edit</b>"]

    style D fill:#f8d7da,stroke:#721c24
    style E fill:#d4edda,stroke:#155724
    style J fill:#e7d6f5,stroke:#5a2a82
```

**Reads as:** a freeze is a hash, not a copy. And `designed` and `delivered` are different claims — a screen not in a frozen deliverable is not delivered, however finished it looks.

---

## Diagram conventions

Used consistently across the documentation, so a colour means the same thing everywhere.

| Convention | Meaning |
|---|---|
| **Blue fill** `#cfe2ff` | Control — the orchestrator, config, the thing that decides. |
| **Green fill** `#d4edda` | Verification — validators, exit codes, confirmed findings. |
| **Yellow fill** `#fff3cd` / `#ffe08a` | Human decision — gates, triage. Darker yellow blocks a forward transition. |
| **Purple fill** `#e7d6f5` | Terminal output — the frozen deliverable and the closed machine record. |
| **Red fill** `#f8d7da` | A failure state or a forbidden path. |
| **Grey fill** `#e2e3e5` | A loop rather than a step. |
| **Solid edge** | The forward pipeline, or a hard dependency. |
| **Dashed edge** | A loop, a configuration read, or a conditional path. |
| `{{hexagon}}` | A gate or a decision the machine cannot make alone. |
| `[(cylinder)]` | A store — artifacts, reference files, machine state. |
| `([stadium])` | A terminal state. |

---

[← README](README.md) · [Architecture →](ARCHITECTURE.md) · [Workflow Guide →](WORKFLOW_GUIDE.md) · [Artifact Flow →](ARTIFACT_FLOW.md) · [Validation Engine →](VALIDATION_ENGINE.md)
