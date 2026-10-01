"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { getGPUTier } from "detect-gpu";
import { Vector3 } from "three";
import { loading, store } from "@/lib/store";
import { budgetOf, higher, lower } from "@/lib/tiers";

declare global {
  interface Window {
    __stats?: () => unknown;
    __r3f?: unknown;
  }
}

/**
 * Chooses the quality tier with real evidence: the GPU benchmark tables
 * (self-hosted) first, then the frame times of this very device. A slow
 * two seconds steps the tier down; four fast seconds on a desktop step it
 * up, once. Never more than one change per three seconds. Also publishes
 * renderer numbers for the HUD and the scripts.
 */
export default function Tiering() {
  const gl = useThree((s) => s.gl);
  const acc = useRef({ frames: 0, time: 0, slow: 0, fast: 0, last: 0, changes: 0 });

  useEffect(() => {
    let cancelled = false;
    getGPUTier({ benchmarksURL: "/benchmarks" })
      .then((g) => {
        if (cancelled) return;
        const q = new URLSearchParams(location.search);
        // a GPU the benchmark tables rank at 0 (blocked, software, or far too slow) gets the HTML journey
        if (g.tier <= 0 && !q.has("gl")) {
          loading.fallback();
          return;
        }
        if (q.has("tier")) return;
        const touch = store.get().touch;
        // detect-gpu tiers: 0 (no/blocked GPU) … 3 (fast); fps is the benchmark's median
        let tier = store.get().tier;
        if (g.tier <= 0 || (g.fps !== undefined && g.fps < 20)) tier = "low";
        else if (g.tier === 1) tier = "low";
        else if (g.tier === 2) tier = "mid";
        else if (g.tier === 3) tier = touch ? "mid" : g.fps !== undefined && g.fps >= 120 ? "ultra" : "high";
        if (touch && tier === "ultra") tier = "high";
        store.set({ tier });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    gl.info.autoReset = false;
    window.__stats = () => ({ ...store.get().stats, tier: store.get().tier, p: store.get().p, stop: store.get().stop, memory: gl.info.memory, programs: gl.info.programs?.length ?? 0 });
    // `?debug`: the renderer, scene and camera for scripts/gltrace.mjs and scripts/probe.mjs
    if (new URLSearchParams(location.search).has("debug")) window.__r3f = { gl, scene, camera, Vector3 };
    return () => {
      gl.info.autoReset = true;
      delete window.__stats;
      delete window.__r3f;
    };
  }, [gl, scene, camera]);

  useFrame((st, dt) => {
    // this hook runs after everything else (priority 1000), which turns off fiber's own render;
    // the composer draws the frame on HIGH/ULTRA, so on MID/LOW the frame is drawn here
    if (!budgetOf(store.get().tier).post) st.gl.render(st.scene, st.camera);
    const a = acc.current;
    a.frames++;
    a.time += dt;
    const calls = gl.info.render.calls;
    const tris = gl.info.render.triangles;
    gl.info.reset();
    if (a.time >= 0.5) {
      const fps = a.frames / a.time;
      const ms = (a.time / a.frames) * 1000;
      store.set({ stats: { fps, ms, calls, tris } });
      const s = store.get();
      const now = st.clock.elapsedTime;
      if (document.visibilityState === "visible" && s.loaded && !new URLSearchParams(location.search).has("tier")) {
        if (ms > 26) a.slow += a.time;
        else a.slow = 0;
        if (ms < 9) a.fast += a.time;
        else a.fast = 0;
        if (a.slow >= 2 && s.tier !== "low" && now - a.last > 3) {
          store.set({ tier: lower(s.tier) });
          a.last = now;
          a.slow = 0;
          a.changes++;
        } else if (a.fast >= 4 && s.tier === "high" && !s.touch && a.changes === 0 && now - a.last > 3) {
          store.set({ tier: higher(s.tier) });
          a.last = now;
          a.fast = 0;
          a.changes++;
        }
      }
      a.frames = 0;
      a.time = 0;
    }
  }, 1000);
  return null;
}
