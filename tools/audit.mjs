#!/usr/bin/env node
/**
 * audit.mjs — STATE 08 `SELF_AUDIT` harness.
 *
 * Method rules carried from skills/08, and the reason each exists:
 *   M1  every assertion reads COMPUTED render state, never DOM presence
 *       (a node can exist, lay out and accept a click while painting nothing)
 *   M2  screenshots are evidence, not decoration
 *   M3  a failing assertion is a hypothesis until the probe itself is verified
 *   M4  sweep the source for the classes that do not show up on one screen
 *
 * Nothing about a specific product lives in this file. What to drive comes from
 * `reference/audit-plan.json` (or, absent that, the hooks in
 * `reference/state-machines.json`); the palette, tap-target floor, viewport and
 * scripts come from `toolkit.config.json`.
 *
 * Usage:
 *   node tools/audit.mjs [--root <repo>] [--plan <file>] [--shots <dir>]
 *                        [--json <out.json>] [--quiet]
 *
 * Exit codes: 0 = no defects, 1 = defects, 2 = tool error.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { launch, newPage, serve } from './cdp.mjs';
import { loadConfig, parseArgs } from './config.mjs';

const { arg, has } = parseArgs();
const CFG = loadConfig(arg('--root', null));

const PROTO = CFG.paths.prototype;
const SHOTS = arg('--shots', CFG.paths.shots);
const OUT = arg('--json', path.join(CFG.paths.artifacts, 'audit-data.json'));
const PLAN_FILE = arg('--plan', path.join(CFG.paths.reference, 'audit-plan.json'));
const QUIET = has('--quiet');

const FLOOR = CFG.audit.tapTargetFloorPx;
const ALLOW = new Set((CFG.audit.colorAllowlist || []).map((h) => h.toUpperCase()));
const SCRIPTS = CFG.product.scripts || [];
const BENIGN = CFG.audit.benignConsole || [];

const die = (m) => { console.error(`audit: ${m}`); process.exit(2); };

if (!existsSync(PROTO)) die(`prototype dir not found: ${PROTO}`);
mkdirSync(SHOTS, { recursive: true });

// ------------------------------------------------------------------ the plan
//
// A plan is a list of URLs to drive and what each one claims to be. Deriving it
// beats maintaining it: STATE 07 B2 already requires a hook per flow state, and
// STATE 12's state-machines.json records them. The explicit file wins when present.

function loadPlan() {
  if (existsSync(PLAN_FILE)) return JSON.parse(readFileSync(PLAN_FILE, 'utf8'));

  const sm = CFG.paths.stateMachines;
  if (!existsSync(sm)) {
    die(`no ${path.relative(CFG.root, PLAN_FILE)} and no ${path.relative(CFG.root, sm)} — ` +
        `nothing to drive. Write the plan (templates/audit-plan.json) or author the state machines first.`);
  }
  const spec = JSON.parse(readFileSync(sm, 'utf8'));
  const screens = [], states = [];
  for (const [id, m] of Object.entries(spec.screens || {})) {
    for (const [state, node] of Object.entries(m.states || {})) {
      if (!node.hook) continue;
      const row = { id, state, url: node.hook, label: `${id}·${state}` };
      (state.startsWith('happy') ? screens : states).push(row);
    }
  }
  return {
    passes: [{ name: 'base', query: '' }],
    screens,
    states,
    _derived: 'reference/state-machines.json hooks',
  };
}

const plan = loadPlan();
const passes = plan.passes?.length ? plan.passes : [{ name: 'base', query: '' }];

// ------------------------------------------------------------------ the probe
//
// Runs in the page. Everything it returns is computed style or measured geometry.

const probeScreen = (opt) => {
  const C = opt.contract;
  const on = document.querySelector(`${C.viewSelector}.${C.activeClass}`) ||
             document.querySelector(C.screenSelector) || document.body;
  const out = {
    view: on.getAttribute?.('data-view') ?? null,
    sid: on.getAttribute?.('data-sid') ?? null,
    painted: false, small: [], overflow: false, spill: [], contrast: [],
    script: [], contrastSkipped: 0,
  };

  const cs = getComputedStyle(on), r = on.getBoundingClientRect();
  out.painted = cs.display !== 'none' && cs.visibility === 'visible' && cs.opacity !== '0' &&
                r.width > opt.minW && r.height > opt.minH;

  // M1 — tap targets, measured as hit area on rendered elements only.
  document.querySelectorAll('button,a,input,select,textarea,[role="switch"],[role="button"],[role="tab"],[tabindex="0"]').forEach((el) => {
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) return;
    if (el.closest('[hidden]')) return;
    if (getComputedStyle(el).visibility === 'hidden') return;
    if (el.getAttribute('tabindex') === '-1') return;
    if (b.width < opt.floor - 0.5 || b.height < opt.floor - 0.5) {
      out.small.push(`${el.id || el.className || el.tagName} ${Math.round(b.width)}x${Math.round(b.height)}`);
    }
  });

  // Content taller than its own box with overflow visible paints over its neighbours.
  // Structural assertions never see this; a screenshot does.
  on.querySelectorAll?.('[class]').forEach((el) => {
    if (getComputedStyle(el).overflow !== 'visible') return;
    if (el.getBoundingClientRect().height === 0) return;
    if (el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) {
      out.spill.push(`${el.className} ${el.scrollHeight}>${el.clientHeight}`);
    }
  });

  const sc = document.querySelector(C.screenSelector);
  if (sc && sc.scrollWidth > sc.clientWidth + 1) out.overflow = true;
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) out.overflow = true;

  // M4 — every script must resolve on a stack that carries a face for it. CSS falls
  // back PER GLYPH, so a token applied correctly over a stack with no such face is
  // still a defect.
  for (const s of opt.scripts) {
    const re = new RegExp(`[${s.range}]`);
    const walker = document.createTreeWalker(on, NodeFilter.SHOW_TEXT);
    let n, seen = 0;
    while ((n = walker.nextNode()) && seen < 400) {
      if (!re.test(n.nodeValue || '')) continue;
      const el = n.parentElement; if (!el) continue;
      seen++;
      const ff = getComputedStyle(el).fontFamily;
      if (!new RegExp(s.fontMatch, 'i').test(ff)) {
        out.script.push(`${s.name}: ${el.className || el.tagName} :: ${ff.slice(0, 60)}`);
      }
    }
  }

  // Contrast, on COMPOSITED backgrounds. A semi-transparent layer over a colour is
  // not that colour, and a gradient ancestor is not machine-readable as one — those
  // are counted and left to the screenshot rather than asserted (M3).
  const lum = (c) => {
    const m = (c || '').match(/\d+(\.\d+)?/g); if (!m) return null;
    const [r0, g0, b0] = m.slice(0, 3).map(Number).map((v) => {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0;
  };
  const parse = (c) => { const m = (c || '').match(/[\d.]+/g); return m ? { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] } : null; };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const bgOf = (el) => {
    const layers = []; let e = el;
    while (e) {
      const s = getComputedStyle(e);
      if (/gradient/.test(s.backgroundImage)) return 'GRADIENT';
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 0.999) break; }
      e = e.parentElement;
    }
    if (!layers.length) return getComputedStyle(document.body).backgroundColor;
    let base = layers[layers.length - 1];
    if (base.a < 0.999) base = over(base, { r: 255, g: 255, b: 255, a: 1 });
    for (let i = layers.length - 2; i >= 0; i--) base = over(layers[i], base);
    return `rgb(${Math.round(base.r)}, ${Math.round(base.g)}, ${Math.round(base.b)})`;
  };
  [...on.querySelectorAll('p,b,h1,h2,h3,li,span')].slice(0, 30).forEach((el) => {
    if (!el.textContent.trim()) return;
    if (el.children.length) return;
    const bg = bgOf(el);
    if (bg === 'GRADIENT') { out.contrastSkipped++; return; }
    const f = lum(getComputedStyle(el).color), g = lum(bg);
    if (f == null || g == null) return;
    const ratio = (Math.max(f, g) + 0.05) / (Math.min(f, g) + 0.05);
    const size = parseFloat(getComputedStyle(el).fontSize);
    const need = size >= 18.66 ? 3 : 4.5;
    if (ratio < need) out.contrast.push(`${el.className || el.tagName} ${ratio.toFixed(2)}:1 need ${need}`);
  });

  return out;
};

// ------------------------------------------------------------------ M4 source sweeps
//
// Classes that are invisible on any single screen: off-palette values, duplicate
// keys in string/config objects, and network calls the docs claim do not exist.

/** Files that live in the prototype dir but are review chrome, not product surface.
 *  Resolved in config.mjs (`review.harnessFiles`, always including the player), so
 *  this sweep and annotate.mjs's network sweep read one list. Without the
 *  exclusion the palette sweep reports the player's own chrome as off-palette on
 *  every run — 11 hexes on the first reference run, all confirmed at source, none
 *  of them app surface. A recurring false positive teaches a reader to stop
 *  reading the report (M3). */
