import { Color, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, type WebGLProgramParametersWithUniforms } from "three";

/**
 * The stage's material family. Chrome, holographic glass, liquid and matte
 * neon — four looks, reused at every stop, lit by each stop's own studio.
 */
export function chrome(opts: { color?: string; roughness?: number; env?: number } = {}) {
  return new MeshStandardMaterial({ color: opts.color ?? "#ffffff", metalness: 1, roughness: opts.roughness ?? 0.06, envMapIntensity: opts.env ?? 1.5 });
}

/** translucent, thin-film iridescence, a clear coat: glass without the cost of transmission */
export function holo(opts: { color?: string; opacity?: number; ior?: number } = {}) {
  return new MeshPhysicalMaterial({
    color: opts.color ?? "#9aa6ff",
    transparent: true,
    opacity: opts.opacity ?? 0.78,
    roughness: 0.12,
    metalness: 0.05,
    iridescence: 1,
    iridescenceIOR: opts.ior ?? 1.45,
    iridescenceThicknessRange: [140, 640],
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.6,
    side: DoubleSide,
    depthWrite: false,
  });
}

export function neon(color: string, intensity = 1.6) {
  const m = new MeshStandardMaterial({ color, emissive: new Color(color), emissiveIntensity: intensity, roughness: 0.6, metalness: 0 });
  return m;
}

const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export interface LiquidUniforms {
  uTime: { value: number };
  uAmp: { value: number };
  uFreq: { value: number };
  uSpeed: { value: number };
}

/**
 * Liquid: a physical material whose vertices are displaced along their
 * normals by simplex noise in the vertex shader, with the normal
 * re-derived so the light rolls over the swell. Iridescent, clear-coated.
 */
export function liquid(opts: { color?: string; amp?: number; freq?: number; speed?: number; opacity?: number } = {}) {
  const m = new MeshPhysicalMaterial({
    color: opts.color ?? "#1f3bff",
    roughness: 0.18,
    metalness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 0.9,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 500],
    envMapIntensity: 1.3,
    transparent: (opts.opacity ?? 1) < 1,
    opacity: opts.opacity ?? 1,
  });
  const uniforms: LiquidUniforms = { uTime: { value: 0 }, uAmp: { value: opts.amp ?? 0.22 }, uFreq: { value: opts.freq ?? 1.4 }, uSpeed: { value: opts.speed ?? 0.5 } };
  m.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nuniform float uTime; uniform float uAmp; uniform float uFreq; uniform float uSpeed;\n${NOISE}\nfloat swell(vec3 p) { return snoise(p * uFreq + vec3(0.0, uTime * uSpeed, uTime * uSpeed * 0.7)); }`)
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
        // re-derive the normal from the displaced neighbourhood
        float e = 0.02;
        vec3 p0 = position;
        vec3 tang = normalize(cross(objectNormal, vec3(0.0, 1.0, 0.001)));
        vec3 bitan = normalize(cross(objectNormal, tang));
        float h0 = swell(p0);
        float hT = swell(p0 + tang * e);
        float hB = swell(p0 + bitan * e);
        vec3 dT = tang * e + objectNormal * (hT - h0) * uAmp;
        vec3 dB = bitan * e + objectNormal * (hB - h0) * uAmp;
        objectNormal = normalize(cross(dT, dB));
        if (dot(objectNormal, normal) < 0.0) objectNormal = -objectNormal;`
      )
      .replace("#include <begin_vertex>", `#include <begin_vertex>\ntransformed += normal * swell(position) * uAmp;`);
  };
  (m as MeshPhysicalMaterial & { liquid: LiquidUniforms }).liquid = uniforms;
  return m as MeshPhysicalMaterial & { liquid: LiquidUniforms };
}
