"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/content";
import { t } from "@/lib/i18n";
import { store, useStore } from "@/lib/store";

/**
 * The opening: one particle of colour in the dark. It grows as the real
 * loading units arrive (fonts, the 3D chunk, the stage's first frame, the
 * first textures), gathers a cloud of particles into a turning sphere, and
 * when everything is in, the sphere bursts and the journey is there.
 * Canvas 2D, no three.js in the first bundle. Reduced motion: a count and a fade.
 */
export default function Loader({ lang }: { lang: Lang }) {
  const d = t(lang);
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const done = useStore((s) => s.loadDone);
  const total = useStore((s) => s.loadTotal);
  const loaded = useStore((s) => s.loaded);
  const [gone, setGone] = useState(false);
  const [stuck, setStuck] = useState(false);
  const pct = Math.min(99, Math.round((done / Math.max(1, total)) * 100));

  // all units in → the burst, then the handover
  useEffect(() => {
    if (loaded || done < total) return;
    const timer = setTimeout(() => store.set({ loaded: true }), store.get().reduced ? 120 : 700);
    return () => clearTimeout(timer);
  }, [done, total, loaded]);
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => setGone(true), 900);
    return () => clearTimeout(timer);
  }, [loaded]);
  // a way in if a unit never arrives (a blocked chunk, a stalled font)
  useEffect(() => {
    const timer = setTimeout(() => !store.get().loaded && setStuck(true), 9000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv || store.get().reduced) return;
    const ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const INKS = ["#1f3bff", "#ff2e88", "#19e3ff", "#c8ff00", "#e400ff"];
    const N = 420;
    // particles on a sphere: a direction, a radius, a colour, a phase
    const P = Array.from({ length: N }, (_, i) => {
      const u = (i + 0.5) / N;
      const phi = Math.acos(1 - 2 * u);
      const th = Math.PI * (1 + Math.sqrt(5)) * i;
      return { x: Math.sin(phi) * Math.cos(th), y: Math.sin(phi) * Math.sin(th), z: Math.cos(phi), c: INKS[i % INKS.length], s: 0.6 + (i % 7) / 7, vx: 0, vy: 0, vz: 0 };
    });
    let raf = 0;
    const t0 = performance.now();
    let burstAt = -1;
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const s = store.get();
      const prog = Math.min(1, s.loadDone / Math.max(1, s.loadTotal));
      if (s.loaded && burstAt < 0) burstAt = now;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * (0.06 + 0.16 * prog);
      // the core
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
      g.addColorStop(0, "rgba(31,59,255,0.95)");
      g.addColorStop(0.5, "rgba(31,59,255,0.35)");
      g.addColorStop(1, "rgba(31,59,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2);
      ctx.fill();
      // the cloud: more of it as more arrives, turning; after the burst it flies
      const count = Math.floor(N * Math.min(1, 0.12 + prog * 0.88));
      const a = t * 0.5;
      const b = t * 0.23;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const cb = Math.cos(b);
      const sb = Math.sin(b);
      const burst = burstAt >= 0 ? (now - burstAt) / 1000 : 0;
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < count; i++) {
        const p = P[i];
        // rotate the sphere
        const x = p.x * ca - p.z * sa;
        let z = p.x * sa + p.z * ca;
        const y = p.y * cb - z * sb;
        z = p.y * sb + z * cb;
        let r = R * (1.15 + 0.1 * Math.sin(t * 2 + i));
        let alpha = 0.55 + 0.45 * (z + 1) * 0.5;
        if (burst > 0) {
          r += burst * burst * Math.max(w, h) * 0.9 * p.s;
          alpha *= Math.max(0, 1 - burst * 1.4);
        }
        const px = cx + x * r;
        const py = cy + y * r;
        const size = (1.2 + (z + 1) * 1.1) * p.s * (1 + burst * 2);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
        void y;
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      if (burst < 1.2) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (gone) return null;
  return (
    <div className="loader" ref={root} role="status" aria-live="polite" data-loaded={loaded ? "true" : "false"}>
      <canvas ref={canvas} className="loader-canvas" aria-hidden="true" />
      <p className="loader-label meta">
        <span>{d.loader.label}</span>
        <span className="num">{String(pct).padStart(2, "0")}</span>
      </p>
      {stuck && !loaded ? (
        <button type="button" className="cta loader-enter" onClick={() => store.set({ loaded: true })}>
          {d.loader.enter} <span aria-hidden="true">→</span>
        </button>
      ) : null}
    </div>
  );
}
