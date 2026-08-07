# PROGRESS — <product>

_Snapshot: <YYYY-MM-DD>_

> The priority tracker. Fixed format, updated **on every flow close and every debt
> change**. Detailed history lives elsewhere (a status log); this file answers one
> question: what is the state of the work right now, and what is the next thing.

## Alignment snapshot

| Metric | Value |
|---|---|
| Flows closed | 0 / 0 |
| Screens delivered | 0 / 0 |
| Gates granted | 0 |
| Open decisions | 0 |
| Debt items open | 0 |
| Machine state | `REQUIREMENT_ANALYSIS` |

## Track A — blocked on someone else

Items this workspace **cannot** act on alone. Each names who can unblock it and
what the one line would be.

| # | Item | Blocked on | The one line needed |
|---|---|---|---|

## Track B — actionable here

Ordered. The top row is the next thing.

| # | Item | State it belongs to | Why it is next |
|---|---|---|---|

## Open decisions

`o-<id>` items carried forward rather than defaulted. An unruled question that
reaches the prototype as an invented answer is how a placeholder gets frozen into
an approved deliverable.

| ID | Question | What it blocks | Who can rule | Ships as (the reversible reading) |
|---|---|---|---|---|

## Debt

Every waiver rides on a numbered item here, and every item states what closes it.

| # | Debt | Opened | Rides under | What closes it | Status |
|---|---|---|---|---|---|

## Loop accounting

A ceiling nobody counts is not a ceiling.

| Feature | `L_REVISION` | `L_AUDIT_FIX` | Passes to approval |
|---|---|---|---|
