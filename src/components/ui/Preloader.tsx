"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { Lang } from "@/lib/content";
import { t } from "@/i18n/dict";

/**
 * Act 0. Crop marks and a registration mark draw themselves, then give way
 * to the EG monogram. The percentage is the weighted sum of real loading
 * units (fonts, the 3D chunk, the scene's textures); nothing is faked.
 * It never covers the hero text: the marks sit in the centre, the text is
 * on the left, and the overlay is transparent.
 */
export default function Preloader({ lang }: { lang: Lang }) {
  const gl = useStore((s) => s.gl);
  const loaded = useStore((s) => s.loaded);
  const progress = useStore((s) => s.loadProgress);
  const [started, setStarted] = useState(false);
  const [gone, setGone] = useState(false);
  const phase = loaded ? "monogram" : started ? "marks" : "idle";

  useEffect(() => {
    if (!gl) return;
    const a = window.setTimeout(() => setStarted(true), 50);
    return () => window.clearTimeout(a);
  }, [gl]);
  useEffect(() => {
    if (!gl || !loaded) return;
    const a = window.setTimeout(() => setGone(true), 1500);
    return () => window.clearTimeout(a);
  }, [gl, loaded]);

  if (!gl || gone) return null;
  const d = t(lang);
  return (
    <div className="preloader" data-phase={phase} data-done={loaded && phase === "monogram"} role="status" aria-live="polite">
      <svg viewBox="0 0 120 120">
        {/* crop marks */}
        <path className="mark" d="M0 22 H16 M22 0 V16" />
        <path className="mark" d="M120 22 H104 M98 0 V16" />
        <path className="mark" d="M0 98 H16 M22 120 V104" />
        <path className="mark" d="M120 98 H104 M98 120 V104" />
        {/* registration mark */}
        <circle className="mark reg" cx="60" cy="60" r="12" />
        <path className="mark reg" d="M60 40 V80 M40 60 H80" />
        {/* monogram */}
        <g transform="translate(24 24) scale(1.5)">
          <path className="mono" d="M8 10h14M8 10v28h14M8 24h10" style={{ stroke: "var(--spot)" }} />
          <path className="mono" d="M40 14a10.5 10.5 0 1 0 0 20v-8h-7" />
        </g>
      </svg>
      <span className="pct">
        {loaded ? d.ui.ready : `${d.ui.loading} ${Math.round(progress * 100)}%`}
      </span>
    </div>
  );
}
