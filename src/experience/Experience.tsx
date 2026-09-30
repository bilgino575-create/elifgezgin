"use client";

import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import Scene from "./Scene";

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

  return (
    <Canvas
      frameloop={!visible ? "never" : touch ? "demand" : "always"}
      dpr={tier === "high" ? [1, dprMax] : 1}
      gl={{
        antialias: true,
        alpha: false,
        stencil: false,
        depth: true,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        outputColorSpace: SRGBColorSpace,
      }}
      shadows={tier === "high" ? "soft" : false}
      camera={{ fov: 32, near: 0.05, far: 80, position: [0, 2.4, 3.2] }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      <Scene />
    </Canvas>
  );
}
