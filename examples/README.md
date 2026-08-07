# `examples/` — empty by design

[← Repository root](../README.md) · [Start Here](../START_HERE.md) · [Method rules](../docs/method-rules.md)

---

## Purpose

A place to keep **your** worked artifacts, once you have some.

This toolkit ships the **method** from a completed product design run, not that product's artifacts. What survived the extraction is in three places:

- [`docs/method-rules.md`](../docs/method-rules.md) — every hardened rule, with the class of failure that produced it
- each skill's **Recorded failure modes** section — the same defects, stated where the state that causes them can see them
- [`templates/`](../templates/) — the artifact shapes, with the load-bearing fields marked

## Why it ships empty

If you want worked examples, the honest way to get them is to run the pipeline once on a small feature and keep that feature's artifacts here as the reference set.

A borrowed example from another product is the failure mode [`skills/06`](../skills/06-ui-planning/SKILL.md) records first:

> **A plan built on the wrong source validates perfectly against it.**

On the extraction run, a design-system specification belonging to a different project was adopted, survived four revision cycles, and the machine reached `HALT_BLOCKED` before the tell was spotted — a desktop-first viewport assumption inside a mobile product. No downstream rule could catch it, because every rule was checking against the wrong document and passing.

Shipping a plausible-looking example of someone else's product invites exactly that, at the moment a new user is least equipped to notice.

## Inputs

Whatever you copy in — typically the full artifact set from your first completed feature.

## Outputs

None. This folder is read by people, not by tools.

## Examples

**After your first run:**

```bash
mkdir -p examples/signin
cp artifacts/requirements-signin.md examples/signin/
cp artifacts/ux-plan-signin.md      examples/signin/
cp artifacts/flows-signin.md        examples/signin/
cp artifacts/traceability-signin.md examples/signin/
cp artifacts/review-record-signin.md examples/signin/
cp -r artifacts/deliverable-signin  examples/signin/deliverable
```

Then write a short `examples/signin/README.md` recording three things a future reader will want:

1. **What the brief was**, verbatim.
2. **Which rules fired**, and what each one caught. This is the part that makes an example instructive rather than decorative.
3. **What you would do differently.** Every real run produces at least one.

## Best practices

- **Keep an example from your own product, not from someone else's.** That is the entire reason this folder is empty.
- **Keep the artifacts that show a rule working**, not just the tidy ones. An `audit-report` with a `fail` verdict and a routed revision teaches more than a clean one.
- **Keep the harness corrections.** The record of which failures turned out to be the instrument is the most transferable thing a first run produces.
- **Update the example when the method changes.** A stale example is worse than no example — it is a plan built on a source that has moved, which is the failure this folder exists to avoid.
- **Do not let an example become a template.** Templates live in [`templates/`](../templates/) and are deliberately empty. An example is evidence of one run; a template is the shape for the next.

## Related

- [`START_HERE.md`](../START_HERE.md) — a guided first project, end to end
- [`templates/`](../templates/) — the empty shapes
- [`docs/method-rules.md`](../docs/method-rules.md) — every rule, with the defect that produced it
