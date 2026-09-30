/**
 * Interaction check on the software renderer: moves the pointer over the
 * wall, reads the store's hover state and screenshots the loupe / lifted
 * object. Also types "elif" for the confetti and opens the first work.
 *
 *   node scripts/hover.mjs [--out dir]
 */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const get = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const out = get("out", "docs/screenshots");
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto("http://localhost:3000/?gl=1&tier=high&debug", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise((r) => setTimeout(r, 16000));
await page.evaluate(() => window.__snap?.(0.24));
await new Promise((r) => setTimeout(r, 6000));
// sweep the pointer across the wall's free half and stop on the second object
for (let x = 760; x <= 1160; x += 40) {
  await page.mouse.move(x, 380);
  await new Promise((r) => setTimeout(r, 400));
}
await new Promise((r) => setTimeout(r, 4000));
const state = await page.evaluate(() => {
  const s = window.__stats?.();
  return { stats: s, hover: document.querySelector('.index li[data-active="true"] .t')?.textContent ?? null, cursor: document.querySelector(".cursor")?.dataset.mode };
});
console.log(JSON.stringify(state));
await page.screenshot({ path: path.join(out, "hover-loupe-desktop-light.png") });
// the gift
await page.keyboard.type("elif");
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: path.join(out, "confetti-desktop-light.png") });
console.log(errors.length ? `errors:\n${errors.join("\n")}` : "console: clean");
await browser.close();
