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

/** scroll the journey to p (0..1 on the track), the way the probe does */
const snap = (page, pp) =>
  page.evaluate((pp) => {
    const track = document.querySelector(".track");
    if (!track) return window.scrollTo({ top: pp * (document.documentElement.scrollHeight - innerHeight), behavior: "auto" });
    const max = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: track.offsetTop + pp * max, behavior: "auto" });
  }, pp);
/** the hold of each stop, as p */
const HOLDS = [0, 0.186, 0.329, 0.471, 0.614, 0.757, 0.9];

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
    // focus inside a stop brings the camera to it; the layer follows on the next frames (slow here, software GL)
    await sleep(900);
    const info = await p.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      const sec = el.closest("section.stop");
      const cs = getComputedStyle(el);
      const focusRing = cs.outlineStyle !== "none" && cs.outlineWidth !== "0px";
      const layer = sec?.querySelector(".stop-layer");
      return {
        tag: el.tagName,
        text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40),
        section: sec?.id ?? null,
        sectionHidden: sec ? String(sec.dataset.active !== "true") : null,
        visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight,
        opacity: layer ? getComputedStyle(layer).opacity : "1",
        focusRing,
      };
    });
    if (!info) continue;
    if (info.section && info.sectionHidden === "true" && Number(info.opacity) < 0.5) hiddenFocus++;
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
  // no horizontal scroll at any width the brief names, in both modes, at every stop and on a project page
  const b = await launch();
  const out = [];
  const widths = [320, 375, 390, 430, 768, 1024, 1440, 1920];
  for (const q of ["?gl=1&tier=low", "?nogl"]) {
    for (const w of widths) {
      const p = await b.newPage();
      const mobile = w < 768;
      await p.setViewport({ width: w, height: mobile ? 844 : 900, isMobile: mobile, hasTouch: mobile });
      await p.goto(`${url}/${q}`, { waitUntil: "domcontentloaded" });
      await sleep(q.includes("nogl") ? 2500 : 9000);
      const row = { mode: q.includes("nogl") ? "nogl" : "gl", width: w, overflowAt: [] };
      for (const pp of HOLDS) {
        await snap(p, pp);
        await sleep(500);
        const sw = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        if (sw > w) row.overflowAt.push({ p: pp, scrollWidth: sw });
      }
      // the menu open, on phones
      if (mobile) {
        await p.evaluate(() => document.querySelector(".menu-btn")?.click());
        await sleep(600);
        const sw = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        if (sw > w) row.overflowAt.push({ menu: true, scrollWidth: sw });
      }
      out.push(row);
      await p.close();
    }
  }
  // a project page, both modes, phone and desktop
  const workHref = await (async () => {
    const p = await b.newPage();
    await p.goto(`${url}/?nogl`, { waitUntil: "domcontentloaded" });
    const h = await p.evaluate(() => document.querySelector('a[href^="/isler/"]')?.getAttribute("href"));
    await p.close();
    return h;
  })();
  if (workHref) {
    for (const q of ["?gl=1&tier=low", "?nogl"]) {
      for (const w of [320, 390, 1440]) {
        const p = await b.newPage();
        const mobile = w < 768;
        await p.setViewport({ width: w, height: mobile ? 844 : 900, isMobile: mobile, hasTouch: mobile });
        await p.goto(`${url}${workHref}${q}`, { waitUntil: "domcontentloaded" });
        await sleep(q.includes("nogl") ? 2500 : 7000);
        const sw = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        out.push({ mode: q.includes("nogl") ? "nogl" : "gl", page: workHref, width: w, overflowAt: sw > w ? [{ scrollWidth: sw }] : [] });
        await p.close();
      }
    }
  }
  const bad = out.filter((r) => r.overflowAt.length);
  console.log(JSON.stringify({ check: "overflow", pages: out.length, failures: bad }));
  await b.close();
}

if (mode === "memory") {
  // Five full scroll cycles through every world, then compare renderer.info.memory.
  const b = await launch();
  const p = await b.newPage();
  await p.setViewport({ width: 1000, height: 600 });
  await p.goto(`${url}/?gl=1&tier=high`, { waitUntil: "domcontentloaded" });
  await sleep(12000);
  const stops = [0, 0.1, 0.186, 0.26, 0.329, 0.4, 0.471, 0.55, 0.614, 0.69, 0.757, 0.83, 0.9, 0.97, 1.0];
  const snapshot = async () => p.evaluate(() => window.__stats?.());
  const before = await snapshot();
  const cycles = [];
  for (let c = 0; c < 5; c++) {
    for (const s of stops) {
      await snap(p, s);
      await sleep(700);
    }
    for (const s of [...stops].reverse()) {
      await snap(p, s);
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
  await p.goto(`${url}/?gl=1&tier=low&debug`, { waitUntil: "domcontentloaded" });
  await sleep(10000);
  const samples = [];
  for (const target of [0.05, 0.13, 0.3, 0.55, 0.7, 0.84, 0.94]) {
    await snap(p, target);
    await sleep(2500);
    samples.push(await p.evaluate(() => {
      const s = window.__stats?.();
      const r = window.__r3f;
      const active = document.querySelector('.stop[data-active="true"]');
      return { p: +s.p.toFixed(3), stop: s.stop, activeLayer: active?.dataset.n ?? null, cam: r ? r.camera.position.toArray().map((x) => +x.toFixed(1)) : null, reducedClass: document.documentElement.classList.contains("reduced") };
    }));
  }
  const reduced = await p.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  // between two stops (p = 0.13 is 91% through segment 0) the camera must still sit on stop 1, not between
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
    for (const [stop, pp] of [["01 renk", 0.0], ["01→02 travel", 0.12], ["02 tipografi", 0.186], ["03 marka", 0.329], ["04 afiş", 0.471], ["05 dijital", 0.614], ["06 elif", 0.757], ["07 iletişim", 0.9]]) {
      await snap(p, pp);
      await sleep(6000);
      const s = await p.evaluate(() => window.__stats?.());
      out.push({ viewport: `${w}x${h}`, cpuThrottle: throttle, stop, fps: +s.fps.toFixed(1), ms: +s.ms.toFixed(1), calls: s.calls, triangles: s.tris, tier: s.tier });
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
        heroRole: document.querySelector(".hero-role")?.textContent?.trim(),
        stopHead: document.querySelector('.stop[data-n="2"] .stop-head')?.textContent?.replace(/\s+/g, " ").trim(),
        toggle: document.querySelector('.nav a[hreflang]')?.getAttribute("href"),
        alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => `${l.getAttribute("hreflang")}→${l.getAttribute("href")}`),
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute("content"),
        firstWorkHref: document.querySelector('a[href^="/isler/"], a[href^="/en/work/"]')?.getAttribute("href"),
        navLabels: [...document.querySelectorAll(".nav-links a")].map((a) => a.textContent.trim()),
      }), lang)
    );
    await p.close();
  }
  console.log(JSON.stringify({ check: "lang", results: out }));
  await b.close();
}
