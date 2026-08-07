# Method rules — the hardened catalogue

[← docs/](README.md) · [Repository root](../README.md) · [Spec →](workflow.md) · [Design principles →](../DESIGN_PRINCIPLES.md) · [Glossary → rule codes](../GLOSSARY.md#rule-code-prefixes)

Every rule below was written by a defect that got past a green check on a real
product design run. They are indexed here so a rule can be cited by code from a
plan, a log or a gate record; each skill carries the full statement of its own set.

**How to read this file.** The left column is the code you cite. The middle is the
class of failure that produced it — stated as a class, never as an anecdote about
one product. The right is the skill that owns it.

A rule is not satisfied by understanding it. It is satisfied by the evidence named
in the skill's validation rules.

---

## The three that shape everything else

| | Rule |
|---|---|
| **1** | **A DOM-assertion suite is not a substitute for looking at the render.** A screen can pass every structural assertion while painting nothing: `visibility:hidden` keeps layout boxes and accepts programmatic clicks. "N/N assertions passed" is a statement about the suite, not about the product. |
| **2** | **A failing probe is a hypothesis, not a finding.** One audit's first run reported 60 failures and 3 were real; another reported 37 and **all 37** were the harness. Confirm at source, correct the instrument, re-run. Never waive, never report unconfirmed. |
| **3** | **An approval is scoped to the bytes it saw.** Record the sha256. A gate record that names its versions only in prose is not machine-checkable, and the field it drops is exactly the one `FINAL_OUTPUT` needs. |

---

## B — Build method · [`skills/07-prototype`](../skills/07-prototype/SKILL.md)

| Code | Rule | Written by |
|---|---|---|
| **B1** | Emit in chunks, never one giant write. | Every parallel builder that tried to emit a whole file in one write crashed mid-response and lost the work. |
| **B2** | Every flow state, variant and error case ships a **deep-link hook**, recorded in `traceability.md`. | A state reachable only by clicking through four screens cannot be audited by STATE 08 or demonstrated at the STATE 09 gate. The hook table *is* the review packet. |
| **B3** | Claim the selector namespace before you use it; scope descendants. | Generic class names collided silently across screens and repainted unrelated panels, inflated icons to ~340px, and overflowed cards. All were geometry or screenshot finds, invisible to structure. |
| **B4** | String and config keys are a namespace too — sweep for duplicates across every file **and** every locale object. | Duplicate keys do not error; the later definition silently wins. One locale hid the defect completely because both labels happened to read the same. |
| **B5** | The token layer is the **base**, not an opt-in. Then check the stack itself. | An opt-in font token over a foreign base produced 138 instances across 7 flows rendering a script on an arbitrary OS fallback — and the base stack turned out to carry no face for that script at all. CSS falls back per glyph. Same completeness rule applies to asset registries: a slug with no entry falls back to the default. |
| **B6** | A transition is not wired until its **destination paints**. | Two shapes, both of which pass structural assertions: boundary mocks that outlived their boundary (11 live call sites routing to a placeholder after every destination existed), and a state that exists but never becomes visible. |
| **B7** | Supersession **deletes**. When a revision rebuilds a component, strip the old CSS, strings and handlers. | Leftovers are un-specced elements and fail the traceability rule exactly as additions do. Record the strip, itemised. |
| **B8** | Self-check before handing to the audit: syntax check, palette inventory, drive every view headless and **read the screenshots**, console sweep, and read every rendered number against its own copy. | A progress fill computed from a 0-based index showed empty on question 1; an "unlocked!" ceremony drew a **closed** padlock. Both faithful to their code, both wrong on the screen. |

### F — Figma plugin-API traps (same skill)

| Code | Trap |
|---|---|
| **F1** | `setBoundVariableForPaint()` silently drops `paint.opacity`. Assign → **re-read `node.fills[0]`** → spread the opacity on → reassign. Spreading the object returned by the bind call does not survive assignment. |
| **F2** | A bad lookup **fails silently**. An id without the `VariableID:` prefix returns `null`, and the bind call accepts `null` without throwing — producing unbound paints and zero errors. Re-read and assert the binding. |
| **F3** | `paint.opacity` round-trips as float32 (`0.12` → `0.11999999…`). Compare with an epsilon. |

---

## M — Verification method · [`skills/08-self-audit`](../skills/08-self-audit/SKILL.md)

| Code | Rule | Written by |
|---|---|---|
| **M1** | Every check is **rendering-class**: computed visibility and geometry, never DOM presence. | 84/84 DOM assertions passed against a screen that displayed nothing. |
| **M2** | **Look at the render.** Screenshot review is a required audit step across language × theme × reduced-motion × state. | Four of one flow's six real defects were screenshot-only finds — a closed sheet bleeding back in, a scroll that pushed the topbar out of frame, a truncated label, an asset crop gap. |
| **M3** | A failing probe is a hypothesis. Confirm at source; correct the harness and re-run. | See "the three", above. The known false-positive classes are catalogued in the skill. |
| **M4** | **Sweep the source**, not just the surface: duplicate keys, stale placeholder routes, per-glyph font fallback. | Each of these is invisible to both assertions and screenshots in at least one locale or theme. |
| **M5** | The verdict is **scoped to the bytes it audited**. Targeted assertions run during a revision round are not an audit. | Five of seven approved flows arrived at their gate past their audit of record. The eventual re-run found three more real defects. |
| **M6** | **Record, do not silently resolve.** A conflict between two approved artifacts, or between a project criterion and an external standard, is a finding with a recommendation. | Silently editing one of two disagreeing sources hides the disagreement rather than resolving it. |

---

## G — Review method · [`skills/09-user-review`](../skills/09-user-review/SKILL.md)

| Code | Rule | Written by |
|---|---|---|
| **G1** | **Run Local, never a static preview.** Review happens through the player, and the player URL is recorded. | A direct user correction. Reviewing raw pages bypasses the review chrome. |
| **G2** | The **hook list is the packet**. Ship STATE 07's traceability table with the verdict request. | A state the user cannot reach in one step is a state that gets approved unseen. |
| **G3** | An approval is scoped to the bytes it saw — freeze and record sha256, and name versions in frontmatter. | The most recent gate record dropped `reads_versions` entirely, naming its versions only in a body table. |
| **G4** | **Classify a post-approval delta before asking about it.** Bug-fix-only → a scope confirm, with byte-level evidence. Feature delta → a ruling; the gate is `pending`. | Bytes moved after approval three times in one session, including a whole screen rebuilt as a new surface. |
| **G5** | **Present limitations; do not launder them.** An acceptance with qualifications is recorded with its qualifications. | A clean-looking record of a qualified acceptance is a false record — and it is the artifact delivery is later checked against. |
| **G6** | **Every waiver names its rider** debt item, its grantor and its closing condition. | Two waivers granted this way were both closed the next day. The waiver was never the problem; the silence would have been. |
| **G7** | Keep the pass count honest: `pass N = 1 + revision rounds delivered`, bumped everywhere in the same edit. | Three pass counts were found stale at one gate and had to be corrected before it could close. |
| **G8** | Ambiguity is **bounded, not absorbed** — two clarification rounds, then record as a non-blocking note. | A guess recorded as a requirement becomes a spec nobody chose. |

---

## R — Revision method · [`skills/10-revision`](../skills/10-revision/SKILL.md)

| Code | Rule | Written by |
|---|---|---|
| **R1** | Merge first; **dedup against `seen_changes`**. Same item + no new evidence → drop and cite. | Otherwise the loop runs on its own exhaust. |
| **R2** | **Route the class, not the instance.** State the class, sweep for it, record the sweep count. | A defect reported as six selectors in one file was patched three times and never swept. The root cause resurfaced 24 days later at 138 instances across 7 flows. |
| **R3** | Root cause is **where the fault was introduced**, not where it is visible. A repeat is evidence of misrouting. | Three cycles dispatched palette work downstream; the real fault was wrong-document adoption upstream. The machine reached `HALT_BLOCKED` before the routing was re-examined. |
| **R4** | Dispatch a **bounded scope** — what changes *and what must not*. | An over-applied palette change remixed a brand mark; the next round's first item was "restore it". A revision that does more than the item asked manufactures the next revision item. |
| **R5** | Supersession is part of the change; **aged items are re-verified** against current bytes before dispatch. | Three of one carried item's six reported selectors no longer existed by the time it was actioned. |
| **R6** | **Re-validate through `SELF_AUDIT`**, or record a waiver with a rider. | Targeted verification is evidence inside the loop. It is not the audit. |
| **R7** | **Count the loop, out loud, every cycle.** One round = one prototype rebuild, however many sub-asks it folds. | Counters stopped being written; one flow delivered five rounds against a ceiling of three, and an inner loop breached ×4 and ×8 with no escalation. |
| **R8** | A conflict goes to the **Conflict Mini-Gate**, never into the bytes. Ship the reversible reading, open the item, put it to the gate. | Includes the case of two *approved* deliverables disagreeing: silently editing one to hide the disagreement is worse than the disagreement. |

---

## P — Packaging method · [`skills/11-final-output`](../skills/11-final-output/SKILL.md)

| Code | Rule | Written by |
|---|---|---|
| **P1** | The approval must be **current and must name its bytes**. | A deliverable and its prototype disagreed about what had shipped for a full day. |
| **P2** | **A freeze is a hash, not a copy.** One deliverable per approval gate. | `designed` and `delivered` are different claims: a screen that is in no frozen deliverable is not delivered, however finished it looks. |
| **P3** | V2 is checked against the **traceability matrix**, never from memory. `superseded` is a legitimate status and it names the revision that superseded it. | One batch shipped with no matrix at all, so the rule was not failed — it was *unevaluable*. |
| **P4** | The audit of record must have run on **the bytes being frozen**. | A green audit on superseded bytes is not a green audit. |
| **P5** | Completion rule 6 needs a **revision log that exists**. A missing log reads as no evidence, not as no open items. | The log covered one flow out of eleven; the rest lived in prose. |
| **P6** | A waiver is a legitimate exit; **silence is not**. User-granted + written into Known limitations + a numbered rider + what would close it. | Both waivers granted this way were closed within a day. |
| **P7** | **Close the machine record in the same edit as the freeze**, with a boolean *and a one-line reason* per completion rule. | The state file sat two days and two approval rounds stale while the machine reported itself shipping. |
| **P8** | **Known limitations ship inside the deliverable, at full strength** — in the terms they were discovered in. | The receiving team otherwise discovers them in build, at a much higher price. |

---

## W / E — Navigation mapping · [`skills/12-flow-visualization`](../skills/12-flow-visualization/SKILL.md)

| Code | Rule | Written by |
|---|---|---|
| **W1** | **Derive the graph; never draw it.** Every connector traces to a registry cell, and the derivation is a tool with an exit code. | A hand-drawn connector is an assertion nobody can re-check. |
| **W2** | One Section per **journey**, never per feature. Format `FLOW-XXX • Journey Name`. | A Section named after a feature becomes a bucket, and a bucket answers no question. |
| **W3** | Layout is a **contract**: left→right traversal order, uniform pitch, 8pt grid, branches vertical. | A reviewer scanning right is reading the happy path — only if the ordering is enforced. |
| **W4** | Arrow style carries meaning, and the **legend ships in the file**. | Without it, four line styles are decoration. |
| **W5** | In a Design file a connector is a **vector and does not reflow**. Regenerate wholesale; never hand-patch. | A stale arrow is indistinguishable from a fresh one. This is the artifact's most dangerous property. |
| **W6** | Every frame carries its **own metadata**, including the prototype version it depicts. | A frame that cannot say which bytes it depicts cannot be checked against them — drift becomes undetectable rather than merely undetected. |
| **W7** | **Sync is triggered by a hash, not by memory.** A re-derivation whose edge set differs *is* the signal. | "We updated the Figma" is not a sync record. A diff of the edge set is. |
| **W8** | A boundary is a **dated claim**. Re-derive every port each sync; record the date its status was checked. | A boundary is correct when written and silently wrong once the owning flow ships. |
| **W9** | Render-backed frames are acceptable for mapping; **state variants are not optional**. | If `loading` and `error` live only in the prototype, the state diagram has nothing to point at and the developer reads "this screen has one state". |
| **W10** | **The gate passes on the report, not on the picture.** | A flow map that renders beautifully over a derivation reporting broken routes is the exact failure this state exists to prevent. |

### Extension rules

| Code | Rule |
|---|---|
| **E1** | Lanes come from an explicit assignment file. An unassigned screen is **reported, never guessed into a lane** — a wrong lane reads as a ruling about who owns a screen. |
| **E2** | The cross-feature map is derived. Nearly half of a navigation model is typically *between* features — which is exactly the half no single flow document owns. |
| **E3** | **Heat is measured, never assigned.** In-degree plus distinct source features: a screen reached from six features is a hub, and hubs are where regressions land. |
| **E4** | Deep links are **read out of the implementation**, not out of a doc that claims them. A flow with no hooks is a major finding with a rider, not an omission. |
| **E5** | **Normalize the state vocabulary first, then generate.** Generating first freezes N private vocabularies into a deliverable. The node set is derived; the edge set is authored **with evidence** (`file:line`), and the tool resolves the citation. |
| **E6** | **`UNKNOWN` is a legal value and a guessed value is not.** Annotations cite rather than restate; derived fields are re-derived every run rather than trusted; state the value the **bytes** carry, not the value the plan asked for. |
| **E7** | The overview page ships its **provenance block** — registry sha, derivation run, prototype versions, date — or the page does not ship. |

---

## Cross-cutting

| Rule | Statement |
|---|---|
| **Scope your clearance claims** | "No boundary mocks left" was written about one flow and read as holding for the set. State the scope *inside* the claim. The mirror case: a gap recorded for one flow that a mechanical scan found in three. |
| **An unruled question is carried, never defaulted** | An unanswered guard is an open decision (`o-<id>`), not a branch invented at build time. An invented value becomes a frozen number nobody owns. |
| **A shared component is a cross-flow contract** | A component used by more than one flow names its owning plan, or each file re-decides it — and they drift. |
| **Facts promised at a boundary are contracts** | A fact one flow promises at a `⟂` boundary belongs in both flows' decision logs, or two internally-consistent flows will disagree. |
