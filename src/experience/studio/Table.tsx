"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, MeshStandardMaterial } from "three";
import { store } from "@/lib/store";
import { colA } from "../utils/scratch";
import { useDispose } from "../utils/useDispose";

const LIGHT = new Color("#ecebe5");
const DARK = new Color("#1d1d20");

/** The studio table: one large matte plane at y = 0 that receives the lamp's shadow. */
export default function Table() {
  const mat = useMemo(() => new MeshStandardMaterial({ color: LIGHT.clone(), roughness: 0.95, metalness: 0 }), []);
  useDispose(mat);
  const bg = useRef<Color>(new Color("#f6f5f1"));
  useFrame((state, dt) => {
    const dark = store.get().theme === "dark";
    const k = Math.min(1, dt * 3);
    mat.color.lerp(colA.copy(dark ? DARK : LIGHT), k);
    bg.current.lerp(colA.set(dark ? "#151517" : "#f6f5f1"), k);
    const scene = state.scene;
    if (scene.background instanceof Color) scene.background.copy(bg.current);
    else scene.background = bg.current.clone();
    if (scene.fog) {
      scene.fog.color.copy(bg.current);
    }
  });
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[15, 0, 0]} receiveShadow material={mat}>
        <planeGeometry args={[400, 240]} />
      </mesh>
      <fog attach="fog" args={["#f6f5f1", 8, 26]} />
    </>
  );
}
