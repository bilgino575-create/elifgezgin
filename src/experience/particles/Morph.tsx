"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, DataTexture, Float32BufferAttribute, GLSL3, LinearFilter, Mesh, MeshBasicMaterial, NormalBlending, PerspectiveCamera, PlaneGeometry, Points, RGBAFormat, ShaderMaterial, SRGBColorSpace, Texture, TextureLoader, UnsignedByteType, Vector3, Vector4 } from "three";
import { store, type Tier } from "@/lib/store";
import { atmo, atmosphere } from "@/content/atmosphere.generated";
import { rig, targetOf } from "../rig/CameraRig";
import { nameMask } from "../acts/name/mask";
import { Sim2 } from "../gpgpu/Sim2";
import { fluid } from "../fluid/Fluid";
import { rng } from "../utils/scratch";
import { MORPH_KEYS, type MorphKey } from "./schedule";

/**
 * ONE persistent GPGPU particle system for the whole site. Every particle
 * owns a uv; the two current target images (256² colour textures made at
 * build time) give it a colour and a place (relief from luminance) in two
 * formations A and B; the fragment step springs it toward mix(A, B) with a
 * per-particle stagger, explodes it into a curl cloud in the middle of a
 * transition, pushes it away from the hand (velocity-sensitive) and lets a
 * click blow it apart. Everything is a function of the scroll clock, so
 * scrolling back re-forms the previous image. Targets load lazily one key
 * ahead. Reduced motion: the images themselves, crossfading.
 */
const GRID: Record<Tier, number> = { ultra: 346, high: 346, mid: 245, low: 158 };

