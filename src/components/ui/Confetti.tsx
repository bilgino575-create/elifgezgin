"use client";

import { useEffect, useRef } from "react";
import { store } from "@/lib/store";

/**
 * The gift: typing "elif" releases a slow shower of paper confetti in the
 * spot colour. DOM/canvas, so it works with and without WebGL. Respects
 * reduced motion (a single still scatter that fades).
 */
export default function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = store.get().confetti;
    let pieces: { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; a: number; life: number }[] = [];
    let t0 = 0;

    const spot = () => getComputedStyle(document.documentElement).getPropertyValue("--spot").trim() || "#1F4BFF";

    const frame = (now: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = window.innerWidth;
      const H = window.innerHeight;
      if (c.width !== W * dpr || c.height !== H * dpr) {
        c.width = W * dpr;
        c.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const dt = Math.min(0.05, (now - t0) / 1000 || 0.016);
      t0 = now;
      const reduced = store.get().reducedMotion;
      ctx.fillStyle = spot();
      let alive = 0;
      for (const p of pieces) {
        if (!reduced) {
          p.vy += 60 * dt;
          p.vy = Math.min(p.vy, 90);
          p.x += p.vx * dt + Math.sin(now / 700 + p.r) * 18 * dt;
          p.y += p.vy * dt;
          p.r += p.vr * dt;
        }
        p.life -= dt;
        if (p.life <= 0 || p.y > H + 20) continue;
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life) * p.a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.scale(1, Math.abs(Math.cos(now / 400 + p.r)) * 0.8 + 0.2);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(frame);
      else {
        pieces = [];
        raf = 0;
        c.style.display = "none";
      }
    };

    const release = () => {
      const W = window.innerWidth;
      const n = 140;
      pieces = [];
      for (let i = 0; i < n; i++) {
        pieces.push({
          x: Math.random() * W,
          y: -20 - Math.random() * window.innerHeight * 0.6,
          vx: (Math.random() - 0.5) * 30,
          vy: 20 + Math.random() * 40,
          r: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 2,
          w: 6 + Math.random() * 8,
          h: 3 + Math.random() * 5,
          a: 0.7 + Math.random() * 0.3,
          life: 9 + Math.random() * 5,
        });
      }
      if (store.get().reducedMotion) for (const p of pieces) p.y = Math.random() * window.innerHeight;
      c.style.display = "block";
      t0 = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const unsub = store.subscribe(() => {
      const n = store.get().confetti;
      if (n !== last) {
        last = n;
        release();
      }
    });
    return () => {
      unsub();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 55, pointerEvents: "none", display: "none", width: "100%", height: "100%" }} />;
}
