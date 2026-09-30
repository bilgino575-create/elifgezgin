"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, GLSL3, NormalBlending, Points, ShaderMaterial, Vector3 } from "three";
import { ACTS } from "@/lib/acts";
import { portrait, site } from "@/lib/content";
import { store } from "@/lib/store";
import { INKS } from "@/lib/inks";
import { rig } from "../../rig/CameraRig";
import { Sim } from "../../gpgpu/Sim";

/**
 * Act V. The portrait (or the monogram) rebuilt from a grid of instanced
 * halftone dots in the five inks and paper white. Their positions live in a
 * ping-pong simulation: springs to the rest grid, the hand scatters them
 * like sand, they return. LOW tier draws the rest grid without a sim.
 */
const N = { ultra: 224, high: 224, mid: 176, low: 110 };
const SIZE_W = 2.6;

const STEP = /* glsl */ `
precision highp float;
in vec2 vUv;
uniform sampler2D uState;
uniform sampler2D uRest;
uniform float uDt;
uniform vec3 uHand;
uniform float uHandK;
uniform float uTime;
out vec4 fragColor;
void main() {
  vec4 s = texture(uState, vUv);
  vec4 r = texture(uRest, vUv);
  vec2 pos = s.xy;
  vec2 vel = s.zw;
  vec2 toRest = r.xy - pos;
  vec2 force = toRest * 18.0 - vel * 2.6;
  vec2 d = pos - uHand.xy;
  float dist = length(d);
  float push = smoothstep(0.75, 0.0, dist) * uHandK;
  force += normalize(d + 1e-4) * push * 60.0;
  // a whisper of turbulence while scattered
  float scattered = clamp(length(toRest) * 3.0, 0.0, 1.0);
  force += vec2(sin(uTime * 3.0 + r.x * 40.0), cos(uTime * 2.3 + r.y * 40.0)) * scattered * 2.0;
  vel += force * uDt;
  pos += vel * uDt;
  fragColor = vec4(pos, vel);
}
`;
const VERT = /* glsl */ `
in float aIndex;
in vec3 aColor;
in float aSize;
uniform sampler2D uState;
uniform vec2 uGrid;
uniform float uPx;
uniform float uScale;
out vec3 vColor;
out float vAlpha;
void main() {
  vec2 uv = (vec2(mod(aIndex, uGrid.x), floor(aIndex / uGrid.x)) + 0.5) / uGrid;
  vec4 s = texture(uState, uv);
  vec4 mv = modelViewMatrix * vec4(s.xy * uScale, 0.0, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPx * uScale / max(0.1, -mv.z);
  vColor = aColor;
  vAlpha = aSize > 0.01 ? 1.0 : 0.0;
}
`;
const FRAG = /* glsl */ `
precision highp float;
in vec3 vColor;
in float vAlpha;
out vec4 fragColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = (1.0 - smoothstep(0.38, 0.5, d)) * vAlpha;
  if (a <= 0.01) discard;
  fragColor = vec4(vColor, a);
}
`;

async function sourceImage(): Promise<HTMLCanvasElement> {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  if (portrait) {
    const img = new Image();
    img.src = portrait.src;
    await img.decode().catch(() => null);
    const s = Math.max(256 / img.width, 256 / img.height);
    const w = img.width * s;
    const h = img.height * s;
    ctx.drawImage(img, (256 - w) / 2, (256 - h) / 2, w, h);
    return c;
  }
  // the monogram: E in the spot colour, G in paper white, on black
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 256, 256);
  ctx.lineWidth = 26;
  ctx.lineCap = "square";
  ctx.strokeStyle = site.spotColor;
  ctx.beginPath();
  ctx.moveTo(44, 54);
  ctx.lineTo(118, 54);
  ctx.moveTo(44, 54);
  ctx.lineTo(44, 204);
  ctx.lineTo(118, 204);
  ctx.moveTo(44, 129);
  ctx.lineTo(100, 129);
  ctx.stroke();
  ctx.strokeStyle = "#f6f6fa";
  ctx.beginPath();
  ctx.arc(176, 129, 56, 0.2 * Math.PI, 1.8 * Math.PI);
  ctx.moveTo(232, 129);
  ctx.lineTo(232, 180);
  ctx.moveTo(190, 129);
  ctx.lineTo(232, 129);
  ctx.stroke();
  return c;
}

