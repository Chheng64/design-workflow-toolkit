#!/usr/bin/env node
/**
 * navgraph.mjs — Navigation graph extractor + validator (STATE 12 / DWF-05).
 *
 * Reads the canonical screen registry (and, when present, the prototype pages
 * and per-flow handoffs) and derives the machine-checkable navigation model
 * that the Figma flow visualization is generated from and validated against.
 *
 * It is deliberately a *derivation*, not an authoring surface: every edge it
 * emits is traceable to a registry cell. If the diagram and this output
 * disagree, the diagram is wrong.
 *
 * Usage:
 *   node tools/navgraph.mjs [--root <repo>] [--json <out.json>] [--md <out.md>]
 *                              [--fail-on blocking|major|advisory] [--quiet]
 *
 * Exit codes: 0 = no findings at or above --fail-on, 1 = findings, 2 = tool error.
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadConfig, parseArgs, SEVERITIES, CANON_STATES } from './config.mjs';

// ---------------------------------------------------------------- args + config

const { arg, has } = parseArgs();
const CFG = loadConfig(arg('--root', null));

const ROOT = CFG.root;
const REGISTRY = CFG.paths.registry;
const LANES = CFG.paths.lanes;
const PROTO_DIR = CFG.paths.prototype;
const ARTIFACTS = CFG.paths.artifacts;
const OUT_JSON = arg('--json', path.join(ARTIFACTS, 'navgraph.json'));
const OUT_MD = arg('--md', path.join(ARTIFACTS, 'navmap-report.md'));
const QUIET = has('--quiet');

/** Severity ladder (from config.mjs). `--fail-on` names the lowest rung that fails. */
const FAIL_ON = arg('--fail-on', 'blocking');

// Tokens that are legitimately not screens. Anything else that fails to parse
// is reported, never silently dropped.
const EXTERNALS = new Set([
  'app launch', 'app-launch', 'cold launch', 'exit', 'app exit', 'os back',
  'deep link', 'push notification', 'external', 'browser', 'system',
]);

// A screen that terminates on purpose declares it here, with the reason.
// Absence from this map is what turns a terminal into a finding.
const TERMINAL_JUSTIFICATIONS = {};

// ---------------------------------------------------------------- csv

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

// ---------------------------------------------------------------- ids

const ID_RE = /\b(?:S-)?([A-Z]{3,8}-\d{1,2}[A-Z]?)\b/g;

const norm = (id) => id.replace(/^S-/, '').toUpperCase();
const full = (id) => `S-${norm(id)}`;

/** Split a registry nav cell into tokens, then each token into ids + label. */
function parseNavCell(cell) {
  const out = { edges: [], externals: [], unparsed: [] };
  if (!cell) return out;
  for (const raw of cell.split('|').map((t) => t.trim()).filter(Boolean)) {
    const labelMatch = raw.match(/\(([^)]*)\)/);
    const label = labelMatch ? labelMatch[1].trim() : '';
    const ids = [...raw.matchAll(ID_RE)].map((m) => m[1]);
    if (ids.length) {
      for (const id of ids) out.edges.push({ id: full(id), label, token: raw });
      // A token like "START-02/03 skip" carries a second id our pattern cannot
      // see. Report the residue rather than pretending the token was clean.
      const residue = raw.replace(ID_RE, '').replace(/\([^)]*\)/g, '').trim();
      if (/\d/.test(residue)) out.unparsed.push(raw);
    } else if (EXTERNALS.has(raw.toLowerCase())) {
      out.externals.push(raw);
    } else {
      out.unparsed.push(raw);
    }
  }
  return out;
}

const allStatesEarly = (nodes) => {
  const h = {};
  for (const n of nodes.values()) for (const s of n.states) h[s] = (h[s] || 0) + 1;
  return h;
};

