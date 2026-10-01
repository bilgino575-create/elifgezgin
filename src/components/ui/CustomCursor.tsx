"use client";

import { useEffect, useRef } from "react";
import type { Lang } from "@/lib/content";
import { t } from "@/lib/i18n";
import { store, type HoverKind } from "@/lib/store";

/**
 * The light the visitor carries: a glowing dot that follows the pointer at
 * once and a ring that follows with a lag; magnetic on links, a disc with a
 * word over projects ("AÇ"), a different word over things that turn. Fine
 * pointers only — on touch the finger is the light and nothing is drawn.
 * It is also the one place the pointer is read for the stage.
 */
/** wires the cursor to the pointer once the tweening library is here; returns the teardown */
function attach(gsap: typeof import("gsap").default, el: HTMLElement, words: Record<string, string>) {
  const h = document.documentElement;
  const dot = el.querySelector<HTMLElement>(".cursor-dot")!;
  const ring = el.querySelector<HTMLElement>(".cursor-ring")!;
  const label = el.querySelector<HTMLElement>(".cursor-label")!;
  h.classList.add("cursor-on");
  const reduced = store.get().reduced;
  const x = gsap.quickTo(dot, "x", { duration: reduced ? 0 : 0.08, ease: "power3.out" });
  const y = gsap.quickTo(dot, "y", { duration: reduced ? 0 : 0.08, ease: "power3.out" });
  const rx = gsap.quickTo(ring, "x", { duration: reduced ? 0 : 0.38, ease: "power3.out" });
  const ry = gsap.quickTo(ring, "y", { duration: reduced ? 0 : 0.38, ease: "power3.out" });

  let magnet: HTMLElement | null = null;
  let magnetTo: { x: (v: number) => void; y: (v: number) => void } | null = null;

  const kindOf = (target: Element | null): { kind: HoverKind; label: string } => {
    const c = target?.closest<HTMLElement>("[data-cursor]");
    if (c) {
      const k = c.dataset.cursor as "open" | "drag" | "view";
      return { kind: k === "open" ? "project" : k === "drag" ? "drag" : "view", label: words[k] ?? "" };
    }
    if (target?.closest("a, button, [role=button], input, textarea, select, label")) return { kind: "link", label: "" };
    return { kind: null, label: "" };
  };

  const move = (e: PointerEvent) => {
    x(e.clientX);
    y(e.clientY);
    store.set({ cx: e.clientX, cy: e.clientY, px: (e.clientX / window.innerWidth) * 2 - 1, py: -((e.clientY / window.innerHeight) * 2 - 1), pointer: true });
    // the ring snaps to a magnet's centre and pulls the element a little toward the pointer
    if (magnet && magnetTo) {
      const r = magnet.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      magnetTo.x(dx * 0.22);
      magnetTo.y(dy * 0.22);
      rx(cx + dx * 0.35);
      ry(cy + dy * 0.35);
    } else {
      rx(e.clientX);
      ry(e.clientY);
    }
    const { kind, label: lbl } = kindOf(e.target as Element | null);
    const s = store.get();
    // the stage may be reporting a 3D object under the pointer; DOM wins only when it has something
    if (kind || s.hoverLabel === "" || !s.hover) {
      if (s.hover !== kind || s.hoverLabel !== lbl) store.set({ hover: kind, hoverLabel: lbl });
    }
  };
  const over = (e: PointerEvent) => {
    const m = (e.target as Element | null)?.closest<HTMLElement>("[data-magnet]");
    if (m && m !== magnet) {
      if (magnet) gsap.to(magnet, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      magnet = m;
      magnetTo = { x: gsap.quickTo(m, "x", { duration: 0.3, ease: "power3.out" }), y: gsap.quickTo(m, "y", { duration: 0.3, ease: "power3.out" }) };
    }
  };
  const out = (e: PointerEvent) => {
    const m = (e.target as Element | null)?.closest<HTMLElement>("[data-magnet]");
    if (m && m === magnet && !m.contains(e.relatedTarget as Node | null)) {
      gsap.to(m, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.45)" });
      magnet = null;
      magnetTo = null;
    }
  };
  const leave = () => store.set({ pointer: false, hover: null, hoverLabel: "" });
  const down = () => el.classList.add("down");
  const up = () => el.classList.remove("down");
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerover", over, { passive: true });
  window.addEventListener("pointerout", out, { passive: true });
  window.addEventListener("pointerdown", down);
  window.addEventListener("pointerup", up);
  document.documentElement.addEventListener("pointerleave", leave);

  const unsub = store.subscribe(() => {
    const s = store.get();
    el.dataset.kind = s.hover ?? "";
    el.dataset.on = s.pointer ? "true" : "false";
    if (label.textContent !== s.hoverLabel) label.textContent = s.hoverLabel;
  });
  return () => {
    h.classList.remove("cursor-on");
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerover", over);
    window.removeEventListener("pointerout", out);
    window.removeEventListener("pointerdown", down);
    window.removeEventListener("pointerup", up);
    document.documentElement.removeEventListener("pointerleave", leave);
    unsub();
  };
}


export default function CustomCursor({ lang }: { lang: Lang }) {
  const root = useRef<HTMLDivElement>(null);
  const d = t(lang);

  useEffect(() => {
    const h = document.documentElement;
    if (!h.classList.contains("fine")) return;
    let alive = true;
    let cleanup: (() => void) | null = null;
    // the tweening library arrives after first paint; the cursor is drawn by CSS until then
    import("gsap").then(({ default: gsap }) => {
      if (!alive) return;
      cleanup = attach(gsap, root.current!, { open: d.cursor.open, drag: d.cursor.drag, view: d.cursor.view });
    });
    return () => {
      alive = false;
      cleanup?.();
    };
  }, [d.cursor.drag, d.cursor.open, d.cursor.view]);

  return (
    <div className="cursor" ref={root} aria-hidden="true" data-on="false">
      <div className="cursor-dot" />
      <div className="cursor-ring">
        <span className="cursor-label micro" />
      </div>
    </div>
  );
}
