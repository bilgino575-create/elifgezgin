"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { BufferGeometry, Color, Float32BufferAttribute, GLSL3, ShaderMaterial, Vector2 } from "three";
import { store } from "@/lib/store";
import { fluid } from "../fluid/Fluid";
import { useDispose } from "../utils/useDispose";

/**
 * The stage: a fullscreen triangle drawn first, depth off, that shows the
 * ink. Absorbance → colour: on Gece the ink is backlit pigment on black,
 * on Galeri it darkens white paper (subtractive). Without a simulation
 * (LOW tier) a slow noise field in the same inks stands in.
 */
const VERT = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.99999, 1.0);
}
`;
const FRAG = /* glsl */ `
precision highp float;
out vec4 fragColor;
in vec2 vUv;
uniform sampler2D uDye;
uniform float uHasDye;
uniform float uLight;
uniform vec3 uStage;
uniform vec3 uStage2;
uniform float uTime;
uniform vec2 uAspect;
uniform vec3 uSpot;

// value noise for the LOW-tier field
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }

void main() {
  // ambient: violet-blue at the top, black below (Gece); paper on Galeri
  float g = smoothstep(0.1, 1.0, vUv.y);
  vec3 stage = mix(uStage, uStage2, g * 0.9);
  vec3 A;
  if (uHasDye > 0.5) {
    A = max(texture(uDye, vUv).rgb, 0.0);
  } else {
    // LOW: two drifting inks (spot and magenta) as absorbance
    vec2 p = (vUv - 0.5) * uAspect;
    float n1 = fbm(p * 2.2 + vec2(uTime * 0.05, -uTime * 0.03));
    float n2 = fbm(p * 1.9 - vec2(uTime * 0.04, uTime * 0.025) + 5.0);
    float k1 = smoothstep(0.5, 0.9, n1);
    float k2 = smoothstep(0.52, 0.92, n2);
    vec3 a1 = vec3(1.0, 0.81, 0.0);   // ultramarine: absorbs red and most green
    vec3 a2 = vec3(0.0, 1.0, 0.37);   // magenta: absorbs green
    A = a1 * k1 * 0.4 + a2 * k2 * 0.3;
  }
  // saturating pigment: the mixed absorbance DIRECTION gives the hue (cyan + yellow = green),
  // its length only the coverage, so thin ink is still vivid and thick ink never turns to mud
  float amount = A.r + A.g + A.b;
  vec3 dir = A / max(amount, 1e-4);
  vec3 T = exp(-dir * 5.5);              // the hue, always saturated (linear light; the output is sRGB)
  float k = smoothstep(0.0, 0.14, amount); // the coverage: thin ink is dim, not pale
  float thick = smoothstep(0.7, 2.2, amount);
  vec3 col;
  if (uLight > 0.5) {
    col = stage * mix(vec3(1.0), T * (1.0 - 0.35 * thick), k);
  } else {
    col = mix(stage, T * (0.98 - 0.3 * thick), k);
  }
  fragColor = vec4(col, 1.0);
}
`;

const tri = new BufferGeometry();
tri.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
tri.setAttribute("uv", new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));

const STAGE = { dark: ["#0a0a12", "#12122a"], light: ["#fafaf7", "#f0f0ea"] } as const;

export default function Backdrop() {
  const material = useDispose(
    useMemo(
      () =>
        new ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          glslVersion: GLSL3,
          depthTest: false,
          depthWrite: false,
          uniforms: {
            uDye: { value: null },
            uHasDye: { value: 0 },
            uLight: { value: 0 },
            uStage: { value: new Color(STAGE.dark[0]) },
            uStage2: { value: new Color(STAGE.dark[1]) },
            uTime: { value: 0 },
            uAspect: { value: new Vector2(1, 1) },
            uSpot: { value: new Color("#2b3cff") },
          },
        }),
      []
    )
  );
  useFrame((state) => {
    const u = material.uniforms;
    const s = store.get();
    u.uDye.value = fluid.dye;
    u.uHasDye.value = fluid.dye ? 1 : 0;
    const light = s.theme === "light";
    u.uLight.value = light ? 1 : 0;
    (u.uStage.value as Color).set(light ? STAGE.light[0] : STAGE.dark[0]);
    (u.uStage2.value as Color).set(light ? STAGE.light[1] : STAGE.dark[1]);
    u.uTime.value = s.reducedMotion ? 0 : state.clock.elapsedTime;
    (u.uAspect.value as Vector2).set(state.size.width / state.size.height, 1);
  });
  return <mesh geometry={tri} material={material} frustumCulled={false} renderOrder={-100} />;
}
