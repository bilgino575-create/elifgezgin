"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { ACESFilmicToneMapping, Color, DoubleSide, Group, Mesh, SRGBColorSpace, Vector2 } from "three";
import type { Lang, Work } from "@/lib/content";
import { store, useStore } from "@/lib/store";
import { budgetOf } from "@/lib/tiers";
import { chrome } from "./materials";
import { useWorkTexture } from "./scenes/common";

const ndc = new Vector2();

/** the sheet, lit by the project's own inks, leaning toward the pointer; a chrome bar for the light to catch */
function Piece({ work }: { work: Work }) {
  const tex = useWorkTexture(work.cover, 8);
  const g = useRef<Group>(null);
  const bar = useRef<Mesh>(null);
  const ar = work.cover.w / work.cover.h;
  const H = ar > 1.2 ? 2.6 : 3.8;
  const mat = useMemo(() => chrome({ roughness: 0.05, env: 1.6 }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const el = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e: PointerEvent) => {
      ndc.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      el.current.x = ndc.x;
      el.current.y = ndc.y;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  useFrame((st, dt) => {
    const r = g.current;
    if (!r) return;
    const s = store.get();
    const cdt = Math.min(0.05, dt);
    const l = 1 - Math.exp(-cdt / 0.35);
    const yawT = s.reduced ? 0 : el.current.x * 0.45 + Math.sin(st.clock.elapsedTime * 0.3) * 0.06;
    const pitchT = s.reduced ? 0 : -el.current.y * 0.25;
    r.rotation.y += (yawT - r.rotation.y) * l;
    r.rotation.x += (pitchT - r.rotation.x) * l;
    r.position.y = s.reduced ? 0 : Math.sin(st.clock.elapsedTime * 0.5) * 0.08;
    if (bar.current && !s.reduced) bar.current.rotation.z = st.clock.elapsedTime * 0.2;
  });
  return (
    <group ref={g}>
      <mesh position={[0.08, -0.08, -0.05]}>
        <planeGeometry args={[H * ar, H]} />
        <meshStandardMaterial color="#07060f" roughness={0.9} />
      </mesh>
      <mesh>
        <planeGeometry args={[H * ar, H]} />
        <meshStandardMaterial map={tex} roughness={0.5} metalness={0} envMapIntensity={0.35} side={DoubleSide} />
      </mesh>
      <mesh ref={bar} position={[(H * ar) / 2 + 0.9, 0.6, 0.6]} material={mat}>
        <torusGeometry args={[0.55, 0.14, 24, 64]} />
      </mesh>
    </group>
  );
}

/** a project's small stage: its three inks as the studio lights */
export default function WorkScene({ work }: { work: Work; lang: Lang }) {
  const tier = useStore((s) => s.tier);
  const b = budgetOf(tier);
  const [c0, c1, c2] = work.colors;
  const bg = useMemo(() => new Color(c0).lerp(new Color("#07060f"), 0.65), [c0]);
  return (
    <Canvas dpr={Math.min(b.dpr, typeof window !== "undefined" ? window.devicePixelRatio : 1)} gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05, outputColorSpace: SRGBColorSpace }} camera={{ fov: 32, near: 0.1, far: 60, position: [0, 0.2, 8.5] }} onCreated={({ gl }) => gl.setClearColor(bg, 1)}>
      <color attach="background" args={[bg.getHex()]} />
      <fog attach="fog" args={[bg.getHex(), 10, 30]} />
      <Environment resolution={b.envRes} frames={1}>
        <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 5, -2]} scale={[12, 12, 1]} color="#ffffff" />
        <Lightformer intensity={1.6} rotation-y={Math.PI / 2} position={[-6, 1, 0]} scale={[8, 3, 1]} color={c1} />
        <Lightformer intensity={1.4} rotation-y={-Math.PI / 2} position={[6, -1, 0]} scale={[8, 3, 1]} color={c2 ?? c1} />
      </Environment>
      <ambientLight intensity={0.35} />
      <pointLight position={[-4, 3, 5]} intensity={14} distance={20} color={c1} decay={2} />
      <pointLight position={[4, -2, 5]} intensity={10} distance={20} color={c2 ?? c1} decay={2} />
      <Suspense fallback={null}>
        <Piece work={work} />
      </Suspense>
      <mesh rotation-x={-Math.PI / 2} position={[0, -2.6, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={bg} roughness={0.3} metalness={0.2} envMapIntensity={0.8} />
      </mesh>
    </Canvas>
  );
}
