#!/usr/bin/env node
/**
 * stategraph.mjs — Per-screen state-machine extractor + validator (STATE 12 / DWF-05, E5).
 *
 * navgraph.mjs answers "which screen leads to which screen". This answers the
 * question one level down: *within* a screen, which states exist, what moves
 * the screen between them, and how does a developer or QA reach each one.
 *
 * Two inputs, and the split matters:
 *   reference/screen-registry.csv   — the canonical state SET per screen (owned by the
 *                                     registry; this tool never invents a state)
 *   reference/state-machines.json   — the transitions between those states, each one
 *                                     carrying a `evidence` file:line into the frozen
 *                                     prototype, and each state carrying the `hook`
 *                                     that drives it
 *
 * So the node set is derived and the edge set is authored-with-evidence. Every
 * authored claim is then checked back against the bytes: a transition whose
 * evidence line does not exist is a finding, and a hook whose parameter the page
 * never reads is a finding. An unverifiable diagram is the thing this file exists
 * to prevent.
 *
 * Usage:
 *   node tools/stategraph.mjs [--root <repo>] [--json <out.json>] [--md <out.md>]
 *                                [--fail-on blocking|major|advisory] [--quiet]
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
const MACHINES = CFG.paths.stateMachines;
const VOCAB = CFG.paths.vocabulary;
const PROTO_DIR = CFG.paths.prototype;
const ARTIFACTS = CFG.paths.artifacts;
const OUT_JSON = arg('--json', path.join(ARTIFACTS, 'stategraph.json'));
const OUT_MD = arg('--md', path.join(ARTIFACTS, 'statemap-report.md'));
const QUIET = has('--quiet');

const FAIL_ON = arg('--fail-on', 'blocking');

/* The term set is `CANON_STATES` in config.mjs — imported, not restated.
   navgraph.mjs enforces the same set, and the product's vocabulary file
   (`paths.vocabulary`) documents it; adding a term means editing that constant
   and that file. */

/** How a transition is caused. A trigger must declare one, so the diagram can class it. */
const TRIGGER_KINDS = new Set([
  'user',      // the student did something on this screen
  'system',    // time, a simulated response, a settle
  'entry',     // the state the screen is built in on arrival (guard on entry data)
  'data',      // a stored/profile value the screen reads
]);

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

const parseStates = (cell) =>
  (cell || '').split(',').map((s) => s.trim()).filter(Boolean);

// ---------------------------------------------------------------- sources

const srcCache = new Map();
function source(file) {
  if (srcCache.has(file)) return srcCache.get(file);
  const p = path.join(PROTO_DIR, file);
  const v = fs.existsSync(p)
    ? { text: fs.readFileSync(p, 'utf8'), lines: fs.readFileSync(p, 'utf8').split('\n').length }
    : null;
  srcCache.set(file, v);
  return v;
}

/** "home.html:1183" → {file,line} · a bare "home.html" is not enough to check. */
function parseEvidence(ev) {
  const m = String(ev || '').match(/^([\w.-]+\.html):(\d+)(?:-(\d+))?$/);
  return m ? { file: m[1], from: +m[2], to: m[3] ? +m[3] : +m[2] } : null;
}

/** "study.html?view=reward&skip=1" → the params it asks the page to read. */
function parseHook(hook) {
  const m = String(hook || '').match(/^([\w.-]+\.html)(?:\?(.*))?$/);
  if (!m) return null;
  const params = m[2]
    ? m[2].split('&').map((kv) => kv.split('=')[0]).filter(Boolean)
    : [];
  return { file: m[1], params };
}

// ---------------------------------------------------------------- build

