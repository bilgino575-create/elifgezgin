"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { getGPUTier } from "detect-gpu";
import { store, TIERS, type Tier } from "@/lib/store";
import { disableGl } from "@/lib/gl";

/**
 * Four quality tiers with hysteresis (docs/RENK.md §6).
 *
 * 1. `detect-gpu` (benchmarks self-hosted under /benchmarks) sets the
 *    ceiling: desktop tier 3 → ULTRA, 2 → HIGH, 1 → MID; phones one step
 *    lower; tier 0 → the HTML site.
 * 2. drei's PerformanceMonitor moves one step down after two consecutive
 *    declines and one step up after three inclines, never above the ceiling,
 *    with a six-second lock after each change and at most three flip-flops.
 */
export default function Tiering() {
  const declines = useRef(0);
  const inclines = useRef(0);
  const lockedUntil = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getGPUTier({ benchmarksURL: "/benchmarks" })
      .then((r) => {
        if (cancelled) return;
        const forced = new URLSearchParams(location.search).get("gl") === "1";
        if (r.tier === 0 && !store.get().tierLocked && !forced) {
          disableGl(`gpu tier 0 (${r.gpu ?? "unknown"})`);
          return;
        }
        const mobileLike = r.isMobile || store.get().touch;
        let tier: Tier = r.tier >= 3 ? "ultra" : r.tier === 2 ? "high" : "mid";
        if (mobileLike) tier = TIERS[Math.max(0, TIERS.indexOf(tier) - 1)];
        if (forced && r.tier === 0) tier = "low";
        store.set(store.get().tierLocked ? { gpuTier: r.tier } : { gpuTier: r.tier, tier, tierMax: tier });
      })
      .catch(() => {
        if (cancelled) return;
        store.set({ gpuTier: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const move = (dir: -1 | 1) => {
    const s = store.get();
    if (s.tierLocked || performance.now() < lockedUntil.current) return;
    const i = TIERS.indexOf(s.tier);
    const j = Math.min(TIERS.indexOf(s.tierMax), Math.max(0, i + dir));
    if (j === i) return;
    store.set({ tier: TIERS[j] });
    lockedUntil.current = performance.now() + 6000;
  };

  return (
    <PerformanceMonitor
      bounds={() => [45, 58]}
      flipflops={3}
      iterations={8}
      ms={250}
      onDecline={() => {
        inclines.current = 0;
        declines.current++;
        if (declines.current >= 2) {
          move(-1);
          declines.current = 0;
        }
      }}
      onIncline={() => {
        declines.current = 0;
        inclines.current++;
        if (inclines.current >= 3) {
          move(1);
          inclines.current = 0;
        }
      }}
    />
  );
}
