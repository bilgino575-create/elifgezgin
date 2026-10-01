"use client";

import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { DoubleSide, GLSL3, Group, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, PlaneGeometry, ShaderMaterial, Vector3, type Texture } from "three";
import type { Lang, Work } from "@/lib/content";
import { works } from "@/lib/content";
import { store, useStore } from "@/lib/store";
import { budgetOf } from "@/lib/tiers";
import { STOPS } from "@/lib/stops";
import { chrome } from "../materials";
import { rig } from "../rig";
import { useStopGroup, useProjectHandlers, useWorkTexture, damp, holdProgress, rand } from "./common";

const tmp = new Vector3();

/** the floating poster: lit paper that leans toward the light, with a thin black sheet behind for an edge */
function FloatingPoster({ work, lang, position, touch }: { work: Work; lang: Lang; position: [number, number, number]; touch: boolean }) {
  const mesh = useRef<Group>(null);
  const tex = useWorkTexture(work.cover, 8);
  const h = useProjectHandlers(lang, work.slug);
  const ar = work.cover.w / work.cover.h;
  const H = touch ? 2.4 : 5.4;
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const s = store.get();
    tmp.copy(rig.light);
    const yawT = Math.max(-0.5, Math.min(0.5, Math.atan2(tmp.x - m.position.x, tmp.z - m.position.z) * 0.6));
    const pitchT = Math.max(-0.3, Math.min(0.3, -Math.atan2(tmp.y - m.position.y, 12) * 0.6));
    m.rotation.y = damp(m.rotation.y, (s.pointer ? yawT : 0) + 0.12, 0.35, rig.dt);
    m.rotation.x = damp(m.rotation.x, s.pointer ? pitchT : 0, 0.35, rig.dt);
    m.position.y = position[1] + (s.reduced ? 0 : Math.sin(rig.time * 0.45) * 0.12);
  });
  return (
    <group ref={mesh} name="poster" position={position} {...h}>
      <mesh position={[0.06, -0.06, -0.03]}>
        <planeGeometry args={[H * ar, H]} />
        <meshStandardMaterial color="#07060f" roughness={0.9} />
      </mesh>
      <mesh>
        <planeGeometry args={[H * ar, H]} />
        <meshStandardMaterial map={tex} roughness={0.55} metalness={0} envMapIntensity={0.3} side={DoubleSide} />
      </mesh>
    </group>
  );
}

const VERT = /* glsl */ `
in vec2 aCell;      // cell uv origin
in vec3 aSeed;      // random per cell
uniform vec2 uGrid;
uniform vec2 uSize;
uniform float uExplode;
uniform float uTime;
uniform vec3 uLight;
out vec2 vUv;
out float vFade;
float hash(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  vec2 cellSize = uSize / uGrid;
  vec2 local = (position.xy + 0.5) * cellSize;
  vec2 origin = (aCell - 0.5) * uSize;
  vec3 p = vec3(origin + local, 0.0);
  // the explosion: every cell flies on its own path and tumbles
  float e = uExplode;
  float ee = e * e;
  vec3 dir = normalize(vec3(aSeed.x - 0.5, aSeed.y - 0.5, aSeed.z - 0.2));
  vec3 centre = vec3(origin + cellSize * 0.5, 0.0);
  float ang = e * 6.28318 * (aSeed.x - 0.5) * 2.0 + uTime * 0.6 * e;
  float ca = cos(ang), sa = sin(ang);
  vec3 rel = p - centre;
  rel.xy = mat2(ca, -sa, sa, ca) * rel.xy;
  p = centre + rel + dir * ee * (5.0 + aSeed.y * 6.0) + vec3(0.0, sin(uTime * 2.0 + aSeed.x * 20.0) * e * 0.3, 0.0);
  vUv = aCell + (position.xy + 0.5) / uGrid;
  vFade = 1.0 - smoothstep(0.75, 1.0, e);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;
const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
in vec2 vUv;
in float vFade;
out vec4 fragColor;
void main() {
  vec4 c = texture(uMap, vUv);
  fragColor = vec4(c.rgb, vFade);
  if (fragColor.a < 0.02) discard;
}
`;

/**
 * The poster series as particles: the sheet is cut into cells, each an
 * instance; on a clock the cells explode along their own paths, the next
 * poster is loaded into the texture while nothing can be seen, and the
 * cells fall back into a new sheet. The hand can set it off early.
 */
