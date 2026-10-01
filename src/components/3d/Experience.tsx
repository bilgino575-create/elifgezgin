"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { useStore } from "@/lib/store";
import { budgetOf } from "@/lib/tiers";
import { STOPS } from "@/lib/stops";
import World from "./World";

/**
 * The stage. Mounted after first paint by Journey; the canvas sits behind
 * the stop layers and reads the pointer from the document, so the HTML
 * never has to get out of the way. Frames stop when the tab is hidden.
 */
export default function Experience() {
  const tier = useStore((s) => s.tier);
  const touch = useStore((s) => s.touch);
  const [visible, setVisible] = useState(true);
  const b = budgetOf(tier);
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  const cam = touch ? STOPS[0].camMobile : STOPS[0].cam;
  return (
    <Canvas
      dpr={Math.min(b.dpr, touch ? 1.5 : 2, typeof window !== "undefined" ? window.devicePixelRatio : 1)}
      frameloop={visible ? "always" : "never"}
      gl={{
        antialias: b.antialias,
        alpha: false,
        stencil: false,
        depth: true,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
        outputColorSpace: SRGBColorSpace,
      }}
      camera={{ fov: STOPS[0].fov, near: 0.1, far: 240, position: cam }}
      shadows={false}
      flat={false}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.setClearColor(STOPS[0].palette.bg, 1);
      }}
    >
      <World />
    </Canvas>
  );
}
