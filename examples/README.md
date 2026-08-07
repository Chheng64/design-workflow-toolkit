# examples/

Empty by design.

This toolkit ships the **method** from a completed product design run, not that
product's artifacts. What survived the extraction is in three places:

- [`docs/method-rules.md`](../docs/method-rules.md) — every hardened rule, with the
  class of failure that produced it
- each skill's **Recorded failure modes** section — the same defects, stated where
  the state that causes them can see them
- [`templates/`](../templates/) — the artifact shapes, with the load-bearing fields
  marked

If you want worked examples, the honest way to get them is to run the pipeline
once on a small feature and keep that feature's artifacts here as the reference
set. A borrowed example from another product is the failure mode `skills/06`
records first: **a plan built on the wrong source validates perfectly against it.**
