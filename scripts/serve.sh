#!/usr/bin/env bash
# Restart the production server on port 3000 (used by the screenshot loop).
for p in $(ps aux | grep -E "next-server|next start" | grep -v grep | awk '{print $2}'); do kill -9 "$p" 2>/dev/null; done
sleep 1
cd "$(dirname "$0")/.."
nohup npx next start -p 3000 > /tmp/next.log 2>&1 &
for i in $(seq 1 30); do
  sleep 1
  if curl -s -o /dev/null http://localhost:3000/; then echo "server up"; exit 0; fi
done
echo "server failed"; tail -20 /tmp/next.log; exit 1
