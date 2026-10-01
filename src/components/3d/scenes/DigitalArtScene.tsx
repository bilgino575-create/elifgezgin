"use client";

import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Color, DoubleSide, Group, Mesh, type Texture } from "three";
import type { Lang, Work } from "@/lib/content";
import { works } from "@/lib/content";
import { store } from "@/lib/store";
import { STOPS } from "@/lib/stops";
import { liquid } from "../materials";
import { rig } from "../rig";
import { useStopGroup, useProjectHandlers, useWorkTexture, damp, holdProgress } from "./common";

/** the generative piece projected on a folded sculpture: a liquid sphere whose surface carries the image as light */
function Projection({ work, lang, position, touch }: { work: Work; lang: Lang; position: [number, number, number]; touch: boolean }) {
  const mesh = useRef<Mesh>(null);
  const tex = useWorkTexture(work.cover, 8);
  const h = useProjectHandlers(lang, work.slug);
  const mat = useMemo(() => {
    const m = liquid({ color: "#ffffff", amp: 0.32, freq: 0.9, speed: 0.25 });
    m.map = tex;
    m.emissiveMap = tex;
    m.emissive = new Color("#ffffff");
    m.emissiveIntensity = 0.55;
    m.roughness = 0.35;
    m.metalness = 0.05;
    m.iridescence = 0.3;
    return m;
  }, [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  const R = touch ? 1.45 : 1.9;
  useFrame(() => {
    const s = store.get();
    const m = mesh.current;
    if (!m) return;
    mat.liquid.uTime.value = s.reduced ? 0 : rig.time * 0.8;
    m.rotation.y = damp(m.rotation.y, (s.reduced ? 0 : rig.time * 0.12) + (s.pointer ? s.px * 0.3 : 0), 0.5, rig.dt);
    m.rotation.x = damp(m.rotation.x, s.pointer && !s.reduced ? -s.py * 0.2 : 0, 0.5, rig.dt);
    m.position.y = position[1] + (s.reduced ? 0 : Math.sin(rig.time * 0.5) * 0.1);
  });
  return (
    <mesh ref={mesh} name="projection" position={position} material={mat} {...h}>
      <sphereGeometry args={[R, 128, 96]} />
    </mesh>
  );
}

/** the magazine: two pages hinged at the spine; the spread opens as the camera arrives, the hand turns it */
function Spread({ work, lang, position, touch }: { work: Work; lang: Lang; position: [number, number, number]; touch: boolean }) {
  const root = useRef<Group>(null);
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const tex = useWorkTexture(work.cover, 8);
  const h = useProjectHandlers(lang, work.slug);
  const [tl, tr] = useMemo(() => {
    const a = tex.clone() as Texture;
    a.repeat.set(0.5, 1);
    a.offset.set(0, 0);
    a.needsUpdate = true;
    const b = tex.clone() as Texture;
    b.repeat.set(0.5, 1);
    b.offset.set(0.5, 0);
    b.needsUpdate = true;
    return [a, b];
  }, [tex]);
  useEffect(() => () => {
    tl.dispose();
    tr.dispose();
  }, [tl, tr]);
  const ar = work.cover.w / 2 / work.cover.h;
  const H = touch ? 1.9 : 3.2;
  const Wp = H * ar;
  useFrame(() => {
    const s = store.get();
    const k = holdProgress(4);
    const open = s.reduced ? 1 : Math.min(1, k * 1.6);
    const ease = 1 - Math.pow(1 - open, 3);
    const ang = ease * 1.45; // ~83° each side: a nearly flat spread
    if (left.current) left.current.rotation.y = -(Math.PI / 2 - ang) * 1;
    if (right.current) right.current.rotation.y = Math.PI / 2 - ang;
    const r = root.current;
    if (r) {
      r.rotation.y = damp(r.rotation.y, -0.35 + (s.pointer && !s.reduced ? s.px * 0.25 : 0), 0.5, rig.dt);
      r.rotation.x = damp(r.rotation.x, 0.12 + (s.pointer && !s.reduced ? -s.py * 0.12 : 0), 0.5, rig.dt);
      r.position.y = position[1] + (s.reduced ? 0 : Math.sin(rig.time * 0.4 + 1) * 0.08);
    }
  });
  return (
    <group ref={root} name="spread" position={position} {...h}>
      <group ref={left}>
        <mesh position={[-Wp / 2, 0, 0]}>
          <planeGeometry args={[Wp, H]} />
          <meshStandardMaterial map={tl} roughness={0.6} side={DoubleSide} />
        </mesh>
      </group>
      <group ref={right}>
        <mesh position={[Wp / 2, 0, 0]}>
          <planeGeometry args={[Wp, H]} />
          <meshStandardMaterial map={tr} roughness={0.6} side={DoubleSide} />
        </mesh>
      </group>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[0.04, H, 0.06]} />
        <meshStandardMaterial color="#07060f" roughness={0.9} />
      </mesh>
    </group>
  );
}

/**
 * 05 DİJİTAL SANAT. A white studio: the generative series as light on a
 * folded sculpture, and the magazine opening its spread in the air.
 */
export default function DigitalArtScene({ lang }: { lang: Lang }) {
  const j = 4;
  const group = useRef<Group>(null);
  useStopGroup(j, group);
  const touch = store.get().touch;
  const w = STOPS[j].world;
  const projection = useMemo(() => works.find((x) => x.stop === 5 && x.presentation === "projection") ?? works.find((x) => x.stop === 5), []);
  const spread = useMemo(() => works.find((x) => x.stop === 5 && x.presentation === "spread" && x !== projection), [projection]);
  return (
    <group ref={group}>
      <Suspense fallback={null}>
        {projection ? <Projection work={projection} lang={lang} position={touch ? [w[0] - 1.5, w[1] + 1.9, w[2]] : [w[0] - 2.25, w[1] + 0.5, w[2]]} touch={touch} /> : null}
        {spread ? <Spread work={spread} lang={lang} position={touch ? [w[0] + 0.5, w[1] - 0.25, w[2] - 1] : [w[0] + 3.2, w[1] + 0.2, w[2] - 1.5]} touch={touch} /> : null}
      </Suspense>
      <pointLight position={[w[0] - 6, w[1] + 5, w[2] + 6]} intensity={9} distance={22} color="#19e3ff" decay={2} />
      <pointLight position={[w[0] + 6, w[1] - 2, w[2] + 5]} intensity={7} distance={22} color="#ff2e88" decay={2} />
    </group>
  );
}
