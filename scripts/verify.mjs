/**
 * Verification runs for the definition of done. Each check prints a JSON line.
 *
 *   node scripts/verify.mjs keyboard | overflow | memory | reduced | perf | bundle | lang
 *
 * All runs use the Playwright Chromium with SwiftShader (software WebGL), so
 * frame-time numbers describe this container, not a real GPU.
 */
import puppeteer from "puppeteer";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const mode = process.argv[2] ?? "keyboard";
const url = process.env.URL ?? "http://localhost:3000";
const executablePath = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find((p) => existsSync(p));

async function launch(args = []) {
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", ...args],
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (mode === "keyboard") {
  // Tab through the whole document; every focused element must be visible and inside the viewport,
  // and focusing an element inside a hidden section must bring its section on screen.
  const b = await launch();
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(`${url}/?gl=1&tier=low`, { waitUntil: "domcontentloaded" });
  await sleep(12000);
  const seen = [];
  let hiddenFocus = 0;
  for (let i = 0; i < 70; i++) {
    await p.keyboard.press("Tab");
    await sleep(120);
    const info = await p.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      const sec = el.closest("section.section");
      const cs = getComputedStyle(el);
      const focusRing = cs.outlineStyle !== "none" && cs.outlineWidth !== "0px";
      return {
        tag: el.tagName,
        text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40),
        section: sec?.id ?? null,
        sectionHidden: sec?.dataset.hidden ?? null,
        visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight,
        opacity: sec ? getComputedStyle(sec.querySelector(".panel")).opacity : "1",
        focusRing,
      };
    });
    if (!info) continue;
    if (info.section && info.sectionHidden === "true") hiddenFocus++;
    seen.push(info);
  }
  const invisible = seen.filter((s) => !s.visible);
  const noRing = seen.filter((s) => !s.focusRing);
  console.log(
    JSON.stringify({
      check: "keyboard",
      focused: seen.length,
      sectionsReached: [...new Set(seen.map((s) => s.section).filter(Boolean))],
      invisibleFocused: invisible.length,
      focusWithoutRing: noRing.length,
      stillHiddenAfterFocus: hiddenFocus,
      sample: seen.slice(0, 12).map((s) => `${s.tag}:${s.text}`),
    })
  );
  await b.close();
}

if (mode === "overflow") {
  const b = await launch();
  const out = [];
  for (const q of ["?gl=1", "?nogl"]) {
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await p.goto(`${url}/${q}`, { waitUntil: "domcontentloaded" });
    await sleep(q ? 2000 : 9000);
    const r = await p.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    for (const pp of [0, 0.28, 0.51, 0.65, 0.78, 0.9, 1]) {
      await p.evaluate((pp) => window.__snap?.(pp), pp);
      await sleep(400);
      const w = await p.evaluate(() => document.documentElement.scrollWidth);
      if (w > 390) r[`overflowAt${pp}`] = w;
    }
    out.push({ mode: q || "gl", ...r });
    await p.close();
  }
  console.log(JSON.stringify({ check: "overflow", results: out }));
  await b.close();
}

if (mode === "memory") {
  // Five full scroll cycles through every world, then compare renderer.info.memory.
  const b = await launch();
  const p = await b.newPage();
  await p.setViewport({ width: 1000, height: 600 });
  await p.goto(`${url}/?gl=1&tier=high`, { waitUntil: "domcontentloaded" });
  await sleep(12000);
  const stops = [0, 0.08, 0.16, 0.28, 0.36, 0.44, 0.51, 0.58, 0.65, 0.72, 0.78, 0.84, 0.9, 0.97, 1.0];
  const snapshot = async () => p.evaluate(() => window.__stats?.());
  const before = await snapshot();
  const cycles = [];
  for (let c = 0; c < 5; c++) {
    for (const s of stops) {
      await p.evaluate((s) => window.__snap?.(s), s);
      await sleep(700);
    }
    for (const s of [...stops].reverse()) {
      await p.evaluate((s) => window.__snap?.(s), s);
      await sleep(400);
    }
    cycles.push(await snapshot());
  }
  const after = await snapshot();
  const jsHeap = await p.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
  console.log(
    JSON.stringify({
      check: "memory",
      before: { geometries: before.memory.geometries, textures: before.memory.textures, programs: before.programs },
      perCycle: cycles.map((c) => ({ geometries: c.memory.geometries, textures: c.memory.textures, programs: c.programs })),
      after: { geometries: after.memory.geometries, textures: after.memory.textures, programs: after.programs },
      jsHeapMB: jsHeap,
    })
  );
  await b.close();
}

