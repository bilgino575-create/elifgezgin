"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useStore } from "@/lib/store";
import { fluid, inkAbsorbance } from "@/experience/fluid/Fluid";
import { site } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t } from "@/i18n/dict";

/**
 * Act 0. One drop of the spot colour hangs above the stage; its fall is the
 * weighted sum of real loading units (fonts, the 3D chunk, the letterforms).
 * At 100 % it lands, the splash rings bloom and draw the EG monogram, then
 * the overlay fades. Nothing counts up on its own; a stalled load is a drop
 * that hangs. It never covers the hero text.
 */
export default function Drop({ lang }: { lang: Lang }) {
  const gl = useStore((s) => s.gl);
  const loaded = useStore((s) => s.loaded);
  const progress = useStore((s) => s.loadProgress);
  const [gone, setGone] = useState(false);
  const [unmounted, setUnmounted] = useState(false);

  useEffect(() => {
    if (!gl || !loaded) return;
    // the landing is the first ink on the stage: one blot of the spot colour and a ring of outward velocity
    const splash = window.setTimeout(() => {
      const abs: [number, number, number] = [0, 0, 0];
      inkAbsorbance(site.spotColor, abs, 0.9);
      const portrait = window.innerWidth < window.innerHeight;
      fluid.splat(0.5, 0.5, 0, 0, abs[0], abs[1], abs[2], portrait ? 4 : 9);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        fluid.splat(0.5 + Math.cos(a) * 0.03, 0.5 + Math.sin(a) * 0.03, Math.cos(a) * 900, Math.sin(a) * 900, abs[0] * 0.2, abs[1] * 0.2, abs[2] * 0.2, 3);
      }
    }, 300);
    const a = window.setTimeout(() => setGone(true), 1250);
    const b = window.setTimeout(() => setUnmounted(true), 1900);
    return () => {
      window.clearTimeout(splash);
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [gl, loaded]);

  if (!gl || unmounted) return null;
  const d = t(lang);
  const phase = loaded ? "splash" : "fall";
  return (
    <div className="drop" data-phase={phase} data-gone={gone} role="status" aria-live="polite" style={{ "--fall": progress.toFixed(3) } as CSSProperties}>
      <svg viewBox="0 0 120 120">
        <g className="rings">
          <circle className="ring" cx="60" cy="60" r="54" />
          <circle className="ring" cx="60" cy="60" r="38" />
          <circle className="ring" cx="60" cy="60" r="22" />
        </g>
        <path className="bead" d="M60 44c-6 9-10 14-10 20a10 10 0 0 0 20 0c0-6-4-11-10-20z" />
        <g transform="translate(24 24) scale(1.5)">
          <path className="mono e" d="M8 10h14M8 10v28h14M8 24h10" />
          <path className="mono" d="M40 14a10.5 10.5 0 1 0 0 20v-8h-7" />
        </g>
      </svg>
      <span className="pct">{loaded ? d.ui.ready : `${d.ui.loading} ${Math.round(progress * 100)}%`}</span>
    </div>
  );
}