function build() {
  if (!fs.existsSync(REGISTRY)) throw new Error(`registry not found: ${REGISTRY}`);
  if (!fs.existsSync(MACHINES)) throw new Error(`state machines not found: ${MACHINES}`);

  const rows = parseCSV(fs.readFileSync(REGISTRY, 'utf8'));
  const spec = JSON.parse(fs.readFileSync(MACHINES, 'utf8'));

  const findings = [];
  const F = (sev, code, subject, detail) =>
    findings.push({ severity: sev, code, subject, detail });

  const registry = new Map();
  for (const r of rows) {
    const id = (r.screen_id || '').trim();
    if (!id) continue;
    registry.set(id, {
      id,
      flow: r.flow || '',
      name: r.screen_name || '',
      states: parseStates(r.states),
    });
  }

  const machines = [];

  for (const [id, reg] of registry) {
    const m = spec.screens?.[id];
    if (!m) {
      F('blocking', 'S0-missing-machine', id,
        `${reg.states.length} state(s) in the registry and no machine authored — E5 cannot draw this screen`);
      continue;
    }

    const declared = new Set(Object.keys(m.states || {}));
    const regStates = new Set(reg.states);

    // S1 — the node set is the registry's, not the author's.
    for (const s of regStates)
      if (!declared.has(s))
        F('blocking', 'S1-node-missing', id, `registry declares '${s}'; the machine has no such node`);
    for (const s of declared)
      if (!regStates.has(s))
        F('blocking', 'S1-node-extra', id, `machine declares '${s}'; the registry does not — a state the registry has never seen`);

    // S1b — every node still has to be vocabulary-legal (N11 one level down).
    for (const s of declared) {
      const base = s.match(/^([a-z-]+)(?:\{([a-z0-9-]+)\})?$/);
      if (!base) F('major', 'S1-syntax', id, `'${s}' is not <canon> or <canon>{qualifier}`);
      else if (!CANON_STATES.has(base[1]))
        F('major', 'S1-vocab', id, `'${s}' uses non-canon term '${base[1]}'`);
    }

    // S2 — an initial state, and it must be a node.
    if (!m.initial) F('blocking', 'S2-no-initial', id, 'no initial state declared');
    else if (!declared.has(m.initial))
      F('blocking', 'S2-bad-initial', id, `initial '${m.initial}' is not one of the screen's states`);

    // S3 — transitions land on declared nodes and name a legal trigger kind.
    const T = m.transitions || [];
    for (const t of T) {
      if (!declared.has(t.from)) F('blocking', 'S3-bad-endpoint', id, `transition from unknown state '${t.from}'`);
      if (!declared.has(t.to)) F('blocking', 'S3-bad-endpoint', id, `transition to unknown state '${t.to}'`);
      if (!t.trigger) F('major', 'S3-no-trigger', id, `${t.from} → ${t.to} has no trigger`);
      if (!TRIGGER_KINDS.has(t.kind))
        F('major', 'S3-bad-kind', id, `${t.from} → ${t.to} kind '${t.kind}' is not one of ${[...TRIGGER_KINDS].join('/')}`);
    }

    // S4 — every transition's evidence resolves to a real line of the frozen bytes.
    for (const t of T) {
      if (!t.evidence) { F('major', 'S4-no-evidence', id, `${t.from} → ${t.to} cites no evidence`); continue; }
      const e = parseEvidence(t.evidence);
      if (!e) { F('major', 'S4-bad-evidence', id, `${t.from} → ${t.to} evidence '${t.evidence}' is not file.html:line`); continue; }
      const src = source(e.file);
      if (!src) F('major', 'S4-no-file', id, `${t.from} → ${t.to} cites ${e.file}, which is not in the prototype set`);
      else if (e.to > src.lines)
        F('major', 'S4-line-out-of-range', id, `${t.from} → ${t.to} cites ${t.evidence}; ${e.file} has ${src.lines} lines`);
    }

    // S5 — a state that claims a hook must claim one the page actually reads.
    for (const [s, node] of Object.entries(m.states || {})) {
      if (!node.hook) continue;
      const h = parseHook(node.hook);
      if (!h) { F('major', 'S5-bad-hook', id, `'${s}' hook '${node.hook}' is not page.html?a=b`); continue; }
      const src = source(h.file);
      if (!src) { F('major', 'S5-no-file', id, `'${s}' hook targets ${h.file}, not in the prototype set`); continue; }
      for (const p of h.params) {
        if (!new RegExp(`get\\(['"]${p}['"]\\)`).test(src.text))
          F('major', 'S5-dead-hook', id, `'${s}' hook asks for ?${p}=, which ${h.file} never reads`);
      }
    }

    // S6 — reachability. A state nobody can get to is a claim, not a state.
    const adj = new Map([...declared].map((s) => [s, []]));
    for (const t of T) if (adj.has(t.from) && declared.has(t.to)) adj.get(t.from).push(t.to);
    const seen = new Set([m.initial]);
    const stack = [m.initial];
    while (stack.length) {
      const cur = stack.pop();
      for (const nxt of adj.get(cur) || []) if (!seen.has(nxt)) { seen.add(nxt); stack.push(nxt); }
    }
    for (const s of declared) {
      if (seen.has(s)) continue;
      // A state reachable only by URL is legitimate (QA entry), but it must say so.
      if (m.states[s]?.entry_only) continue;
      // A state the registry declares and the bytes never render is the one case
      // worth surfacing rather than silently drawing: the diagram would otherwise
      // assert a screen behaviour that does not exist.
      if (m.states[s]?.unimplemented) continue;
      F('blocking', 'S6-unreachable', id, `'${s}' has no inbound transition and is not marked entry_only`);
    }

    // S7 — a non-terminal state should have a way out, or say why it has none.
    for (const s of declared) {
      const out = (adj.get(s) || []).length;
      if (out === 0 && !m.states[s]?.terminal && !m.states[s]?.unimplemented)
        F('advisory', 'S7-dead-end', id, `'${s}' has no outbound transition and is not marked terminal`);
    }

    // S9 — registry says the state exists; the prototype does not render it.
    for (const [s, node] of Object.entries(m.states || {})) {
      if (!node.unimplemented) continue;
      if (!node.reason)
        F('major', 'S9-no-reason', id, `'${s}' is marked unimplemented with no reason — the absence must be evidenced`);
      else
        F('advisory', 'S9-unimplemented', id, `'${s}' is declared in the registry and not rendered by the prototype — ${node.reason}`);
    }

    machines.push({
      id, flow: reg.flow, name: reg.name,
      initial: m.initial,
      note: m.note || null,
      states: Object.entries(m.states || {}).map(([s, n]) => ({
        state: s, hook: n.hook || null, note: n.note || null,
        entry_only: !!n.entry_only, terminal: !!n.terminal,
        unimplemented: !!n.unimplemented, reason: n.reason || null,
        reachable: seen.has(s),
      })),
      transitions: T.map((t) => ({ ...t })),
    });
  }

  // A machine authored for a screen the registry does not have.
  for (const id of Object.keys(spec.screens || {}))
    if (!registry.has(id))
      F('blocking', 'S0-unknown-screen', id, 'machine authored for a screen id the registry does not contain');

  // S8 — the registry id and the id the prototype prints in its `sid()` readout
  // disagree. Every state below was authored against the REGISTRY id; the drift is
  // carried here rather than resolved, because renumbering is a registry decision.
  for (const c of spec.id_conflicts || [])
    F('advisory', 'S8-id-drift', c.screen,
      `registry ${c.screen} is implemented by the '${c.prototype_view}' view, which prints '${c.prototype_sid}' — ${c.note}`);

  const stateUse = {};
  for (const m of machines) for (const s of m.states) stateUse[s.state] = (stateUse[s.state] || 0) + 1;

  return {
    generated_by: 'tools/stategraph.mjs',
    inputs: {
      registry: path.relative(ROOT, REGISTRY),
      machines: path.relative(ROOT, MACHINES),
      vocabulary: fs.existsSync(VOCAB) ? path.relative(ROOT, VOCAB) : null,
    },
    counts: {
      screens: machines.length,
      states: machines.reduce((a, m) => a + m.states.length, 0),
      transitions: machines.reduce((a, m) => a + m.transitions.length, 0),
      multiState: machines.filter((m) => m.states.length > 1).length,
      singleState: machines.filter((m) => m.states.length === 1).length,
      hooked: machines.reduce((a, m) => a + m.states.filter((s) => s.hook).length, 0),
    },
    stateUse,
    id_conflicts: spec.id_conflicts || [],
    machines,
    findings,
  };
}

