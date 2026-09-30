"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { store } from "@/lib/store";
import { rig } from "./rig/CameraRig";
import { frameClock } from "@/lib/gl";

declare global {
  interface Window {
    __stats?: () => unknown;
  }
}

/** Real renderer numbers, four times a second. Negative priorities only: a positive one would stop R3F rendering. */
export default function StatsWriter() {
  const gl = useThree((s) => s.gl);
  const acc = useRef({ frames: 0, time: 0, ms: 0, calls: 0, triangles: 0 });

  useEffect(() => {
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = true;
    };
  }, [gl]);

  useFrame(() => {
    acc.current.calls = gl.info.render.calls;
    acc.current.triangles = gl.info.render.triangles;
    gl.info.reset();
    frameClock.last = performance.now();
    frameClock.frames++;
  }, -2000);

  useEffect(() => {
    window.__stats = () => ({
      ...store.get().stats,
      tier: store.get().tier,
      gpuTier: store.get().gpuTier,
      act: store.get().act,
      progress: store.get().progress,
      rigP: rig.p,
      memory: gl.info.memory,
      programs: gl.info.programs?.length ?? 0,
    });
    return () => {
      delete window.__stats;
    };
  }, [gl]);

  useFrame((_, dt) => {
    const a = acc.current;
    a.frames++;
    a.time += dt;
    a.ms = a.ms * 0.9 + dt * 1000 * 0.1;
    if (a.time >= 0.25) {
      store.set({
        stats: {
          fps: a.frames / a.time,
          ms: a.ms,
          calls: a.calls,
          triangles: a.triangles,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
          programs: gl.info.programs?.length ?? 0,
        },
      });
      a.frames = 0;
      a.time = 0;
    }
  }, -1000);

  return null;
}
