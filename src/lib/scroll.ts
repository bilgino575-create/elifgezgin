"use client";

import type Lenis from "lenis";
import { SECTIONS, TRACK_VH, sectionById } from "./acts";
import { store } from "./store";

let lenis: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  lenis = l;
}
export function getLenis() {
  return lenis;
}

export function maxScroll(): number {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}
export function progressToY(p: number): number {
  return p * maxScroll();
}
export function currentProgress(): number {
  return Math.min(1, Math.max(0, window.scrollY / maxScroll()));
}

export function scrollToProgress(p: number, immediate = false) {
  const y = progressToY(p);
  const { reducedMotion } = store.get();
  if (lenis && !reducedMotion && !immediate) {
    lenis.scrollTo(y, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
  } else if (lenis) {
    lenis.scrollTo(y, { immediate: true });
  } else {
    window.scrollTo({ top: y, behavior: reducedMotion || immediate ? "auto" : "smooth" });
  }
}

/** Scroll to a section hash like `#isler`. Works with and without WebGL. */
export function scrollToHash(hash: string, immediate = false) {
  const id = hash.replace(/^#/, "");
  const s = sectionById(id);
  if (store.get().gl && s) {
    scrollToProgress(s.anchor, immediate);
    if (history.replaceState) history.replaceState(null, "", `#${id}`);
    return;
  }
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: store.get().reducedMotion ? "auto" : "smooth", block: "start" });
    if (history.replaceState) history.replaceState(null, "", `#${id}`);
  }
}

export function trackVh(): number {
  return store.get().touch || window.innerWidth < 768 ? TRACK_VH.mobile : TRACK_VH.desktop;
}

export { SECTIONS };