const parseStates = (cell) =>
  (cell || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// ---------------------------------------------------------------- lanes

/**
 * E1 swimlanes. The registry has no actor column, so lanes come from an
 * explicit override file. Anything unassigned is reported as unassigned —
 * it is never guessed into a lane, because a wrong lane reads as a ruling.
 */
function loadLanes() {
  if (!fs.existsSync(LANES)) return { map: {}, present: false };
  try {
    const j = JSON.parse(fs.readFileSync(LANES, 'utf8'));
    const map = {};
    for (const [lane, ids] of Object.entries(j.lanes || {}))
      for (const id of ids) map[full(id)] = lane;
    return { map, present: true, order: j.order || Object.keys(j.lanes || {}) };
  } catch (e) {
    return { map: {}, present: false, error: String(e.message) };
  }
}

// ---------------------------------------------------------------- deep links

/**
  * Which prototype page implements which screen-id prefix.
  *
  * Derived, not hardcoded: for prefix `ONB` the page is `onb.html` unless
  * `toolkit.config.json` → `flowPages` says otherwise. A prefix with no page is
  * NOT silently skipped — it becomes an N9 finding, because "this flow cannot be
  * re-driven after handoff" is exactly what E4 exists to report.
  */
function flowPageMap(prefixes) {
  const override = CFG.flowPages || {};
  const map = {};
  for (const prefix of prefixes) {
    map[prefix] = override[prefix] || `${prefix.toLowerCase()}.html`;
  }
  return map;
}

/** E4: the query-param hooks each prototype page actually reads. */
function scanDeepLinks(prefixes) {
  const hooks = {};
  if (!fs.existsSync(PROTO_DIR)) return hooks;
  for (const [prefix, file] of Object.entries(flowPageMap(prefixes))) {
    const p = path.join(PROTO_DIR, file);
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    const params = new Set(
      [...src.matchAll(/\.get\(['"]([a-zA-Z_][\w]*)['"]\)/g)].map((m) => m[1]),
    );
    hooks[prefix] = { page: file, params: [...params].sort() };
  }
  return hooks;
}

// ---------------------------------------------------------------- build

function build() {
  if (!fs.existsSync(REGISTRY)) {
    console.error(`navgraph: registry not found at ${REGISTRY}`);
    process.exit(2);
  }
  const rows = parseCSV(fs.readFileSync(REGISTRY, 'utf8'));
  const lanes = loadLanes();
  const prefixes = [...new Set(rows.map((r) => norm(r.screen_id).split('-')[0]))];
  const hooks = scanDeepLinks(prefixes);

  const nodes = new Map();
  for (const r of rows) {
    const id = full(r.screen_id);
    nodes.set(id, {
      id,
      name: r.screen_name,
      flow: r.flow,
      prefix: norm(id).split('-')[0],
      status: r.status,
      states: parseStates(r.states),
      lane: lanes.map[id] || null,
      purpose: r.purpose,
      raw: { entry_from: r.entry_from, navigates_to: r.navigates_to },
      out: [], in: [],
    });
  }

  const edges = [];
  const findings = [];
  const F = (sev, code, subject, detail) =>
    findings.push({ severity: sev, code, subject, detail });

  const entryPoints = new Set();
  const unparsedCells = [];

  for (const r of rows) {
    const from = full(r.screen_id);
    const node = nodes.get(from);

    const nav = parseNavCell(r.navigates_to);
    for (const e of nav.edges) {
      if (!nodes.has(e.id)) {
        F('blocking', 'N1-broken-edge', `${from} → ${e.id}`,
          `navigates_to names a screen that is not in the registry (token: "${e.token}")`);
        continue;
      }
      edges.push({ from, to: e.id, label: e.label, source: 'navigates_to' });
    }
    for (const x of nav.unparsed)
      unparsedCells.push({ screen: from, field: 'navigates_to', token: x });

    const ent = parseNavCell(r.entry_from);
    if (ent.externals.length) entryPoints.add(from);
    for (const e of ent.edges) {
      if (!nodes.has(e.id)) {
        F('blocking', 'N1-broken-edge', `${e.id} → ${from}`,
          `entry_from names a screen that is not in the registry (token: "${e.token}")`);
        continue;
      }
      node.declaredEntries ??= [];
      node.declaredEntries.push({ id: e.id, label: e.label });
    }
    for (const x of ent.unparsed)
      unparsedCells.push({ screen: from, field: 'entry_from', token: x });
  }

  // dedupe edges (same from/to keeps the first label, records the rest)
  const seen = new Map();
  for (const e of edges) {
    const k = `${e.from}→${e.to}`;
    if (!seen.has(k)) seen.set(k, { ...e, labels: e.label ? [e.label] : [] });
    else if (e.label && !seen.get(k).labels.includes(e.label)) seen.get(k).labels.push(e.label);
  }
  const E = [...seen.values()];

  for (const e of E) {
    nodes.get(e.from).out.push(e.to);
    nodes.get(e.to).in.push(e.from);
    e.crossFlow = nodes.get(e.from).flow !== nodes.get(e.to).flow;
  }

  // N3 — declared entry_from with no matching navigates_to edge (and back)
  for (const n of nodes.values()) {
    for (const d of n.declaredEntries || []) {
      if (!E.some((e) => e.from === d.id && e.to === n.id))
        F('major', 'N3-asymmetric', `${d.id} → ${n.id}`,
          `${n.id}.entry_from claims ${d.id}, but ${d.id}.navigates_to does not name ${n.id}`);
    }
  }
  for (const e of E) {
    const t = nodes.get(e.to);
    const declared = (t.declaredEntries || []).some((d) => d.id === e.from);
    if (!declared)
      F('advisory', 'N3b-backedge', `${e.from} → ${e.to}`,
        `${e.from}.navigates_to names ${e.to}, but ${e.to}.entry_from does not name ${e.from}`);
  }

  // N2 — reachability. An inbound-only-declared screen is reachable in the
  // product and broken in the registry; that is a different defect from a
  // screen nothing routes to at all, and it gets a different severity.
  for (const n of nodes.values()) {
    if (n.in.length || entryPoints.has(n.id)) continue;
    if ((n.declaredEntries || []).length)
      F('major', 'N2b-inbound-only-declared', n.id,
        `reachable only via entry_from (${n.declaredEntries.map((d) => d.id).join(', ')}); ` +
        'no source screen names it in navigates_to, so the forward edge cannot be drawn');
    else
      F('blocking', 'N2-orphan', n.id,
        'no inbound edge and no external entry point — screen is unreachable');
  }

  // N4 — unjustified terminals
  for (const n of nodes.values()) {
    if (n.out.length === 0 && !TERMINAL_JUSTIFICATIONS[n.id])
      F('major', 'N4-terminal', n.id,
        'no outbound edge and no terminal justification recorded');
  }

  // N8 — lane coverage
  const unassigned = [...nodes.values()].filter((n) => !n.lane);
  if (unassigned.length)
    F(lanes.present ? 'major' : 'advisory', 'N8-lane', `${unassigned.length} screens`,
      lanes.present
        ? `no lane in reference/nav-lanes.json: ${unassigned.map((n) => n.id).join(', ')}`
        : 'reference/nav-lanes.json absent — swimlane layout (E1) cannot be generated');

  // N9 — deep-link hook coverage
  for (const prefix of [...new Set([...nodes.values()].map((n) => n.prefix))].sort()) {
    if (!hooks[prefix])
      F('advisory', 'N9-deeplink', prefix,
        `no prototype page resolved for prefix ${prefix} — deep-link column (E4) will be empty`);
    else if (!hooks[prefix].params.length)
      F('major', 'N9-deeplink', prefix,
        `${hooks[prefix].page} exposes no query hook at all — no screen in this flow is ` +
        'directly addressable, so its states cannot be re-driven after handoff');
    else if (!hooks[prefix].params.includes('view'))
      F('advisory', 'N9-deeplink', prefix,
        `${hooks[prefix].page} exposes no ?view hook — screens in this flow are not directly addressable`);
  }

  // N11 — state vocabulary. E5 needs a closed set; free-text state labels
  // cannot be diagrammed as a shared state machine. Syntax is `canon` or
  // `canon{qualifier}`. The term set is `CANON_STATES` in config.mjs — one
  // definition, because stategraph.mjs enforces the same set and the product's
  // vocabulary file documents it. See reference/state-vocabulary.md for the
  // original → normalized mapping.
  const STATE_RE = /^([a-z-]+)(?:\{([a-z0-9-]+)\})?$/;
  const offVocab = [], malformed = [];
  for (const s of Object.keys(allStatesEarly(nodes))) {
    const m = STATE_RE.exec(s);
    if (!m) { malformed.push(s); continue; }
    if (!CANON_STATES.has(m[1])) offVocab.push(s);
  }
  if (offVocab.length)
    F('advisory', 'N11-state-vocab', `${offVocab.length} labels`,
      `state labels outside the canonical set: ${offVocab.map((s) => `"${s}"`).join(', ')}`);
  if (malformed.length)
    F('advisory', 'N11-state-syntax', `${malformed.length} labels`,
      `not \`canon\` or \`canon{qualifier}\`: ${malformed.map((s) => `"${s}"`).join(', ')}`);

  for (const u of unparsedCells)
    F('advisory', 'N10-unparsed', u.screen,
      `${u.field} token not fully machine-readable: "${u.token}"`);

  // E3 — heatmap (in-degree, weighted by distinct source flows)
  const heat = [...nodes.values()]
    .map((n) => ({
      id: n.id, name: n.name, flow: n.flow,
      inDegree: n.in.length,
      outDegree: n.out.length,
      sourceFlows: new Set(n.in.map((i) => nodes.get(i).flow)).size,
    }))
    .sort((a, b) => b.inDegree - a.inDegree || b.sourceFlows - a.sourceFlows);

  // E2 — cross-feature map
  const cross = E.filter((e) => e.crossFlow).map((e) => ({
    from: e.from, to: e.to,
    fromFlow: nodes.get(e.from).flow, toFlow: nodes.get(e.to).flow,
    labels: e.labels,
  }));

  // E5 — state inventory
  const stateInventory = [...nodes.values()].map((n) => ({
    id: n.id, states: n.states, count: n.states.length,
  }));
  const allStates = {};
  for (const n of nodes.values())
    for (const s of n.states) allStates[s] = (allStates[s] || 0) + 1;

  return {
    meta: {
      root: path.relative(process.cwd(), ROOT) || '.',
      registry: path.relative(ROOT, REGISTRY),
      screens: nodes.size,
      edges: E.length,
      crossFlowEdges: cross.length,
      flows: [...new Set([...nodes.values()].map((n) => n.flow))].sort(),
      entryPoints: [...entryPoints],
      lanesFile: lanes.present,
    },
    nodes: [...nodes.values()].map(({ raw, declaredEntries, ...n }) => n),
    edges: E,
    crossFlow: cross,
    heat,
    states: { perScreen: stateInventory, histogram: allStates },
    deepLinks: hooks,
    findings,
  };
}

// ---------------------------------------------------------------- report

function report(g) {
  const sev = (s) => g.findings.filter((f) => f.severity === s);
  const L = [];
  L.push('# Navigation Graph Report');
  L.push('');
  L.push(`_Derived from \`${g.meta.registry}\` by \`tools/navgraph.mjs\`. Every edge below`);
  L.push('traces to a registry cell — this file is evidence, not authoring._');
  L.push('');
  L.push('| Metric | Value |');
  L.push('|---|---|');
  L.push(`| Screens | ${g.meta.screens} |`);
  L.push(`| Flows | ${g.meta.flows.length} |`);
  L.push(`| Navigation edges | ${g.meta.edges} |`);
  L.push(`| Cross-feature edges | ${g.meta.crossFlowEdges} |`);
  L.push(`| Entry points | ${g.meta.entryPoints.join(', ') || '—'} |`);
  for (const s of SEVERITIES)
    L.push(`| ${s[0].toUpperCase() + s.slice(1)} findings | ${sev(s).length} |`);
  L.push('');

  L.push('## Findings');
  L.push('');
  if (!g.findings.length) L.push('None.');
  else {
    L.push('| Severity | Code | Subject | Detail |');
    L.push('|---|---|---|---|');
    for (const f of SEVERITIES)
      for (const x of sev(f))
        L.push(`| ${f} | ${x.code} | \`${x.subject}\` | ${x.detail} |`);
  }
  L.push('');

  L.push('## Navigation heatmap (E3)');
  L.push('');
  L.push('| Screen | Name | Flow | In | Out | Source flows |');
  L.push('|---|---|---|---|---|---|');
  for (const h of g.heat.slice(0, 15))
    L.push(`| \`${h.id}\` | ${h.name} | ${h.flow} | **${h.inDegree}** | ${h.outDegree} | ${h.sourceFlows} |`);
  L.push('');

  L.push('## Cross-feature edges (E2)');
  L.push('');
  if (!g.crossFlow.length) L.push('None.');
  else {
    L.push('| From | To | From flow | To flow | Label |');
    L.push('|---|---|---|---|---|');
    for (const c of g.crossFlow)
      L.push(`| \`${c.from}\` | \`${c.to}\` | ${c.fromFlow} | ${c.toFlow} | ${c.labels.join(' · ') || '—'} |`);
  }
  L.push('');

  L.push('## State inventory (E5)');
  L.push('');
  L.push('| State | Screens |');
  L.push('|---|---|');
  for (const [s, n] of Object.entries(g.states.histogram).sort((a, b) => b[1] - a[1]))
    L.push(`| ${s} | ${n} |`);
  L.push('');

  L.push('## Deep-link hooks (E4)');
  L.push('');
  L.push('| Flow prefix | Page | Query hooks |');
  L.push('|---|---|---|');
  for (const [p, h] of Object.entries(g.deepLinks))
    L.push(`| ${p} | \`${h.page}\` | ${h.params.map((x) => `\`?${x}\``).join(' ')} |`);
  L.push('');

  return L.join('\n');
}

// ---------------------------------------------------------------- main

const g = build();
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(g, null, 2));
fs.writeFileSync(OUT_MD, report(g));

const cut = SEVERITIES.indexOf(FAIL_ON);
if (cut === -1) {
  console.error(`navgraph: --fail-on must be one of ${SEVERITIES.join('|')}`);
  process.exit(2);
}
const failing = g.findings.filter((f) => SEVERITIES.indexOf(f.severity) <= cut);

if (!QUIET) {
  const c = (n) => g.findings.filter((f) => f.severity === n).length;
  console.log(
    `navgraph: ${g.meta.screens} screens · ${g.meta.edges} edges · ` +
    `${g.meta.crossFlowEdges} cross-feature · ` +
    `findings ${SEVERITIES.map((s) => `${c(s)} ${s}`).join(' / ')}`,
  );
  console.log(`  → ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`  → ${path.relative(ROOT, OUT_MD)}`);
  for (const f of failing.filter((f) => f.severity !== 'advisory'))
    console.log(`  ${f.severity.toUpperCase()} ${f.code} ${f.subject}: ${f.detail}`);
}
process.exit(failing.length ? 1 : 0);
