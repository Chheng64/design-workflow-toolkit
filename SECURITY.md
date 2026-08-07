# Security Policy

[← README](README.md) · [Contributing](CONTRIBUTING.md)

---

## Reporting a vulnerability

**Do not open a public issue for a security report.**

Use GitHub's private vulnerability reporting on this repository — **Security → Report a vulnerability** — or email `<SECURITY_CONTACT>`.

> **Maintainer:** replace `<SECURITY_CONTACT>` with a real address before making this repository public, and enable private vulnerability reporting in the repository's Security settings.

Please include:

- What the issue is, and what an attacker could do with it.
- The file, tool or configuration key involved.
- Steps to reproduce, and the version of Node, Python and Chrome you used.
- Whether it requires a hostile `toolkit.config.json`, a hostile prototype, or a hostile reference file — see [the trust model](#trust-model).

**Response:** an acknowledgement within a few days, and an assessment with a fix or a rejection with reasoning. Fixes are disclosed in [`CHANGELOG.md`](CHANGELOG.md) once released.

---

## Scope

### In scope

| Area | Examples |
|---|---|
| [`tools/`](tools/) | Command injection, path traversal outside the project root, arbitrary file write, unsafe deserialisation. |
| [`templates/prototype/serve.py`](templates/prototype/serve.py) | Path traversal out of the served directory, unintended binding beyond localhost, header injection. |
| [`templates/prototype/run-local.sh`](templates/prototype/run-local.sh) | Unsafe process handling, killing a process it should not. |
| [`tools/cdp.mjs`](tools/cdp.mjs) | Anything that widens the debugging surface beyond the local machine. |
| Configuration handling | A value in `toolkit.config.json` that escapes into a shell, a path, or an evaluated context. |

### Out of scope

| Not a vulnerability | Why |
|---|---|
| A prototype in `artifacts/prototype/` doing something unsafe | The prototype is **your** content. The toolkit drives it; it does not vet it. |
| Chrome's remote-debugging port being open while a tool runs | Expected behaviour, bound to localhost, for the lifetime of the run. See [the trust model](#trust-model). |
| The review server serving your own files | That is its purpose. It is a local development server. |
| Anything requiring an attacker to already have write access to the repository | If they can edit `toolkit.config.json`, they can edit a tool. |
| An AI agent producing an undesirable design | Not a security issue. That is what the gates are for. |

---

## Trust model

Stating this plainly matters, because most of the "is this safe?" questions about this repository are really questions about the trust model rather than about a defect.

### What the toolkit assumes

1. **You trust the repository you are running.** `toolkit.config.json`, the files under `reference/`, the skills and the tools are treated as trusted input. A hostile `toolkit.config.json` is equivalent to a hostile script — do not run this toolkit against a repository you would not run code from.
2. **You trust the prototype you built.** The harnesses load `artifacts/prototype/` in a real browser and execute its JavaScript. That is the only way to check whether a screen paints.
3. **Everything is local.** No tool phones home. There is no telemetry, no account, and no network dependency. The engine runs offline by design.

### What runs, and where

| Component | Binds to | Lifetime |
|---|---|---|
| Chrome, with remote debugging | localhost, on `audit.debugPort` | the tool run |
| The audit's static file server | `127.0.0.1`, on `audit.servePort` | the tool run |
| `serve.py` (Run Local) | the review port, default `8765` | until you stop it |

**The review server is a development server.** It serves the prototype directory, and — while `current_state` is `USER_REVIEW` — injects a live-reload poller into HTML responses. Do not expose it to a network you do not control, and do not put anything in `artifacts/prototype/` that you would not serve.

### Dependencies

`tools/` has **zero runtime dependencies**, by design. There is no npm tree to audit, and no transitive supply-chain surface. `serve.py` uses only the Python standard library.

That is a deliberate security property as much as a maintenance one.

---

## Supported versions

The project is in public preview. Security fixes are applied to `main`, and there are no maintained release branches yet. Track [`CHANGELOG.md`](CHANGELOG.md).

---

[← README](README.md) · [Contributing](CONTRIBUTING.md) · [Tools](tools/README.md)
