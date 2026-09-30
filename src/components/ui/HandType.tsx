"use client";

import { useEffect } from "react";
import { store } from "@/lib/store";

/**
 * The hand on the HTML type. Every `[data-hand] .l` letter gets its weight
 * from the pointer's distance and its width from the pointer's speed, as
 * CSS custom properties read by `font-variation-settings`. Also writes
 * `--hand-x/--hand-y/--hand-v` on the root for the no-WebGL colour field.
 * Nothing runs without a fine pointer or under reduced motion.
 */
export default function HandType() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const letters = Array.from(document.querySelectorAll<HTMLElement>("[data-hand] .l"));
    if (!letters.length) return;
    let x = -1e4;
    let y = -1e4;
    let lx = x;
    let ly = y;
    let v = 0;
    let raf = 0;
    let rects: DOMRect[] = [];
    let measured = 0;
    const measure = () => {
      rects = letters.map((l) => l.getBoundingClientRect());
      measured = performance.now();
    };
    const tick = () => {
      raf = 0;
      if (performance.now() - measured > 500) measure();
      const speed = Math.hypot(x - lx, y - ly);
      lx = x;
      ly = y;
      v += (Math.min(1, speed / 60) - v) * 0.25;
      root.style.setProperty("--hand-x", `${x}px`);
      root.style.setProperty("--hand-y", `${y}px`);
      root.style.setProperty("--hand-v", v.toFixed(3));
      const reach = Math.max(160, window.innerWidth * 0.16);
      for (let i = 0; i < letters.length; i++) {
        const r = rects[i];
        if (!r) continue;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(cx - x, cy - y);
        const k = Math.max(0, 1 - d / reach);
        const g = Math.round(700 + k * 100 - v * k * 250);
        const w = Math.round(90 + k * 10 - v * k * 20);
        const el = letters[i];
        el.style.setProperty("--g", String(Math.max(300, Math.min(800, g))));
        el.style.setProperty("--w", String(Math.max(75, Math.min(100, w))));
      }
      if (v > 0.01) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (store.get().gl && store.get().deboss) return; // the glass letters own the name
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      x = -1e4;
      y = -1e4;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
