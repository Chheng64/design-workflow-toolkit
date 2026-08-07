<!--
Thanks for contributing. The checklist below is the same bar the toolkit holds
its own output to: name the evidence, do not weaken a rule, keep the spec on top.

Full guidance: CONTRIBUTING.md
-->

## What this changes

<!-- One or two sentences. What does this do, and what does it prevent? -->

## Type

<!-- Tick one. -->

- [ ] Documentation
- [ ] A new or sharpened **hardened rule**
- [ ] A validator — new tool, or a change to an existing one
- [ ] A skill contract or method
- [ ] **A specification change** (`docs/workflow.md`) — an issue must exist
- [ ] Chore / repository maintenance

## Evidence

<!--
If this adds or changes a rule, this section is the pull request.
Rules here are not opinions; they are recorded failures.
-->

**Defect that produced this change:**
<!-- State the CLASS, not the incident. Name the mechanism: why is this invisible
     to the checks that already exist? -->

**Which existing check did it get past?**

**Owning state** (where the fault is *introduced*, not where it is visible):

**Rule code assigned** (continuing that state's namespace):

## Checklist

- [ ] **`docs/workflow.md` still wins.** No skill contradicts the specification.
- [ ] If a rule was added, it is in **all three places** — the skill's hardened method section, the skill's Recorded failure modes, and `docs/method-rules.md` — with a code.
- [ ] If a machine-checkable condition was added, it is a **`V5+`** rule. No `V1`–`V4` rule was removed or weakened.
- [ ] If a tool was added or changed: it takes `--root`, reads config through `config.mjs`, uses the shared severity ladder, distinguishes exit `1` (findings) from exit `2` (did not run), writes both JSON and human-readable output, and adds **zero** dependencies.
- [ ] If a false-positive class is possible, it is documented in `VALIDATION_ENGINE.md § 10`.
- [ ] Terminology matches `GLOSSARY.md`.
- [ ] Every relative link resolves, and no link points at a `reference/` file that only exists after seeding.
- [ ] **No number was invented.** Every figure traces to a recorded run. If a number was corrected, it was corrected in *every* occurrence.
- [ ] Documentation is updated **in this pull request**, not in a follow-up.
- [ ] `CHANGELOG.md` updated under `[Unreleased]`.

## Verification

<!--
What did you actually run? Paste the output.
Per M3: a failing probe is a hypothesis. If a check failed and you decided it was
the instrument, say so and say what you corrected.
-->

```
```

## Related issues

<!-- Closes #… -->
