#!/usr/bin/env bash
# Run Local — default USER_REVIEW step (docs/workflow.md STATE 09, skills/09 G1).
# Copied into artifacts/prototype/ by STATE 07; run it from there.
# Serves prototype/ over HTTP (serve.py — live reload: any file change in
# prototype/ auto-refreshes the browser, but ONLY while the workflow is in
# USER_REVIEW per state/machine_state.yaml) and opens the player (play.html).
# Idempotent: re-run = "Refresh run local" — reuses a live server, just reopens player.
# A plain server (no live reload) already on the port gets replaced.
set -euo pipefail

PORT="${1:-8765}"
DIR="$(cd "$(dirname "$0")" && pwd)"
URL="http://localhost:${PORT}/play.html"

up()         { lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; }
live_reload() { curl -sf "http://localhost:${PORT}/__watch" >/dev/null 2>&1; }

if up && live_reload; then
  echo "refresh: live-reload server already on :${PORT} — reusing"
else
  if up; then
    echo "upgrade: plain server on :${PORT} — replacing with live-reload server"
    lsof -nP -tiTCP:"${PORT}" -sTCP:LISTEN | xargs kill 2>/dev/null || true
    sleep 0.3
  fi
  echo "start: serving ${DIR} on :${PORT} (live reload)"
  (cd "${DIR}" && nohup python3 serve.py "${PORT}" >/dev/null 2>&1 &)
  # wait until up (max ~3s)
  for _ in $(seq 1 30); do
    curl -s -o /dev/null "${URL}" && break
    sleep 0.1
  done
fi

echo "player: ${URL}"
if command -v open >/dev/null 2>&1; then open "${URL}"; fi
