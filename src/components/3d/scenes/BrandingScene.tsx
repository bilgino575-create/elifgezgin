"use client";

import { MeshTransmissionMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Group, Mesh } from "three";
import type { Lang, Work } from "@/lib/content";
import { works } from "@/lib/content";
import { store, useStore } from "@/lib/store";
import { budgetOf } from "@/lib/tiers";
import { STOPS } from "@/lib/stops";
import { holo, neon } from "../materials";
import { rig } from "../rig";
import { useStopGroup, useProjectHandlers, useWorkTexture, damp, holdProgress } from "./common";

/** the identity's plates inside the cube: the sheet, the mark page, the pattern, at three depths */
function Plates({ work }: { work: Work }) {
  const a = useWorkTexture(work.cover, 8);
  const b = useWorkTexture(work.gallery[0] ?? work.cover, 4);
  const c = useWorkTexture(work.gallery[1] ?? work.cover, 4);
  const ar = (img: { w: number; h: number }) => img.w / img.h;
  return (
    <group>
      <mesh position={[0, 0, -0.75]}>
        <planeGeometry args={[1.9 * ar(work.gallery[1] ?? work.cover) * 0.9, 1.9 * 0.9]} />
        <meshBasicMaterial map={c} toneMapped={false} />
      </mesh>
      <mesh position={[0.25, 0.1, 0]}>
        <planeGeometry args={[1.8, 1.8 / ar(work.cover)]} />
        <meshBasicMaterial map={a} toneMapped={false} />
      </mesh>
      <mesh position={[-0.35, -0.45, 0.75]} rotation={[0, 0.25, 0]}>
        <planeGeometry args={[1.3 * ar(work.gallery[0] ?? work.cover) * 0.6, 1.3 * 0.6]} />
        <meshBasicMaterial map={b} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * 03 MARKA. The identity system in a glass cube: one transmission material
 * for the whole site, refracting the plates inside and the violet void
 * behind. The cube turns slowly and tilts toward the hand; three neon
 * satellites in the stop's inks orbit it.
 */
export default function BrandingScene({ lang }: { lang: Lang }) {
  const j = 2;
  const group = useRef<Group>(null);
  const cube = useRef<Group>(null);
  const sats = useRef<Group>(null);
  const tier = useStore((s) => s.tier);
  const work = useMemo(() => works.find((w) => w.stop === 3), []);
  const handlers = useProjectHandlers(lang, work?.slug ?? "");
  const mats = useMemo(() => [neon("#e400ff", 2.2), neon("#19e3ff", 2.2), neon("#ff2e88", 2.2)], []);
  const cheap = useMemo(() => holo({ color: "#c9b8ff", opacity: 0.35, ior: 1.3 }), []);
  useEffect(() => () => {
    mats.forEach((m) => m.dispose());
    cheap.dispose();
  }, [mats, cheap]);
  useStopGroup(j, group);
  const w = STOPS[j].world;
  const touch = store.get().touch;
  const size = touch ? 2.0 : 2.9;
  const glass = budgetOf(tier).glassSamples > 1;
  // the text takes the top-left on desktop, so the cube stands right of centre; on phones it rises above the words
  const ox = touch ? 0 : 1.8;
  const oy = touch ? 1.2 : 0;

  useFrame(() => {
    const s = store.get();
    const c = cube.current;
    if (c) {
      const k = holdProgress(j);
      const spin = s.reduced ? 0.4 : rig.time * 0.14;
      c.rotation.y = damp(c.rotation.y, spin + (s.pointer ? s.px * 0.4 : 0), 0.4, rig.dt);
      c.rotation.x = damp(c.rotation.x, 0.25 + (s.pointer && !s.reduced ? -s.py * 0.25 : 0), 0.4, rig.dt);
      c.position.y = w[1] + oy + (s.reduced ? 0 : Math.sin(rig.time * 0.5) * 0.12) + (1 - Math.min(1, k * 3)) * -0.6;
    }
    const g = sats.current;
    if (g && !s.reduced) g.rotation.y = -rig.time * 0.35;
  });

  return (
    <group ref={group}>
      <group ref={cube} name="cube" position={[w[0] + ox, w[1] + oy, w[2]]} {...(work ? handlers : {})}>
        <mesh>
          <boxGeometry args={[size, size, size, 2, 2, 2]} />
          {glass ? (
            <MeshTransmissionMaterial samples={budgetOf(tier).glassSamples} resolution={tier === "ultra" ? 1024 : 512} thickness={0.9} roughness={0.06} ior={1.42} chromaticAberration={tier === "mid" ? 0 : 0.08} anisotropicBlur={0.1} distortion={0.12} distortionScale={0.5} temporalDistortion={0.05} color="#ffffff" attenuationColor="#b9a4ff" attenuationDistance={4} envMapIntensity={1.4} clearcoat={1} />
          ) : (
            <primitive object={cheap} attach="material" />
          )}
        </mesh>
        <mesh>
          <boxGeometry args={[size + 0.04, size + 0.04, size + 0.04]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.08} />
        </mesh>
        <group scale={size / 2.9}>{work ? <Suspense fallback={null}>{<Plates work={work} />}</Suspense> : null}</group>
      </group>
      <group ref={sats} position={[w[0] + ox, w[1] + oy, w[2]]}>
        {mats.map((m, i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 3.6, Math.sin(a * 2) * 0.8, Math.sin(a) * 3.6]} material={m}>
              <sphereGeometry args={[0.16 + i * 0.05, 24, 16]} />
            </mesh>
          );
        })}
      </group>
      <pointLight position={[w[0] + 3, w[1] + 2, w[2] + 3]} intensity={10} distance={14} color="#e400ff" decay={2} />
      <pointLight position={[w[0] - 3, w[1] - 1, w[2] + 2]} intensity={8} distance={14} color="#19e3ff" decay={2} />
    </group>
  );
}

export { Mesh };