export default function Portrait() {
  const gl = useThree((s) => s.gl);
  const ref = useRef<Points>(null);
  const tier = store.get().tier;
  const n = N[tier] ?? 176;
  const mobile = store.get().touch || window.innerWidth < 768;
  const [src, setSrc] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => {
    let live = true;
    sourceImage().then((c) => live && setSrc(c));
    return () => {
      live = false;
    };
  }, []);

  const res = useMemo(() => {
    if (!src) return null;
    const ctx = src.getContext("2d")!;
    const data = ctx.getImageData(0, 0, 256, 256).data;
    const count = n * n;
    const rest = new Float32Array(count * 4);
    const color = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const index = new Float32Array(count);
    const inks = [...INKS, "#f6f6fa"].map((h) => new Color(h));
    const c = new Color();
    const aspect = 1;
    const W = SIZE_W;
    const H = W / aspect;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const k = j * n + i;
        const px = Math.min(255, Math.floor((i / n) * 256));
        const py = Math.min(255, Math.floor((j / n) * 256));
        const o = (py * 256 + px) * 4;
        const r = data[o] / 255;
        const g = data[o + 1] / 255;
        const b = data[o + 2] / 255;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        c.setRGB(r, g, b);
        // nearest ink (in sRGB), white for the brightest neutrals
        let best = 0;
        let bd = Infinity;
        inks.forEach((ink, ii) => {
          const d = (ink.r - r) ** 2 + (ink.g - g) ** 2 + (ink.b - b) ** 2;
          if (d < bd) {
            bd = d;
            best = ii;
          }
        });
        const ink = inks[best];
        color[k * 3] = ink.r;
        color[k * 3 + 1] = ink.g;
        color[k * 3 + 2] = ink.b;
        size[k] = lum < 0.06 ? 0 : 0.35 + 0.75 * Math.sqrt(lum);
        index[k] = k;
        rest[k * 4] = (i / n - 0.5) * W;
        rest[k * 4 + 1] = (0.5 - j / n) * H;
        rest[k * 4 + 2] = 0;
        rest[k * 4 + 3] = 0;
      }
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aIndex", new Float32BufferAttribute(index, 1));
    geo.setAttribute("aColor", new Float32BufferAttribute(color, 3));
    geo.setAttribute("aSize", new Float32BufferAttribute(size, 1));
    const sim = tier === "low" ? null : new Sim(n, n, rest, STEP, { uHand: { value: new Vector3() }, uHandK: { value: 0 }, uTime: { value: 0 } });
    const restTex = sim ? sim.rest : new Sim(n, n, rest, STEP, {}).rest;
    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      glslVersion: GLSL3,
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      uniforms: { uState: { value: restTex }, uGrid: { value: [n, n] }, uPx: { value: (W / n) * 900 }, uScale: { value: mobile ? 0.8 : 1 } },
    });
    return { geo, mat, sim, restTex };
  }, [src, n, tier, mobile]);

  useEffect(
    () => () => {
      res?.geo.dispose();
      res?.mat.dispose();
      res?.sim?.dispose();
    },
    [res]
  );

  useFrame((state, dt) => {
    const pts = ref.current;
    if (!pts || !res) return;
    const s = store.get();
    const p = rig.p;
    pts.visible = p > 0.7 && p < 0.87;
    if (!pts.visible) return;
    const local = pts.position;
    // hand in the portrait's local plane
    if (res.sim && !s.reducedMotion) {
      const u = res.sim.material.uniforms;
      (u.uHand.value as Vector3).set((rig.hand.x - local.x) / (mobile ? 0.8 : 1), (rig.hand.y - local.y) / (mobile ? 0.8 : 1), 0);
      u.uHandK.value = rig.pointer ? 1 : 0;
      u.uTime.value = state.clock.elapsedTime;
      res.sim.step(state.gl, dt);
      res.mat.uniforms.uState.value = res.sim.texture;
    }
    res.mat.uniforms.uPx.value = (SIZE_W / n) * state.size.height * 1.15 * (s.theme === "light" ? 0.9 : 1);
    res.mat.blending = s.theme === "light" ? NormalBlending : AdditiveBlending;
  });

  void gl;
  if (!res) return null;
  return <points ref={ref} geometry={res.geo} material={res.mat} position={[ACTS[4].x, 0.15, 0]} frustumCulled={false} visible={false} />;
}