function ParticlePosters({ work, lang, position, touch }: { work: Work; lang: Lang; position: [number, number, number]; touch: boolean }) {
  const tier = useStore((s) => s.tier);
  const imgs = useMemo(() => [work.cover, ...work.gallery].slice(0, 3), [work]);
  const tex0 = useWorkTexture(imgs[0], 4);
  const tex1 = useWorkTexture(imgs[1] ?? imgs[0], 4);
  const tex2 = useWorkTexture(imgs[2] ?? imgs[0], 4);
  const texs = useMemo(() => [tex0, tex1, tex2], [tex0, tex1, tex2]);
  const h = useProjectHandlers(lang, work.slug);
  const count = budgetOf(tier).shardCount;
  const cols = Math.round(Math.sqrt(count / 1.5));
  const rows = Math.round(cols * 1.5);
  const ar = work.cover.w / work.cover.h;
  const H = touch ? 3.0 : 3.6;
  const geometry = useMemo(() => {
    const base = new PlaneGeometry(1, 1);
    const g = new InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute("position", base.getAttribute("position"));
    g.setAttribute("uv", base.getAttribute("uv"));
    const n = cols * rows;
    const cell = new Float32Array(n * 2);
    const seed = new Float32Array(n * 3);
    const r = rand(99);
    let i = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        cell[i * 2] = x / cols;
        cell[i * 2 + 1] = y / rows;
        seed[i * 3] = r();
        seed[i * 3 + 1] = r();
        seed[i * 3 + 2] = r();
        i++;
      }
    }
    g.setAttribute("aCell", new InstancedBufferAttribute(cell, 2));
    g.setAttribute("aSeed", new InstancedBufferAttribute(seed, 3));
    g.instanceCount = n;
    base.dispose();
    return g;
  }, [cols, rows]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        glslVersion: GLSL3,
        transparent: true,
        side: DoubleSide,
        uniforms: { uMap: { value: null as Texture | null }, uGrid: { value: [cols, rows] }, uSize: { value: [H * ar, H] }, uExplode: { value: 0 }, uTime: { value: 0 }, uLight: { value: new Vector3() } },
      }),
    [cols, rows, H, ar]
  );
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);
  const state = useRef({ idx: 0, phase: 0, t0: 0, burst: 0 });
  const mesh = useRef<Mesh>(null);
  useFrame(() => {
    const s = store.get();
    const u = material.uniforms;
    const st = state.current;
    const T = rig.time;
    // a cycle of 6.5 s: hold 4 s, explode 1.1 s, re-form 1.4 s; the hand's hover sets it off
    const period = 6.5;
    const local = (T - st.t0) % period;
    let e = 0;
    if (s.reduced) e = 0;
    else if (local < 4.0) e = 0;
    else if (local < 5.1) e = (local - 4.0) / 1.1;
    else e = 1 - (local - 5.1) / 1.4;
    e = Math.min(1, Math.max(0, e));
    // the poster swaps while nothing can be seen
    const idx = Math.floor((T - st.t0) / period) % texs.length;
    if (e > 0.95 && st.idx !== idx + 1) st.idx = idx + 1;
    u.uMap.value = texs[(idx + (e > 0.95 || local >= 5.1 ? 1 : 0)) % texs.length];
    const hover = s.hover === "project" && st.burst > 0 ? st.burst : 0;
    u.uExplode.value = Math.max(e, hover);
    u.uTime.value = T;
    (u.uLight.value as Vector3).copy(rig.light);
    const m = mesh.current;
    if (m) {
      m.rotation.y = damp(m.rotation.y, -0.22 + (s.pointer && !s.reduced ? s.px * 0.15 : 0), 0.5, rig.dt);
      m.position.y = position[1] + (s.reduced ? 0 : Math.sin(T * 0.4 + 2) * 0.1);
    }
    void holdProgress;
  });
  return <mesh ref={mesh} name="series" geometry={geometry} material={material} position={position} frustumCulled={false} {...h} />;
}

/** a few chrome shards in the air, for the light to find */
function Shards({ w }: { w: number[] }) {
  const mat = useMemo(() => chrome({ roughness: 0.1, env: 1.6 }), []);
  const g = useRef<Group>(null);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    const s = store.get();
    if (g.current && !s.reduced) g.current.rotation.y = rig.time * 0.05;
  });
  const r = rand(5);
  // offsets from the stop's centre: the group turns about the installation, not the world's origin
  // the upper band only, and far: the words below stay clear of them
  const items = Array.from({ length: 7 }, (_, i) => ({ p: [(r() - 0.5) * 18, 2.2 + r() * 4, -8 - r() * 6] as [number, number, number], s: 0.25 + r() * 0.45, rot: [r() * 3, r() * 3, r() * 3] as [number, number, number], k: i }));
  return (
    <group ref={g} position={[w[0], w[1], w[2]]}>
      {items.map((it) => (
        <mesh key={it.k} position={it.p} rotation={it.rot} material={mat}>
          <octahedronGeometry args={[it.s, 0]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 04 AFİŞ. Acid green void, black type. The exhibition poster floats on
 * the left and leans toward the light; to its right the numeral series
 * scatters into cells and gathers again as the next poster.
 */
export default function PosterScene({ lang }: { lang: Lang }) {
  const j = 3;
  const group = useRef<Group>(null);
  useStopGroup(j, group);
  const touch = store.get().touch;
  const w = STOPS[j].world;
  const poster = useMemo(() => works.find((x) => x.stop === 4 && x.presentation === "poster") ?? works.find((x) => x.stop === 4), []);
  const series = useMemo(() => works.find((x) => x.stop === 4 && x.presentation === "particles" && x !== poster), [poster]);
  return (
    <group ref={group}>
      <Suspense fallback={null}>
        {poster ? <FloatingPoster work={poster} lang={lang} position={touch ? [w[0] - 1.0, w[1] + 2.0, w[2] + 1] : [w[0] - 2.8, w[1] + 0.3, w[2]]} touch={touch} /> : null}
        {series ? <ParticlePosters work={series} lang={lang} position={touch ? [w[0] + 1.6, w[1] + 2.9, w[2] - 4] : [w[0] + 5.6, w[1] + 2.7, w[2] - 4]} touch={touch} /> : null}
      </Suspense>
      <Shards w={w} />
      <pointLight position={[w[0] - 4, w[1] + 4, w[2] + 5]} intensity={6} distance={18} color="#ffffff" decay={2} />
    </group>
  );
}
