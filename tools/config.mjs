/**
 * config.mjs — the one place a tool learns where this product keeps its files.
 *
 * Every tool in this toolkit is product-agnostic. What differs between products
 * is paths, viewport, palette and ports — all of which live in
 * `toolkit.config.json` at the project root, never in a tool.
 *
 * Usage in a tool:
 *   import { loadConfig } from './config.mjs';
 *   const cfg = loadConfig(argRoot);      // argRoot = the tool's --root flag, or null
 *   cfg.paths.registry                    // absolute path
 *   cfg.product.viewport.width
 *
 * Resolution order for the root: --root flag → $TOOLKIT_ROOT → nearest ancestor
 * of cwd containing toolkit.config.json → cwd.
 */

import fs from 'node:fs';
import path from 'node:path';

const CONFIG_NAME = 'toolkit.config.json';

const DEFAULTS = {
  product: {
    name: 'Unnamed product',
    slug: 'product',
    platform: 'mobile',
    viewport: { width: 393, height: 852 },
    locales: ['en'],
    scripts: [],
  },
  paths: {
    artifacts: 'artifacts',
    reference: 'reference',
    prototype: 'artifacts/prototype',
    shots: 'artifacts/shots',
    state: 'state/machine_state.yaml',
    registry: 'reference/screen-registry.csv',
    lanes: 'reference/nav-lanes.json',
    stateMachines: 'reference/state-machines.json',
    vocabulary: 'reference/state-vocabulary.md',
    edgeAnnotations: 'reference/edge-annotations.json',
  },
  screens: {
    idPattern: '^S-[A-Z0-9]+-[0-9]+[A-Z]?$',
    flowSectionFormat: 'FLOW-XXX • Journey Name',
  },
  review: {
    port: 8765,
    player: 'play.html',
    liveReloadWhenState: 'USER_REVIEW',
    // Files that live in the prototype dir and are review chrome, not product
    // surface. `player` is always added to this set — see resolution below.
    harnessFiles: ['run-local.sh', 'serve.py'],
  },
  prototype: {
    viewSelector: '.view',
    activeClass: 'active',
    screenSelector: '.screen',
    sidSelector: '#sid',
    minVisibleNodes: 3,
  },
  audit: {
    chrome: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    debugPort: 9333,
    servePort: 8791,
    tapTargetFloorPx: 44,
    colorAllowlist: [],
    colorBanned: [],
    benignConsole: ['favicon.ico'],
  },
  flowPages: {},   // screen-id prefix → prototype page, when it is not `<prefix>.html`
  designSystem: { name: '', sourceId: '' },
  figma: { fileKey: '', pages: {} },
  loops: { L_CLARIFY: 3, L_RESEARCH: 2, L_UX_EDGE: 2, L_REVISION: 3, L_AUDIT_FIX: 3 },
};

/** Shallow-per-section merge: a product overrides keys, never whole sections. */
function merge(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && typeof base[k] === 'object'
      ? merge(base[k], v)
      : v;
  }
  return out;
}

export function findRoot(explicit = null) {
  if (explicit) return path.resolve(explicit);
  if (process.env.TOOLKIT_ROOT) return path.resolve(process.env.TOOLKIT_ROOT);
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, CONFIG_NAME))) return dir;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return process.cwd();
}

export function loadConfig(explicitRoot = null) {
  const root = findRoot(explicitRoot);
  const file = path.join(root, CONFIG_NAME);
  let raw = {};
  if (fs.existsSync(file)) {
    try {
      raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      throw new Error(`${CONFIG_NAME} is not valid JSON: ${e.message}`);
    }
  }
  delete raw.$schema;
  const cfg = merge(DEFAULTS, raw);

  // The review player is harness chrome by definition, so it is always in the
  // set — a product should not have to remember to list it. Resolved once, here,
  // because two tools sweep the prototype dir for two different things and both
  // must exclude the SAME files. Them disagreeing is what produced TK-1: the
  // palette sweep reported the player's own colours as off-palette on every run,
  // while the network sweep beside it already knew to skip the file.
  cfg.review.harnessFiles = [...new Set([cfg.review.player, ...(cfg.review.harnessFiles || [])])];

  // Resolve every path to absolute, once, here — so no tool ever joins a path itself.
  const abs = {};
  for (const [k, v] of Object.entries(cfg.paths)) abs[k] = path.resolve(root, v);

  return { ...cfg, root, configFile: fs.existsSync(file) ? file : null, paths: abs, rel: cfg.paths };
}

/** Shared arg parsing so every tool takes the same flags. */
export function parseArgs(argv = process.argv.slice(2)) {
  const arg = (flag, dflt = null) => {
    const i = argv.indexOf(flag);
    return i === -1 ? dflt : argv[i + 1];
  };
  const has = (flag) => argv.includes(flag);
  return { argv, arg, has, root: arg('--root', null), quiet: has('--quiet') };
}

export const SEVERITIES = ['blocking', 'major', 'advisory'];

/**
 * The closed state vocabulary (E5). Defined once, here, because it is enforced
 * by two separate tools — `navgraph.mjs` (`N11-state-vocab`) and
 * `stategraph.mjs` (`S1-vocab`) — and documented in a third place, the product's
 * vocabulary file (`paths.vocabulary`). Three copies of a set is three chances
 * for two of them to disagree, and a vocabulary that disagrees with itself is
 * not a closed set.
 *
 * It is a toolkit constant, not a product setting. A per-product term set would
 * make every product's state machine private again, which is the failure E5
 * exists to prevent. Adding a term costs a justification written into the
 * product's vocabulary file AND an edit here — deliberately two steps.
 */
export const CANON_STATES = new Set([
  'happy', 'loading', 'empty', 'error', 'fail', 'success', 'in-progress',
  'timeout', 'guest', 'locked', 'confirm', 'filtered', 'offline', 'permission-denied',
]);
