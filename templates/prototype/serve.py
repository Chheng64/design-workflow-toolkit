#!/usr/bin/env python3
"""Run Local dev server — static serve + live reload (docs/workflow.md STATE 09).

Lives in artifacts/prototype/ (copied from templates/prototype/ by STATE 07).

Serves this directory and injects a tiny poller into every .html response;
any file change in the tree reloads the browser automatically.
Endpoint /__watch returns the newest mtime in the tree (also used by
run-local.sh to detect a live-reload-capable server vs a plain one).

Live reload is active ONLY while the workflow is in the USER_REVIEW state
(state/machine_state.yaml top-level current_state). Outside review the
server still serves pages, but /__watch answers "off" and no poller is
injected — checked per request, so a state transition applies without
restart. Missing/unreadable state file = reload ON (standalone use).
"""
import os
import re
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

DIR = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
STATE_FILE = os.environ.get('TOOLKIT_STATE_FILE') or os.path.abspath(
    os.path.join(DIR, '..', '..', 'state', 'machine_state.yaml'))


def in_review():
    try:
        with open(STATE_FILE, encoding='utf-8') as f:
            for line in f:
                m = re.match(r'^  current_state:\s*(\S+)', line)
                if m:  # first 2-space-indented hit = machine_state's own field (parked flows nest deeper)
                    return m.group(1) == 'USER_REVIEW'
    except OSError:
        pass
    return True

SNIPPET = (b"<script>/* live-reload - injected by serve.py (run-local dev only, "
           b"not part of the prototype) */\n"
           b"(()=>{let m=null;setInterval(async()=>{try{"
           b"const r=await fetch('/__watch',{cache:'no-store'});const t=await r.text();"
           b"if(m===null)m=t;else if(t!==m){m=t;location.reload()}}catch(e){}},1000)})();"
           b"</script>")


def latest_mtime():
    mx = 0
    for root, _dirs, files in os.walk(DIR):
        for f in files:
            try:
                mx = max(mx, os.stat(os.path.join(root, f)).st_mtime_ns)
            except OSError:
                pass
    return str(mx)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def log_message(self, *args):
        pass

    def _send(self, body, ctype):
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        live = in_review()
        if self.path.startswith('/__watch'):
            self._send(latest_mtime().encode() if live else b'off', 'text/plain')
            return
        if not live:
            super().do_GET()
            return
        path = self.translate_path(self.path.split('?', 1)[0].split('#', 1)[0])
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
        if path.endswith('.html') and os.path.isfile(path):
            with open(path, 'rb') as f:
                body = f.read()
            if b'</body>' in body:
                body = body.replace(b'</body>', SNIPPET + b'\n</body>', 1)
            else:
                body += SNIPPET
            self._send(body, 'text/html; charset=utf-8')
            return
        super().do_GET()


if __name__ == '__main__':
    print(f'serve.py: {DIR} on :{PORT} (live reload on)')
    ThreadingHTTPServer(('', PORT), Handler).serve_forever()
