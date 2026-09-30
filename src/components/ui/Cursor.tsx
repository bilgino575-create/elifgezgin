"use client";

import { useEffect, useRef } from "react";
import { store } from "@/lib/store";

/**
 * The hand: a small ring in difference blend, larger over anything
 * interactive in the scene (a portal, a word, the card). Only on fine
 * pointers with the 3D layer on; hidden otherwise.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = -100;
    let y = -100;
    let raf = 0;
    let mode = "";
    const tick = () => {
      raf = 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const s = store.get();
      const on = s.gl && !s.touch && s.pointerIn;
      const next = !on ? "hidden" : s.hoverWork || s.hoverSkill || s.hoverCard ? "hover" : "ring";
      if (next !== mode) {
        mode = next;
        el.dataset.mode = next;
      }
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const unsub = store.subscribe(() => {
      if (!raf) raf = requestAnimationFrame(tick);
    });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      unsub();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="cursor" data-mode="hidden" aria-hidden="true" />;
}
