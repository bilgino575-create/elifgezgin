"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  ClampToEdgeWrapping,
  Float32BufferAttribute,
  GLSL3,
  HalfFloatType,
  LinearFilter,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLRenderTarget,
  type WebGLRenderer,
} from "three";
import { store } from "@/lib/store";
import { ADVECTION, CLEAR, CURL, DIVERGENCE, GRADIENT_SUBTRACT, PRESSURE, SPLAT, VERT, VORTICITY } from "./shaders";

/**
 * The living ink: a stable-fluids simulation in screen space. Velocity and
 * dye live in half-float ping-pong targets; the dye stores ABSORBANCE per
 * channel (see docs/RENK.md §5), so inks mix like pigment. Anyone can
 * inject through `fluid.splat` (the hand, the drop, the ending text);
 * consumers read `fluid.dye` (the backdrop, the card).
 *
 * LOW tier never mounts this; the backdrop falls back to an animated noise field.
 */

interface Splat {
  x: number;
  y: number;
  dx: number;
  dy: number;
  r: number;
  g: number;
  b: number;
  radius: number;
}

class Fluid {
  dye: Texture | null = null;
  /** true while a simulation is mounted and stepping */
  live = false;
  /** 0..1 amount of ink on the stage (EMA of injected amounts), read by the ending */
  amount = 0;
  private queue: Splat[] = [];
  private pool: Splat[] = [];
  splat(x: number, y: number, dx: number, dy: number, r: number, g: number, b: number, radius = 1) {
    if (!this.live) return;
    const s = this.pool.pop() ?? { x: 0, y: 0, dx: 0, dy: 0, r: 0, g: 0, b: 0, radius: 1 };
    s.x = x;
    s.y = y;
    s.dx = dx;
    s.dy = dy;
    s.r = r;
    s.g = g;
    s.b = b;
    s.radius = radius;
    this.queue.push(s);
    this.amount = Math.min(1, this.amount + 0.02 * (r + g + b));
  }
  drain(fn: (s: Splat) => void) {
    for (const s of this.queue) {
      fn(s);
      this.pool.push(s);
    }
    this.queue.length = 0;
  }
}
export const fluid = new Fluid();

/** Absorbance of an ink for the splat, normalised so every ink injects a comparable amount. */
export function inkAbsorbance(hex: string, out: [number, number, number], strength = 1) {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  const a = c.map((v) => -Math.log(Math.max(v, 0.03)));
  const m = Math.max(a[0], a[1], a[2], 1e-3);
  out[0] = (a[0] / m) * strength;
  out[1] = (a[1] / m) * strength;
  out[2] = (a[2] / m) * strength;
  return out;
}

const tri = new BufferGeometry();
tri.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
tri.setAttribute("uv", new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));

function target(w: number, h: number, filter: typeof LinearFilter | typeof NearestFilter) {
  const rt = new WebGLRenderTarget(w, h, {
    type: HalfFloatType,
    format: RGBAFormat,
    minFilter: filter,
    magFilter: filter,
    wrapS: ClampToEdgeWrapping,
    wrapT: ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
  return rt;
}

class PingPong {
  a: WebGLRenderTarget;
  b: WebGLRenderTarget;
  texel: Vector2;
  constructor(w: number, h: number, filter: typeof LinearFilter | typeof NearestFilter) {
    this.a = target(w, h, filter);
    this.b = target(w, h, filter);
    this.texel = new Vector2(1 / w, 1 / h);
  }
  get read() {
    return this.a;
  }
  get write() {
    return this.b;
  }
  swap() {
    const t = this.a;
    this.a = this.b;
    this.b = t;
  }
  dispose() {
    this.a.dispose();
    this.b.dispose();
  }
}

function mat(frag: string, uniforms: Record<string, { value: unknown }>) {
  return new ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms: { texelSize: { value: new Vector2() }, ...uniforms }, glslVersion: GLSL3, depthTest: false, depthWrite: false });
}

export interface FluidConfig {
  simScale: number; // fraction of the canvas resolution for velocity
  dyeScale: number;
  pressureIterations: number;
  curl: number;
}
export const FLUID_BY_TIER: Record<string, FluidConfig> = {
  ultra: { simScale: 0.28, dyeScale: 0.75, pressureIterations: 22, curl: 14 },
  high: { simScale: 0.25, dyeScale: 0.66, pressureIterations: 20, curl: 12 },
  mid: { simScale: 0.16, dyeScale: 0.4, pressureIterations: 12, curl: 6 },
};

