"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { store, useStore, loading } from "@/lib/store";
import { disableGl, frameClock, glForced } from "@/lib/gl";

/**
 * Mounts the single persistent canvas after first paint. The 3D chunk is a
 * separate bundle (`ssr: false`) requested from an idle callback, so the
 * hero text is painted before three.js is fetched. An error boundary, a
 * window error listener and a watchdog hand the document back to HTML if
 * the 3D layer throws or stalls.
 */
const Experience = dynamic(() => import("@/experience/Experience").then((m) => {
  loading.done("chunk");
  return m;
}), { ssr: false, loading: () => null });

class GlBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    disableGl(`render error: ${error.message}`);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function ExperienceLoader() {
  const gl = useStore((s) => s.gl);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!gl) return;
    let cancelled = false;
    const start = () => !cancelled && setReady(true);
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 1200 });
    else setTimeout(start, 250);
    return () => {
      cancelled = true;
    };
  }, [gl]);

  useEffect(() => {
    if (!gl || !ready || glForced()) return;
    const mounted = performance.now();
    let armed = false;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const now = performance.now();
      if (!armed) {
        if (frameClock.frames > 0 || now - mounted > 25000) armed = true;
        if (now - mounted > 25000 && frameClock.frames === 0) disableGl("no frame rendered 25 s after mount");
        return;
      }
      if (now - frameClock.last > 12000) disableGl("renderer stalled for 12 s");
    }, 1000);
    return () => window.clearInterval(id);
  }, [gl, ready]);

  useEffect(() => {
    if (!gl) return;
    const onError = (e: ErrorEvent) => {
      const src = `${e.filename ?? ""} ${e.error?.stack ?? ""}`;
      if (/three|experience|fiber|postprocessing/i.test(src)) disableGl(`runtime error: ${e.message}`);
    };
    window.addEventListener("error", onError);
    return () => window.removeEventListener("error", onError);
  }, [gl]);

  if (!gl || !ready) return null;
  return (
    <div className="gl-layer" aria-hidden="true">
      <GlBoundary>
        <Experience />
      </GlBoundary>
    </div>
  );
}

export { store };
