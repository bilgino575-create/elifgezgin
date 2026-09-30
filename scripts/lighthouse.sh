#!/usr/bin/env bash
# Lighthouse mobile + desktop against the local production server.
# Uses the Playwright Chromium with software WebGL; numbers describe this machine.
set -e
LH=${LH:-/tmp/lh/node_modules/.bin/lighthouse}
export CHROME_PATH=${CHROME_PATH:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}
URL=${URL:-http://localhost:3000/}
FLAGS="--no-sandbox --headless=new --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist"
mkdir -p /tmp/lh/out
"$LH" "$URL" --output=json --output-path=/tmp/lh/out/mobile.json --chrome-flags="$FLAGS" --quiet --only-categories=performance,accessibility,best-practices,seo
"$LH" "$URL" --preset=desktop --output=json --output-path=/tmp/lh/out/desktop.json --chrome-flags="$FLAGS" --quiet --only-categories=performance,accessibility,best-practices,seo
node -e '
for (const f of ["mobile","desktop"]) {
  const r = JSON.parse(require("fs").readFileSync(`/tmp/lh/out/${f}.json`,"utf8"));
  const c = r.categories, a = r.audits;
  console.log(JSON.stringify({ form: f,
    performance: Math.round(c.performance.score*100), accessibility: Math.round(c.accessibility.score*100),
    bestPractices: Math.round(c["best-practices"].score*100), seo: Math.round(c.seo.score*100),
    LCP_s: +(a["largest-contentful-paint"].numericValue/1000).toFixed(2), CLS: +a["cumulative-layout-shift"].numericValue.toFixed(3),
    TBT_ms: Math.round(a["total-blocking-time"].numericValue), FCP_s: +(a["first-contentful-paint"].numericValue/1000).toFixed(2),
    lcpElement: a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet?.slice(0,80) ?? null,
    failing: Object.values(a).filter(x => x.score !== null && x.score < 0.9 && ["accessibility","best-practices","seo"].some(cat => c[cat].auditRefs.some(ref => ref.id === x.id))).map(x => x.id)
  }));
}'
