"use client";

import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, Color, Group, Mesh, SphereGeometry, TubeGeometry, Vector3, type MeshPhysicalMaterial } from "three";
import type { Lang } from "@/lib/content";
import { site, upper, works } from "@/lib/content";
import { loading, store } from "@/lib/store";
import { chrome, holo, liquid } from "../materials";
import ExtrudedText from "../text/ExtrudedText";
import { rig } from "../rig";
import { useStopGroup, useWorkTexture, useProjectHandlers, damp, rand } from "./common";

const W = [0, 0, 0];
const tmp = new Vector3();
const flee = new Vector3();

/** the hero's entrance: a critically damped rise with a little overshoot, driven by time since the loader handed over */
function rise(delay: number) {
  const tau = Math.max(0, rig.entered * 2.2 - delay);
  if (tau <= 0) return 0;
  const w = 3.2;
  const z = 0.68;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau));
}

/** a liquid sphere: displaced, iridescent; one of them avoids the hand */
function Liquid({ position, radius, color, seed, flees = false, amp = 0.2 }: { position: [number, number, number]; radius: number; color: string; seed: number; flees?: boolean; amp?: number }) {
  const mesh = useRef<Mesh>(null);
  const mat = useMemo(() => liquid({ color, amp, freq: 1.1 + seed * 0.4, speed: 0.35 + seed * 0.3 }), [color, amp, seed]);
  const base = useMemo(() => new Vector3(...position), [position]);
  const off = useMemo(() => new Vector3(), []);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const s = store.get();
    mat.liquid.uTime.value = s.reduced ? 0 : rig.time;
    const k = rise(0.3 + seed * 0.4);
    m.scale.setScalar(Math.max(0.001, k) * radius);
    // float
    const bob = s.reduced ? 0 : Math.sin(rig.time * (0.5 + seed * 0.3) + seed * 9) * 0.25;
    if (flees && s.pointer && !s.reduced) {
      // the small one keeps its distance from the light
      flee.subVectors(base, rig.light);
      flee.z = 0;
      const d = flee.length();
      const push = Math.max(0, 3.4 - d) * 0.9;
      flee.normalize().multiplyScalar(push);
      off.lerp(flee, 1 - Math.exp(-rig.dt / 0.25));
    } else {
      off.lerp(tmp.set(0, 0, 0), 1 - Math.exp(-rig.dt / 0.8));
    }
    m.position.set(base.x + off.x, base.y + bob + off.y, base.z + off.z);
    m.rotation.y += rig.dt * 0.12;
  });
  return (
    <mesh ref={mesh} material={mat} position={position}>
      <sphereGeometry args={[1, 96, 64]} />
    </mesh>
  );
}

/** chrome ribbons: tubes along slow curves, turning around their own axis */
function Ribbons() {
  const group = useRef<Group>(null);
  const mat = useMemo(() => chrome({ roughness: 0.08, env: 1.8 }), []);
  const geos = useMemo(() => {
    const r = rand(77);
    const make = (pts: number[][]) => new TubeGeometry(new CatmullRomCurve3(pts.map((p) => new Vector3(...p)), false, "centripetal"), 160, 0.11, 10, false);
    return [
      make([[-9, -2.5, -6], [-5, 0.5, -3], [-1, 3.6, -5], [3, 1.2, -7], [8, 4.4, -4], [12, 2, -8]]),
      make([[-8, 4.5, -9], [-3, 2.2, -4], [1.5, -1.5, -2], [6, -2.6, -5], [10, -0.5, -10]]),
      make([[2 + r(), -4, 2], [4.5, -2.2, 0.5], [7.5, -3.8, -2], [10, -1, -3]]),
    ];
  }, []);
  useEffect(() => () => {
    geos.forEach((g) => g.dispose());
    mat.dispose();
  }, [geos, mat]);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const s = store.get();
    const k = rise(0.9);
    g.scale.setScalar(Math.max(0.001, k));
    if (!s.reduced) g.rotation.y = Math.sin(rig.time * 0.08) * 0.12;
  });
  return (
    <group ref={group}>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} />
      ))}
    </group>
  );
}

/** a fragment of a poster drifting in the depth, leaning toward the light */
function Fragment({ img, position, seed, slug, lang }: { img: Parameters<typeof useWorkTexture>[0]; position: [number, number, number]; seed: number; slug: string; lang: Lang }) {
  const mesh = useRef<Mesh>(null);
  const tex = useWorkTexture(img, 4);
  const h = useProjectHandlers(lang, slug);
  const ar = img.w / img.h;
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const s = store.get();
    const k = rise(1.1 + seed * 0.5);
    m.scale.setScalar(Math.max(0.001, k));
    if (!s.reduced) {
      m.position.y = position[1] + Math.sin(rig.time * 0.4 + seed * 11) * 0.3;
      m.position.x = position[0] + Math.cos(rig.time * 0.27 + seed * 5) * 0.2;
    }
    // lean toward the light
    tmp.copy(rig.light);
    const yaw = Math.atan2(tmp.x - m.position.x, tmp.z - m.position.z) * 0.35;
    const pitch = -Math.atan2(tmp.y - m.position.y, 10) * 0.35;
    m.rotation.y = damp(m.rotation.y, yaw, 0.4, rig.dt);
    m.rotation.x = damp(m.rotation.x, pitch, 0.4, rig.dt);
  });
  return (
    <mesh ref={mesh} position={position} {...h}>
      <planeGeometry args={[1.3 * ar, 1.3]} />
      <meshStandardMaterial map={tex} roughness={0.6} metalness={0} envMapIntensity={0.25} />
    </mesh>
  );
}