// ---------------------------------------------------------------- report

function report(g) {
  const sev = (s) => g.findings.filter((f) => f.severity === s);
  const L = [];
  L.push('# Screen State Machines — derivation report', '');
  L.push(`_Generated by \`${g.generated_by}\` from \`${g.inputs.registry}\` + \`${g.inputs.machines}\`._`, '');
  L.push('## Counts', '');
  L.push('| Metric | Value |', '|---|---|');
  L.push(`| Screens | ${g.counts.screens} |`);
  L.push(`| States | ${g.counts.states} |`);
  L.push(`| Transitions | ${g.counts.transitions} |`);
  L.push(`| Multi-state screens | ${g.counts.multiState} |`);
  L.push(`| Single-state screens | ${g.counts.singleState} |`);
  L.push(`| States with a QA hook | ${g.counts.hooked} |`);
  L.push('');
  L.push('## Findings', '');
  if (!g.findings.length) L.push('None.', '');
  else {
    L.push('| Severity | Code | Screen | Detail |', '|---|---|---|---|');
    for (const s of SEVERITIES)
      for (const f of sev(s)) L.push(`| ${s} | \`${f.code}\` | ${f.subject} | ${f.detail} |`);
    L.push('');
  }
  if (g.id_conflicts.length) {
    L.push('## Registry ↔ prototype id drift', '');
    L.push('Every machine below is authored against the **registry** id. Where the prototype’s');
    L.push('own `sid()` readout prints a different id for the view that implements it, the pair is');
    L.push('recorded here rather than reconciled — renumbering is a registry decision, not this tool’s.', '');
    L.push('| Registry id | Prototype view | Prints | Note |', '|---|---|---|---|');
    for (const c of g.id_conflicts)
      L.push(`| ${c.screen} | \`${c.prototype_view}\` | \`${c.prototype_sid}\` | ${c.note} |`);
    L.push('');
  }
  L.push('## Per-screen machines', '');
  let flow = null;
  for (const m of g.machines) {
    if (m.flow !== flow) { flow = m.flow; L.push(`### ${flow}`, ''); }
    L.push(`**${m.id} · ${m.name}** — initial \`${m.initial}\`, ${m.states.length} state(s), ${m.transitions.length} transition(s)`, '');
    if (m.note) L.push(`_${m.note}_`, '');
    L.push('| State | Hook | Flags |', '|---|---|---|');
    for (const s of m.states) {
      const flags = [
        s.entry_only ? 'entry-only' : '',
        s.terminal ? 'terminal' : '',
        s.unimplemented ? 'NOT IMPLEMENTED' : '',
      ].filter(Boolean).join(', ');
      L.push(`| \`${s.state}\` | ${s.hook ? `\`${s.hook}\`` : '—'} | ${flags || '—'} |`);
    }
    L.push('');
    if (m.transitions.length) {
      L.push('| From | → | To | Trigger | Kind | Evidence |', '|---|---|---|---|---|---|');
      for (const t of m.transitions)
        L.push(`| \`${t.from}\` | → | \`${t.to}\` | ${t.trigger} | ${t.kind} | \`${t.evidence}\` |`);
      L.push('');
    }
  }
  L.push('## State usage across the product', '');
  L.push('| State | Screens |', '|---|---|');
  for (const [s, n] of Object.entries(g.stateUse).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])))
    L.push(`| \`${s}\` | ${n} |`);
  L.push('');
  return L.join('\n');
}

// ---------------------------------------------------------------- main

let g;
try {
  g = build();
} catch (e) {
  console.error(`stategraph: ${e.message}`);
  process.exit(2);
}

fs.writeFileSync(OUT_JSON, JSON.stringify(g, null, 2));
fs.writeFileSync(OUT_MD, report(g));

const cut = SEVERITIES.indexOf(FAIL_ON);
const failing = g.findings.filter((f) => SEVERITIES.indexOf(f.severity) <= cut);

if (!QUIET) {
  const c = (n) => g.findings.filter((f) => f.severity === n).length;
  console.log(
    `stategraph: ${g.counts.screens} screens · ${g.counts.states} states · ` +
    `${g.counts.transitions} transitions · ${g.counts.hooked} hooked`);
  console.log(`findings: ${c('blocking')} blocking / ${c('major')} major / ${c('advisory')} advisory`);
  for (const f of g.findings) console.log(`  [${f.severity}] ${f.code} ${f.subject} — ${f.detail}`);
  console.log(`wrote ${path.relative(ROOT, OUT_JSON)} · ${path.relative(ROOT, OUT_MD)}`);
}

process.exit(failing.length ? 1 : 0);
