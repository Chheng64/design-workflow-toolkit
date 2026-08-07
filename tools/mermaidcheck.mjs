#!/usr/bin/env node
/**
 * mermaidcheck.mjs — documentation integrity: every Mermaid block is well formed.
 *
 * Why this exists. The diagrams in this repository are load-bearing: the state
 * machine, the artifact pipeline and the gate sequence are explained by a diagram
 * first and by prose second. A block that fails to parse renders on GitHub as a
 * grey error box, and the reader loses the explanation without being told they
 * lost anything — a silent failure, which is the class this toolkit exists to
 * make loud.
 *
 * Scope, stated plainly: this is a **syntax smell** check, not a Mermaid parser.
 * It catches the three mistakes that actually shipped here — an unclosed fence,
 * an unrecognised diagram type, and an unbalanced quote — and it flags one more
 * as advisory. It cannot prove a block renders. Rendering is proved by looking at
 * the page (`M2`), and this check is what stops you looking for the wrong reason.
 *
 * Usage:
 *   node tools/mermaidcheck.mjs [--root <repo>] [--fail-on <blocking|major|advisory>]
 *                               [--json <out.json>] [--quiet]
 *
 * Findings:
 *   D4-type      blocking   first token is not a recognised diagram type
 *   D5-quotes    major      odd number of `"` on a line — an unterminated label
 *   D6-unclosed  blocking   a ```mermaid fence that never closes
 *   D7-parens    advisory   parentheses inside an unquoted square-bracket label
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

const die = (m) => { console.error(`mermaidcheck: ${m}`); process.exit(2); };

if (!SEVERITIES.includes(FAIL_ON)) die(`--fail-on must be one of ${SEVERITIES.join(', ')}`);

let ROOT;
try { ROOT = loadConfig(arg('--root', null)).root; } catch (e) { die(e.message); }
if (!fs.existsSync(ROOT)) die(`root not found: ${ROOT}`);

/** Every diagram type used or plausibly usable here. A type outside this set is
 *  far more often a typo than a new Mermaid feature — but when it IS a new
 *  feature, adding it is one line, and the finding told you to look. */
const TYPES = new Set([
  'flowchart', 'graph', 'stateDiagram', 'stateDiagram-v2', 'sequenceDiagram',
  'classDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'quadrantChart',
  'requirementDiagram', 'gitGraph', 'mindmap', 'timeline', 'sankey-beta',
  'xychart-beta', 'block-beta', 'packet-beta', 'architecture-beta', 'C4Context',
]);

/** Node shapes whose own delimiters contain brackets or parentheses. These must be
 *  recognised BEFORE the label scan, or every cylinder `db[(Store)]` and stadium
 *  `s([Go])` reports as an unquoted paren. That false positive is not
 *  hypothetical: the throwaway version of this script produced twelve of them on
 *  its first run, and every one was a valid shape. A check that cries wolf gets
 *  skimmed, and a skimmed check is not a check (`M3`). */
const COMPOUND_SHAPE = /^\s*[\w-]+\s*(\[\(|\(\[|\[\[|\(\(|\{\{|\[\/|\[\\|>)/;

const SKIP_DIRS = new Set(['.git', 'node_modules']);
const rel = (p) => path.relative(ROOT, p) || '.';

const findings = [];
const F = (severity, code, subject, detail) => findings.push({ severity, code, subject, detail });

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
let blocks = 0;

for (const file of files) {
  let lines;
  try { lines = fs.readFileSync(file, 'utf8').split('\n'); }
  catch (e) { die(`cannot read ${rel(file)}: ${e.message}`); }

  let open = false, startLine = 0, body = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!open && /^\s*```+\s*mermaid\s*$/.test(line)) {
      open = true; startLine = i + 1; body = [];
      continue;
    }
    if (open && /^\s*```+\s*$/.test(line)) {
      open = false; blocks++;
      checkBlock(file, startLine, body);
      continue;
    }
    if (open) body.push({ text: line, line: i + 1 });
  }

  if (open)
    F('blocking', 'D6-unclosed', `${rel(file)}:${startLine}`,
      'a ```mermaid fence opens here and never closes — everything below it renders as diagram source');
}

function checkBlock(file, startLine, body) {
  const at = (n) => `${rel(file)}:${n}`;

  const first = body.find((b) => b.text.trim() && !b.text.trim().startsWith('%%'));
  const type = first ? first.text.trim().split(/[\s:]+/)[0] : '';
  if (!TYPES.has(type))
    F('blocking', 'D4-type', at(first ? first.line : startLine),
      `"${type || '(empty block)'}" is not a recognised diagram type`);

  for (const b of body) {
    if ((b.text.match(/"/g) || []).length % 2)
      F('major', 'D5-quotes', at(b.line),
        `odd number of quotes — unterminated label: ${b.text.trim().slice(0, 72)}`);

    if (!/^(flowchart|graph)$/.test(type)) continue;
    if (COMPOUND_SHAPE.test(b.text)) continue;
    const m = /^\s*[\w-]+\[([^"\]]*)\]/.exec(b.text);
    if (m && /[()]/.test(m[1]))
      F('advisory', 'D7-parens', at(b.line),
        `parentheses in an unquoted label — quote it: ${b.text.trim().slice(0, 72)}`);
  }
}

// ------------------------------------------------------------------ report

const order = (s) => SEVERITIES.indexOf(s);
findings.sort((a, b) => order(a.severity) - order(b.severity) || a.subject.localeCompare(b.subject));

const counts = Object.fromEntries(SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s).length]));

if (!QUIET) {
  for (const f of findings) console.log(`${f.severity.padEnd(8)} ${f.code.padEnd(12)} ${f.subject}  —  ${f.detail}`);
  console.log(`\n${blocks} mermaid blocks in ${files.length} files · ` +
              `${counts.blocking} blocking · ${counts.major} major · ${counts.advisory} advisory`);
}

if (OUT_JSON) {
  try {
    fs.mkdirSync(path.dirname(path.resolve(OUT_JSON)), { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify({ root: ROOT, files: files.length, blocks, counts, findings }, null, 2));
  } catch (e) { die(`cannot write ${OUT_JSON}: ${e.message}`); }
}

const gate = SEVERITIES.slice(0, SEVERITIES.indexOf(FAIL_ON) + 1);
process.exit(findings.some((f) => gate.includes(f.severity)) ? 1 : 0);