function Fragments({ lang }: { lang: Lang }) {
  const picks = useMemo(() => works.slice(0, 5), []);
  useEffect(() => {
    // the fourth loading unit: the first stop's textures are in
    loading.done();
  }, []);
  const spots: [number, number, number][] = [
    [-7.4, 3.2, -7],
    [6.8, -0.4, -9],
    [-3.2, -3.2, -4],
    [9.5, 2.8, -12],
    [-9.5, -1.4, -10],
  ];
  return (
    <>
      {picks.map((w, i) => (
        <Fragment key={w.slug} img={w.cover} position={spots[i]} seed={i * 0.37} slug={w.slug} lang={lang} />
      ))}
    </>
  );
}

/**
 * 01 RENK. The name as sculpture: ELİF in chrome, GEZGİN in holographic
 * glass at another depth; liquid spheres in the three inks, chrome ribbons,
 * fragments of the posters drifting behind, all rising when the loader
 * hands over. The light in the hand rakes the chrome; the small cyan
 * sphere keeps away from it.
 */
export default function ColorScene({ lang }: { lang: Lang }) {
  const group = useRef<Group>(null);
  const first = useRef<Group>(null);
  const last = useRef<Group>(null);
  const chromeMat = useMemo(() => chrome({ roughness: 0.05, env: 1.7 }), []);
  const holoMat = useMemo(() => holo({ color: "#8fa0ff", opacity: 0.8 }), []);
  const chromeSphere = useMemo(() => chrome({ roughness: 0.03, env: 1.6 }), []);
  const hotMat = useMemo(() => {
    const m = holo({ color: "#ff2e88", opacity: 0.9, ior: 1.6 });
    (m as MeshPhysicalMaterial).emissive = new Color("#ff2e88");
    (m as MeshPhysicalMaterial).emissiveIntensity = 0.25;
    return m;
  }, []);
  useEffect(() => () => {
    chromeMat.dispose();
    holoMat.dispose();
    chromeSphere.dispose();
    hotMat.dispose();
  }, [chromeMat, holoMat, chromeSphere, hotMat]);
  useStopGroup(0, group);
  const touch = store.get().touch;
  const S = touch ? 0.72 : 1;

  useFrame(() => {
    const s = store.get();
    const a = first.current;
    const b = last.current;
    if (a) {
      const k = rise(0.0);
      a.position.y = (touch ? 2.6 : 1.9) + (k - 1) * 2.4;
      a.rotation.y = -0.16 + (s.reduced ? 0 : s.px * 0.08);
      a.rotation.x = s.reduced ? 0 : -s.py * 0.05;
      a.rotation.z = 0.04;
      a.scale.setScalar(S * (0.85 + 0.15 * Math.min(1, k)));
    }
    if (b) {
      const k = rise(0.35);
      b.position.y = (touch ? -1.0 : -0.6) + (k - 1) * 2.4;
      b.rotation.y = -0.34 + (s.reduced ? 0 : s.px * 0.06);
      b.rotation.x = s.reduced ? 0 : -s.py * 0.04;
      b.scale.setScalar(S * (0.85 + 0.15 * Math.min(1, k)));
    }
  });

  return (
    <group ref={group} position={W as [number, number, number]}>
      <group ref={first} position={[touch ? 0 : 1.0, 1.9, 0]}>
        <ExtrudedText text={upper(site.firstName)} size={touch ? 2.2 : 2.7} depth={0.5} bevel={0.05} weight={900} stretch="condensed" material={chromeMat} />
      </group>
      <group ref={last} position={[touch ? 0.4 : 3.4, -0.6, -2.6]}>
        <ExtrudedText text={upper(site.lastName)} size={touch ? 1.6 : 2.0} depth={0.3} bevel={0.03} weight={900} stretch="condensed" material={holoMat} />
      </group>
      <Liquid position={[touch ? -2.6 : -4.6, 1.3, -3.5]} radius={touch ? 1.1 : 1.7} color="#1f3bff" seed={0.1} amp={0.22} />
      <Liquid position={[touch ? 2.8 : 5.9, 3.3, -1.2]} radius={0.9} color="#ff2e88" seed={0.55} amp={0.18} />
      <Liquid position={[touch ? -1.4 : -1.9, -1.9, 1.6]} radius={0.5} color="#19e3ff" seed={0.8} amp={0.3} flees />
      <mesh position={[touch ? 2.2 : 4.8, -2.3, 0.8]} material={chromeSphere}>
        <sphereGeometry args={[0.72, 64, 48]} />
      </mesh>
      <mesh position={[-5.6, -0.6, 2.2]} material={chromeSphere}>
        <sphereGeometry args={[0.34, 48, 32]} />
      </mesh>
      <mesh position={[touch ? 1.8 : 3.0, 4.6, -5]} material={hotMat}>
        <sphereGeometry args={[0.42, 48, 32]} />
      </mesh>
      <Ribbons />
      <Suspense fallback={null}>
        <Fragments lang={lang} />
      </Suspense>
    </group>
  );
}

export { SphereGeometry };
