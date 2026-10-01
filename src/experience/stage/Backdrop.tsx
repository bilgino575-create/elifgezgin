"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { BufferGeometry, Color, Float32BufferAttribute, GLSL3, Matrix4, ShaderMaterial, Vector2, Vector3, Vector4 } from "three";
import { store } from "@/lib/store";
import { site } from "@/lib/content";
import { fluid } from "../fluid/Fluid";
import { nameMask } from "../acts/name/mask";
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
uniform sampler2D uMask;
uniform vec4 uMaskRect;
uniform float uMaskK;
uniform mat4 uInvPV;
uniform vec3 uCam;

// the name's mask on the z = 0 plane, seen through this pixel: R letterforms, G halo
vec2 nameMaskAt(vec2 uv) {
  vec4 f = uInvPV * vec4(uv * 2.0 - 1.0, 1.0, 1.0);
  vec3 far = f.xyz / f.w;
  vec3 d = far - uCam;
  float t = -uCam.z / (abs(d.z) < 1e-6 ? 1e-6 : d.z);
  if (t < 0.0) return vec2(0.0);
  vec2 w = uCam.xy + d.xy * t;
  vec2 m = (w - uMaskRect.xy) / uMaskRect.zw;
  if (m.x < 0.0 || m.x > 1.0 || m.y < 0.0 || m.y > 1.0) return vec2(0.0);
  return texture(uMask, m).rg;
}

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
  // the name written in ink: dense inside the letters, a thin wash around them, a lit edge between
  vec2 nm = uMaskK > 0.001 ? nameMaskAt(vUv) * uMaskK : vec2(0.0);
  amount *= mix(1.0 - 0.45 * uMaskK, 3.2, nm.r);
  vec3 dir = A / max(amount, 1e-4);
  vec3 T = exp(-dir * 5.5);              // the hue, always saturated (linear light; the output is sRGB)
  float k = smoothstep(0.0, 0.14, amount); // the coverage: thin ink is dim, not pale
  float thick = smoothstep(0.7, 2.2, amount);
  vec3 col;
  float halo = max(nm.g - nm.r, 0.0);
  if (uLight > 0.5) {
    col = stage * mix(vec3(1.0), T * (1.0 - 0.35 * thick), k);
    // on paper the letters hold a faint tint of the spot and a darker edge
    col = mix(col, col * mix(vec3(1.0), uSpot, 0.18), nm.r * (1.0 - k));
    col *= 1.0 - halo * 0.22;
  } else {
    col = mix(stage, T * (0.98 - 0.3 * thick), k);
    // on the dark stage an unlit letter is a dim plate of the spot, and the halo is light leaking past the glass
    col = mix(col, mix(uSpot * 0.35, vec3(0.9, 0.92, 1.0), 0.25), nm.r * (1.0 - k) * 0.55);
    col += halo * mix(uSpot, vec3(1.0), 0.45) * 0.5;
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
            uMask: { value: null },
            uMaskRect: { value: new Vector4(0, 0, 1, 1) },
            uMaskK: { value: 0 },
            uInvPV: { value: new Matrix4() },
            uCam: { value: new Vector3() },
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
    (u.uSpot.value as Color).set(site.spotColor);
    u.uMask.value = nameMask.texture;
    u.uMaskK.value = nameMask.texture ? nameMask.k : 0;
    (u.uMaskRect.value as Vector4).copy(nameMask.rect);
    const cam = state.camera;
    (u.uInvPV.value as Matrix4).multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).invert();
    (u.uCam.value as Vector3).copy(cam.position);
  });
  return <mesh geometry={tri} material={material} frustumCulled={false} renderOrder={-100} />;
}
