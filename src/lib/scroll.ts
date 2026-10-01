"use client";

import type Lenis from "lenis";
import { store } from "@/lib/store";
import { COUNT, segmentAt } from "@/lib/stops";

/**
 * Scroll → p. Lenis smooths the wheel on fine pointers; phones keep native
 * scrolling. p is read from the real scroll position every frame, so the
 * 3D camera, the stop layers and the route index all share one clock.
 */
let lenis: Lenis | null = null;
let raf = 0;
let track: HTMLElement | null = null;
let stopped = false;

function read() {
  if (!track) return;
  const max = Math.max(1, track.offsetHeight - window.innerHeight);
  const y = Math.min(max, Math.max(0, window.scrollY - track.offsetTop));
  const p = y / max;
  const { i } = segmentAt(p);
  const s = store.get();
  if (Math.abs(s.p - p) > 1e-5 || s.stop !== i) {
    store.set({ p, stop: i });
    document.documentElement.style.setProperty("--p", p.toFixed(5));
  }
}

export function startScroll(el: HTMLElement) {
  track = el;
  const fine = document.documentElement.classList.contains("fine") && !store.get().reduced;
  let alive = true;
  if (fine) {
    // the smooth-scroll library arrives after first paint; native scrolling serves until then
    import("lenis").then(({ default: L }) => {
      if (!alive || !track) return;
      lenis = new L({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
      if (stopped) {
        document.documentElement.style.overflow = "";
        lenis.stop();
      }
    });
  }
  const loop = (t: number) => {
    lenis?.raf(t);
    read();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  read();
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    lenis?.destroy();
    lenis = null;
    track = null;
  };
}

/** scroll to the hold of stop i (0-based) */
export function scrollToStop(i: number, immediate = false) {
  if (!track) return;
  const max = track.offsetHeight - window.innerHeight;
  const p = Math.min(1, (i + 0.08) / COUNT);
  const y = track.offsetTop + p * max;
  if (lenis && !immediate) lenis.scrollTo(y, { duration: 1.6 });
  else window.scrollTo({ top: y, behavior: immediate || store.get().reduced ? "auto" : "smooth" });
}

export function stopScroll(stop: boolean) {
  stopped = stop;
  if (!lenis) {
    document.documentElement.style.overflow = stop ? "hidden" : "";
    return;
  }
  if (stop) lenis.stop();
  else lenis.start();
}