export default function FluidSim({ config }: { config: FluidConfig }) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const scene = useMemo(() => new Scene(), []);
  const cam = useMemo(() => new OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const quad = useMemo(() => new Mesh(tri), []);
  const mats = useMemo(
    () => ({
      splat: mat(SPLAT, { uTarget: { value: null }, aspectRatio: { value: 1 }, color: { value: new Vector2() as unknown }, point: { value: new Vector2() }, radius: { value: 0.01 } }),
      curl: mat(CURL, { uVelocity: { value: null } }),
      vorticity: mat(VORTICITY, { uVelocity: { value: null }, uCurl: { value: null }, curl: { value: 10 }, dt: { value: 0.016 } }),
      divergence: mat(DIVERGENCE, { uVelocity: { value: null } }),
      clear: mat(CLEAR, { uTexture: { value: null }, value: { value: 0.8 } }),
      pressure: mat(PRESSURE, { uPressure: { value: null }, uDivergence: { value: null } }),
      gradient: mat(GRADIENT_SUBTRACT, { uPressure: { value: null }, uVelocity: { value: null } }),
      advection: mat(ADVECTION, { uVelocity: { value: null }, uSource: { value: null }, dt: { value: 0.016 }, dissipation: { value: 0.2 } }),
    }),
    []
  );
  // splat colour is a vec3; the uniform above is typed loosely so the material factory stays generic
  useEffect(() => {
    mats.splat.uniforms.color.value = [0, 0, 0];
  }, [mats]);

  const targets = useRef<{ vel: PingPong; dye: PingPong; div: WebGLRenderTarget; curl: WebGLRenderTarget; pre: PingPong } | null>(null);

  useEffect(() => {
    scene.add(quad);
    const dpr = gl.getPixelRatio();
    const W = Math.max(1, Math.round(size.width * dpr));
    const H = Math.max(1, Math.round(size.height * dpr));
    const sw = Math.max(32, Math.round(W * config.simScale));
    const sh = Math.max(32, Math.round(H * config.simScale));
    const dw = Math.max(64, Math.round(W * config.dyeScale));
    const dh = Math.max(64, Math.round(H * config.dyeScale));
    const t = {
      vel: new PingPong(sw, sh, LinearFilter),
      dye: new PingPong(dw, dh, LinearFilter),
      div: target(sw, sh, NearestFilter),
      curl: target(sw, sh, NearestFilter),
      pre: new PingPong(sw, sh, NearestFilter),
    };
    targets.current = t;
    fluid.dye = t.dye.read.texture;
    fluid.live = true;
    return () => {
      fluid.live = false;
      fluid.dye = null;
      t.vel.dispose();
      t.dye.dispose();
      t.div.dispose();
      t.curl.dispose();
      t.pre.dispose();
      targets.current = null;
      scene.remove(quad);
    };
  }, [gl, size.width, size.height, config, scene, quad]);

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats]
  );

  const blit = (renderer: WebGLRenderer, m: ShaderMaterial, rt: WebGLRenderTarget, texel: Vector2) => {
    m.uniforms.texelSize.value.copy(texel);
    quad.material = m;
    renderer.setRenderTarget(rt);
    renderer.render(scene, cam);
  };

  useFrame((state, delta) => {
    const t = targets.current;
    if (!t) return;
    if (store.get().reducedMotion) return; // frozen: the first frame stays
    const renderer = state.gl;
    const dt = Math.min(delta, 1 / 30);
    const prevAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    const aspect = t.vel.texel.y / t.vel.texel.x; // width / height

    // 1. inject
    fluid.drain((s) => {
      mats.splat.uniforms.uTarget.value = t.vel.read.texture;
      mats.splat.uniforms.aspectRatio.value = aspect;
      (mats.splat.uniforms.point.value as Vector2).set(s.x, s.y);
      mats.splat.uniforms.radius.value = 0.0006 * s.radius;
      const c = mats.splat.uniforms.color.value as number[];
      c[0] = s.dx;
      c[1] = s.dy;
      c[2] = 0;
      blit(renderer, mats.splat, t.vel.write, t.vel.texel);
      t.vel.swap();
      mats.splat.uniforms.uTarget.value = t.dye.read.texture;
      c[0] = s.r;
      c[1] = s.g;
      c[2] = s.b;
      blit(renderer, mats.splat, t.dye.write, t.dye.texel);
      t.dye.swap();
    });

    // 2. vorticity confinement
    mats.curl.uniforms.uVelocity.value = t.vel.read.texture;
    blit(renderer, mats.curl, t.curl, t.vel.texel);
    mats.vorticity.uniforms.uVelocity.value = t.vel.read.texture;
    mats.vorticity.uniforms.uCurl.value = t.curl.texture;
    mats.vorticity.uniforms.curl.value = config.curl;
    mats.vorticity.uniforms.dt.value = dt;
    blit(renderer, mats.vorticity, t.vel.write, t.vel.texel);
    t.vel.swap();

    // 3. pressure projection
    mats.divergence.uniforms.uVelocity.value = t.vel.read.texture;
    blit(renderer, mats.divergence, t.div, t.vel.texel);
    mats.clear.uniforms.uTexture.value = t.pre.read.texture;
    mats.clear.uniforms.value.value = 0.8;
    blit(renderer, mats.clear, t.pre.write, t.vel.texel);
    t.pre.swap();
    mats.pressure.uniforms.uDivergence.value = t.div.texture;
    for (let i = 0; i < config.pressureIterations; i++) {
      mats.pressure.uniforms.uPressure.value = t.pre.read.texture;
      blit(renderer, mats.pressure, t.pre.write, t.vel.texel);
      t.pre.swap();
    }
    mats.gradient.uniforms.uPressure.value = t.pre.read.texture;
    mats.gradient.uniforms.uVelocity.value = t.vel.read.texture;
    blit(renderer, mats.gradient, t.vel.write, t.vel.texel);
    t.vel.swap();

    // 4. advect velocity, then dye
    mats.advection.uniforms.dt.value = dt;
    mats.advection.uniforms.uVelocity.value = t.vel.read.texture;
    mats.advection.uniforms.uSource.value = t.vel.read.texture;
    mats.advection.uniforms.dissipation.value = 0.12;
    blit(renderer, mats.advection, t.vel.write, t.vel.texel);
    t.vel.swap();
    mats.advection.uniforms.uVelocity.value = t.vel.read.texture;
    mats.advection.uniforms.uSource.value = t.dye.read.texture;
    mats.advection.uniforms.dissipation.value = 0.55;
    blit(renderer, mats.advection, t.dye.write, t.dye.texel);
    t.dye.swap();
    fluid.dye = t.dye.read.texture;
    fluid.amount *= Math.max(0, 1 - dt * 0.35);

    renderer.setRenderTarget(null);
    renderer.autoClear = prevAutoClear;
  }, -50);

  return null;
}
