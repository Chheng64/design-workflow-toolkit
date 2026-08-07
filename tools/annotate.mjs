#!/usr/bin/env node
/**
 * annotate.mjs — Developer-annotation validator (STATE 12 / DWF-05, E6).
 *
 * navgraph.mjs answers "which screen leads to which screen".
 * stategraph.mjs answers "within a screen, which states exist and what moves between them".
 * This answers the question a developer asks *at the connector*: when the app takes this
 * route, what kind of navigation is it, what moves on screen, what call does it make, and
 * what has to be true first — plus, per frame, who is allowed in and what the OS must grant.
 *
 * Two inputs:
 *   artifacts/navgraph.json          — the edge set (derived; this tool never invents an edge)
 *   reference/edge-annotations.json  — the four fields per edge + two per frame, each one
 *                                      carrying the artifact or `file.html:line` it came from
 *
 * The load-bearing rule is E6's: **`UNKNOWN` is a legal value and a guessed value is not.**
 * A blank field fails (V12). An `api` field filled with a plausible-looking endpoint is worse
 * than an empty one, because the developer will build it — so this tool re-runs the network
 * sweep itself rather than trusting the recorded claim, and it resolves every cited line
 * against the frozen bytes.
 *
 * Usage:
 *   node tools/annotate.mjs [--root <repo>] [--json <out.json>] [--md <out.md>]
 *                              [--fail-on blocking|major|advisory] [--quiet]
 *
 * Exit codes: 0 = no findings at or above --fail-on, 1 = findings, 2 = tool error.
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadConfig, parseArgs, SEVERITIES } from './config.mjs';

// ---------------------------------------------------------------- args + config

const { arg, has } = parseArgs();
const CFG = loadConfig(arg('--root', null));

const ROOT = CFG.root;
const ARTIFACTS = CFG.paths.artifacts;
const NAVGRAPH = path.join(ARTIFACTS, 'navgraph.json');
const ANNOTATIONS = CFG.paths.edgeAnnotations;
const PROTO_DIR = CFG.paths.prototype;
const OUT_JSON = arg('--json', path.join(ARTIFACTS, 'annotations.json'));
const OUT_MD = arg('--md', path.join(ARTIFACTS, 'annotate-report.md'));
const QUIET = has('--quiet');

const FAIL_ON = arg('--fail-on', 'blocking');

/** E6's closed value sets. Adding a value costs a justification in skills/12 §E6. */
const NAV_KINDS = new Set(['push', 'replace', 'modal', 'sheet', 'tab', 'back', 'deep-link', 'UNKNOWN']);

/** Files that live in the prototype dir but are review chrome, not product surface. */
const HARNESS_FILES = new Set([CFG.review.player, 'run-local.sh', 'serve.py']);
const AUTH_KINDS = new Set(['guest-ok', 'auth-required', 'premium', 'UNKNOWN']);

