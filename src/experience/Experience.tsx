"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import Scene from "./Scene";

/**
 * `?capture=1`: the loop is driven from outside (scripts/capture.mjs) one
 * frame at a time with a fixed clock, so the video loops are captured from
 * the real scene at a steady 30 fps whatever the machine renders at.
 */
declare global {
  interface Window {
    __advance?: (t: number) => void;
  }
}
function CaptureHooks() {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    window.__advance = (t: number) => advance(t, true);
    return () => {
      delete window.__advance;
    };
  }, [advance]);
  return null;
}
const captureMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("capture") === "1";

/** Frame cap on touch: the canvas runs in demand mode and this loop invalidates it. */
function FrameCap({ fps, paused }: { fps: number; paused: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let last = 0;
    const step = 1000 / fps - 1.5;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < step) return;
      last = t;
      invalidate();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, fps, paused]);
  return null;
}

export default function Experience() {
  const tier = useStore((s) => s.tier);
  const touch = useStore((s) => s.touch);
  const [visible, setVisible] = useState(true);
  const [dprMax] = useState(() => Math.min(2, window.devicePixelRatio || 1));

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const dpr: number | [number, number] = tier === "ultra" ? [1, dprMax] : tier === "high" ? [1, Math.min(1.5, dprMax)] : 1;

  return (
    <Canvas
      frameloop={captureMode || !visible ? "never" : touch ? "demand" : "always"}
      dpr={dpr}
      gl={{
        antialias: true,
        alpha: false,
        stencil: true,
        depth: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: captureMode,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        outputColorSpace: SRGBColorSpace,
      }}
      shadows={false}
      camera={{ fov: 40, near: 0.05, far: 120, position: [0, 0, 9] }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      {captureMode ? <CaptureHooks /> : touch ? <FrameCap fps={45} paused={!visible} /> : null}
      <Scene />
    </Canvas>
  );
}
