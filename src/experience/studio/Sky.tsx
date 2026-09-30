"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, DirectionalLight, HemisphereLight } from "three";
import { store } from "@/lib/store";
import { colA } from "../utils/scratch";

const SKY = { light: new Color("#ffffff"), dark: new Color("#3a3a44") };
const GROUND = { light: new Color("#e8e4da"), dark: new Color("#141416") };
const WINDOW = { light: new Color("#f4f6ff"), dark: new Color("#3d4152") };

/**
 * Daylight from a large north window: a hemisphere for the base tone and a
 * wide, soft directional light from above-left. In the darkroom the window
 * is a dim grey and the safelight (the lamp) does the work.
 */
export default function Sky() {
  const hemi = useRef<HemisphereLight>(null);
  const win = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);
  useFrame((_, dt) => {
    const dark = store.get().theme === "dark";
    const k = Math.min(1, dt * 3);
    if (hemi.current) {
      hemi.current.color.lerp(colA.copy(dark ? SKY.dark : SKY.light), k);
      hemi.current.groundColor.lerp(colA.copy(dark ? GROUND.dark : GROUND.light), k);
      hemi.current.intensity += ((dark ? 0.35 : 1.1) - hemi.current.intensity) * k;
    }
    if (win.current) {
      win.current.color.lerp(colA.copy(dark ? WINDOW.dark : WINDOW.light), k);
      win.current.intensity += ((dark ? 0.35 : 1.9) - win.current.intensity) * k;
    }
    if (rim.current) rim.current.intensity += ((dark ? 0.15 : 0.5) - rim.current.intensity) * k;
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#ffffff", "#e8e4da", 1.1]} position={[0, 6, 0]} />
      <directionalLight ref={win} position={[-6, 9, 5]} intensity={1.9} color="#f4f6ff" />
      <directionalLight ref={rim} position={[8, 4, -6]} intensity={0.5} color="#dfe6ff" />
    </>
  );
}