/** Anything that opens a socket or issues a request. Kept broad on purpose. */
const NETWORK_RE = /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource|\baxios\b|\$\.ajax\s*\(/;

// ---------------------------------------------------------------- helpers

const findings = [];
const finding = (severity, code, subject, detail) => findings.push({ severity, code, subject, detail });

const protoCache = new Map();
function protoLines(file) {
  if (!protoCache.has(file)) {
    const p = path.join(PROTO_DIR, file);
    protoCache.set(file, fs.existsSync(p) ? fs.readFileSync(p, 'utf8').split('\n') : null);
  }
  return protoCache.get(file);
}

/**
 * A source string is one of:
 *   `file.html:1234`            a line in the frozen bytes
 *   `file.html:12,34` / `12-34` several lines / a range in one file
 *   `flows-x.md D3`             a ratified guard in a flow document
 *   free text (`sweep 2026-…`, `o-n1`, …) — legal, and reported as unresolvable-by-tool
 * Returns {kind, ok, detail}.
 */
function resolveSource(src) {
  const cites = String(src).split('·').map((s) => s.trim()).filter(Boolean);
  let sawResolvable = false;
  for (const cite of cites) {
    const m = cite.match(/^([a-z0-9_-]+\.html):([0-9,\-\s]+)/i);
    if (m) {
      sawResolvable = true;
      const lines = protoLines(m[1]);
      if (!lines) return { ok: false, detail: `cited file \`${m[1]}\` is not in artifacts/prototype/` };
      for (const part of m[2].split(',')) {
        for (const n of part.split('-')) {
          const num = parseInt(n.trim(), 10);
          if (!Number.isFinite(num)) continue;
          if (num < 1 || num > lines.length)
            return { ok: false, detail: `\`${m[1]}:${num}\` is past the end of the file (${lines.length} lines)` };
          if (!lines[num - 1].trim())
            return { ok: false, detail: `\`${m[1]}:${num}\` is a blank line — the citation has drifted` };
        }
      }
      continue;
    }
    const d = cite.match(/^(flows[a-z0-9-]*\.md)\s+(D[0-9]+[a-z]?)/i);
    if (d) {
      sawResolvable = true;
      const p = path.join(ARTIFACTS, d[1]);
      if (!fs.existsSync(p)) return { ok: false, detail: `cited flow document \`${d[1]}\` does not exist` };
      const txt = fs.readFileSync(p, 'utf8');
      if (!new RegExp(`\\b${d[2]}\\b`).test(txt))
        return { ok: false, detail: `\`${d[1]}\` contains no guard \`${d[2]}\`` };
    }
  }
  return { ok: true, resolvable: sawResolvable };
}

function checkField(subject, name, field, opts = {}) {
  if (!field || typeof field !== 'object') {
    finding('blocking', 'E0-missing-field', subject, `no \`${name}\` annotation at all`);
    return false;
  }
  const v = field.value;
  if (v === undefined || v === null || String(v).trim() === '') {
    finding('blocking', 'E1-blank', subject, `\`${name}\` is blank — V12 requires a value; UNKNOWN is legal, blank is not`);
    return false;
  }
  if (!field.source || !String(field.source).trim()) {
    finding('major', 'E2-uncited', subject, `\`${name}\` = \`${v}\` carries no source — an annotation that cannot be traced is an assertion`);
    return false;
  }
  if (opts.enum && !opts.enum.has(v)) {
    finding('major', 'E3-enum', subject, `\`${name}\` = \`${v}\` is outside the closed set (${[...opts.enum].join(' · ')})`);
    return false;
  }
  const r = resolveSource(field.source);
  if (!r.ok) finding('major', 'E4-evidence', subject, `\`${name}\`: ${r.detail}`);
  return r.ok;
}

// ---------------------------------------------------------------- build

function build() {
  if (!fs.existsSync(NAVGRAPH)) throw new Error(`missing ${path.relative(ROOT, NAVGRAPH)} — run navgraph.mjs first`);
  if (!fs.existsSync(ANNOTATIONS)) throw new Error(`missing ${path.relative(ROOT, ANNOTATIONS)}`);
  const nav = JSON.parse(fs.readFileSync(NAVGRAPH, 'utf8'));
  const spec = JSON.parse(fs.readFileSync(ANNOTATIONS, 'utf8'));

  // -- A0: coverage. The edge set is navgraph's; this file may not add or drop one.
  const key = (e) => `${e.from}→${e.to}${e.label ? ` (${e.label})` : ''}`;
  const navKeys = nav.edges.map(key);
  const annKeys = (spec.edges || []).map(key);
  const seen = new Set();
  for (const k of annKeys) {
    if (seen.has(k)) finding('major', 'E5-duplicate', k, 'annotated twice — one edge, one annotation');
    seen.add(k);
  }
  for (const k of navKeys) if (!seen.has(k)) finding('blocking', 'E6-uncovered', k, 'edge in navgraph.json with no annotation');
  const navSet = new Set(navKeys);
  for (const k of annKeys) if (!navSet.has(k)) finding('major', 'E7-orphan', k, 'annotated edge that navgraph.json does not derive — fix the registry, not this file');

  // -- per-edge fields
  const byIndex = new Map(annKeys.map((k, i) => [k, spec.edges[i]]));
  const edges = [];
  for (const e of nav.edges) {
    const a = byIndex.get(key(e));
    if (!a) continue;
    const subject = key(e);
    checkField(subject, 'nav', a.nav, { enum: NAV_KINDS });
    checkField(subject, 'anim', a.anim);
    checkField(subject, 'api', a.api);
    checkField(subject, 'guard', a.guard);
    if (a.nav?.value === 'UNKNOWN')
      finding('major', 'E8-no-call-site', subject,
        `the registry derives this route and the frozen bytes contain no call site for it. ${a.nav.note || ''}`.trim());
    if (a.hook_only)
      finding('advisory', 'E13-hook-only', subject,
        `the route exists as a URL hook with no in-screen control behind it — navigable by QA, unreachable by a student. ${a.nav?.note || ''}`.trim());
    edges.push({ ...e, ...a });
  }

  // -- per-frame fields
  const frames = {};
  for (const n of nav.nodes) {
    const f = (spec.frames || {})[n.id];
    if (!f) { finding('blocking', 'E9-frame-uncovered', n.id, 'registry screen with no frame annotation'); continue; }
    checkField(n.id, 'auth', f.auth, { enum: AUTH_KINDS });
    checkField(n.id, 'perm', f.perm);
    frames[n.id] = { id: n.id, name: n.name, flow: n.flow, ...f };
  }
  for (const id of Object.keys(spec.frames || {}))
    if (!nav.nodes.some((n) => n.id === id)) finding('major', 'E10-frame-orphan', id, 'annotated frame that is not a registry screen');

  // -- A5: re-run the network sweep rather than trusting the recorded `api` claim
  const netHits = [];
  for (const file of fs.readdirSync(PROTO_DIR).filter((f) => f.endsWith('.html'))) {
    if (HARNESS_FILES.has(file)) continue;      // review harness, not the app surface
    (protoLines(file) || []).forEach((l, i) => { if (NETWORK_RE.test(l)) netHits.push(`${file}:${i + 1}`); });
  }
  const simulated = edges.filter((e) => /^none \(simulated\)/.test(e.api?.value || ''));
  if (netHits.length && simulated.length)
    finding('blocking', 'E11-api-claim', 'api column',
      `${simulated.length} edges claim \`none (simulated)\` and the sweep found ${netHits.length} network call site(s): ${netHits.slice(0, 5).join(', ')}`);

  // -- E12: an anim value naming an animation the cited file does not declare
  for (const e of edges) {
    const v = e.anim?.value || '';
    const m = v.match(/^([a-z][a-z0-9-]*)\s/i);
    const src = String(e.anim?.source || '').match(/^([a-z0-9_-]+\.html):/i);
    if (!m || !src || /^none/.test(v) || /^transform/.test(v) || /^UNKNOWN/.test(v)) continue;
    const lines = protoLines(src[1]);
    if (lines && !lines.some((l) => l.includes(`@keyframes ${m[1]}`)))
      finding('major', 'E12-anim-undeclared', key(e), `\`${m[1]}\` is not declared in \`${src[1]}\``);
  }

  // -- counts
  const tally = (arr, f) => arr.reduce((a, x) => { const k = f(x); a[k] = (a[k] || 0) + 1; return a; }, {});
  const counts = {
    edges: edges.length,
    frames: Object.keys(frames).length,
    nav: tally(edges, (e) => e.nav?.value),
    anim: tally(edges, (e) => e.anim?.value),
    api: tally(edges, (e) => e.api?.value),
    auth: tally(Object.values(frames), (f) => f.auth?.value),
    perm: tally(Object.values(frames), (f) => f.perm?.value),
    unknown: {
      nav: edges.filter((e) => e.nav?.value === 'UNKNOWN').length,
      anim: edges.filter((e) => e.anim?.value === 'UNKNOWN').length,
      api: edges.filter((e) => e.api?.value === 'UNKNOWN').length,
      guard: edges.filter((e) => e.guard?.value === 'UNKNOWN').length,
      auth: Object.values(frames).filter((f) => f.auth?.value === 'UNKNOWN').length,
      perm: Object.values(frames).filter((f) => f.perm?.value === 'UNKNOWN').length,
    },
    guardless: edges.filter((e) => e.guard?.value === 'none').length,
    networkCallSites: netHits.length,
  };

  return {
    generated_by: 'tools/annotate.mjs',
    inputs: {
      navgraph: path.relative(ROOT, NAVGRAPH),
      annotations: path.relative(ROOT, ANNOTATIONS),
      version: spec.version,
    },
    rules: spec.rules || [],
    counts,
    edges,
    frames,
    findings,
  };
}

// ---------------------------------------------------------------- report

function report(g) {
  const L = [];
  const T = (o) => Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  L.push('# Developer Annotations — derivation report (E6)', '');
  L.push(`_Generated by \`${g.generated_by}\` from \`${g.inputs.navgraph}\` + \`${g.inputs.annotations}\` (\`${g.inputs.version}\`)._`, '');
  L.push('## Counts', '');
  L.push('| Metric | Value |', '|---|---|');
  L.push(`| Edges annotated | ${g.counts.edges} |`);
  L.push(`| Frames annotated | ${g.counts.frames} |`);
  L.push(`| Edges with a guard | ${g.counts.edges - g.counts.guardless} |`);
  L.push(`| \`UNKNOWN\` values | nav ${g.counts.unknown.nav} · anim ${g.counts.unknown.anim} · api ${g.counts.unknown.api} · guard ${g.counts.unknown.guard} · auth ${g.counts.unknown.auth} · perm ${g.counts.unknown.perm} |`);
  L.push(`| Network call sites in the prototype set | **${g.counts.networkCallSites}** |`);
  L.push('');
  L.push('## Distribution', '');
  for (const [name, dist] of [['nav', g.counts.nav], ['anim', g.counts.anim], ['api', g.counts.api], ['auth (frames)', g.counts.auth], ['perm (frames)', g.counts.perm]]) {
    L.push(`**${name}**`, '', '| Value | Count |', '|---|---|');
    for (const [k, v] of T(dist)) L.push(`| \`${k}\` | ${v} |`);
    L.push('');
  }
  L.push('## Findings', '');
  if (!g.findings.length) L.push('None.', '');
  else {
    L.push('| Severity | Code | Subject | Detail |', '|---|---|---|---|');
    for (const s of SEVERITIES) for (const f of g.findings.filter((x) => x.severity === s))
      L.push(`| ${s} | \`${f.code}\` | ${f.subject} | ${f.detail} |`);
    L.push('');
  }
  L.push('## Edge annotations', '');
  let flow = null;
  for (const e of g.edges) {
    const f = e.from.split('-')[1];
    if (f !== flow) { flow = f; L.push(`### ${flow}`, '', '| Edge | nav | anim | api | guard |', '|---|---|---|---|---|'); }
    const cell = (x) => `\`${x.value}\`<br><sub>${x.source}</sub>`;
    L.push(`| ${e.from} → ${e.to}${e.label ? ` <sub>${e.label}</sub>` : ''} | ${cell(e.nav)} | ${cell(e.anim)} | ${cell(e.api)} | ${cell(e.guard)} |`);
  }
  L.push('');
  L.push('## Frame annotations', '');
  L.push('| Screen | auth | perm |', '|---|---|---|');
  for (const fr of Object.values(g.frames))
    L.push(`| ${fr.id} · ${fr.name} | \`${fr.auth.value}\` | \`${fr.perm.value}\` |`);
  L.push('');
  return L.join('\n');
}

// ---------------------------------------------------------------- main

let g;
try {
  g = build();
} catch (e) {
  console.error(`annotate: ${e.message}`);
  process.exit(2);
}

fs.writeFileSync(OUT_JSON, JSON.stringify(g, null, 2));
fs.writeFileSync(OUT_MD, report(g));

const cut = SEVERITIES.indexOf(FAIL_ON);
const failing = g.findings.filter((f) => SEVERITIES.indexOf(f.severity) <= cut);

if (!QUIET) {
  const c = (n) => g.findings.filter((f) => f.severity === n).length;
  console.log(`annotate: ${g.counts.edges} edges · ${g.counts.frames} frames · ${g.counts.networkCallSites} network call sites`);
  console.log(`findings: ${c('blocking')} blocking / ${c('major')} major / ${c('advisory')} advisory`);
  for (const f of g.findings) console.log(`  [${f.severity}] ${f.code} ${f.subject} — ${f.detail}`);
  console.log(`wrote ${path.relative(ROOT, OUT_JSON)} · ${path.relative(ROOT, OUT_MD)}`);
}

process.exit(failing.length ? 1 : 0);
