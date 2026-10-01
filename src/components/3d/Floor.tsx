"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, type Mesh, type MeshStandardMaterial } from "three";
import { useStore } from "@/lib/store";
import { budgetOf } from "@/lib/tiers";
import { STOPS } from "@/lib/stops";
import { rig } from "./rig";

const col = new Color();

/**
 * One floor for the whole route: a glossy plane that follows the camera
 * from stop to stop, takes the void's lower colour, and reflects the
 * installation above it — blurred, so it reads as polished ground, not a
 * mirror. HIGH/ULTRA render the reflection; MID/LOW keep the gloss from
 * the environment only.
 */
export default function Floor() {
  const tier = useStore((s) => s.tier);
  const touch = useStore((s) => s.touch);
  const res = budgetOf(tier).reflector;
  const mesh = useRef<Mesh>(null);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const a = STOPS[rig.i];
    const b = STOPS[Math.min(STOPS.length - 1, rig.i + 1)];
    const k = rig.k;
    m.position.set(a.world[0] + (b.world[0] - a.world[0]) * k, a.world[1] + (b.world[1] - a.world[1]) * k - 3.7, a.world[2] + (b.world[2] - a.world[2]) * k);
    col.copy(rig.bg2).lerp(rig.bg, 0.2);
    const mat = m.material as MeshStandardMaterial;
    mat.color.copy(col);
  }, -40);
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} receiveShadow={false}>
      <planeGeometry args={[400, 400]} />
      {res > 0 ? (
        <MeshReflectorMaterial resolution={touch ? Math.min(res, 512) : res} blur={[520, 140]} mixBlur={1} mixStrength={1.3} mirror={0.55} depthScale={0.6} minDepthThreshold={0.6} maxDepthThreshold={1.6} roughness={0.75} metalness={0.3} color="#0b0a18" />
      ) : (
        <meshStandardMaterial color="#0b0a18" roughness={0.22} metalness={0.25} envMapIntensity={0.9} />
      )}
    </mesh>
  );
}
