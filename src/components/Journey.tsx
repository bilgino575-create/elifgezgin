"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { loading, store, type Tier } from "@/lib/store";
import { scrollToStop, startScroll, stopScroll } from "@/lib/scroll";
import { COUNT, HOLD, STOPS, segmentAt, travelAt } from "@/lib/stops";

declare global {
  interface Window {
    __tier?: Tier;
  }
}

/** relative luminance of a hex colour, for the one place CSS needs to know if an ink is light */
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/**
 * The scroll track and the stage. Starts the scroll clock, hands the html
 * classes to the store, fades each stop's HTML layer as the camera leaves
 * it, and brings the 3D chunk in after first paint, from an idle callback.
 * Without WebGL nothing here changes the document: the stops simply flow.
 */
export default function Journey({ children }: { children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [Stage, setStage] = useState<ComponentType | null>(null);

  useEffect(() => {
    const h = document.documentElement;
    const gl = h.classList.contains("gl");
    const touch = h.classList.contains("touch");
    const reduced = h.classList.contains("reduced");
    const tier = window.__tier ?? "high";
    store.set({ gl, touch, reduced, tier, loadTotal: gl ? 4 : 1 });
    document.fonts.ready.then(() => loading.done());
    const el = track.current!;
    const stop = startScroll(el);
    if (!store.get().loaded) stopScroll(true);
    // keyboard: focusing anything inside a stop's layer brings the camera to that stop's hold,
    // so the focused control is on a visible page, not at the edge where the layer is still faded
    const onFocus = (e: FocusEvent) => {
      const sec = (e.target as Element | null)?.closest?.(".stop") as HTMLElement | null;
      if (!sec) return;
      const n = Number(sec.dataset.n) - 1;
      if (!Number.isFinite(n) || n < 0) return;
      const { p } = store.get();
      const inHold = Math.floor(p * COUNT) === n && (p * COUNT) % 1 < HOLD;
      if (!inHold) scrollToStop(n, true);
    };
    el.addEventListener("focusin", onFocus);

    let cancelled = false;
    if (gl) {
      const load = () =>
        import("@/components/3d/Experience").then((m) => {
          if (cancelled) return;
          setStage(() => m.default);
          loading.done();
        });
      if ("requestIdleCallback" in window) window.requestIdleCallback(load, { timeout: 1200 });
      else setTimeout(load, 200);
    }
    return () => {
      cancelled = true;
      el.removeEventListener("focusin", onFocus);
      stop();
      stopScroll(false);
    };
  }, []);

  // the stop layers: a page over the world, fading as the camera travels on; the root carries the stop's palette
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const layers = Array.from(el.querySelectorAll<HTMLElement>(".stop-layer"));
    const sections = Array.from(el.querySelectorAll<HTMLElement>(".stop"));
    const root = document.documentElement;
    let lastStop = -1;
    let lastLoaded = false;
    const apply = () => {
      const s = store.get();
      if (s.loaded !== lastLoaded) {
        lastLoaded = s.loaded;
        stopScroll(!s.loaded);
      }
      if (!s.gl) return;
      const { i, t } = segmentAt(s.p);
      const { k } = travelAt(s.p);
      for (let j = 0; j < layers.length; j++) {
        // the current layer: in from the start at the first stop, faded in on arrival elsewhere, out as the camera leaves
        const o = j === i ? (i === 0 ? 1 : Math.min(1, t / 0.08)) * (1 - k) : 0;
        const v = s.reduced ? (j === i ? 1 : 0) : o;
        layers[j].style.opacity = v.toFixed(3);
        sections[j].dataset.active = j === i ? "true" : "false";
      }
      if (i !== lastStop) {
        lastStop = i;
        const pal = STOPS[Math.min(COUNT - 1, i)].palette;
        root.dataset.stop = STOPS[i].id;
        root.style.setProperty("--fg", pal.fg);
        root.style.setProperty("--fg2", pal.fg2);
        root.style.setProperty("--a", pal.a);
        root.style.setProperty("--b", pal.b);
        root.style.setProperty("--c", pal.c);
        root.style.setProperty("--bg", pal.bg);
        root.style.setProperty("--on-a", luminance(pal.a) > 0.45 ? "#07060f" : "#f7f6f2");
        root.style.setProperty("--ring", pal.a === pal.fg ? pal.b : pal.a);
      }
    };
    apply();
    return store.subscribe(apply);
  }, []);

  // touch: the finger is the light
  useEffect(() => {
    const onTouch = (e: TouchEvent) => {
      const t0 = e.touches[0];
      if (!t0) return;
      store.set({ cx: t0.clientX, cy: t0.clientY, px: (t0.clientX / window.innerWidth) * 2 - 1, py: -((t0.clientY / window.innerHeight) * 2 - 1), pointer: true });
    };
    const onEnd = () => store.set({ pointer: false });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  return (
    <>
      {Stage ? (
        <div id="stage" aria-hidden="true">
          <Stage />
        </div>
      ) : null}
      <div className="track" ref={track}>
        {children}
      </div>
    </>
  );
}
