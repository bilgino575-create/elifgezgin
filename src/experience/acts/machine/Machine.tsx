"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferGeometry, Color, CylinderGeometry, Float32BufferAttribute, GLSL3, Group, Mesh, MeshPhysicalMaterial, NormalBlending, PlaneGeometry, ShaderMaterial, SphereGeometry, Vector3 } from "three";
import { ACTS, range } from "@/lib/acts";
import { site } from "@/lib/content";
import { store } from "@/lib/store";
import { rig } from "../../rig/CameraRig";
import { rng } from "../../utils/scratch";

/**
 * Act IV. The process as a colour machine: cyan, magenta and yellow drop
 * through three glass tubes, mix in a vessel, run through a halftone drum
 * and come out as a printed sheet in the spot colour. The ink streams are
 * stateless GPU particles (100 k on HIGH, 50 k MID, 20 k LOW): every
 * particle's place on the route is a function of time and its seed, computed
 * in the vertex shader, with the hand pushing them aside. Six stages light
 * up in sequence with scroll and drive the HTML step index.
 */
const COUNT = { ultra: 100000, high: 100000, mid: 50000, low: 20000 };

const VERT = /* glsl */ `
in vec2 aSeed;
in float aStream;
uniform float uTime;
uniform vec3 uHand;
uniform float uHandK;
uniform float uStage;   // 0..6, which stages are live
uniform vec3 uInk[3];
uniform vec3 uMix;
uniform vec3 uSpot;
uniform float uPx;
uniform float uLight;
out vec3 vColor;
out float vAlpha;

vec3 route(float t, float stream, vec2 seed, out vec3 col, out float amp) {
  float tubeX = (stream - 1.0) * 1.1;
  vec3 p;
  if (t < 0.3) {
    float k = t / 0.3;
    p = vec3(tubeX, 2.6 - k * 3.0, 0.0);
    col = uInk[int(stream)];
    amp = 0.05;
  } else if (t < 0.5) {
    float k = (t - 0.3) / 0.2;
    float a = seed.y * 6.2832 + k * 14.0;
    float r = 0.5 * (1.0 - 0.5 * k);
    p = vec3(cos(a) * r, -0.7 + sin(k * 3.1416) * 0.25 - k * 0.15, sin(a) * r);
    col = mix(uInk[int(stream)], uMix, smoothstep(0.0, 0.6, k));
    amp = 0.03;
  } else if (t < 0.7) {
    float k = (t - 0.5) / 0.2;
    p = vec3(0.4 + k * 1.7, -1.05 + sin(k * 6.0 + seed.x * 6.0) * 0.05, (seed.y - 0.5) * 0.25);
    col = uMix;
    amp = 0.03;
  } else if (t < 0.85) {
    float k = (t - 0.7) / 0.15;
    float a = 3.1416 - k * 3.1416;
    p = vec3(2.6 + cos(a) * 0.6, -0.45 + sin(a) * 0.6, (seed.y - 0.5) * 0.6);
    col = mix(uMix, uSpot, smoothstep(0.3, 1.0, k));
    amp = 0.02;
  } else {
    float k = (t - 0.85) / 0.15;
    p = vec3(3.2 + k * 1.3, -1.05 + 0.01, (seed.y - 0.5) * 0.9);
    col = uSpot;
    amp = 0.01;
  }
  return p;
}

void main() {
  float t = fract(uTime * 0.07 + aSeed.x);
  vec3 col;
  float amp;
  vec3 p = route(t, aStream, aSeed, col, amp);
  // curl-ish jitter
  p += vec3(sin(uTime * 2.0 + aSeed.y * 50.0), cos(uTime * 1.7 + aSeed.x * 40.0), sin(uTime * 2.3 + aSeed.y * 30.0)) * amp;
  // the hand pushes the stream aside
  vec3 d = p - uHand;
  float dist = length(d.xy);
  p.xy += normalize(d.xy + 1e-4) * smoothstep(0.9, 0.0, dist) * 0.45 * uHandK;
  // stages that are not live yet stay dark
  float stage = t < 0.3 ? 1.0 : t < 0.5 ? 2.0 : t < 0.7 ? 3.0 : t < 0.85 ? 4.0 : 5.0;
  float live = smoothstep(stage - 0.6, stage + 0.4, uStage);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx / max(0.2, -mv.z);
  vColor = col;
  vAlpha = live * (0.55 + 0.45 * aSeed.y);
}
`;
const FRAG = /* glsl */ `
precision highp float;
in vec3 vColor;
in float vAlpha;
out vec4 fragColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = (1.0 - smoothstep(0.25, 0.5, length(c))) * vAlpha;
  if (a <= 0.01) discard;
  fragColor = vec4(vColor, a);
}
`;

