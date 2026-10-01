"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, GLSL3, Points, ShaderMaterial, Vector3 } from "three";
import { useStore } from "@/lib/store";
import { budgetOf } from "@/lib/tiers";
import { STOPS } from "@/lib/stops";
import { rig } from "./rig";

/**
 * Dust of light along the whole route: every stop gets a cloud of points
 * in its own inks, drifting, twinkling, pushed aside by the light in the
 * visitor's hand. One draw call; everything per-particle lives in the
 * vertex shader.
 */
const VERT = /* glsl */ `
in vec3 aColor;
in float aSeed;
in float aSize;
uniform float uTime;
uniform float uPx;
uniform vec3 uLight;
uniform float uLightK;
out vec3 vColor;
out float vAlpha;
void main() {
  vec3 p = position;
  float t = uTime * (0.25 + aSeed * 0.3);
  p.x += sin(t + aSeed * 31.0) * 0.5;
  p.y += cos(t * 0.8 + aSeed * 17.0) * 0.6;
  p.z += sin(t * 0.6 + aSeed * 7.0) * 0.5;
  // the hand pushes the dust away
  vec3 d = p - uLight;
  float dist = length(d);
  p += normalize(d + 1e-4) * exp(-dist * dist * 0.35) * 2.2 * uLightK;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 50.0);
  gl_PointSize = aSize * uPx * tw / max(1.0, -mv.z);
  vColor = aColor;
  vAlpha = tw * smoothstep(60.0, 20.0, -mv.z) * 0.9;
}
`;
const FRAG = /* glsl */ `
precision highp float;
in vec3 vColor;
in float vAlpha;
out vec4 fragColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.15, 0.5, d)) * vAlpha;
  if (a < 0.01) discard;
  fragColor = vec4(vColor * a, a);
}
`;

export default function ParticleField() {
  const tier = useStore((s) => s.tier);
  const reduced = useStore((s) => s.reduced);
  const count = budgetOf(tier).particles;
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    const c = new Color();
    let s = 12345;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    const per = Math.floor(count / STOPS.length);
    for (let i = 0; i < count; i++) {
      const st = STOPS[Math.min(STOPS.length - 1, Math.floor(i / per))];
      const inks = [st.palette.a, st.palette.b, st.palette.c, "#ffffff"];
      // a flattened cloud around the installation, denser near it, long tails toward the neighbours
      const r = Math.pow(rnd(), 0.6);
      const ang = rnd() * Math.PI * 2;
      const spread = 11 + r * 9;
      pos[i * 3] = st.world[0] + Math.cos(ang) * spread * (0.6 + rnd()) + (rnd() - 0.5) * 6;
      pos[i * 3 + 1] = st.world[1] + (rnd() - 0.5) * 11;
      pos[i * 3 + 2] = st.world[2] + Math.sin(ang) * spread * 0.55 - rnd() * 8;
      c.set(inks[Math.floor(rnd() * inks.length)]);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      seed[i] = rnd();
      size[i] = 0.5 + Math.pow(rnd(), 3) * 2.2;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("aColor", new Float32BufferAttribute(col, 3));
    g.setAttribute("aSeed", new Float32BufferAttribute(seed, 1));
    g.setAttribute("aSize", new Float32BufferAttribute(size, 1));
    return g;
  }, [count]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        glslVersion: GLSL3,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uLight: { value: new Vector3() }, uLightK: { value: 0 } },
      }),
    []
  );
  const points = useMemo(() => {
    const p = new Points(geometry, material);
    p.frustumCulled = false;
    return p;
  }, [geometry, material]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((st) => {
    const u = material.uniforms;
    u.uTime.value = reduced ? 0 : rig.time;
    const fov = ((st.camera as { fov: number }).fov * Math.PI) / 180;
    u.uPx.value = ((st.size.height * st.viewport.dpr) / (2 * Math.tan(fov / 2))) * 0.045;
    (u.uLight.value as Vector3).copy(rig.light);
    u.uLightK.value = rig.pointer ? 1 : 0.3;
  });
  return <primitive object={points} />;
}