const STEP = /* glsl */ `
precision highp float;
in vec2 vUv;
uniform sampler2D uPos;
uniform sampler2D uVel;
uniform sampler2D uRest;
uniform float uDt;
uniform float uSeeded;
uniform float uTime;
uniform sampler2D uTA;
uniform sampler2D uTB;
uniform vec3 uCenA;
uniform vec3 uCenB;
uniform vec2 uSizeA;
uniform vec2 uSizeB;
uniform float uBlend;
uniform float uCloud;
uniform float uRelief;
uniform vec3 uHand;
uniform float uHandK;
uniform float uHandSpeed;
uniform float uExplodeAt;
layout(location = 0) out vec4 oPos;
layout(location = 1) out vec4 oVel;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec3(1, 0, 0)), c = hash(i + vec3(0, 1, 0)), d = hash(i + vec3(1, 1, 0));
  float e = hash(i + vec3(0, 0, 1)), g = hash(i + vec3(1, 0, 1)), h = hash(i + vec3(0, 1, 1)), k = hash(i + vec3(1, 1, 1));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}
vec3 curl(vec3 p) {
  const float e = 0.1;
  float n1 = noise(p + vec3(0, e, 0)) - noise(p - vec3(0, e, 0));
  float n2 = noise(p + vec3(0, 0, e)) - noise(p - vec3(0, 0, e));
  float n3 = noise(p + vec3(e, 0, 0)) - noise(p - vec3(e, 0, 0));
  float n4 = noise(p + vec3(0, 0, e) + 31.0) - noise(p - vec3(0, 0, e) + 31.0);
  float n5 = noise(p + vec3(e, 0, 0) + 57.0) - noise(p - vec3(e, 0, 0) + 57.0);
  float n6 = noise(p + vec3(0, e, 0) + 57.0) - noise(p - vec3(0, e, 0) + 57.0);
  return vec3(n1 - n4, n2 - n5, n3 - n6) / (2.0 * e);
}
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main() {
  vec4 P = texture(uPos, vUv);
  vec4 R = texture(uRest, vUv);
  vec3 vel = uSeeded > 0.5 ? texture(uVel, vUv).xyz : vec3(0.0);
  vec2 uv = R.xy;
  float seed = R.w;
  vec3 pos = uSeeded > 0.5 ? P.xyz : uCenA + vec3((uv.x - 0.5) * uSizeA.x, (0.5 - uv.y) * uSizeA.y, 0.0) + (curl(vec3(uv * 6.0, seed)) * 3.0);
  float lA = lum(texture(uTA, uv).rgb);
  float lB = lum(texture(uTB, uv).rgb);
  vec3 goalA = uCenA + vec3((uv.x - 0.5) * uSizeA.x, (0.5 - uv.y) * uSizeA.y, (lA - 0.5) * uRelief);
  vec3 goalB = uCenB + vec3((uv.x - 0.5) * uSizeB.x, (0.5 - uv.y) * uSizeB.y, (lB - 0.5) * uRelief);
  // staggered, organic timing: every particle crosses over in its own window
  float bl = smoothstep(seed * 0.55, seed * 0.55 + 0.45, uBlend);
  vec3 goal = mix(goalA, goalB, bl);
  // the cloud: a swirling ink volume around the path between the two formations
  vec3 swirl = curl(goal * 0.35 + vec3(0.0, 0.0, uTime * 0.12) + seed * 2.0) * (2.2 + 1.8 * seed) + vec3(0.0, 0.6 * seed, -1.4 * seed);
  goal += swirl * uCloud;
  float stiff = mix(18.0, 5.0, uCloud);
  float damp = mix(5.2, 1.6, uCloud);
  vec3 force = (goal - pos) * stiff - vel * damp;
  force += curl(pos * 1.1 + uTime * 0.25) * (5.0 * uCloud + 0.15);
  // the hand
  vec3 d = pos - uHand;
  float dist = length(d.xy);
  float r = 0.9 + 0.5 * uHandSpeed;
  float push = smoothstep(r, 0.0, dist) * uHandK;
  force += normalize(vec3(d.xy, 0.4 + seed * 0.6)) * push * (50.0 + 80.0 * uHandSpeed);
  force += curl(pos * 3.0 + uTime * 0.8) * push * 16.0;
  // a click blows the formation apart for an instant
  float since = uTime - uExplodeAt;
  if (uExplodeAt > 0.0 && since >= 0.0 && since < 0.06) {
    vec3 c = pos - mix(uCenA, uCenB, uBlend);
    vel += normalize(c + curl(pos * 2.0 + seed) * 0.8 + vec3(0.0, 0.0, 0.01)) * (10.0 + 22.0 * fract(seed * 7.3));
  }
  vel += force * uDt;
  pos += vel * uDt;
  oPos = vec4(pos, 1.0);
  oVel = vec4(vel, 0.0);
}
`;
const VERT = /* glsl */ `
in float aIndex;
uniform sampler2D uPos;
uniform sampler2D uRest;
uniform sampler2D uTA;
uniform sampler2D uTB;
uniform float uBlend;
uniform float uCloud;
uniform float uDimA;
uniform float uDimB;
uniform vec2 uGrid;
uniform float uPx;
uniform float uHeight;
uniform sampler2D uMask;
uniform vec4 uMaskRect;
uniform float uMaskK;
out vec3 vColor;
out float vAlpha;
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 boost(vec3 c) {
  float l = lum(c);
  return clamp(mix(vec3(l), c, 1.3) * 1.06 + 0.02, 0.0, 1.0);
}
void main() {
  vec2 guv = (vec2(mod(aIndex, uGrid.x), floor(aIndex / uGrid.x)) + 0.5) / uGrid;
  vec4 R = texture(uRest, guv);
  vec2 uv = R.xy;
  float seed = R.w;
  vec3 p = texture(uPos, guv).xyz;
  vec3 cA = boost(texture(uTA, uv).rgb);
  vec3 cB = boost(texture(uTB, uv).rgb);
  float bl = smoothstep(seed * 0.55, seed * 0.55 + 0.45, uBlend);
  vec3 c = mix(cA, cB, bl);
  float l = lum(c);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = (0.5 + 0.8 * sqrt(l)) * (1.0 + uCloud * 0.7);
  gl_PointSize = size * uPx * uHeight / max(0.1, -mv.z);
  vColor = c;
  float dim = mix(uDimA, uDimB, bl);
  vAlpha = dim * (0.78 + 0.22 * l) * (1.0 - uCloud * 0.3);
  if (l < 0.03) vAlpha = 0.0;
  // inside the name: the formation is clipped to the letterforms until the hand or the scroll frees it
  if (uMaskK > 0.001) {
    vec2 m = (p.xy - uMaskRect.xy) / uMaskRect.zw;
    float inside = (m.x < 0.0 || m.x > 1.0 || m.y < 0.0 || m.y > 1.0) ? 0.0 : texture(uMask, m).r;
    vAlpha *= mix(1.0, inside, uMaskK * (1.0 - uCloud));
  }
}
`;
const FRAG = /* glsl */ `
precision highp float;
in vec3 vColor;
in float vAlpha;
out vec4 fragColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = (1.0 - smoothstep(0.34, 0.5, length(c))) * vAlpha;
  if (a <= 0.01) discard;
  fragColor = vec4(vColor, a);
}
`;

