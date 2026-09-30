/**
 * Headless screenshots for the self-critique loop.
 *
 *   node scripts/shoot.mjs [--url http://localhost:3000] [--out docs/screenshots] [--tag act1]
 *                          [--p 0,0.24] [--w 1440 --h 900] [--nogl] [--reduce] [--light]
 *                          [--tier ultra|high|mid|low] [--wait 4000] [--settle 3000] [--path /en] [--q chaos=1]
 *
 * Runs on the Playwright Chromium with SwiftShader; `?gl=1` forces the canvas
 * on (the probe would otherwise refuse the software renderer).
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

const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
if (has("reduce")) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
// Gece (dark) is the default stage; --light selects Galeri through the stored preference
await page.evaluateOnNewDocument((t) => localStorage.setItem("eg-theme", t), has("light") ? "light" : "dark");
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

const q = [];
if (has("nogl")) q.push("nogl");
else q.push("gl=1");
if (has("tier")) q.push(`tier=${get("tier", "high")}`);
if (has("debug")) q.push("debug");
if (has("q")) q.push(get("q", ""));
await page.goto(`${url}?${q.join("&")}`, { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise((r) => setTimeout(r, wait));

for (const p of ps) {
  await page.evaluate((p) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: p * max, behavior: "auto" });
    if (window.__snap) window.__snap(p);
  }, p);
  await new Promise((r) => setTimeout(r, has("nogl") ? 500 : settle));
  if (!has("nogl")) {
    for (let i = 0; i < 40; i++) {
      const ok = await page.evaluate((p) => {
        const secs = [...document.querySelectorAll("section.section")];
        const near = secs.map((s) => ({ s, d: Math.abs(Number(s.dataset.anchor) - p) })).sort((a, b) => a.d - b.d)[0];
        const stats = window.__stats ? window.__stats() : null;
        const rigOk = !stats || Math.abs(stats.rigP - p) < 0.01;
        return (!near || near.d > 0.06 || near.s.dataset.hidden === "false") && rigOk;
      }, p);
      if (ok) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    await new Promise((r) => setTimeout(r, settle));
  }
  const theme = has("light") ? "light" : "dark";
  const file = path.join(out, `${tag}-${mobile ? "mobile" : "desktop"}-${theme}-p${p.toFixed(2)}.png`);
  await page.screenshot({ path: file, fullPage: has("nogl") && has("full") });
  console.log("saved", file);
}
console.log(errors.length ? `console:\n${errors.slice(0, 20).join("\n")}` : "console: clean");
await browser.close();
