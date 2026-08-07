#!/usr/bin/env node
/**
 * stateprobe.mjs — drives every hook in reference/state-machines.json and checks
 * that the state it claims to reach actually PAINTS (STATE 12 / E5).
 *
 * stategraph.mjs proves the hook parameter is read by the page. That is not the
 * same claim — a hook that seeds state is not a hook that shows it, and one screen
 * passed 84/84 DOM assertions while rendering nothing. So this probe reads computed
 * visibility and geometry of the active view, never DOM presence.
 *
 * It also reads back the prototype's own screen-id readout for every load, which
 * independently confirms (or refutes) the registry ↔ prototype id drift recorded
 * in `id_conflicts` — the drift is measured here, not asserted from the source.
 *
 * The selectors it looks for are the prototype contract in toolkit.config.json →
 * `prototype`. Paths, ports and the paint threshold come from the same file.
 *
 * Usage: node tools/stateprobe.mjs [--root <repo>] [--port <n>] [--shots <dir>]
 * Exit codes: 0 = every hook painted, 1 = at least one did not, 2 = tool error.
 */

import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, serve } from './cdp.mjs';
import { loadConfig, parseArgs } from './config.mjs';

const { arg } = parseArgs();
const CFG = loadConfig(arg('--root', null));

const ROOT = CFG.root;
const MACHINES = CFG.paths.stateMachines;
const PROTO = CFG.paths.prototype;
const OUT = arg('--json', path.join(CFG.paths.artifacts, 'stateprobe.json'));
const SHOTS = arg('--shots', null);
const PORT = +arg('--port', CFG.audit.servePort);
const CDP = +arg('--cdp', CFG.audit.debugPort + 8);

const spec = JSON.parse(fs.readFileSync(MACHINES, 'utf8'));

// One load per distinct URL; a URL can be claimed by several states.
const byUrl = new Map();
for (const [id, m] of Object.entries(spec.screens)) {
  for (const [state, node] of Object.entries(m.states || {})) {
    if (!node.hook) continue;
    if (!byUrl.has(node.hook)) byUrl.set(node.hook, []);
    byUrl.get(node.hook).push({ screen: id, state });
  }
}

const isLoadingClaim = (claims) => claims.every((c) => c.state.startsWith('loading'));

const results = [];
const srv = serve(PROTO, PORT);
await new Promise((r) => setTimeout(r, 400));
const { proc } = await launch(CDP);

try {
  let n = 0;
  for (const [hook, claims] of byUrl) {
    const page = await newPage(CDP);
    await page.init();
    // Network 4xx is captured with its URL, because the console message for a failed
    // fetch carries none — and some of it is environment noise rather than an app
    // defect: an offline webfont CDN, /favicon.ico. Counting those as failures is the
    // harness being wrong about the app, which is exactly what M3 exists to prevent.
    const netErrors = [];
    page.on((m) => {
      if (m.method !== 'Network.responseReceived') return;
      const { status, url } = m.params.response;
      if (status < 400) return;
      if (!url.includes('127.0.0.1')) return;          // external CDN — not this build
      if (/\/favicon\.ico$/.test(url)) return;         // never authored, never shipped
      netErrors.push(`${status} ${url}`);
    });
    // A loading claim has to be measured BEFORE the simulated fetch settles, or the
    // probe reports the state that replaced it.
    const settle = isLoadingClaim(claims) ? 120 : 480;
    await page.goto(`http://127.0.0.1:${PORT}/${hook}`, settle);

    const probe = await page.eval((C) => {
      const vis = (el) => {
        const cs = getComputedStyle(el), r = el.getBoundingClientRect();
        return cs.visibility !== 'hidden' && cs.display !== 'none' &&
               +cs.opacity > 0.01 && r.width > 0 && r.height > 0;
      };
      const active = [...document.querySelectorAll(C.viewSelector)].filter((v) => v.classList.contains(C.activeClass));
      const painted = active.filter(vis);
      const sid = document.querySelector(C.sidSelector);
      // Anything on screen at all — catches the "active but invisible" class directly.
      const screenEl = document.querySelector(C.screenSelector) || document.body;
      const sr = screenEl.getBoundingClientRect();
      const inkNodes = [...screenEl.querySelectorAll('*')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 8 && r.height > 8 && vis(el);
      }).length;
      const name = (v) => v.id || v.getAttribute('data-view') || v.getAttribute('data-sid') || '(unnamed)';
      return {
        activeViews: active.map(name),
        paintedViews: painted.map(name),
        sid: sid ? sid.textContent.trim() : null,
        screenBox: { w: Math.round(sr.width), h: Math.round(sr.height) },
        visibleNodes: inkNodes,
      };
    }, CFG.prototype);

    // Only script-level errors count from the console — "Failed to load resource" is
    // always mirrored by the network capture above, with the URL that decides it.
    const errs = page.consoleErrors()
      .filter((e) => e && !/Failed to load resource/i.test(e))
      .concat(netErrors);
    // Keep the threshold LOW (config: prototype.minVisibleNodes). An empty state is
    // sparse by design — an empty screen may paint an illustration, a headline and one
    // line of copy and nothing else. A threshold tuned to a busy screen reports the
    // correct rendering of an empty one as a failure. That class cost a 37-failure run
    // in which every failure was the harness.
    const ok = probe.paintedViews.length > 0 &&
               probe.visibleNodes >= CFG.prototype.minVisibleNodes &&
               errs.length === 0;

    if (SHOTS) await page.shot(path.join(SHOTS, `${String(++n).padStart(2, '0')}-${hook.replace(/[^\w]+/g, '_').slice(0, 60)}.png`));

    results.push({ hook, claims, ...probe, consoleErrors: errs, ok });
    await page.close();
  }
} finally {
  try { proc.kill(); } catch {}
  try { srv.kill(); } catch {}
}

// The measured id-drift: what the prototype prints vs the registry id claiming it.
const drift = [];
for (const r of results) {
  if (!r.sid) continue;
  const base = r.sid.split('·')[0].trim();
  for (const c of r.claims)
    if (base.startsWith('S-') && base !== c.screen)
      drift.push({ hook: r.hook, registry: c.screen, prints: r.sid });
}

const failed = results.filter((r) => !r.ok);
fs.writeFileSync(OUT, JSON.stringify({
  generated_by: 'tools/stateprobe.mjs',
  counts: {
    urls: results.length,
    stateClaims: [...byUrl.values()].reduce((a, c) => a + c.length, 0),
    painted: results.length - failed.length,
    failed: failed.length,
    driftObserved: drift.length,
  },
  measured_id_drift: drift,
  results,
}, null, 2));

console.log(`stateprobe: ${results.length} urls · ${results.length - failed.length} painted · ${failed.length} failed · ${drift.length} id-drift observations`);
for (const f of failed)
  console.log(`  [FAIL] ${f.hook} — painted=${JSON.stringify(f.paintedViews)} nodes=${f.visibleNodes} errs=${f.consoleErrors.length}`);
for (const d of [...new Map(drift.map((d) => [d.registry + d.prints, d])).values()])
  console.log(`  [drift] ${d.registry} prints '${d.prints}'  (${d.hook})`);
console.log(`wrote ${path.relative(ROOT, OUT)}`);

process.exit(failed.length ? 1 : 0);
