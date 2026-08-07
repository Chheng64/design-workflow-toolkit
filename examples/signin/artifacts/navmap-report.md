# Navigation Graph Report

_Derived from `reference/screen-registry.csv` by `tools/navgraph.mjs`. Every edge below
traces to a registry cell — this file is evidence, not authoring._

| Metric | Value |
|---|---|
| Screens | 3 |
| Flows | 1 |
| Navigation edges | 4 |
| Cross-feature edges | 0 |
| Entry points | S-SIGN-01 |
| Blocking findings | 0 |
| Major findings | 0 |
| Advisory findings | 0 |

## Findings

None.

## Navigation heatmap (E3)

| Screen | Name | Flow | In | Out | Source flows |
|---|---|---|---|---|---|
| `S-SIGN-01` | Sign in | 01 Sign In | **2** | 1 | 1 |
| `S-SIGN-02` | Reset password | 01 Sign In | **1** | 2 | 1 |
| `S-SIGN-03` | Check your email | 01 Sign In | **1** | 1 | 1 |

## Cross-feature edges (E2)

None.

## State inventory (E5)

| State | Screens |
|---|---|
| happy | 3 |
| loading | 2 |
| error{invalid-credentials} | 1 |
| locked{rate-limited} | 1 |
| offline | 1 |
| error{invalid-email} | 1 |
| success{resent} | 1 |
| error{resend-throttled} | 1 |

## Deep-link hooks (E4)

| Flow prefix | Page | Query hooks |
|---|---|---|
| SIGN | `signin.html` | `?state` `?view` |
