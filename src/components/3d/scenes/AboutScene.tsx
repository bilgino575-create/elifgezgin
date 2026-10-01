"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { GLSL3, Group, MeshStandardMaterial, ShaderMaterial } from "three";
import type { Lang } from "@/lib/content";
import { L, site, upper } from "@/lib/content";
import { store } from "@/lib/store";
import { STOPS } from "@/lib/stops";
import { holo } from "../materials";
import ExtrudedText from "../text/ExtrudedText";
import { rig } from "../rig";
import { useStopGroup, damp } from "./common";
import Statue from "./Statue";

const FONT = "/fonts/archivo-black.ttf";

/** the design system behind the installation: a grid of thin lines and a few rulers, ultraviolet on ink */
const GRID_FRAG = /* glsl */ `
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec3 uColor;
uniform float uTime;
void main() {
  vec2 g = vUv * vec2(28.0, 18.0);
  vec2 f = abs(fract(g) - 0.5);
  float line = 1.0 - smoothstep(0.0, 0.06, min(f.x, f.y));
  float major = 1.0 - smoothstep(0.0, 0.03, min(abs(fract(g.x / 4.0) - 0.5), abs(fract(g.y / 4.0) - 0.5)));
  float pulse = 0.5 + 0.5 * sin(uTime * 0.4 + vUv.x * 6.0);
  float a = line * 0.18 + major * 0.25 * pulse;
  float vig = smoothstep(0.95, 0.4, length(vUv - 0.5) * 1.6);
  fragColor = vec4(uColor * a * vig, a * vig);
}
`;
const GRID_VERT = /* glsl */ `
out vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/**
 * 06 ELİF. The installation: the name in holographic glass at two depths,
 * the statue on its plinth in front, the six disciplines drifting around
 * it at different depths and moving with the hand, and the design system
 * drawn as a grid of light behind everything.
 */
export default function AboutScene({ lang }: { lang: Lang }) {
  const j = 5;
  const group = useRef<Group>(null);
  const words = useRef<Group>(null);
  useStopGroup(j, group);
  const w = STOPS[j].world;
  const touch = store.get().touch;
  const holoA = useMemo(() => holo({ color: "#c8ff00", opacity: 0.55, ior: 1.5 }), []);
  const holoB = useMemo(() => holo({ color: "#9a7bff", opacity: 0.6, ior: 1.35 }), []);
  const wordMat = useMemo(() => new MeshStandardMaterial({ color: "#f7f6f2", roughness: 0.4, metalness: 0.1, emissive: "#c8ff00", emissiveIntensity: 0.15 }), []);
  const grid = useMemo(() => new ShaderMaterial({ vertexShader: GRID_VERT, fragmentShader: GRID_FRAG, glslVersion: GLSL3, transparent: true, depthWrite: false, uniforms: { uColor: { value: [0.42, 0.17, 1.0] }, uTime: { value: 0 } } }), []);
  useEffect(() => () => {
    holoA.dispose();
    holoB.dispose();
    wordMat.dispose();
    grid.dispose();
  }, [holoA, holoB, wordMat, grid]);
  // the statue mounts a stop early, so it has arrived when the camera does
  const [withStatue, setWithStatue] = useState(false);
  useFrame(() => {
    if (!withStatue && rig.i >= 4) setWithStatue(true);
    grid.uniforms.uTime.value = store.get().reduced ? 0 : rig.time;
    const s = store.get();
    const g = words.current;
    if (g) {
      for (let i = 0; i < g.children.length; i++) {
        const c = g.children[i];
        const depth = (i % 3) + 1;
        const tx = (s.pointer && !s.reduced ? s.px : 0) * depth * 0.9;
        const ty = (s.pointer && !s.reduced ? s.py : 0) * depth * 0.5;
        c.position.x = damp(c.position.x, c.userData.x + tx, 0.5, rig.dt);
        c.position.y = damp(c.position.y, c.userData.y + ty + (s.reduced ? 0 : Math.sin(rig.time * 0.5 + i) * 0.15), 0.5, rig.dt);
      }
    }
  });
  // the words circle the name on the right half; the bio keeps the left
  const items = site.disciplines.map((d, i) => {
    const a = (i / site.disciplines.length) * Math.PI * 2 + 0.6;
    const r = touch ? 2.6 : 3.6;
    return { text: upper(L(d, lang), lang), x: w[0] + (touch ? 0.4 : 3.9) + Math.cos(a) * r, y: w[1] + (touch ? 2.2 : 0.8) + Math.sin(a) * 2.6, z: w[2] - 2 - (i % 3) * 2.2, i };
  });
  return (
    <group ref={group}>
      <mesh position={[w[0] + 2, w[1] + 1, w[2] - 14]} material={grid}>
        <planeGeometry args={[46, 30]} />
      </mesh>
      <group name="first" position={[w[0] + (touch ? -0.9 : 3.2), w[1] + (touch ? 4.6 : 2.4), w[2] - 7]} rotation={[0, -0.2, 0]}>
        <ExtrudedText text={upper(site.firstName)} size={touch ? 1.5 : 3.0} depth={0.35} bevel={0.04} weight={900} stretch="condensed" material={holoA} />
      </group>
      <group name="last" position={[w[0] + (touch ? -1.0 : 4.4), w[1] + (touch ? 2.7 : -0.9), w[2] - 5]} rotation={[0, -0.25, 0]}>
        <ExtrudedText text={upper(site.lastName)} size={touch ? 1.1 : 2.3} depth={0.3} bevel={0.03} weight={900} stretch="condensed" material={holoB} />
      </group>
      <group ref={words} name="words">
        {items.map((it) => (
          <group key={it.i} position={[it.x, it.y, it.z]} userData={{ x: it.x, y: it.y }}>
            <Text fontSize={touch ? 0.34 : 0.46} font={FONT} material={wordMat} anchorX="center" anchorY="middle" letterSpacing={0.08} outlineWidth={it.i % 2 ? 0 : 0.012} outlineColor="#c8ff00" fillOpacity={it.i % 2 ? 1 : 0.0} strokeWidth={it.i % 2 ? 0 : 0.012} strokeColor="#f7f6f2">
              {it.text}
            </Text>
          </group>
        ))}
      </group>
      {withStatue ? (
        <Suspense fallback={null}>
          <Statue position={[w[0] + (touch ? 1.35 : 2.2), w[1] + (touch ? 0.6 : -2.9), w[2] + 1.5]} scale={touch ? 1.2 : 1.3} />
        </Suspense>
      ) : null}
      <pointLight position={[w[0] + 5, w[1] + 4, w[2] + 4]} intensity={10} distance={18} color="#c8ff00" decay={2} />
      <pointLight position={[w[0] - 4, w[1] + 1, w[2] + 5]} intensity={8} distance={18} color="#6a2cff" decay={2} />
    </group>
  );
}
