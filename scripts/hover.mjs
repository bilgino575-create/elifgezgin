/**
 * Interaction check on the software renderer: hovers a portal (depth pop),
 * opens it (the fly-through, then the case study), hovers a ribbon word,
 * clicks the card (spin) and types "elif" (confetti). Screenshots the
 * states it reaches and reports the store's view of each.
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
const out = get("out", "docs/screenshots/v2");
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  protocolTimeout: 900000,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto("http://localhost:3000/?gl=1&tier=high&debug", { waitUntil: "domcontentloaded", timeout: 120000 });
await sleep(16000);
const report = {};

// 1. portals: sweep over the first framed portal, right of the legend
await page.evaluate(() => window.__snap?.(0.28));
await sleep(7000);
for (let x = 820; x <= 1140; x += 40) {
  await page.mouse.move(x, 450);
  await sleep(500);
}
await sleep(5000);
report.portalHover = await page.evaluate(() => ({
  hover: document.querySelector('.index li[data-active="true"] .t')?.textContent ?? null,
  cursor: document.querySelector(".cursor")?.dataset.mode,
}));
await page.screenshot({ path: path.join(out, "hover-portal-desktop-dark.png") });

// 2. open it: click where the pointer is, expect the fly-through then the case study
const before = page.url();
await page.mouse.click(1140, 450);
await sleep(300);
// the fly-through runs 950 ms, then the page navigates; a screenshot during navigation hangs the CDP, so only the state is read
report.opening = await page.evaluate(() => (document.querySelector(".hud") ? "hud" : "") + "|" + (window.__stats?.()?.act ?? null));
await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => null);
report.navigated = { from: before, to: page.url() };

// 3. back home: ribbon hover, card spin, the gift
await page.goto("http://localhost:3000/?gl=1&tier=high&debug", { waitUntil: "domcontentloaded", timeout: 120000 });
await sleep(16000);
await page.evaluate(() => window.__snap?.(0.51));
await sleep(7000);
// hover the second skill through its index button (keyboard/pointer parity)
await page.hover(".index li:nth-child(2) button");
await sleep(4000);
report.ribbonHover = await page.evaluate(() => document.querySelector('.index li[data-active="true"] .t')?.textContent ?? null);
await page.screenshot({ path: path.join(out, "hover-ribbon-desktop-dark.png") });

await page.evaluate(() => window.__snap?.(0.9));
await sleep(7000);
await page.mouse.move(1000, 450);
await sleep(1500);
await page.mouse.click(1000, 450);
await sleep(300);
report.cardSpin = await page.evaluate(() => (window.__stats?.() ?? {}).act);
await sleep(2500);
await page.screenshot({ path: path.join(out, "card-spin-desktop-dark.png") });

await page.keyboard.type("elif");
await sleep(2500);
report.confetti = await page.evaluate(() => {
  const c = document.querySelector("canvas[aria-hidden='true']");
  return !!c && c.style.display !== "none";
});
await page.screenshot({ path: path.join(out, "confetti-desktop-dark.png") });
console.log(JSON.stringify(report));
console.log(errors.length ? `errors:\n${errors.join("\n")}` : "console: clean");
await browser.close();
