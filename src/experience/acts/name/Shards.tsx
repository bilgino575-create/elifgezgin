"use client";

import { useEffect, useMemo } from "react";
import { BoxGeometry, Color, GLSL3, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, ShaderMaterial, Vector3 } from "three";
import type { Glyphs } from "./glyphs";
import { rng } from "../../utils/scratch";
import { INKS } from "@/lib/inks";

/**
 * The anamorphic name: every ink sample of the glyphs becomes a shard pushed
 * along its own ray from the viewpoint to a random depth. Everything lives
 * in the vertex shader (position, convergence, the hand's push), so a frame
 * costs a handful of uniform writes. One draw call for all shards.
 */
const VERT = /* glsl */ `
in vec3 aBase;     // unit-space x, y and the line index
in float aDepth;
in vec3 aColor;
in float aKind;
in float aSeed;
in float aRot;
uniform vec3 uView;
uniform vec3 uLine0;   // world offset x, y and scale of line 0
uniform vec3 uLine1;
uniform float uCell;   // shard cell size in unit space
uniform float uConverge;
uniform float uTime;
uniform vec3 uHand;
uniform float uHandK;
out vec3 vN;
out vec3 vV;
out vec3 vColor;
out float vKind;
out float vSeed;
out float vFade;

float ease(float t) { return t * t * (3.0 - 2.0 * t); }

void main() {
  vec3 line = aBase.z < 0.5 ? uLine0 : uLine1;
  vec3 base = vec3(line.xy + aBase.xy * line.z, 0.0);
  vec3 dir = base - uView;
  float c = ease(clamp(uConverge, 0.0, 1.0));
  float depth = mix(aDepth, 1.0, c);
  vec3 P = uView + dir * depth;
  // idle drift, dying out as the shards settle
  float w = (1.0 - c) * 0.01;
  P += vec3(sin(uTime * 0.7 + aSeed * 12.0), cos(uTime * 0.55 + aSeed * 7.0), sin(uTime * 0.4 + aSeed * 3.0)) * w * aDepth;
  // the hand pushes what it passes
  vec2 toHand = P.xy - uHand.xy;
  float d2 = dot(toHand, toHand);
  float push = exp(-d2 / 1.1) * uHandK;
  P.xy += normalize(toHand + 1e-4) * push * 0.55;
  P.z += push * 0.35 * (aSeed - 0.5);
  float size = uCell * line.z * 1.32 * depth;
  // basis facing the viewpoint, rotated in-plane
  vec3 n = normalize(uView - P);
  vec3 t = normalize(cross(vec3(0.0, 1.0, 0.0), n));
  vec3 b = cross(n, t);
  float a = aRot + push * 2.0 + (1.0 - c) * sin(uTime * 0.3 + aSeed * 20.0) * 0.15;
  float ca = cos(a), sa = sin(a);
  vec3 t2 = ca * t + sa * b;
  vec3 b2 = -sa * t + ca * b;
  // a small tilt so edges catch light; settles flat as they converge
  float tilt = (1.0 - c) * 0.24 * (aSeed - 0.5);
  vec3 n2 = normalize(n + t2 * tilt);
  vec3 local = position * vec3(size, size * (0.7 + 0.6 * fract(aSeed * 7.3)), size * 0.12);
  vec3 world = P + t2 * local.x + b2 * local.y + n2 * local.z;
  vec3 nrm = normalize(t2 * normal.x + b2 * normal.y + n2 * normal.z);
  vN = nrm;
  vV = normalize(cameraPosition - world);
  vColor = aColor;
  vKind = aKind;
  vSeed = aSeed;
  vFade = c;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;
const FRAG = /* glsl */ `
precision highp float;
out vec4 fragColor;
in vec3 vN;
in vec3 vV;
in vec3 vColor;
in float vKind;
in float vSeed;
in float vFade;
uniform float uFade;
uniform vec3 uSpot;
uniform float uLight;

