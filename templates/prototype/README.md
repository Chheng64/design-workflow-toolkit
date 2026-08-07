# `templates/prototype/` — the Run Local review player

[← templates/](../README.md) · [Repository root](../../README.md) · [STATE 09](../../WORKFLOW_GUIDE.md#state-09--user_review)

---

## Purpose

The review chrome. Three files that STATE 07 copies into `artifacts/prototype/` so STATE 09 can serve the prototype over HTTP and present it through a player with a sidebar — rather than by opening raw HTML files.

**The player is not a convenience.** Rule G1 exists because reviewing raw pages bypasses the review chrome, and that was a direct user correction on a real run. STATE 09's V4 requires the review to be conducted against a served prototype, with the **player URL recorded** in the gate record.

| File | What it does |
|---|---|
| [`run-local.sh`](run-local.sh) | Starts (or reuses) the server and opens the player. Idempotent — re-running is "Refresh Run Local". |
| [`serve.py`](serve.py) | Static server plus live reload. Reload is **gated on workflow state**. |
| [`play.html`](play.html) | The player: a sidebar of registered flows, walkthrough progress, *open standalone*, and a stage iframe. |

## Inputs

| Input | Where from |
|---|---|
| The prototype pages | `artifacts/prototype/*.html`, built by STATE 07 |
| The `FEATURES` array | Edited inside `play.html`, one entry per prototype page |
| Port | `run-local.sh <port>`, default **8765**, matching `toolkit.config.json` → `review.port` |
| Workflow state | `state/machine_state.yaml` → top-level `current_state`, or `$TOOLKIT_STATE_FILE` |

## Outputs

- A local HTTP server on the chosen port.
- The player at `http://localhost:<port>/play.html`.
- **The player URL**, which is the thing STATE 09 records in `review-record-<feature>.md`.

## Examples

**Standing it up** (STATE 07, in the same edit as the first prototype page):

```bash
cp templates/prototype/{run-local.sh,serve.py,play.html} artifacts/prototype/
chmod +x artifacts/prototype/run-local.sh
```

**Registering a flow.** In `play.html`, one entry per page — added in the **same edit that creates the page**:

```js
const FEATURES = [
  { id:'signin', pri:'P0', file:'signin.html',
    label:'Sign in (email + password, reset)',
    desc:'S-SIGN-01…03 · ?view=main|error|reset' },
];
```

**Running the review:**

```bash
artifacts/prototype/run-local.sh          # → http://localhost:8765/play.html
artifacts/prototype/run-local.sh 9000     # a different port
```

**Deep-linking into a flow and a state.** The player splits `#id?query`, so a hook survives into the stage iframe:

```
http://localhost:8765/play.html#signin
http://localhost:8765/play.html#signin?view=main&state=error
```

That is what makes STATE 07's hook table usable as a review packet: the user reaches the error state in one step instead of clicking toward it.

**What "Refresh Run Local" means.** Re-running the script is idempotent: a live-reload server already on the port is reused; a *plain* server on the port is replaced with the live-reload one.

## Best practices

- **Review through the player, never by opening a page directly.** The sidebar *is* the intended review chrome, and V4 asks for the URL specifically.
- **Register every new page in `FEATURES`, in the same edit that creates the page.** A flow missing from the sidebar is a flow the user does not review — the array renders an explicit "No prototype registered yet" message precisely so its emptiness is not mistaken for an empty prototype.
- **Ship the hook list with the verdict request.** STATE 07's traceability table already names a deep-link hook for every flow state, variant and error case. That table is the packet.
- **Check the state file before calling live reload broken.** Reload is active **only** while the top-level `current_state` in `state/machine_state.yaml` is `USER_REVIEW`. Outside review the same server serves plain pages, `/__watch` answers "off", and no poller is injected. This is checked per request, so a state transition applies without restarting the server.
- **A missing or unreadable state file means reload stays ON.** That is deliberate, for standalone use outside a run.
- **Record the player URL in the gate record.** On the extraction run, three of six records named the player and hook in prose and **none recorded a URL** — so the rule was satisfied in practice and unevidenced in the artifact.
- **The player is harness chrome, not product surface.** Declare its selectors in `audit.paletteExemptSelectors` so the palette sweep does not report the player's own colours as off-palette findings.
- **Do not edit these files in `templates/`.** Copy them; edit the copies. The templates are the shape for the next product too.

## Requirements

- **Python 3** for `serve.py`.
- A shell with `lsof` and `curl` for `run-local.sh`'s reuse detection (macOS and most Linux distributions).
- `open` is used to launch the browser where available; otherwise the script prints the URL.

## Related

- [`WORKFLOW_GUIDE.md § STATE 09`](../../WORKFLOW_GUIDE.md#state-09--user_review) — the review method, G1–G8
- [`skills/09-user-review/SKILL.md`](../../skills/09-user-review/SKILL.md) — the full contract
- [`skills/07-prototype/SKILL.md`](../../skills/07-prototype/SKILL.md) — B2, the hooks that make the packet
- [`ARTIFACT_FLOW.md`](../../ARTIFACT_FLOW.md) — what the gate record must carry
