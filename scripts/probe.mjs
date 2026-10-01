/**
 * What is on the stage at a given p: renderer numbers, every mesh with its
 * visibility, world position and material, and the HTML layer's boxes.
 *
 *   node scripts/probe.mjs [p] [extra query]      # needs `next start`; opens ?gl=1&tier=high&debug
 */
import puppeteer from "puppeteer";


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

const p = Number(process.argv[2] || 0);
const q = process.argv[3] || "";
const mobile = process.argv.includes("--mobile");
const browser = await puppeteer.launch({ headless: true, executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
if (mobile) await page.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
else await page.setViewport({ width: 1440, height: 900 });
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") console.log("console", m.type(), m.text().slice(0, 240));
});
page.on("pageerror", (e) => console.log("pageerror", e.message));
await page.goto(`http://localhost:3000/?gl=1&tier=high&debug${q ? "&" + q : ""}`, { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise((r) => setTimeout(r, 6000));
// the loader locks scrolling until it hands over: wait for it, then scroll and wait for p to arrive
for (let i = 0; i < 80; i++) {
  const gone = await page.evaluate(() => {
    const l = document.querySelector(".loader");
    return !l || l.getAttribute("data-loaded") === "true";
  });
  if (gone) break;
  await new Promise((r) => setTimeout(r, 500));
}
await page.evaluate((p) => {
  const track = document.querySelector(".track");
  const max = track.offsetHeight - window.innerHeight;
  window.scrollTo({ top: track.offsetTop + p * max, behavior: "auto" });
}, p);
for (let i = 0; i < 40; i++) {
  const ok = await page.evaluate((p) => {
    const s = window.__stats ? window.__stats() : null;
    return !!s && Math.abs(s.p - p) < 0.01;
  }, p);
  if (ok) break;
  await new Promise((r) => setTimeout(r, 500));
}
const settled = await settleCamera(page);
console.log("camera settled:", settled);
const out = await page.evaluate(() => {
  const r = window.__r3f;
  const res = { stats: window.__stats ? window.__stats() : null, loader: document.querySelector(".loader")?.getAttribute("data-loaded") ?? "gone" };
  if (!r) return { ...res, r3f: "missing" };
  const { scene, camera } = r;
  const items = [];
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!(o.isMesh || o.isPoints)) return;
    const e = o.matrixWorld.elements;
    let vis = true;
    let n = o;
    while (n) {
      if (!n.visible) vis = false;
      n = n.parent;
    }
    const geo = o.geometry;
    const cnt = geo?.index ? geo.index.count / 3 : (geo?.attributes?.position?.count ?? 0) / 3;
    items.push(`${o.type}:${o.material?.type ?? "?"} vis=${vis} pos=(${e[12].toFixed(1)},${e[13].toFixed(1)},${e[14].toFixed(1)}) scale=${o.scale.x.toFixed(2)} tris=${Math.round(cnt)} fc=${o.frustumCulled}`);
  });
  // screen boxes of the named objects (the nearest named ancestor of each mesh), in CSS px
  const boxes = {};
  const T = r;
  scene.traverse((o) => {
    if (!(o.isMesh || o.isPoints)) return;
    let n = o;
    let name = "";
    while (n) {
      if (!n.visible) return;
      if (!name && n.name) name = n.name;
      n = n.parent;
    }
    if (!name) return;
    const geo = o.geometry;
    if (!geo) return;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox;
    if (!bb || !isFinite(bb.min.x)) return;
    const corners = [];
    for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) corners.push([x, y, z]);
    const b = boxes[name] ?? (boxes[name] = { l: 1e9, t: 1e9, r: -1e9, bt: -1e9 });
    for (const c of corners) {
      const v = T ? new T.Vector3(c[0], c[1], c[2]) : null;
      if (!v) return;
      v.applyMatrix4(o.matrixWorld).project(camera);
      const sx = ((v.x + 1) / 2) * window.innerWidth;
      const sy = ((1 - v.y) / 2) * window.innerHeight;
      b.l = Math.min(b.l, sx); b.r = Math.max(b.r, sx); b.t = Math.min(b.t, sy); b.bt = Math.max(b.bt, sy);
    }
  });
  res.boxes = Object.fromEntries(Object.entries(boxes).map(([k, b]) => [k, { x: Math.round(b.l), y: Math.round(b.t), w: Math.round(b.r - b.l), h: Math.round(b.bt - b.t) }]));
  res.camera = { pos: camera.position.toArray().map((x) => +x.toFixed(2)), fov: camera.fov };
  res.fog = scene.fog ? { near: scene.fog.near, far: scene.fog.far, color: "#" + scene.fog.color.getHexString() } : null;
  res.env = !!scene.environment;
  res.meshes = items;
  const rect = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), opacity: getComputedStyle(el).opacity };
  };
  res.dom = { layer1: rect('.stop[data-n="1"] .stop-layer'), head1: rect('.stop[data-n="1"] .stop-head'), body1: rect('.stop[data-n="1"] .stop-body'), layerCur: rect('.stop[data-active="true"] .stop-layer'), headCur: rect('.stop[data-active="true"] .stop-head'), bodyCur: rect('.stop[data-active="true"] .stop-body'), track: rect(".track") };
  return res;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