const black = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, RGBAFormat, UnsignedByteType);
black.needsUpdate = true;

class Targets {
  private cache = new Map<string, Texture>();
  private loading = new Set<string>();
  private loader = new TextureLoader();
  get(id: string): Texture {
    const t = this.cache.get(id);
    if (t) return t;
    if (!this.loading.has(id)) {
      const a = atmo(id);
      if (a) {
        this.loading.add(id);
        this.loader.load(a.target, (tex) => {
          tex.colorSpace = SRGBColorSpace;
          tex.minFilter = tex.magFilter = LinearFilter;
          tex.generateMipmaps = false;
          this.cache.set(id, tex);
        });
      }
    }
    return black;
  }
  dispose() {
    this.cache.forEach((t) => t.dispose());
    this.cache.clear();
  }
}

function segment(p: number) {
  let i = 0;
  while (i < MORPH_KEYS.length - 2 && MORPH_KEYS[i + 1].p <= p) i++;
  const a = MORPH_KEYS[i];
  const b = MORPH_KEYS[i + 1];
  const t = Math.min(1, Math.max(0, (p - a.p) / Math.max(1e-4, b.p - a.p)));
  return { a, b, t, next: MORPH_KEYS[Math.min(MORPH_KEYS.length - 1, i + 2)] };
}

const cen = new Vector3();
function centreOf(k: MorphKey, out: Vector3, mobile: boolean) {
  if (k.anchor === "name") out.set(rig.nameCenter.x, rig.nameCenter.y, 0);
  else {
    targetOf(k.p, cen);
    out.copy(cen);
  }
  out.x += (k.dx ?? 0) * (mobile ? 0 : 1);
  out.y += (k.dy ?? 0) + (mobile && !k.anchor ? 1.0 : 0);
  out.z += k.z;
  return out;
}
function heightOf(k: MorphKey, mobile: boolean, aspect = 1) {
  // anchored to the name: cover the whole name block (the mask clips the rest), `height` scales that
  if (k.anchor === "name") return Math.max(rig.nameHeight, rig.nameWidth / Math.max(0.2, aspect)) * k.height;
  return mobile ? k.height * 0.72 : k.height;
}

