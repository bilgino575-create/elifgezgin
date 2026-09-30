"use client";

import { useEffect } from "react";
import { SECTIONS, actAt, sectionVisibility, TRACK_VH } from "@/lib/acts";
import { store, loading } from "@/lib/store";
import { currentProgress, scrollToHash, setLenis } from "@/lib/scroll";
import { probeWebGL } from "@/lib/gl";
import { readTheme } from "@/lib/theme";

/**
 * Owns the scroll and the environment flags. Decides early whether the 3D
 * layer is possible (so the document takes its final shape before the chunk
 * loads), runs Lenis, writes progress to the store and drives the visibility
 * of the HTML sections without React re-renders. Also the "elif" easter egg
 * and the `D` debug key.
 */
export default function ScrollDriver() {
  useEffect(() => {
    const html = document.documentElement;
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const mqFine = window.matchMedia("(pointer: fine)");
    const params = new URLSearchParams(window.location.search);

    const touch = mqCoarse.matches || "ontouchstart" in window;
    const reducedMotion = mqReduce.matches;
    const debug = params.has("debug");
    const onHome = !!document.getElementById("giris");

    const probe = onHome ? probeWebGL() : { ok: false, reason: "not the home page", renderer: "" };
    const glOk = probe.ok;
    const tierParam = params.get("tier");
    const tierLocked = tierParam === "ultra" || tierParam === "high" || tierParam === "mid" || tierParam === "low";
    store.set({
      touch,
      reducedMotion,
      debug,
      theme: readTheme(),
      gl: glOk,
      glFailed: onHome && !glOk,
      ...(tierLocked ? { tier: tierParam as "ultra" | "high" | "mid" | "low", tierMax: tierParam as "ultra" | "high" | "mid" | "low", tierLocked: true } : {}),
      ...(glOk ? {} : { loaded: true, loadProgress: 1 }),
    });

    if (params.get("capture") === "1") html.classList.add("capture");
    if (glOk) {
      html.classList.add("gl");
      if (mqFine.matches && !touch) html.classList.add("fine-pointer");
      html.style.setProperty("--track-vh", String(touch || window.innerWidth < 768 ? TRACK_VH.mobile : TRACK_VH.desktop));
      // real loading units the preloader waits for
      loading.register("fonts", 1);
      loading.register("chunk", 2);
      loading.register("scene", 2);
      document.fonts?.ready.then(() => loading.done("fonts"));
      if (!document.fonts) loading.done("fonts");
    }

    const sections = SECTIONS.map((s) => ({ s, el: document.getElementById(s.id) })).filter(
      (x): x is { s: (typeof SECTIONS)[number]; el: HTMLElement } => !!x.el
    );
    const footer = document.querySelector<HTMLElement>("footer.footer");

    let lastSection = "";
    const apply = (p: number) => {
      if (!store.get().gl) return;
      let best = "";
      let bestD = 1;
      for (const { s, el } of sections) {
        const v = sectionVisibility(s, p);
        el.style.setProperty("--vis", v.toFixed(3));
        el.dataset.hidden = v < 0.02 ? "true" : "false";
        const d = Math.abs(p - s.anchor);
        if (d < bestD) {
          bestD = d;
          best = s.id;
        }
      }
      if (best !== lastSection) {
        lastSection = best;
        store.set({ section: best });
      }
      const fv = sectionVisibility(SECTIONS[SECTIONS.length - 1], p);
      html.style.setProperty("--footer-vis", fv.toFixed(3));
      if (footer) footer.dataset.on = fv > 0.5 ? "true" : "false";
    };

    const onScroll = () => {
      const live = store.get().gl;
      const p = live ? currentProgress() : 0;
      store.set({ progress: p, act: actAt(p) });
      if (live) {
        apply(p);
        return;
      }
      let best = "giris";
      const mid = window.innerHeight * 0.45;
      for (const { s, el } of sections) if (el.getBoundingClientRect().top <= mid) best = s.id;
      if (best !== lastSection) {
        lastSection = best;
        store.set({ section: best });
      }
    };

    let lenisCleanup = () => {};
    if (glOk && !reducedMotion) {
      import("lenis").then(({ default: Lenis }) => {
        if (!store.get().gl) return;
        const lenis = new Lenis({ autoRaf: true, lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4, syncTouch: false });
        setLenis(lenis);
        lenis.on("scroll", onScroll);
        lenisCleanup = () => {
          lenis.destroy();
          setLenis(null);
        };
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    if (glOk && window.location.hash) {
      const hash = window.location.hash;
      requestAnimationFrame(() => scrollToHash(hash, true));
    }

    // keyboard focus inside a hidden section brings the camera there
    const onFocus = (e: FocusEvent) => {
      if (!store.get().gl) return;
      const target = e.target as HTMLElement | null;
      const sec = target?.closest<HTMLElement>("section.section");
      if (!sec || sec.dataset.hidden !== "true") return;
      scrollToHash(`#${sec.id}`, true);
    };
    document.addEventListener("focusin", onFocus);

    // keys: D toggles the HUD, typing "elif" releases confetti
    let typed = "";
    const isTyping = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "d" || e.key === "D") store.set({ debug: !store.get().debug });
      if (e.key.length === 1) {
        typed = (typed + e.key.toLocaleLowerCase("tr-TR")).slice(-4);
        if (typed === "elif") {
          typed = "";
          store.set({ confetti: store.get().confetti + 1 });
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const onPointer = (e: PointerEvent) => {
      store.set({
        pointerX: (e.clientX / window.innerWidth) * 2 - 1,
        pointerY: -(e.clientY / window.innerHeight) * 2 + 1,
        pointerIn: true,
      });
    };
    const onLeave = () => store.set({ pointerIn: false });
    // a moving finger paints ink while the page scrolls natively (pointermove stops at pointercancel; touchmove does not)
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      store.set({
        pointerX: (t.clientX / window.innerWidth) * 2 - 1,
        pointerY: -(t.clientY / window.innerHeight) * 2 + 1,
        pointerIn: true,
        touchAt: performance.now() / 1000,
      });
    };
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    const onReduce = () => store.set({ reducedMotion: mqReduce.matches });
    mqReduce.addEventListener("change", onReduce);

    // the 3D name takes over the HTML name (html.deboss makes the <h1> transparent, box kept)
    let debossed = false;
    const unsubDeboss = store.subscribe(() => {
      const d = store.get().deboss && store.get().gl;
      if (d !== debossed) {
        debossed = d;
        html.classList.toggle("deboss", d);
      }
    });

    return () => {
      lenisCleanup();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onTouch);
      document.removeEventListener("pointerleave", onLeave);
      mqReduce.removeEventListener("change", onReduce);
      unsubDeboss();
    };
  }, []);

  return null;
}