export default function Machine() {
  const root = useRef<Group>(null);
  const drum = useRef<Mesh>(null);
  const tier = store.get().tier;
  const count = COUNT[tier] ?? 50000;
  const mobile = store.get().touch || window.innerWidth < 768;

  const res = useMemo(() => {
    const seed = new Float32Array(count * 2);
    const stream = new Float32Array(count);
    const r = rng(41);
    for (let i = 0; i < count; i++) {
      seed[i * 2] = r();
      seed[i * 2 + 1] = r();
      stream[i] = i % 3;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aSeed", new Float32BufferAttribute(seed, 2));
    geo.setAttribute("aStream", new Float32BufferAttribute(stream, 1));
    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      glslVersion: GLSL3,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uHand: { value: new Vector3() },
        uHandK: { value: 0 },
        uStage: { value: 0 },
        uInk: { value: [new Color("#00c8ff"), new Color("#ff2e88"), new Color("#ffd400")] },
        uMix: { value: new Color("#2a1f6e") },
        uSpot: { value: new Color(site.spotColor) },
        uPx: { value: 6 },
        uLight: { value: 0 },
      },
    });
    const glass = new MeshPhysicalMaterial({ color: "#dfe6ff", transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0, clearcoat: 1, transmission: 0, side: 2, depthWrite: false });
    const tube = new CylinderGeometry(0.16, 0.16, 3.0, 24, 1, true);
    const vessel = new SphereGeometry(0.72, 32, 24, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65);
    const drumGeo = new CylinderGeometry(0.62, 0.62, 1.1, 48);
    const drumMat = new MeshPhysicalMaterial({ color: "#1a1a30", metalness: 0.9, roughness: 0.22, iridescence: 0.45, iridescenceIOR: 1.3, clearcoat: 1 });
    const sheetGeo = new PlaneGeometry(1.4, 0.95);
    const sheetMat = new MeshPhysicalMaterial({ color: new Color(site.spotColor), emissive: new Color(site.spotColor), emissiveIntensity: 0.5, roughness: 0.6 });
    const pipe = new CylinderGeometry(0.1, 0.1, 1.9, 16, 1, true);
    return { geo, mat, glass, tube, vessel, drumGeo, drumMat, sheetGeo, sheetMat, pipe };
  }, [count]);

  useEffect(
    () => () => {
      res.geo.dispose();
      res.mat.dispose();
      res.glass.dispose();
      res.tube.dispose();
      res.vessel.dispose();
      res.drumGeo.dispose();
      res.drumMat.dispose();
      res.sheetGeo.dispose();
      res.sheetMat.dispose();
      res.pipe.dispose();
    },
    [res]
  );

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const s = store.get();
    const p = rig.p;
    g.visible = p > 0.56 && p < 0.76;
    if (!g.visible) return;
    const u = res.mat.uniforms;
    u.uTime.value = s.reducedMotion ? 4 : state.clock.elapsedTime;
    const scale = mobile ? 0.62 : 1;
    (u.uHand.value as Vector3).set((rig.hand.x - g.position.x) / scale, (rig.hand.y - g.position.y) / scale, 0);
    u.uHandK.value = rig.pointer && !s.reducedMotion ? 1 : 0;
    // six stages across the act's scroll range
    const k = range(p, 0.6, 0.72);
    const stage = Math.min(5, Math.floor(k * 6));
    u.uStage.value = 1 + k * 5.2;
    if (s.stage !== stage) store.set({ stage });
    u.uPx.value = state.size.height * 0.006 * (tier === "low" ? 1.6 : 1);
    res.mat.blending = s.theme === "light" ? NormalBlending : AdditiveBlending;
    u.uLight.value = s.theme === "light" ? 1 : 0;
    if (drum.current && !s.reducedMotion) drum.current.rotation.z -= dt * 0.8;
    res.sheetMat.emissiveIntensity = 0.15 + 0.6 * range(k, 0.75, 1);
    res.drumMat.emissive.set(stage >= 4 ? site.spotColor : "#000000");
    res.drumMat.emissiveIntensity = stage >= 4 ? 0.25 : 0;
  });

  const scale = mobile ? 0.62 : 1;
  return (
    <group ref={root} position={[ACTS[3].x, 0, 0]} scale={scale} visible={false}>
      <points geometry={res.geo} material={res.mat} frustumCulled={false} />
      {[-1.1, 0, 1.1].map((x) => (
        <mesh key={x} geometry={res.tube} material={res.glass} position={[x, 1.1, 0]} />
      ))}
      <mesh geometry={res.vessel} material={res.glass} position={[0, -0.5, 0]} />
      <mesh geometry={res.pipe} material={res.glass} position={[1.25, -1.05, 0]} rotation={[0, 0, Math.PI / 2]} />
      <mesh ref={drum} geometry={res.drumGeo} material={res.drumMat} position={[2.6, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={res.sheetGeo} material={res.sheetMat} position={[3.9, -1.06, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}
