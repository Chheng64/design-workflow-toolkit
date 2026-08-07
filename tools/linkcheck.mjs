#!/usr/bin/env node
/**
 * linkcheck.mjs — documentation integrity: every internal link resolves.
 *
 * Why this is a tool and not a chore. This repository's documentation is a
 * navigable set, not a pile of files: a skill README points at its spec, the
 * spec points back, the workflow guide points at both. A broken link in that set
 * is the same class of defect as a dead deep-link hook in a prototype — the
 * structure claims a destination that is not there — and the toolkit's own rule
 * is that a claim nobody re-checks is a claim that rots. `M6`: record what you
 * cannot verify; do not assert it.
 *
 * Scope, stated because a scope claim belongs inside the claim:
 *   - Internal links only. `http(s):` and `mailto:` targets are NOT fetched —
 *     network state is not a property of this repository, and a check that fails
 *     on someone else's outage teaches readers to ignore it.
 *   - Links inside fenced code blocks are skipped. They are examples, not links.
 *   - Anchors are resolved against the target file's headings, using GitHub's
 *     slug rule including its `-1`, `-2` disambiguation for repeated headings.
 *
 * Usage:
 *   node tools/linkcheck.mjs [--root <repo>] [--fail-on <blocking|major|advisory>]
 *                            [--json <out.json>] [--quiet]
 *
 * Findings:
 *   D1-missing   blocking   link target file or directory does not exist
 *   D2-anchor    blocking   fragment has no matching heading in the target
 *   D3-dir       advisory   link to a directory that has no README.md to render
 *
 * Exit codes: 0 = nothing at or above --fail-on, 1 = findings, 2 = tool error.
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadConfig, parseArgs, SEVERITIES } from './config.mjs';

const { arg, has } = parseArgs();
const QUIET = has('--quiet');
const FAIL_ON = arg('--fail-on', 'blocking');
const OUT_JSON = arg('--json', null);

const die = (m) => { console.error(`linkcheck: ${m}`); process.exit(2); };

if (!SEVERITIES.includes(FAIL_ON)) die(`--fail-on must be one of ${SEVERITIES.join(', ')}`);

let ROOT;
try { ROOT = loadConfig(arg('--root', null)).root; } catch (e) { die(e.message); }
if (!fs.existsSync(ROOT)) die(`root not found: ${ROOT}`);

const SKIP_DIRS = new Set(['.git', 'node_modules', '.DS_Store']);
const rel = (p) => path.relative(ROOT, p) || '.';

const findings = [];
const F = (severity, code, subject, detail) => findings.push({ severity, code, subject, detail });

// ------------------------------------------------------------------ discovery

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { die(`cannot read ${rel(dir)}: ${e.message}`); }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const files = walk(ROOT).sort();
if (!files.length) die(`no markdown files under ${rel(ROOT)}`);

// ------------------------------------------------------------------ parsing
//
// One pass per file yields both the heading set and the link list, because both
// need the same fenced-block state and reading the file twice invites the two
// passes to disagree about where a fence started.

/** GitHub's heading slug: lowercase, drop everything that is not word/space/hyphen,
 *  trim, then replace each space with a hyphen. Repeats get `-1`, `-2`, … in
 *  document order.
 *
 *  The per-character replacement is the part that is easy to get wrong, and
 *  getting it wrong is worse than not checking. `## 1 · High-level architecture`
 *  loses the `·` and keeps BOTH surrounding spaces, so the anchor is
 *  `#1--high-level-architecture` with two hyphens. Collapsing whitespace here
 *  reports 167 correct links as broken — which is exactly the recurring false
 *  positive that teaches a reader to stop reading the report (M3). */
const slugify = (h) => h.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s/g, '-');

const LINK_RE = /\[([^\]]*)\]\(([^)\s]+)\)/g;

function parse(file) {
  let src;
  try { src = fs.readFileSync(file, 'utf8'); }
  catch (e) { die(`cannot read ${rel(file)}: ${e.message}`); }

  const anchors = new Set();
  const seen = new Map();
  const links = [];
  let fence = null;

  src.split('\n').forEach((line, i) => {
    const f = /^\s*(```+|~~~+)/.exec(line);
    if (f) {
      if (fence === null) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
      return;
    }
    if (fence !== null) return;

    const h = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) {
      const base = slugify(h[2]);
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      anchors.add(n === 0 ? base : `${base}-${n}`);
      return;
    }

    for (const m of line.matchAll(LINK_RE)) links.push({ target: m[2], line: i + 1 });
  });

  return { anchors, links };
}

const parsed = new Map(files.map((f) => [f, parse(f)]));

// ------------------------------------------------------------------ resolution

let checked = 0;

for (const file of files) {
  const { links } = parsed.get(file);
  const where = (l) => `${rel(file)}:${l.line}`;

  for (const l of links) {
    if (/^(https?:|mailto:|tel:|data:)/i.test(l.target)) continue;   // out of scope, by design
    checked++;

    // A bare fragment resolves inside this file.
    if (l.target.startsWith('#')) {
      const frag = decodeURIComponent(l.target.slice(1));
      if (!parsed.get(file).anchors.has(frag))
        F('blocking', 'D2-anchor', where(l), `no heading in this file produces "#${frag}"`);
      continue;
    }

    const [relPath, frag] = l.target.split('#');
    const abs = path.resolve(path.dirname(file), decodeURIComponent(relPath));

    if (!fs.existsSync(abs)) {
      F('blocking', 'D1-missing', where(l), `target does not exist: ${l.target}`);
      continue;
    }

    if (fs.statSync(abs).isDirectory()) {
      if (!fs.existsSync(path.join(abs, 'README.md')))
        F('advisory', 'D3-dir', where(l),
          `${l.target} is a directory with no README.md — it renders as a file listing`);
      continue;
    }

    if (!frag) continue;
    if (!abs.endsWith('.md')) continue;   // a fragment on a non-markdown target is not ours to resolve

    const target = parsed.get(abs);
    if (!target) continue;                // outside the scanned tree
    if (!target.anchors.has(decodeURIComponent(frag)))
      F('blocking', 'D2-anchor', where(l), `${relPath} has no heading producing "#${frag}"`);
  }
}

// ------------------------------------------------------------------ report

const order = (s) => SEVERITIES.indexOf(s);
findings.sort((a, b) => order(a.severity) - order(b.severity) || a.subject.localeCompare(b.subject));

const counts = Object.fromEntries(SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s).length]));

if (!QUIET) {
  for (const f of findings) console.log(`${f.severity.padEnd(8)} ${f.code.padEnd(12)} ${f.subject}  —  ${f.detail}`);
  const broken = counts.blocking + counts.major;
  console.log(`\n${checked - broken}/${checked} internal links resolve · ` +
              `${counts.blocking} blocking · ${counts.major} major · ${counts.advisory} advisory ` +
              `· ${files.length} files`);
}

if (OUT_JSON) {
  try {
    fs.mkdirSync(path.dirname(path.resolve(OUT_JSON)), { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify({ root: ROOT, files: files.length, checked, counts, findings }, null, 2));
  } catch (e) { die(`cannot write ${OUT_JSON}: ${e.message}`); }
}

const gate = SEVERITIES.slice(0, SEVERITIES.indexOf(FAIL_ON) + 1);
process.exit(findings.some((f) => gate.includes(f.severity)) ? 1 : 0);
