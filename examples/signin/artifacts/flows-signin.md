---
artifact: flows
version: flow-signin-01
produced_by: flow-generation
reads_versions:
  ux-plan-signin.md: ux-signin-01
  requirements-signin.md: req-signin-01
feature: signin
folds_in: []
---

# Flows — signin

Node ids = prototype views. `⟂` = flow boundary (another flow's screen, mocked).

Node contents below are **triggers, guards and routes**. Naming a node after a screen id is the toolkit convention; it does not make this a screen document.

## Canon entry paths

These are the paths a reviewer checks the prototype against.

1. **Straight in** — cold start → credentials entered → submit → authenticated area.
2. **Mistyped and corrected** — cold start → submit → rejected → correct the secret → submit → authenticated area.
3. **Locked out, then reset** — cold start → submit rejected ×5 → locked → reset route → request → acknowledged.
4. **Forgot from the start** — cold start → reset route → request → acknowledged → back to credentials.

## F1 — Credential entry and recovery (TASK-A, TASK-B)

```
app launch ──▶ S-SIGN-01 (happy)

S-SIGN-01 ──submit──▶ [D1 both fields non-empty?]
   D1 no   ──▶ (unreachable — submit is inert; guarded, not branched)
   D1 yes  ──▶ S-SIGN-01 (loading) ──▶ [D2 reachable?]

D2 no      ──▶ S-SIGN-01 (offline)      recovery: retry edge → loading
D2 yes     ──▶ [D3 credentials accepted?]

   D3 yes                    ──▶ ⟂HOME-01
   D3 no, attempts < N       ──▶ S-SIGN-01 (error{invalid-credentials})
   D3 no, attempts >= N      ──▶ S-SIGN-01 (locked{rate-limited})

S-SIGN-01 (error{invalid-credentials}) ──correct + submit──▶ S-SIGN-01 (loading)
S-SIGN-01 (offline)                    ──retry──▶ S-SIGN-01 (loading)
S-SIGN-01 (locked{rate-limited})       ──reset route──▶ S-SIGN-02 (happy)
S-SIGN-01 (any state)                  ──reset route──▶ S-SIGN-02 (happy)
```

**D1:** `identifier.length > 0 && secret.length > 0` — enforced as a **guard on the affordance**, not as a branch. The false arm is unreachable by construction, which is why it is not drawn as a route. Stating it here rather than omitting it is the difference between a guarded edge and a missing one.

**D2:** `navigator.onLine` at submit time. Exhaustive over `{true, false}`.

**D3:** `accepted ∈ {true, false}` × `attempts ∈ {< N, ≥ N}`. Three arms, and the pair is exhaustive: accepted-and-locked cannot occur because a successful attempt resets the counter. `N` is `o-s1`, assumed 5 — **carried, not chosen here**. The branch exists regardless of the number; only the copy depends on it.

**Not drawn, and why:** `interrupted` from `ux-signin-01` is not a node. Leaving and re-entering the area produces a fresh `S-SIGN-01 (happy)` — it is the *absence* of retained state, not a state of its own. Recorded so its absence reads as a decision.

## F2 — Reset request (TASK-C)

```
S-SIGN-01 (any) ──reset route──▶ S-SIGN-02 (happy)   [identifier carried in]

S-SIGN-02 ──submit──▶ [D4 identifier well-formed?]
   D4 no  ──▶ S-SIGN-02 (error{invalid-email})   recovery: correct + submit → loading
   D4 yes ──▶ S-SIGN-02 (loading) ──▶ [D5 reachable?]

D5 no  ──▶ S-SIGN-02 (error{invalid-email}, offline variant)
           recovery: retry edge → loading
D5 yes ──▶ S-SIGN-03 (happy)        ← REPLACE, not push

S-SIGN-02 ──back──▶ S-SIGN-01 (happy)   [identifier preserved]

S-SIGN-03 ──resend──▶ [D6 within throttle window?]
   D6 yes ──▶ S-SIGN-03 (error{resend-throttled})   recovery: wait, then resend
   D6 no  ──▶ S-SIGN-03 (success{resent})

S-SIGN-03 ──back to sign in──▶ S-SIGN-01 (happy)
```

**D4:** `wellFormed(identifier)` — exhaustive over `{true, false}`. **There is deliberately no `account exists?` decision anywhere in F2.** A well-formed identifier always reaches `S-SIGN-03`, whether or not it belongs to an account. Adding that branch would satisfy a helpfulness instinct and build an account-enumeration oracle (AC4.3, research T2).

**D5:** `navigator.onLine`. Exhaustive.

**D6:** `now - lastSend < window`. Exhaustive over `{true, false}`. `window` is copy, not a branch.

`S-SIGN-02 → S-SIGN-03` is a **replace**, not a push: back into a request already submitted invites a duplicate. That is why `S-SIGN-03` carries its own explicit route back rather than relying on browser back.

## Decision log

| ID | Decision | Ruled by | Date |
|---|---|---|---|
| D-s4 | Password paste is not blocked — blocking it removes the mechanism SC 3.3.8 relies on | product-review (D-s4) | 2026-08-07 |
| D-f1 | `D1` is a **guard on the affordance**, not a branch. The empty-submit arm is unreachable by construction and is documented rather than drawn | this state | 2026-08-07 |
| D-f2 | **No `account exists?` decision in F2.** A well-formed identifier always reaches acknowledgement | requirements AC4.3 + research T2 | 2026-08-07 |
| D-f3 | `S-SIGN-02 → S-SIGN-03` is a **replace**; `S-SIGN-01 → S-SIGN-02` is a **push** | ux-signin-01 navigation model | 2026-08-07 |
| D-f4 | `interrupted` is not a node — it is the absence of retained state | this state | 2026-08-07 |
| D-f5 | Attempt threshold `N` is carried as `o-s1`, not chosen here. The branch is drawn; the number is not | this state | 2026-08-07 |

## Reachability report

| Node | Reachable from | Terminal? | Justification if terminal |
|---|---|---|---|
| `S-SIGN-01 (happy)` | app launch, S-SIGN-02 back, S-SIGN-03 back to sign in | no | — |
| `S-SIGN-01 (loading)` | S-SIGN-01 happy, error, offline retry | no | — |
| `S-SIGN-01 (error{invalid-credentials})` | D3 no, attempts < N | no | recovery: correct + submit |
| `S-SIGN-01 (locked{rate-limited})` | D3 no, attempts ≥ N | no | recovery: reset route |
| `S-SIGN-01 (offline)` | D2 no | no | recovery: retry |
| `S-SIGN-02 (happy)` | S-SIGN-01 reset route (from any state) | no | — |
| `S-SIGN-02 (loading)` | D4 yes | no | — |
| `S-SIGN-02 (error{invalid-email})` | D4 no, D5 no | no | recovery: correct + submit / retry |
| `S-SIGN-03 (happy)` | D5 yes | no | routes: resend, back to sign in |
| `S-SIGN-03 (success{resent})` | D6 no | no | routes: resend again, back to sign in |
| `S-SIGN-03 (error{resend-throttled})` | D6 yes | no | recovery: wait, then resend |
| `⟂HOME-01` | D3 yes | **boundary** | leaves this flow; owned by the authenticated area |

**Unreachable nodes: 0.** **Dead ends without justification: 0.**

Every non-happy node has at least one outbound edge that leads somewhere the user can act (AC6.2). None is terminal.

## Recovery coverage

| Non-happy state (ux-plan) | Recovery transition |
|---|---|
| TASK-A / loading | resolves to one of `⟂HOME-01`, `error{invalid-credentials}`, `locked{rate-limited}`, `offline` — never hangs |
| TASK-A / offline | retry edge → `S-SIGN-01 (loading)` |
| TASK-A / interrupted | re-entry produces `S-SIGN-01 (happy)` — see D-f4 |
| TASK-B / error (credential rejected) | correct + submit → `S-SIGN-01 (loading)` |
| TASK-B / locked (attempts exhausted) | reset route → `S-SIGN-02 (happy)` — the strongest reason to want the reset branch |
| TASK-B / offline | retry edge → `S-SIGN-01 (loading)` |
| TASK-C / loading | resolves to `S-SIGN-03 (happy)` or `S-SIGN-02 (error{invalid-email})` |
| TASK-C / error (malformed) | correct + submit → `S-SIGN-02 (loading)` |
| TASK-C / error (repeat throttled) | wait, then resend → `S-SIGN-03 (success{resent})` |
| TASK-C / offline | retry edge → `S-SIGN-02 (loading)` |

All 10 non-happy states from `ux-signin-01` have a recovery transition (V3).

## Flow boundaries

| Boundary node | Owning flow | Status | Checked on |
|---|---|---|---|
| `⟂HOME-01` | authenticated area (not in this run's scope) | **mocked** | 2026-08-07 |

**A boundary status is a dated claim.** `⟂HOME-01` is correct as a mock *today*, and becomes silently wrong the moment the authenticated area ships. Re-check this table whenever any other feature reaches `FINAL_OUTPUT`.

**Scope of this clearance claim:** *this flow* has exactly one boundary mock, and it is the one above. The claim is about `flows-signin.md`, not about any other flow.

## Open decisions

- **`o-s1`:** attempt threshold `N` — the `D3` branch exists; the number does not. Ruled by: auth service owner.
- **`o-s2`:** reveal-the-secret affordance — would add no node and no edge, only an in-state control. Ruled by: product, at STATE 06.
- **`o-s3`:** copy ownership. Ruled by: content design.
- **`o-s5`:** announcement-versus-focus ordering on `error{invalid-credentials}`. Not a branch — a within-state behaviour. Ruled by: STATE 06. Verified by: STATE 08.

## Validation self-check

- **V1** ✅ — 0 unreachable nodes; every node's inbound source is named in the reachability report.
- **V2** ✅ — 0 dead ends without justification. The only terminal is `⟂HOME-01`, which is a boundary, and it is declared as one.
- **V3** ✅ — all 10 non-happy states from `ux-signin-01` map to a recovery transition.
- **V4** ✅ — D1–D6 each state a guard and cover its whole domain, including the `D1` arm that is unreachable by construction and the `account exists?` branch that is **deliberately absent** rather than forgotten.

**Exit:** validation passes → `UI_PLANNING`.