const HARNESS_FILES = new Set(CFG.review.harnessFiles);

async function sweepSource() {
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(PROTO)
    .filter((f) => /\.(html|js|css)$/.test(f))
    .filter((f) => !HARNESS_FILES.has(f));
  const findings = [];
  const hexes = new Map();
  for (const f of files) {
    const src = readFileSync(path.join(PROTO, f), 'utf8');

    // Palette: strip CSS id selectors first — `#feed` is not a colour (a recorded
    // false positive that cost a re-run).
    const scrubbed = src.replace(/[#.][A-Za-z_][\w-]*\s*(?=[{,:.\s])/g, ' ');
    for (const m of scrubbed.matchAll(/#[0-9A-Fa-f]{6}\b/g)) {
      const hex = m[0].toUpperCase();
      hexes.set(hex, (hexes.get(hex) || 0) + 1);
    }

    // Duplicate keys in object literals — the later definition silently wins, and
    // one locale can hide the defect completely.
    const keys = new Map();
    for (const m of src.matchAll(/^\s{2,}([A-Za-z_]\w*)\s*:\s*['"`]/gm)) {
      keys.set(m[1], (keys.get(m[1]) || 0) + 1);
    }
    // Counted per file; a key legitimately repeats once per locale object, so the
    // report states the count and the reviewer rules it (M6, never auto-resolved).
    const dupes = [...keys].filter(([, n]) => n > (CFG.product.locales?.length || 1));
    if (dupes.length) findings.push({ file: f, kind: 'duplicate-keys', detail: dupes.map(([k, n]) => `${k}×${n}`).join(', ') });

    if (/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\s*\(/.test(src)) {
      findings.push({ file: f, kind: 'network-call-site', detail: 'page issues a real request — the handoff must say so' });
    }
  }
  const offPalette = ALLOW.size ? [...hexes].filter(([h]) => !ALLOW.has(h)) : [];
  if (offPalette.length) {
    findings.push({ file: '(set)', kind: 'off-palette', detail: offPalette.map(([h, n]) => `${h}×${n}`).join(', ') });
  }
  return { findings, hexCount: hexes.size, files: files.length };
}

// ------------------------------------------------------------------ run

const PORT = CFG.audit.servePort + 6, DBG = CFG.audit.debugPort + 4;
const srv = serve(PROTO, PORT);
await new Promise((r) => setTimeout(r, 700));
const { proc } = await launch(DBG);

const results = { product: CFG.product.slug, checks: [], defects: [], shots: 0, runs: 0, sweeps: null };
const add = (id, ok, detail) => {
  results.checks.push({ id, ok, detail });
  if (!ok) results.defects.push({ id, detail });
};

const opt = {
  floor: FLOOR,
  scripts: SCRIPTS,
  contract: CFG.prototype,
  minW: Math.min(200, CFG.product.viewport.width * 0.5),
  minH: Math.min(400, CFG.product.viewport.height * 0.45),
};

async function drive(url, label, shot) {
  const page = await newPage(DBG);
  await page.init();

  // A failed request logs "Failed to load resource" with NO url attached, so the
  // console alone cannot tell an app defect from environment noise. Capture the
  // network response, which carries the url, and filter benign entries BY NAME
  // (M3: the alternative is reporting a missing favicon as a product defect).
  const netErrors = [];
  page.on((m) => {
    if (m.method !== 'Network.responseReceived') return;
    const { status, url: u } = m.params.response;
    if (status < 400) return;
    if (!u.includes('127.0.0.1')) return;                 // external host — not this build
    if (BENIGN.some((b) => u.includes(b))) return;
    netErrors.push(`${status} ${u}`);
  });

  await page.goto(`http://127.0.0.1:${PORT}/${url.replace(/^\//, '')}`);
  const r = await page.eval(probeScreen, opt);
  const errs = page.consoleErrors()
    .filter((e) => e && !/Failed to load resource/i.test(e))
    .filter((e) => !BENIGN.some((b) => String(e).includes(b)))
    .concat(netErrors);
  results.runs++;
  if (shot) { await page.shot(path.join(SHOTS, `${shot}.png`)); results.shots++; }
  await page.close();
  return { r, errs, label };
}

const rows = [...(plan.screens || []), ...(plan.states || [])];
if (!rows.length) die('the plan drives nothing — no screens and no states');

for (const pass of passes) {
  if (!QUIET) console.log(`— pass: ${pass.name} ${pass.query ? `(${pass.query})` : ''} —————————————`);
  for (const row of rows) {
    const sep = row.url.includes('?') ? '&' : '?';
    const url = pass.query ? `${row.url}${sep}${pass.query}` : row.url;
    const tag = `${row.label || row.id}${pass.name === 'base' ? '' : ` [${pass.name}]`}`;
    const shot = `${(row.label || row.id).toLowerCase().replace(/[^\w-]+/g, '-')}${pass.name === 'base' ? '' : `-${pass.name.replace(/\W+/g, '-')}`}`;
    const { r, errs } = await drive(url, tag, shot);

    add(`${tag} paints`, r.painted, `painted=${r.painted} view=${r.view}`);
    add(`${tag} no console errors`, errs.length === 0, errs.join(' | '));
    add(`${tag} ${FLOOR}px targets`, r.small.length === 0, r.small.slice(0, 4).join(', '));
    add(`${tag} no h-overflow`, !r.overflow, r.overflow ? 'scrollWidth > clientWidth' : '');
    add(`${tag} no content spill`, r.spill.length === 0, r.spill.slice(0, 3).join(' | '));
    add(`${tag} contrast`, r.contrast.length === 0, r.contrast.slice(0, 3).join(' | '));
    if (SCRIPTS.length) add(`${tag} script fonts`, r.script.length === 0, r.script.slice(0, 3).join(' | '));
    if (row.id && r.sid) add(`${tag} id matches registry`, r.sid === row.id, `page prints ${r.sid}`);
    if (!QUIET) process.stdout.write(r.painted ? '.' : 'X');
  }
  if (!QUIET) console.log('');
}

results.sweeps = await sweepSource();
for (const f of results.sweeps.findings) add(`sweep ${f.kind} · ${f.file}`, false, f.detail);

proc.kill(); srv.kill();

writeFileSync(OUT, JSON.stringify(results, null, 1));
const pass = results.checks.length - results.defects.length;
console.log(`\n${pass} / ${results.checks.length} checks · ${results.runs} runs · ${results.shots} screenshots`);
console.log(`wrote ${path.relative(CFG.root, OUT)} · screenshots in ${path.relative(CFG.root, SHOTS)}`);
if (results.defects.length) {
  console.log(`\n${results.defects.length} defect(s) — per M3, confirm each at source before writing it into audit-report.md:`);
  for (const d of results.defects.slice(0, 40)) console.log(`  ✗ ${d.id}${d.detail ? ` — ${d.detail}` : ''}`);
}
console.log('\nM2: the screenshots are part of this audit. Read them before writing the verdict.');
process.exit(results.defects.length ? 1 : 0);
