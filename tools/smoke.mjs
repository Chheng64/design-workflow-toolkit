/* Build-time smoke run: for each (file, view) pair — does the view actually PAINT,
   are there console errors, and is any interactive target below the tap-target floor?
   Run it from STATE 07 (skills/07 B8) before handing anything to the audit.

   Usage: node tools/smoke.mjs "home:dash,stack" "auth:landing,phone" ...
   Floor, ports and prototype dir come from toolkit.config.json. */
import { launch, newPage, serve } from './cdp.mjs';
import { loadConfig } from './config.mjs';

const CFG = loadConfig();
const FLOOR = CFG.audit.tapTargetFloorPx;
const BENIGN = CFG.audit.benignConsole || [];

const specs = process.argv.slice(2).filter(s => s.includes(':')).map(s => {
  const [file, views] = s.split(':');
  return { file, views: views.split(',') };
});

if (!specs.length) {
  console.error('usage: node tools/smoke.mjs "<page>:<view>[,<view>...]" ...');
  process.exit(2);
}

const PORT = CFG.audit.servePort, DBG = CFG.audit.debugPort + 2;
const srv = serve(CFG.paths.prototype, PORT);
await new Promise(r => setTimeout(r, 700));
const { proc } = await launch(DBG);

let pass = 0, fail = 0;
const problems = [];

for (const { file, views } of specs) {
  for (const view of views) {
    const page = await newPage(DBG);
    await page.init();
    const netErrors = [];
    page.on((m) => {                                       // see tools/audit.mjs — a bare
      if (m.method !== 'Network.responseReceived') return; // console error carries no url
      const { status, url: u } = m.params.response;
      if (status < 400 || !u.includes('127.0.0.1')) return;
      if (BENIGN.some((b) => u.includes(b))) return;
      netErrors.push(`${status} ${u}`);
    });
    const url = `http://127.0.0.1:${PORT}/${file}.html?view=${view}`;
    await page.goto(url);
    const r = await page.eval(({ floor, C }) => {
      const on = document.querySelector(`${C.viewSelector}.${C.activeClass}`);
      const out = { view: on && on.getAttribute('data-view'), sid: on && on.getAttribute('data-sid'), painted: false, small: [], overflow: 0, text: '' };
      if (!on) return out;
      const cs = getComputedStyle(on), rc = on.getBoundingClientRect();
      out.painted = cs.display !== 'none' && cs.visibility === 'visible' && rc.width > 100 && rc.height > 100;
      out.text = (on.innerText || '').trim().slice(0, 60);
      // Tap-target floor — measure the hit area, including any ::after expansion
      // (skills/08 §B: an element box below the floor is a hypothesis, not a finding).
      document.querySelectorAll('button,a,input,[role="switch"],[role="button"],[tabindex="0"]').forEach(el => {
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) return;
        if (b.width < floor - 0.5 || b.height < floor - 0.5) {
          out.small.push((el.id || el.className || el.tagName) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height));
        }
      });
      if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) out.overflow = 1;
      return out;
    }, { floor: FLOOR, C: CFG.prototype });
    const errs = page.consoleErrors()
      .filter((e) => e && !/Failed to load resource/i.test(e))
      .concat(netErrors);
    const ok = r.painted && r.view === view && errs.length === 0 && r.small.length === 0 && !r.overflow;
    if (ok) pass++; else {
      fail++;
      problems.push({ file, view, ...r, errs });
    }
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${file}:${view}  ${r.sid || '-'}  ${r.painted ? 'painted' : 'BLANK'}` +
      (r.small.length ? `  small:${r.small.join('|')}` : '') + (r.overflow ? '  H-OVERFLOW' : '') +
      (errs.length ? `  errs:${errs.join(' ~ ')}` : ''));
    await page.close();
  }
}

console.log(`\n${pass} pass / ${fail} fail`);
if (problems.length) console.log(JSON.stringify(problems, null, 1).slice(0, 4000));
proc.kill(); srv.kill();
process.exit(fail ? 1 : 0);
