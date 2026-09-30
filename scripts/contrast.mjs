/**
 * WCAG AA contrast report against the RENDERED background.
 *
 * For each theme × viewport the page is screenshotted with all text made
 * transparent, so what remains is exactly what sits behind every glyph
 * (stage, colour field, scrims, chips, the canvas at a scroll stop). Each
 * visible text element's box is then sampled from that image and the
 * contrast of its colour against the 5th and 95th luminance percentiles of
 * the pixels is computed; the worse one must pass 4.5 : 1 (3 : 1 for large
 * text). Buttons are also checked in hover and focus-visible states.
 *
 *   node scripts/contrast.mjs [--url http://localhost:3000] [--path /] [--gl] [--p 0.28]
 */
import puppeteer from "puppeteer";
import sharp from "sharp";

const args = process.argv.slice(2);
const get = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const gl = args.includes("--gl");
const url = get("url", "http://localhost:3000") + get("path", "/") + (gl ? "?gl=1&tier=low" : "?nogl");
const stops = gl ? get("p", "0,0.28,0.51,0.65,0.78,0.9,1").split(",").map(Number) : [0];

const lum = (r, g, b) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
let failures = 0;
let checked = 0;
const fails = [];

async function audit(page, label, state) {
  // collect text elements
  const els = await page.evaluate((state) => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(/[\s,\/]+/).map(Number);
      return { r, g, b, a: Number.isNaN(a) ? 1 : a };
    };
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    let n;
    while ((n = walker.nextNode())) {
      const text = n.textContent.trim();
      if (!text) continue;
      const el = n.parentElement;
      if (!el || seen.has(el)) continue;
      seen.add(el);
      if (el.closest("script,style,noscript,.sr-only,[hidden],.hud")) continue;
      if (state && !el.closest(state)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.color === "transparent") continue;
      // hidden panels in the 3D layout have --vis 0
      let e = el;
      let op = 1;
      while (e && e !== document.body) {
        op *= Number(getComputedStyle(e).opacity);
        e = e.parentElement;
      }
      if (op < 0.98) continue;
      // the glyph run itself (a Range), not the element box: pills, padding and underlines are background
      const range = document.createRange();
      range.selectNodeContents(n);
      const r = range.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      // scrolled under the fixed nav: not readable there anyway
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
      if (r.top < navH && !el.closest(".nav, .skip")) continue;
      const fg = parse(cs.color);
      if (!fg || fg.a < 1 || cs.backgroundClip === "text") continue;
      const size = parseFloat(cs.fontSize);
      const bold = parseInt(cs.fontWeight, 10) >= 700;
      const large = size >= 24 || (bold && size >= 18.66);
      out.push({
        text: text.slice(0, 36),
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === "string" ? el.className : "").slice(0, 36),
        fg,
        min: large ? 3 : 4.5,
        size: +size.toFixed(1),
        x: Math.max(0, Math.round(r.left)),
        y: Math.max(0, Math.round(r.top)),
        w: Math.round(Math.min(r.right, innerWidth) - Math.max(0, r.left)),
        h: Math.round(Math.min(r.bottom, innerHeight) - Math.max(0, r.top)),
      });
    }
    return out;
  }, state);
  if (!els.length) return;
  // screenshot with text transparent (outline/underline kept: they are not glyphs but count as background)
  await page.addStyleTag({ content: "body * { color: transparent !important; caret-color: transparent !important; -webkit-text-fill-color: transparent !important; } .cursor{display:none!important}" });
  const png = await page.screenshot({ type: "png" });
  await page.evaluate(() => document.querySelectorAll("style").forEach((s) => s.textContent?.includes("caret-color: transparent") && s.remove()));
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const dbg = process.env.CONTRAST_DEBUG;
  let saved = false;
  for (const e of els) {
    const ls = [];
    for (let y = e.y; y < e.y + e.h; y += 2) {
      for (let x = e.x; x < e.x + e.w; x += 2) {
        const i = (y * info.width + x) * info.channels;
        ls.push(lum(data[i], data[i + 1], data[i + 2]));
      }
    }
    if (!ls.length) continue;
    ls.sort((a, b) => a - b);
    const lo = ls[Math.floor(ls.length * 0.05)];
    const hi = ls[Math.floor(ls.length * 0.95)];
    const lf = lum(e.fg.r, e.fg.g, e.fg.b);
    const worst = Math.min(ratio(lf, lo), ratio(lf, hi));
    checked++;
    if (worst < e.min) {
      failures++;
      fails.push(`FAIL ${label} ${worst.toFixed(2)}:1 (min ${e.min}) <${e.tag} class="${e.cls}"> "${e.text}" ${e.size}px`);
      if (dbg && !saved) {
        saved = true;
        const f = `${dbg}/fail-${fails.length}.png`;
        await sharp(png).toFile(f);
        console.log(`debug: ${f} rect=${JSON.stringify([e.x, e.y, e.w, e.h])} fg=${JSON.stringify(e.fg)} lo=${lo.toFixed(3)} hi=${hi.toFixed(3)} "${e.text}"`);
      }
    }
  }
}

for (const theme of ["dark", "light"]) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, isMobile: w < 600, hasTouch: w < 600 });
    await page.evaluateOnNewDocument((t) => localStorage.setItem("eg-theme", t), theme);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, gl ? 12000 : 1500));
    const label = `${theme} ${w}px`;
    if (gl) {
      for (const p of stops) {
        await page.evaluate((p) => window.__snap?.(p), p);
        await new Promise((r) => setTimeout(r, 2500));
        await audit(page, `${label} p=${p}`, null);
      }
    } else {
      // no-WebGL: the whole document, viewport by viewport
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < total; y += h) {
        await page.evaluate((y) => window.scrollTo(0, y), y);
        // let the section tracker and the 0.2 s colour transitions settle before reading styles
        await new Promise((r) => setTimeout(r, 700));
        await audit(page, `${label} y=${y}`, null);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      // button states: hover and keyboard focus on every visible control
      const controls = await page.$$("button, a.btn, a.chip, .chip, .nav-links a, .icon-btn, .link");
      for (const c of controls) {
        const box = await c.boundingBox();
        if (!box) continue;
        await c.evaluate((el) => el.scrollIntoView({ block: "center" }));
        await new Promise((r) => setTimeout(r, 120));
        await c.hover();
        await new Promise((r) => setTimeout(r, 300));
        await audit(page, `${label} hover`, "button, a.btn, a.chip, .chip, .nav-links a, .icon-btn, .link");
        await c.focus();
        await page.keyboard.press("Shift"); // focus-visible needs a keyboard interaction
        await new Promise((r) => setTimeout(r, 200));
        await audit(page, `${label} focus`, "button, a.btn, a.chip, .chip, .nav-links a, .icon-btn, .link");
        await page.mouse.move(0, 0);
      }
    }
    await page.close();
  }
}
await browser.close();
for (const f of fails) console.log(f);
console.log(JSON.stringify({ check: "contrast", url, checked, failures }));
process.exit(failures ? 1 : 0);
