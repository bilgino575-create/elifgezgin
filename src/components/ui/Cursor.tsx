"use client";

import { useEffect, useRef } from "react";
import { store } from "@/lib/store";

/**
 * Custom cursor: a crosshair registration mark everywhere, a loupe ring over
 * a work (the magnified halftone itself is rendered in the 3D layer under
 * the ring). Only on fine pointers with the 3D layer on; hidden otherwise.
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
      const next = !on ? "hidden" : s.hoverWork && s.act === "wall" ? "loupe" : "mark";
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
  return (
    <div ref={ref} className="cursor" data-mode="hidden" aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
        <circle cx="60" cy="60" r="58" />
        <circle cx="60" cy="60" r="20" />
        <path d="M60 0V40M60 80V120M0 60H40M80 60H120" />
      </svg>
    </div>
  );
}
