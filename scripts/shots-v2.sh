#!/usr/bin/env bash
# Every act on desktop and phone, Gece and Galeri, plus the specimen, the
# no-WebGL page, LOW tier, reduced motion and the chaos state, into
# docs/screenshots/v2. Runs against `next start` on the software renderer.
set -e
cd "$(dirname "$0")/.."
OUT=docs/screenshots/v2
mkdir -p "$OUT"
P="0,0.16,0.28,0.51,0.65,0.78,0.9,0.99"
node scripts/shoot.mjs --out "$OUT" --tag final --tier high --p "$P" --w 1440 --h 900 --wait 16000 --settle 8000
node scripts/shoot.mjs --out "$OUT" --tag final --tier high --light --p "$P" --w 1440 --h 900 --wait 16000 --settle 8000
node scripts/shoot.mjs --out "$OUT" --tag final --tier high --p "$P" --w 390 --h 844 --wait 16000 --settle 8000
node scripts/shoot.mjs --out "$OUT" --tag final --tier high --light --p "$P" --w 390 --h 844 --wait 16000 --settle 8000
node scripts/shoot.mjs --out "$OUT" --tag chaos --tier high --q chaos=1 --p 0 --w 1440 --h 900 --wait 14000 --settle 6000
node scripts/shoot.mjs --out "$OUT" --tag low --tier low --p 0,0.16,0.28 --w 1440 --h 900 --wait 14000 --settle 6000
node scripts/shoot.mjs --out "$OUT" --tag reduced --reduce --tier high --p 0,0.28 --w 1440 --h 900 --wait 14000 --settle 6000
node scripts/shoot.mjs --out "$OUT" --tag html --nogl --full --w 1440 --h 900
node scripts/shoot.mjs --out "$OUT" --tag html --nogl --full --light --w 1440 --h 900
node scripts/shoot.mjs --out "$OUT" --tag html --nogl --full --w 390 --h 844
node scripts/shoot.mjs --out "$OUT" --tag type --path /_type --nogl --full --w 1440 --h 900
node scripts/shoot.mjs --out "$OUT" --tag type --path /_type --nogl --full --w 390 --h 844
node scripts/shoot.mjs --out "$OUT" --tag type --path /_type --nogl --full --light --w 1440 --h 900
echo "shots done: $(ls "$OUT" | wc -l) files"
