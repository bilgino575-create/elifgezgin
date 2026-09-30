#!/usr/bin/env bash
# Stop the production server, build, restart. Building while `next start` holds .next
# occasionally trips Turbopack's font import map, so the server is stopped first.
set -e
cd "$(dirname "$0")/.."
for p in $(ps aux | grep -E "next-server|next start" | grep -v grep | awk '{print $2}'); do kill -9 "$p" 2>/dev/null || true; done
sleep 1
npm run build 2>&1 | grep -E "✓ Compiled|rror|Error" | head -5
scripts/serve.sh
