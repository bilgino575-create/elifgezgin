/**
 * Headless screenshots of the journey.
 *
 *   node scripts/shoot.mjs [--url http://localhost:3000] [--out docs/screenshots] [--tag renk]
 *                          [--p 0,0.16] [--w 1440 --h 900] [--nogl] [--reduce] [--full]
 *                          [--tier ultra|high|mid|low] [--wait 6000] [--settle 3000] [--path /en] [--q debug]
 *
 * Runs on the Playwright Chromium with SwiftShader; `?gl=1` forces the stage
 * on (the probe would otherwise refuse the software renderer). Waits for the
 * loader to hand over and for the camera clock to reach each p.
 */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const get = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const has = (k) => args.includes(`--${k}`);

const url = get("url", "http://localhost:3000") + get("path", "/");
const out = get("out", "docs/screenshots");
const tag = get("tag", "shot");
const ps = get("p", "0").split(",").map(Number);
const w = Number(get("w", 1440));
const h = Number(get("h", 900));
const wait = Number(get("wait", 6000));
const settle = Number(get("settle", 3000));
const mobile = w < 600;
mkdirSync(out, { recursive: true });


/** the camera glides to its stop at the pace of this machine's frames: wait until it holds still over three rendered frames */
async function settleCamera(page, maxMs = 60000) {
  let last = null;
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    await new Promise((r) => setTimeout(r, 500));
    const cur = await page.evaluate(() => {
      const r = window.__r3f;
      if (!r) return null;
      return [...r.camera.position.toArray(), r.camera.fov, r.gl.info.render.frame];
    });
    if (!cur) continue;
    if (!last) {
      last = cur;
      continue;
    }
    if (cur[4] - last[4] < 3) continue;
    const d = Math.hypot(cur[0] - last[0], cur[1] - last[1], cur[2] - last[2]);
    if (d < 0.02 && Math.abs(cur[3] - last[3]) < 0.02 && Date.now() - t0 > 3000) return true;
    last = cur;
  }
  return false;
}

const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
if (has("reduce")) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

const q = [];
if (has("nogl")) q.push("nogl");
else q.push("gl=1");
if (has("tier")) q.push(`tier=${get("tier", "high")}`);
if (has("q")) q.push(get("q", ""));
if (!q.includes("debug")) q.push("debug");
await page.goto(`${url}?${q.join("&")}`, { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise((r) => setTimeout(r, wait));
// the loader must have handed over
for (let i = 0; i < 60; i++) {
  const gone = await page.evaluate(() => {
    const l = document.querySelector(".loader");
    return !l || l.getAttribute("data-loaded") === "true";
  });
  if (gone) break;
  await new Promise((r) => setTimeout(r, 500));
}

for (const p of ps) {
  await page.evaluate((p) => {
    const track = document.querySelector(".track");
    const max = track ? track.offsetHeight - window.innerHeight : document.documentElement.scrollHeight - window.innerHeight;
    const top = (track ? track.offsetTop : 0) + p * Math.max(1, max);
    window.scrollTo({ top, behavior: "auto" });
  }, p);
  await new Promise((r) => setTimeout(r, has("nogl") ? 500 : settle));
  if (!has("nogl")) {
    for (let i = 0; i < 40; i++) {
      const ok = await page.evaluate((p) => {
        const s = window.__stats ? window.__stats() : null;
        return !s || Math.abs(s.p - p) < 0.01;
      }, p);
      if (ok) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    await settleCamera(page);
    await new Promise((r) => setTimeout(r, settle));
  }
  const file = path.join(out, `${tag}-${mobile ? "mobile" : "desktop"}-p${p.toFixed(2)}.png`);
  await page.screenshot({ path: file, fullPage: has("nogl") && has("full") });
  console.log("saved", file);
}
console.log(errors.length ? `console:\n${errors.slice(0, 20).join("\n")}` : "console: clean");
await browser.close();
