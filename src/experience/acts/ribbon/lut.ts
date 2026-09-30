import { Curve, DataTexture, FloatType, NearestFilter, RGBAFormat, Vector3 } from "three";

/**
 * Arc-length frames of a closed curve packed into one float texture with
 * four rows (position, tangent, normal, binormal) and kept on the CPU too,
 * so a vertex shader can bend geometry along the curve and the CPU can
 * place hit targets on it.
 */
export interface CurveLUT {
  texture: DataTexture;
  n: number;
  length: number;
  pos: Float32Array;
  nor: Float32Array;
  bin: Float32Array;
  at(t: number, out: Vector3): Vector3;
}

export function curveLUT(curve: Curve<Vector3>, n = 512): CurveLUT {
  const frames = curve.computeFrenetFrames(n, true);
  const data = new Float32Array(n * 4 * 4);
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const bin = new Float32Array(n * 3);
  const p = new Vector3();
  for (let i = 0; i < n; i++) {
    curve.getPointAt(i / n, p);
    const t = frames.tangents[i];
    const nn = frames.normals[i];
    const b = frames.binormals[i];
    const rows = [p, t, nn, b];
    rows.forEach((v, r) => {
      const o = (r * n + i) * 4;
      data[o] = v.x;
      data[o + 1] = v.y;
      data[o + 2] = v.z;
      data[o + 3] = 1;
    });
    pos.set([p.x, p.y, p.z], i * 3);
    nor.set([nn.x, nn.y, nn.z], i * 3);
    bin.set([b.x, b.y, b.z], i * 3);
  }
  const texture = new DataTexture(data, n, 4, RGBAFormat, FloatType);
  texture.minFilter = texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return {
    texture,
    n,
    length: curve.getLength(),
    pos,
    nor,
    bin,
    at(t: number, out: Vector3) {
      const f = ((t % 1) + 1) % 1;
      const i = Math.floor(f * n) % n;
      return out.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    },
  };
}

/** GLSL shared by everything bent along the curve. */
export const BEND_PARS = /* glsl */ `
uniform sampler2D uLut;
uniform float uLutN;
uniform float uOffset;   // arc fraction where the geometry's x = 0 sits
uniform float uInvLen;   // 1 / curve length
uniform float uLift;     // extra outward offset (hover)
uniform float uRadius;   // base outward offset
vec3 lutRow(float t, float row) {
  float f = fract(t) * uLutN;
  float i0 = floor(f);
  float w = f - i0;
  float u0 = (mod(i0, uLutN) + 0.5) / uLutN;
  float u1 = (mod(i0 + 1.0, uLutN) + 0.5) / uLutN;
  float v = (row + 0.5) / 4.0;
  return mix(texture2D(uLut, vec2(u0, v)).xyz, texture2D(uLut, vec2(u1, v)).xyz, w);
}
`;
export const BEND_VERTEX = /* glsl */ `
  float bt = uOffset + position.x * uInvLen;
  vec3 bP = lutRow(bt, 0.0);
  vec3 bT = normalize(lutRow(bt, 1.0));
  vec3 bN = normalize(lutRow(bt, 2.0));
  vec3 bB = normalize(lutRow(bt, 3.0));
  vec3 transformed = bP + bN * (position.y + uRadius + uLift) + bB * position.z;
`;
export const BEND_NORMAL = /* glsl */ `
  float nt = uOffset + position.x * uInvLen;
  vec3 nT = normalize(lutRow(nt, 1.0));
  vec3 nN = normalize(lutRow(nt, 2.0));
  vec3 nB = normalize(lutRow(nt, 3.0));
  vec3 objectNormal = normalize(nT * normal.x + nN * normal.y + nB * normal.z);
`;
