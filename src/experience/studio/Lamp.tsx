"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, Group, Object3D, SpotLight } from "three";
import { store, useStore } from "@/lib/store";
import { rig } from "../rig/CameraRig";
import { colA } from "../utils/scratch";

/**
 * The cursor is a studio lamp. A spot light sits above-left of the pointer's
 * hit on the table and rakes across the paper at ~34° elevation, so grain,
 * emboss and ink sheen appear where the visitor's hand is. On HIGH it casts
 * a soft shadow.
 */
export default function Lamp() {
  const light = useRef<SpotLight>(null);
  const targetRef = useRef<Object3D>(null);
  const tier = useStore((s) => s.tier);
  const theme = useStore((s) => s.theme);
  const group = useRef<Group>(null);
  const warm = useMemo(() => new Color("#fff2dc"), []);
  const safelight = useMemo(() => new Color("#ffb26b"), []);

  useEffect(() => {
    const l = light.current;
    if (!l) return;
    l.shadow.mapSize.set(2048, 2048);
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.02;
    l.shadow.radius = 7;
    l.shadow.camera.near = 0.3;
    l.shadow.camera.far = 6;
  }, []);

  useFrame((_, dt) => {
    const l = light.current;
    const t = targetRef.current;
    if (!l || !t) return;
    const s = store.get();
    const k = Math.min(1, dt * 8);
    // the lamp body: upper-left of the target, low elevation
    const tx = rig.lamp.x;
    const tz = rig.lamp.z;
    l.position.x += (tx - 0.8 - l.position.x) * k;
    l.position.y += (1.05 - l.position.y) * k;
    l.position.z += (tz + 0.6 - l.position.z) * k;
    t.position.set(tx, 0, tz);
    l.target = t;
    // intensity breathes with pointer speed: faster hand, slightly brighter light
    const base = s.theme === "dark" ? 3.6 : 1.9;
    const want = base * (1 + Math.min(0.25, rig.speed / 6000));
    l.intensity += (want - l.intensity) * k;
    colA.copy(s.theme === "dark" ? safelight : warm);
    l.color.lerp(colA, k);
  });

  return (
    <group ref={group}>
      <spotLight
        ref={light}
        position={[-0.75, 0.95, 0.55]}
        angle={1.05}
        penumbra={0.9}
        decay={1.4}
        distance={7}
        intensity={1.9}
        color={theme === "dark" ? "#ffb26b" : "#fff2dc"}
        castShadow={tier === "high"}
      />
      <object3D ref={targetRef} position={[0, 0, 0]} />
    </group>
  );
}
