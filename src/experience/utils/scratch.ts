/**
 * Module-level scratch objects so that `useFrame` callbacks never allocate.
 * Every consumer must finish with a scratch object inside the same call.
 */
import { Vector3, Quaternion, Matrix4, Object3D, Color, Euler, Vector2 } from "three";

export const v3a = new Vector3();
export const v3b = new Vector3();
export const v3c = new Vector3();
export const v3d = new Vector3();
export const v2a = new Vector2();
export const qa = new Quaternion();
export const qb = new Quaternion();
export const m4a = new Matrix4();
export const m4b = new Matrix4();
export const dummy = new Object3D();
export const colA = new Color();
export const colB = new Color();
export const eulerA = new Euler();

export const UP = Object.freeze(new Vector3(0, 1, 0)) as Vector3;

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp(x: number, a: number, b: number) {
  return x < a ? a : x > b ? b : x;
}

export function smoothstep(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Deterministic hash → [0,1). */
export function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Seeded PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
