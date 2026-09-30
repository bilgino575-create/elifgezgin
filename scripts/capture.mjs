/**
 * Captures short video loops from the REAL 3D scene for the no-WebGL page.
 *
 * No ffmpeg exists in the build container, so the encoding happens inside
 * headless Chromium: the page is opened with `?capture=1` (frameloop driven
 * by `window.__advance(t)` at a fixed 30 fps clock), every frame is handed
 * to WebCodecs' VideoEncoder (VP9, software), and the chunks are muxed by
 * scripts/webm.mjs into a WebM. A poster (first frame) is saved as WebP.
 *
 *   node scripts/capture.mjs [--name hero] [--p 0.05] [--seconds 6] [--w 1280 --h 720] [--all]
 *
 * Output: public/loops/<name>.webm + public/loops/<name>.webp
 */
import puppeteer from "puppeteer";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { WEBM_SOURCE } from "./webm.mjs";

const args = process.argv.slice(2);
const get = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const url = get("url", "http://localhost:3000");
const LOOPS = {
  hero: { p: 0.0, seconds: 7, hand: true, intro: true },
  portals: { p: 0.34, seconds: 6, hand: true },
  card: { p: 0.9, seconds: 6, hand: true },
};
const names = args.includes("--all") ? Object.keys(LOOPS) : [get("name", "hero")];
const W = Number(get("w", 1280));
const H = Number(get("h", 720));
const FPS = 30;
mkdirSync("public/loops", { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  protocolTimeout: 1800000,
});

for (const name of names) {
  const cfg = LOOPS[name];
  const seconds = Number(get("seconds", cfg.seconds));
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(`${url}/?gl=1&tier=high&capture=1${cfg.intro ? "&chaos=0" : ""}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.evaluate(WEBM_SOURCE);
  // wait for the scene to be ready (the drop lands when every loading unit is done)
  await page.waitForFunction(() => window.__advance && document.documentElement.classList.contains("deboss"), { timeout: 240000, polling: 500 });
  // settle a little and place the scroll
  await page.evaluate((p) => window.__snap?.(p), cfg.p);
  const t0 = Date.now();
  const result = await page.evaluate(
    async ({ seconds, fps, w, h, hand, p }) => {
      const canvas = document.querySelector(".gl-layer canvas");
      const chunks = [];
      let err = null;
      const encoder = new VideoEncoder({
        output: (chunk) => {
          const data = new Uint8Array(chunk.byteLength);
          chunk.copyTo(data);
          chunks.push({ data, timestamp: chunk.timestamp, key: chunk.type === "key" });
        },
        error: (e) => {
          err = e.message;
        },
      });
      encoder.configure({ codec: "vp09.00.10.08", width: w, height: h, bitrate: 1_200_000, framerate: fps, latencyMode: "quality" });
      const n = seconds * fps;
      let poster = null;
      // warm-up frames so the intro glide and the ink settle where the loop should start
      const warm = p === 0 ? 0 : 20;
      for (let i = -warm; i < n; i++) {
        const t = (i + warm) / fps;
        if (hand) {
          // a hand that strolls over the stage
          const x = Math.sin(t * 0.9) * 0.55 + Math.sin(t * 0.37) * 0.2;
          const y = Math.cos(t * 0.7) * 0.35 + Math.cos(t * 0.23) * 0.15;
          window.dispatchEvent(new PointerEvent("pointermove", { clientX: (x * 0.5 + 0.5) * w, clientY: (-y * 0.5 + 0.5) * h, bubbles: true }));
        }
        window.__advance((t + 0.001) * 1000);
        // let the compositor breathe every few frames so timers (the drop) run
        if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
        if (i < 0) continue;
        // the poster is a frame from the middle of the loop (the name has snapped, the ink is alive)
        if (i === Math.floor(n * 0.45)) poster = canvas.toDataURL("image/png");
        const frame = new VideoFrame(canvas, { timestamp: Math.round((i / fps) * 1e6), duration: Math.round(1e6 / fps) });
        encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
        frame.close();
        if (encoder.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 30));
      }
      await encoder.flush();
      encoder.close();
      if (err) throw new Error(err);
      const webm = window.__muxWebm({ width: w, height: h, fps, chunks });
      let s = "";
      for (let i = 0; i < webm.length; i += 0x8000) s += String.fromCharCode.apply(null, webm.subarray(i, i + 0x8000));
      return { webm: btoa(s), poster, frames: n, bytes: webm.length };
    },
    { seconds, fps: FPS, w: W, h: H, hand: !!cfg.hand, p: cfg.p }
  );
  writeFileSync(`public/loops/${name}.webm`, Buffer.from(result.webm, "base64"));
  await sharp(Buffer.from(result.poster.split(",")[1], "base64")).webp({ quality: 78 }).toFile(`public/loops/${name}.webp`);
  console.log(JSON.stringify({ loop: name, frames: result.frames, seconds, kb: Math.round(result.bytes / 1024), took_s: Math.round((Date.now() - t0) / 1000) }));
  await page.close();
}
await browser.close();