vec3 pal(float t) {
  return 0.55 + 0.45 * cos(6.28318 * (vec3(1.0, 1.0, 1.0) * t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  vec3 L = normalize(vec3(-0.45, 0.8, 0.55));
  vec3 L2 = normalize(vec3(0.6, -0.5, 0.4));
  float ndl = max(dot(N, L), 0.0);
  float ndl2 = max(dot(N, L2), 0.0);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 48.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 col;
  float alpha = 1.0;
  if (vKind < 0.5) {
    // pearlescent paint
    col = vColor * (0.32 + 0.68 * ndl) + uSpot * ndl2 * 0.1 + spec * 0.35 + fres * 0.08;
  } else if (vKind < 1.5) {
    // holographic foil: the hue lives in the view angle
    vec3 iri = pal(dot(N, V) * 1.6 + vSeed * 4.0);
    col = mix(vColor, iri, 0.7) * (0.5 + 0.5 * ndl) + spec * 1.1 + fres * 0.3;
  } else {
    // glass chip: tinted, mostly rim
    col = vColor * 0.55 * (0.5 + 0.5 * ndl) + vec3(1.0) * (fres * 0.9 + spec * 1.2);
    alpha = 0.62 + fres * 0.38;
  }
  if (uLight > 0.5) col = mix(col, col * 0.9, 0.2);
  alpha *= 1.0 - uFade;
  fragColor = vec4(col, alpha);
}
`;

export interface ShardsProps {
  lines: Glyphs[];
  cell: number;
  material?: ShaderMaterial;
}

export function makeShardMaterial() {
  return new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    glslVersion: GLSL3,
    transparent: true,
    alphaToCoverage: true,
    uniforms: {
      uView: { value: new Vector3(0, 0, 9) },
      uLine0: { value: new Vector3(0, 0, 1) },
      uLine1: { value: new Vector3(0, 0, 1) },
      uCell: { value: 0.06 },
      uConverge: { value: 0 },
      uTime: { value: 0 },
      uHand: { value: new Vector3(0, 0, 0) },
      uHandK: { value: 0 },
      uFade: { value: 0 },
      uSpot: { value: new Color("#2b3cff") },
      uLight: { value: 0 },
    },
  });
}

const PALETTE = [INKS[0], INKS[1], INKS[2], INKS[3], INKS[0], INKS[3], "#f6f6fa", "#f6f6fa", "#14142a"];

export function buildShardGeometry(lines: Glyphs[]) {
  const box = new BoxGeometry(1, 1, 1);
  const geo = new InstancedBufferGeometry();
  geo.index = box.index;
  geo.setAttribute("position", box.getAttribute("position"));
  geo.setAttribute("normal", box.getAttribute("normal"));
  geo.setAttribute("uv", box.getAttribute("uv"));
  let n = 0;
  for (const l of lines) n += l.samples.length / 2;
  const base = new Float32Array(n * 3);
  const depth = new Float32Array(n);
  const color = new Float32Array(n * 3);
  const kind = new Float32Array(n);
  const seed = new Float32Array(n);
  const rot = new Float32Array(n);
  const r = rng(1234);
  const c = new Color();
  let i = 0;
  lines.forEach((l, li) => {
    for (let k = 0; k < l.samples.length; k += 2) {
      base[i * 3] = l.samples[k];
      base[i * 3 + 1] = l.samples[k + 1];
      base[i * 3 + 2] = li;
      // depths cluster near the letters with a long tail into the room, so the chaos reads as a cloud, not a wall
      const u = r();
      depth[i] = 0.32 + Math.pow(u, 1.6) * 1.5;
      c.set(PALETTE[Math.floor(r() * PALETTE.length)]);
      color[i * 3] = c.r;
      color[i * 3 + 1] = c.g;
      color[i * 3 + 2] = c.b;
      const kk = r();
      kind[i] = kk < 0.45 ? 0 : kk < 0.75 ? 1 : 2;
      seed[i] = r();
      // nearly aligned tiles read as letters from the viewpoint; the chaos comes from depth, not rotation
      rot[i] = (r() - 0.5) * 0.5;
      i++;
    }
  });
  geo.setAttribute("aBase", new InstancedBufferAttribute(base, 3));
  geo.setAttribute("aDepth", new InstancedBufferAttribute(depth, 1));
  geo.setAttribute("aColor", new InstancedBufferAttribute(color, 3));
  geo.setAttribute("aKind", new InstancedBufferAttribute(kind, 1));
  geo.setAttribute("aSeed", new InstancedBufferAttribute(seed, 1));
  geo.setAttribute("aRot", new InstancedBufferAttribute(rot, 1));
  geo.instanceCount = n;
  box.dispose();
  return geo;
}

export default function Shards({ lines, cell, material }: ShardsProps) {
  const geometry = useMemo(() => buildShardGeometry(lines), [lines]);
  const mat = useMemo(() => material ?? makeShardMaterial(), [material]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    mat.uniforms.uCell.value = cell;
  }, [mat, cell]);
  const mesh = useMemo(() => {
    const m = new Mesh(geometry, mat);
    m.frustumCulled = false;
    return m;
  }, [geometry, mat]);
  return <primitive object={mesh} />;
}
