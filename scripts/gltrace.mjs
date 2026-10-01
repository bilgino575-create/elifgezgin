/**
 * One frame of the live scene under the microscope: wraps the WebGL draw
 * calls and clears, names each program and framebuffer, checks getError
 * after every draw, and reads the composer's buffers back mid-frame
 * (scene buffer, bloom luminance, the last upsample, the canvas) counting
 * NaN / Inf pixels. This is how the black hero frame was found: one NaN
 * pixel in the scene buffer, 324 000 after bloom.
 *
 *   node scripts/gltrace.mjs [extra query] [p]      # needs `next start`; opens ?gl=1&tier=high&debug
 */
import puppeteer from "puppeteer";
const q = process.argv[2] || "";
const p = Number(process.argv[3] || 0);
const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() =>
  localStorage.setItem("eg-theme", "dark"),
);
page.on("console", (m) => {
  if (m.type() === "error")
    console.log("console.error:", m.text().slice(0, 300));
});
await page.goto(
  `http://localhost:3000/?gl=1&tier=high&debug${q ? "&" + q : ""}`,
  { waitUntil: "domcontentloaded", timeout: 120000 },
);
await new Promise((r) => setTimeout(r, 14000));
await page.evaluate((p) => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo(0, p * max);
}, p);
await new Promise((r) => setTimeout(r, 6000));
await page.evaluate(() => {
  const { gl } = window.__r3f;
  const ctx = gl.getContext();
  const progs = gl.info.programs || [];
  const nameOf = (wp) => {
    const pr = progs.find((q) => q.program === wp);
    return pr ? `${pr.name || "mat"}#${pr.id}` : "?";
  };
  const fbs = new Map();
  const fbName = (fb) => {
    if (!fb) return "canvas";
    if (!fbs.has(fb)) fbs.set(fb, `fb${fbs.size}`);
    return fbs.get(fb);
  };
  window.__trace = [];
  window.__reads = [];
  const h2f = (h) => {
    const s = h & 0x8000 ? -1 : 1,
      e = (h >> 10) & 0x1f,
      f = h & 0x3ff;
    if (e === 0) return s * Math.pow(2, -14) * (f / 1024);
    if (e === 31) return f ? NaN : s * Infinity;
    return s * Math.pow(2, e - 15) * (1 + f / 1024);
  };
  const readStats = (label) => {
    const vp = ctx.getParameter(ctx.VIEWPORT);
    const w = vp[2],
      h = vp[3];
    const x0 = 0,
      y0 = 0;
    const type = ctx.getParameter(ctx.IMPLEMENTATION_COLOR_READ_TYPE),
      fmt = ctx.getParameter(ctx.IMPLEMENTATION_COLOR_READ_FORMAT);
    let vals;
    if (type === ctx.UNSIGNED_BYTE) {
      const b = new Uint8Array(w * h * 4);
      ctx.readPixels(x0, y0, w, h, fmt, type, b);
      vals = new Float32Array(b.length);
      for (let i = 0; i < b.length; i++) vals[i] = b[i] / 255;
    } else if (type === ctx.HALF_FLOAT) {
      const b = new Uint16Array(w * h * 4);
      ctx.readPixels(x0, y0, w, h, fmt, type, b);
      vals = new Float32Array(b.length);
      for (let i = 0; i < b.length; i++) vals[i] = h2f(b[i]);
    } else {
      vals = new Float32Array(w * h * 4);
      ctx.readPixels(x0, y0, w, h, fmt, type, vals);
    }
    const err = ctx.getError();
    let nan = 0,
      inf = 0,
      max = -1e9,
      sum = 0,
      dark = 0;
    for (let i = 0; i < w * h; i++) {
      const r = vals[i * 4],
        g = vals[i * 4 + 1],
        bl = vals[i * 4 + 2];
      const m = Math.max(r, g, bl);
      if (Number.isNaN(m)) nan++;
      else if (!Number.isFinite(m)) inf++;
      else {
        if (m > max) max = m;
        sum += m;
        if (m < 0.01) dark++;
      }
    }
    window.__reads.push(
      `${label} fmt=${fmt} type=${type} err=${err} nan=${nan} inf=${inf} max=${max.toFixed(3)} mean=${(sum / (w * h)).toFixed(4)} dark=${(dark / (w * h)).toFixed(3)} alpha0=${vals[3]}`,
    );
  };
  for (const fn of [
    "drawElements",
    "drawArrays",
    "drawElementsInstanced",
    "drawArraysInstanced",
  ]) {
    const orig = ctx[fn].bind(ctx);
    ctx[fn] = (...a) => {
      orig(...a);
      const e = ctx.getError();
      const wp = ctx.getParameter(ctx.CURRENT_PROGRAM);
      const fb = ctx.getParameter(ctx.FRAMEBUFFER_BINDING);
      const vp = ctx.getParameter(ctx.VIEWPORT);
      window.__trace.push(
        `${fn.replace("draw", "")} ${nameOf(wp)} ${fbName(fb)} ${vp[2]}x${vp[3]} err=${e}`,
      );
      const nm = nameOf(wp);
      if (
        window.__reads.length < 12 &&
        (!fb ||
          nm.startsWith("LuminanceMaterial") ||
          (nm.startsWith("UpsamplingMaterial") && vp[2] === 720) ||
          (nm === "mat#19" && vp[2] === 1440))
      )
        readStats(`after ${nm} ${fbName(fb)} ${vp[2]}x${vp[3]}`);
    };
  }
  const origClear = ctx.clear.bind(ctx);
  ctx.clear = (m) => {
    origClear(m);
    const fb = ctx.getParameter(ctx.FRAMEBUFFER_BINDING);
    window.__trace.push(`clear(${m}) ${fbName(fb)}`);
  };
});
await new Promise((r) => setTimeout(r, 2500));
const t = await page.evaluate(() => [
  JSON.stringify(window.__stats ? window.__stats() : null),
  `total ${window.__trace.length}`,
  ...window.__reads,
]);
console.log(t.join("\n"));
await browser.close();
