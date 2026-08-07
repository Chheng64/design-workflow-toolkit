/* Minimal CDP driver — no dependencies (Node ≥22 global WebSocket/fetch).
   Used by the STATE 08 audit, the STATE 12 state probe, and build-time smoke runs.
   Rule from skills/08 M1: assertions read COMPUTED render state (visibility,
   geometry, colour), never mere DOM presence.

   Product-specific values — browser binary and viewport — come from
   toolkit.config.json, never from this file. */
import { spawn } from 'node:child_process';
import { loadConfig, parseArgs } from './config.mjs';

/* This module is a library, but it is only ever imported into a CLI process that
   was handed the same argv. Reading `--root` from that argv is what makes the
   flag mean the same thing here as in the tool that imported it. Without it the
   viewport and the Chrome path came from cwd's config while every path came from
   --root's config — two configs that agree until the day they do not, and the
   symptom is an audit measuring the wrong viewport with no finding to show for
   it (TK-3). */
const CFG = loadConfig(parseArgs().root);
const CHROME = process.env.TOOLKIT_CHROME || CFG.audit.chrome;
const VP = CFG.product.viewport;

export async function launch(port = CFG.audit.debugPort, { width = VP.width, height = VP.height } = {}) {
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, '--disable-gpu',
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
    '--disable-features=Translate,MediaRouter', `--window-size=${width},${height}`,
    `--user-data-dir=/tmp/toolkit-${CFG.product.slug}-chrome`, 'about:blank'
  ], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) break; }
    catch { await new Promise(r => setTimeout(r, 100)); }
  }
  return { proc, port };
}

export async function newPage(port) {
  const r = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  const t = await r.json();
  return connect(t.webSocketDebuggerUrl, t.id, port);
}

function connect(wsUrl, targetId, port) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const waiters = new Map();
  const events = [];
  const listeners = [];
  const ready = new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && waiters.has(msg.id)) {
      const { res, rej } = waiters.get(msg.id); waiters.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method) {
      events.push(msg);
      listeners.forEach(fn => fn(msg));
    }
  };
  const send = async (method, params = {}) => {
    await ready;
    const mid = ++id;
    return new Promise((res, rej) => { waiters.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method, params })); });
  };
  return {
    send, events, targetId,
    on: (fn) => listeners.push(fn),
    async init() {
      await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
      // Without this the shared user-data-dir serves a stale ds.css and the audit measures
      // the PREVIOUS build — a fix can look like it did not land (probe discipline, M3).
      await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
      await send('Emulation.setDeviceMetricsOverride', {
        width: VP.width, height: VP.height, deviceScaleFactor: 2,
        mobile: CFG.product.platform === 'mobile',
      });
    },
    async goto(url, settle = 420) {
      const loaded = new Promise(res => {
        const fn = (m) => { if (m.method === 'Page.loadEventFired') res(); };
        listeners.push(fn);
      });
      await send('Page.navigate', { url });
      await Promise.race([loaded, new Promise(r => setTimeout(r, 6000))]);
      await new Promise(r => setTimeout(r, settle));
    },
    async eval(fn, arg) {
      const expr = `(${fn.toString()})(${JSON.stringify(arg ?? null)})`;
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval error');
      return r.result.value;
    },
    async shot(path) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      const { writeFile } = await import('node:fs/promises');
      await writeFile(path, Buffer.from(r.data, 'base64'));
    },
    consoleErrors() {
      return events
        .filter(e => (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') ||
                     (e.method === 'Runtime.exceptionThrown') ||
                     (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'))
        .map(e => e.params.entry?.text ||
                  e.params.exceptionDetails?.exception?.description ||
                  (e.params.args || []).map(a => a.value ?? a.description).join(' '));
    },
    async close() {
      try { await fetch(`http://127.0.0.1:${port}/json/close/${targetId}`); } catch {}
      try { ws.close(); } catch {}
    }
  };
}

export function serve(dir, port = 8788) {
  const p = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '-d', dir], { stdio: 'ignore' });
  return p;
}