if (mode === "reduced") {
  // With prefers-reduced-motion the rig must sit exactly on a stop key (no interpolation) and cut between them.
  const b = await launch();
  const p = await b.newPage();
  await p.setViewport({ width: 1000, height: 600 });
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await p.goto(`${url}/?gl=1&tier=low`, { waitUntil: "domcontentloaded" });
  await sleep(10000);
  const samples = [];
  for (const target of [0.05, 0.3, 0.55, 0.7, 0.84, 0.94]) {
    await p.evaluate((t) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: t * max, behavior: "auto" });
    }, target);
    await sleep(2500);
    samples.push(await p.evaluate(() => {
      const s = window.__stats?.();
      return { progress: +s.progress.toFixed(3), rigP: +s.rigP.toFixed(3), act: s.act };
    }));
  }
  const reduced = await p.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  console.log(JSON.stringify({ check: "reduced-motion", mediaMatches: reduced, samples }));
  await b.close();
}

if (mode === "perf") {
  // Frame time per act as measured by the debug HUD stats, at 1440 and 390 (4× CPU throttle).
  const b = await launch();
  const out = [];
  for (const [w, h, throttle] of [[1440, 900, 1], [390, 844, 4]]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, isMobile: w < 600, hasTouch: w < 600 });
    const cdp = await p.createCDPSession();
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
    await p.goto(`${url}/?gl=1&tier=high&debug`, { waitUntil: "domcontentloaded" });
    await sleep(12000);
    for (const [act, pp] of [["I name", 0.0], ["I glass", 0.16], ["II portals", 0.28], ["III ribbon", 0.51], ["IV machine", 0.65], ["V portrait", 0.78], ["VI card", 0.9], ["ending", 0.995]]) {
      await p.evaluate((pp) => window.__snap?.(pp), pp);
      await sleep(6000);
      const s = await p.evaluate(() => window.__stats?.());
      out.push({ viewport: `${w}x${h}`, cpuThrottle: throttle, act, fps: +s.fps.toFixed(1), ms: +s.ms.toFixed(1), calls: s.calls, triangles: s.triangles, tier: s.tier });
    }
    await p.close();
  }
  console.log(JSON.stringify({ check: "perf(software-gl)", renderer: "SwiftShader (no GPU in this container)", results: out }));
  await b.close();
}

if (mode === "bundle") {
  // Initial JS: every script the HTML references, gzip-compressed, vs the lazily loaded 3D chunk(s).
  const html = await (await fetch(`${url}/`)).text();
  const scripts = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]);
  const chunkDir = path.resolve(".next/static/chunks");
  let initial = 0;
  const rows = [];
  for (const s of new Set(scripts)) {
    const f = path.join(chunkDir, path.basename(s));
    if (!existsSync(f)) continue;
    const gz = gzipSync(readFileSync(f)).length;
    initial += gz;
    rows.push({ file: path.basename(s), gzipKB: +(gz / 1024).toFixed(1) });
  }
  // the 3D chunks are the ones not referenced by the HTML
  let lazy = 0;
  const lazyRows = [];
  for (const f of readdirSync(chunkDir)) {
    if (!f.endsWith(".js") || scripts.some((s) => s.endsWith(f))) continue;
    const gz = gzipSync(readFileSync(path.join(chunkDir, f))).length;
    if (statSync(path.join(chunkDir, f)).size > 20000) lazyRows.push({ file: f, gzipKB: +(gz / 1024).toFixed(1) });
    lazy += gz;
  }
  console.log(JSON.stringify({ check: "bundle", initialGzipKB: +(initial / 1024).toFixed(1), initialScripts: rows.length, lazyGzipKB: +(lazy / 1024).toFixed(1), largestLazy: lazyRows.sort((a, b) => b.gzipKB - a.gzipKB).slice(0, 6) }));
}

if (mode === "lang") {
  // TR at /, EN at /en: html lang, hreflang alternates, the toggle's target, the dictionary in use.
  const b = await launch();
  const out = [];
  for (const [path, lang] of [["/", "tr"], ["/en", "en"]]) {
    const p = await b.newPage();
    await p.goto(`${url}${path}?nogl`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    out.push(
      await p.evaluate((lang) => ({
        path: location.pathname,
        htmlLang: document.documentElement.lang,
        expected: lang,
        h2: document.querySelector("#isler-title")?.textContent,
        toggle: document.querySelector('.nav-tools a[hreflang]')?.getAttribute("href"),
        alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => `${l.getAttribute("hreflang")}→${l.getAttribute("href")}`),
        title: document.title,
        firstWorkHref: document.querySelector(".works-grid a")?.getAttribute("href"),
      }), lang)
    );
    await p.close();
  }
  console.log(JSON.stringify({ check: "lang", results: out }));
  await b.close();
}