export default function Morph() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const points = useRef<Points>(null);
  const planeA = useRef<Mesh>(null);
  const planeB = useRef<Mesh>(null);
  const mobile = useMemo(() => store.get().touch || window.innerWidth < 768, []);
  const tier = store.get().tier;
  const n = mobile ? GRID.low : GRID[tier];
  const targets = useMemo(() => new Targets(), []);
  const explode = useRef(0);
  const lastExplode = useRef(0);
  const cA = useMemo(() => new Vector3(), []);
  const cB = useMemo(() => new Vector3(), []);
  const reducedTex = useRef(new Map<string, Texture>());

  const res = useMemo(() => {
    const count = n * n;
    const rest = new Float32Array(count * 4);
    const init = new Float32Array(count * 4);
    const index = new Float32Array(count);
    const r = rng(7);
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const k = j * n + i;
        rest[k * 4] = (i + 0.5) / n;
        rest[k * 4 + 1] = (j + 0.5) / n;
        rest[k * 4 + 2] = 0;
        rest[k * 4 + 3] = r();
        index[k] = k;
      }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aIndex", new Float32BufferAttribute(index, 1));
    const sim = new Sim2(n, n, rest, init, STEP, {
      uTime: { value: 0 },
      uTA: { value: black },
      uTB: { value: black },
      uCenA: { value: new Vector3() },
      uCenB: { value: new Vector3() },
      uSizeA: { value: [1, 1] },
      uSizeB: { value: [1, 1] },
      uBlend: { value: 0 },
      uCloud: { value: 0 },
      uRelief: { value: 0.35 },
      uHand: { value: new Vector3() },
      uHandK: { value: 0 },
      uHandSpeed: { value: 0 },
      uExplodeAt: { value: -1 },
    });
    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      glslVersion: GLSL3,
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      uniforms: { uPos: { value: sim.position }, uRest: { value: sim.rest }, uTA: { value: black }, uTB: { value: black }, uBlend: { value: 0 }, uCloud: { value: 0 }, uDimA: { value: 1 }, uDimB: { value: 1 }, uGrid: { value: [n, n] }, uPx: { value: 1 }, uHeight: { value: 1 }, uMask: { value: black }, uMaskRect: { value: new Vector4(0, 0, 1, 1) }, uMaskK: { value: 0 } },
    });
    const planeGeo = new PlaneGeometry(1, 1);
    const pmA = new MeshBasicMaterial({ transparent: true, opacity: 0, toneMapped: false });
    const pmB = new MeshBasicMaterial({ transparent: true, opacity: 0, toneMapped: false });
    return { geo, sim, mat, planeGeo, pmA, pmB, count };
  }, [n]);

  useEffect(() => {
    const tex = reducedTex.current;
    return () => {
      res.geo.dispose();
      res.sim.dispose();
      res.mat.dispose();
      res.planeGeo.dispose();
      res.pmA.dispose();
      res.pmB.dispose();
      targets.dispose();
      tex.forEach((t) => t.dispose());
      tex.clear();
    };
  }, [res, targets]);

  useEffect(() => {
    const onKey = () => {};
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loader = useMemo(() => new TextureLoader(), []);
  const reducedImage = (id: string) => {
    const m = reducedTex.current;
    const t = m.get(id);
    if (t) return t;
    const a = atmo(id);
    if (!a) return black;
    const tex = loader.load(a.webp800, (tx) => {
      tx.colorSpace = SRGBColorSpace;
    });
    m.set(id, tex);
    return tex;
  };

  useFrame((state, dt) => {
    const pts = points.current;
    if (!pts) return;
    const s = store.get();
    const p = rig.p;
    const { a, b, t, next } = segment(p);
    const same = a.img === b.img;
    const blend = same ? 0 : t;
    const cloud = same ? 0 : Math.sin(Math.PI * t) ** 1.2;
    centreOf(a, cA, mobile);
    centreOf(b, cB, mobile);
    if (same) cA.lerp(cB, t); // glide with the camera during a hold
    const aspA = atmo(a.img)?.aspect ?? 1;
    const aspB = atmo(b.img)?.aspect ?? 1;
    const hA = heightOf(a, mobile, aspA);
    const hB = heightOf(b, mobile, aspB);
    // lazy targets: A, B and one key ahead
    const tA = targets.get(a.img);
    const tB = targets.get(b.img);
    targets.get(next.img);
    const reduced = s.reducedMotion;
    pts.visible = !reduced;
    if (planeA.current) planeA.current.visible = reduced;
    if (planeB.current) planeB.current.visible = reduced && !same;
    if (reduced) {
      const pa = planeA.current;
      const pb = planeB.current;
      if (pa) {
        pa.position.copy(same ? cA : cA);
        pa.scale.set(hA * aspA, hA, 1);
        res.pmA.map = reducedImage(a.img);
        res.pmA.opacity = a.dim * (same ? 1 : 1 - t);
        res.pmA.needsUpdate = true;
      }
      if (pb && !same) {
        pb.position.copy(cB);
        pb.scale.set(hB * aspB, hB, 1);
        res.pmB.map = reducedImage(b.img);
        res.pmB.opacity = b.dim * t;
        res.pmB.needsUpdate = true;
      }
      return;
    }
    const u = res.sim.material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uTA.value = tA;
    u.uTB.value = tB;
    (u.uCenA.value as Vector3).copy(cA);
    (u.uCenB.value as Vector3).copy(cB);
    (u.uSizeA.value as number[])[0] = hA * aspA;
    (u.uSizeA.value as number[])[1] = hA;
    (u.uSizeB.value as number[])[0] = hB * aspB;
    (u.uSizeB.value as number[])[1] = hB;
    u.uBlend.value = blend;
    u.uCloud.value = cloud;
    u.uRelief.value = 0.03 * (same ? hA : Math.max(hA, hB));
    (u.uHand.value as Vector3).set(rig.hand.x, rig.hand.y, same ? cA.z : (cA.z + cB.z) / 2);
    u.uHandK.value = rig.pointer ? 1 : 0;
    u.uHandSpeed.value = Math.min(1.5, rig.speed / 900);
    if (explode.current !== lastExplode.current) {
      lastExplode.current = explode.current;
      u.uExplodeAt.value = state.clock.elapsedTime;
    }
    // fixed 1/60 substeps: one on a 60 fps machine, up to ten on a slow frame so the formation still settles
    const steps = Math.min(10, Math.max(1, Math.round(dt * 60)));
    for (let i = 0; i < steps; i++) res.sim.step(state.gl, 1 / 60);
    const m = res.mat.uniforms;
    m.uPos.value = res.sim.position;
    m.uTA.value = tA;
    m.uTB.value = tB;
    m.uBlend.value = blend;
    m.uCloud.value = cloud;
    m.uDimA.value = a.dim;
    m.uDimB.value = b.dim;
    const fov = (camera.fov * Math.PI) / 180;
    m.uPx.value = (1.9 * state.size.height) / (n * 2 * Math.tan(fov / 2));
    m.uHeight.value = same ? hA : hA + (hB - hA) * t;
    // the name keys: clip to the letterforms (both keys anchored → full, one → by the blend)
    const mk = (a.anchor === "name" ? 1 - t : 0) + (b.anchor === "name" ? t : 0);
    m.uMask.value = nameMask.texture ?? black;
    m.uMaskK.value = nameMask.texture ? mk * nameMask.k : 0;
    (m.uMaskRect.value as Vector4).copy(nameMask.rect);
    res.mat.blending = NormalBlending;
    // the cloud feeds the living ink with the images' colours (a few splats per frame, no allocation)
    if (fluid.live && cloud > 0.2) {
      const bx = cB.x + (Math.random() - 0.5) * hB * aspB * 0.6;
      const by = cB.y + (Math.random() - 0.5) * hB * 0.6;
      cen.set(bx, by, cB.z).project(camera);
      const ux = cen.x * 0.5 + 0.5;
      const uy = cen.y * 0.5 + 0.5;
      if (ux > 0 && ux < 1 && uy > 0 && uy < 1) fluid.splat(ux, uy, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500, 0.16 * Math.random(), 0.12 * Math.random(), 0.06, 1.8);
    }
  });

  return (
    <group>
      <points
        ref={points}
        geometry={res.geo}
        material={res.mat}
        frustumCulled={false}
        onClick={(e) => {
          e.stopPropagation();
          explode.current++;
        }}
      />
      <mesh ref={planeA} geometry={res.planeGeo} material={res.pmA} visible={false} />
      <mesh ref={planeB} geometry={res.planeGeo} material={res.pmB} visible={false} />
    </group>
  );
}

export { atmosphere };
