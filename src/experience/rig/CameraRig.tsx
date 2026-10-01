"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from "three";
import { damp } from "maath/easing";
import { store } from "@/lib/store";
import { actAt, smoothstep } from "@/lib/acts";
import { DESKTOP_KEYS, MOBILE_KEYS, type Key } from "./keyframes";
import { v3a, v3b, v3c } from "../utils/scratch";
import { fluid, inkAbsorbance } from "../fluid/Fluid";
import { INKS } from "@/lib/inks";
import { portalWorld } from "../acts/portals/Portals";

/**
 * Shared, allocation-free state read by every act: smoothed progress, the
 * hand in world space, pointer velocity, the intro glide.
 */
export const rig = {
  p: 0,
  act: "name" as Key["act"],
  /** where the pointer ray hits the z = 0 plane (world) */
  hit: new Vector3(0, 0, 0),
  /** damped hand */
  hand: new Vector3(0, 0, 0),
  /** pointer speed in px/s (EMA) and its velocity */
  speed: 0,
  vel: new Vector2(),
  /** camera look-at */
  target: new Vector3(),
  keys: DESKTOP_KEYS,
  /** true while there is a real pointer to follow */
  pointer: false,
  /** 0 → 1 glide from chaos to the anamorphic point (the name now opens resolved, so this starts complete) */
  intro: 1,
  /** the visitor's ink for this stroke, 0..3 */
  ink: 0,
  /** centre of the fitted name on the z = 0 plane (Act I writes it) */
  nameCenter: new Vector2(0, 0),
  /** world height and width of the fitted name block */
  nameHeight: 3,
  nameWidth: 6,
  snap: (p: number) => {
    void p;
  },
};

declare global {
  interface Window {
    __snap?: (p: number) => void;
  }
}

const ray = new Raycaster();
const plane = new Plane(new Vector3(0, 0, 1), 0);
const ndc = new Vector2();
const abs: [number, number, number] = [0, 0, 0];
const HAND_INKS = [INKS[0], INKS[1], INKS[2], INKS[3]];

function sample(keys: Key[], p: number, outPos: Vector3, outTgt: Vector3): { fov: number; act: Key["act"] } {
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].p <= p) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const t = a === b ? 0 : smoothstep(a.p, b.p, p);
  outPos.set(a.pos[0] + (b.pos[0] - a.pos[0]) * t, a.pos[1] + (b.pos[1] - a.pos[1]) * t, a.pos[2] + (b.pos[2] - a.pos[2]) * t);
  outTgt.set(a.tgt[0] + (b.tgt[0] - a.tgt[0]) * t, a.tgt[1] + (b.tgt[1] - a.tgt[1]) * t, a.tgt[2] + (b.tgt[2] - a.tgt[2]) * t);
  return { fov: a.fov + (b.fov - a.fov) * t, act: t < 0.5 ? a.act : b.act };
}

/** camera look-at at a given p, for anything that anchors to the path (allocation-free, into `out`) */
const tPos = new Vector3();
export function targetOf(p: number, out: Vector3) {
  sample(rig.keys, p, tPos, out);
  return out;
}

function snapKey(keys: Key[], p: number): number {
  let best = keys[0].p;
  for (const k of keys) if (k.stop && k.p <= p + 0.02) best = k.p;
  return best;
}

const holdChaos = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("chaos") === "1";
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const smoothed = useRef({ p: 0 });
  const lastPointer = useRef({ x: 0, y: 0, t: 0, u: 0.5, v: 0.5 });
  const introStart = useRef(-1);
  const strokeT = useRef(0);
  const openT = useRef(0);
  const keys = useMemo(() => (store.get().touch || window.innerWidth < 768 ? MOBILE_KEYS : DESKTOP_KEYS), []);

  useEffect(() => {
    rig.keys = keys;
    camera.near = 0.05;
    camera.far = 120;
    camera.updateProjectionMatrix();
    rig.snap = (p: number) => {
      smoothed.current.p = p;
      rig.p = p;
      rig.act = sample(keys, p, v3a, v3b).act;
      rig.intro = 1;
    };
    window.__snap = (p: number) => {
      window.scrollTo({ top: p * (document.documentElement.scrollHeight - window.innerHeight), behavior: "auto" });
      store.set({ progress: p, act: actAt(p) });
      rig.snap(p);
    };
    return () => {
      delete window.__snap;
    };
  }, [keys, camera]);

  useFrame((state, dt) => {
    const s = store.get();
    const cdt = Math.min(dt, 1 / 20);
    const now = state.clock.elapsedTime;
    let p: number;
    if (s.reducedMotion) {
      p = snapKey(keys, s.progress);
      smoothed.current.p = p;
      rig.intro = 1;
    } else {
      damp(smoothed.current, "p", s.progress, 0.2, cdt);
      p = smoothed.current.p;
    }
    rig.p = p;
    const { fov, act } = sample(keys, p, v3a, v3b);
    rig.act = act;
    // the close-up dollies onto the fitted name, wherever the HTML laid it out
    if (act === "name" && p > 0.07) {
      const k = smoothstep(0.07, 0.16, p);
      v3a.x += rig.nameCenter.x * k;
      v3a.y += rig.nameCenter.y * k;
      v3b.x += rig.nameCenter.x * k;
      v3b.y += rig.nameCenter.y * k;
      // stop where the name fills the frame (whichever of height and width is tighter), with room for the nav
      const tan = Math.tan((fov * Math.PI) / 360);
      const aspect = state.size.width / state.size.height;
      const fill = Math.max(rig.nameHeight / (2 * tan), rig.nameWidth / (2 * tan * aspect)) * 1.12 + 0.35;
      v3a.z = v3a.z * (1 - k) + fill * k;
    }

    // the intro glide: from chaos to the anamorphic point in 2.4 s after the drop lands (`?chaos=1` holds it, for captures)
    if (holdChaos) {
      rig.intro = 0;
      v3a.x += 2.6;
      v3a.y += 1.4;
      v3a.z += -0.6;
    } else if (rig.intro < 1) {
      if (s.loaded && introStart.current < 0) introStart.current = now + 0.35;
      if (introStart.current >= 0 && now > introStart.current) rig.intro = Math.min(1, (now - introStart.current) / 2.4);
      if (s.progress > 0.03) rig.intro = 1;
      const k = 1 - easeInOut(rig.intro);
      v3a.x += 2.6 * k;
      v3a.y += 1.4 * k;
      v3a.z += -0.6 * k;
    }

    // the hand breathes the camera: enough to fracture the name, never enough to lose it
    if (!s.touch && !s.reducedMotion && s.pointerIn && rig.intro >= 1) {
      v3c.subVectors(v3b, v3a);
      const rx = v3c.z;
      const rz = -v3c.x;
      const len = Math.hypot(rx, rz) || 1;
      const amt = act === "name" ? 0.1 : 0.24;
      v3a.x += (rx / len) * s.pointerX * amt;
      v3a.z += (rz / len) * s.pointerX * amt;
      v3a.y += s.pointerY * amt * 0.6;
    }
    // opening a work: fly through its portal, then the page navigates
    if (s.opening) {
      const target = portalWorld.get(s.opening);
      if (target) {
        openT.current = Math.min(1, openT.current + cdt / 0.9);
        const k = easeInOut(openT.current);
        v3a.x += (target.x - v3a.x) * k;
        v3a.y += (target.y - v3a.y) * k;
        v3a.z += (target.z - 0.6 - v3a.z) * k;
        v3b.set(target.x, target.y, target.z - 3);
      }
    } else openT.current = 0;
    camera.position.copy(v3a);
    camera.lookAt(v3b);
    rig.target.copy(v3b);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    // pointer → z = 0 plane (the hand) and velocity; the hand injects ink
    const touchLive = s.touch && performance.now() / 1000 - s.touchAt < 0.12;
    const hasPointer = (!s.touch && s.pointerIn) || touchLive;
    const lp = lastPointer.current;
    if (hasPointer && !s.reducedMotion) {
      ndc.set(s.pointerX, s.pointerY);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, v3c)) {
        v3c.x = Math.min(Math.max(v3c.x, v3b.x - 8), v3b.x + 8);
        v3c.y = Math.min(Math.max(v3c.y, v3b.y - 6), v3b.y + 6);
        rig.hit.copy(v3c);
      }
      rig.pointer = true;
      const dtp = Math.max(1e-3, now - lp.t);
      const u = (s.pointerX + 1) / 2;
      const v = (s.pointerY + 1) / 2;
      const du = u - lp.u;
      const dv = v - lp.v;
      if (dtp > 1 / 240) {
        const vx = (du * window.innerWidth) / dtp;
        const vy = (dv * window.innerHeight) / dtp;
        const sp = Math.hypot(vx, vy);
        rig.speed += (sp - rig.speed) * Math.min(1, cdt * 12);
        rig.vel.x += (vx - rig.vel.x) * Math.min(1, cdt * 12);
        rig.vel.y += (vy - rig.vel.y) * Math.min(1, cdt * 12);
        if (fluid.live && (du !== 0 || dv !== 0)) {
          // the ink changes every 2.2 s of movement; the amount follows the speed
          strokeT.current += dtp;
          rig.ink = Math.floor(strokeT.current / 2.2) % HAND_INKS.length;
          const amount = Math.min(1, 0.25 + sp / 1400);
          // sunflower is the brightest ink on the black stage: lay it thinner so it never blinds
          inkAbsorbance(HAND_INKS[rig.ink], abs, 0.16 * amount * (rig.ink === 2 ? 0.6 : 1));
          fluid.splat(u, v, du * 5000, dv * 5000, abs[0], abs[1], abs[2], s.touch ? 1.6 : 1.0);
        }
        lp.x = s.pointerX;
        lp.y = s.pointerY;
        lp.u = u;
        lp.v = v;
        lp.t = now;
      }
    } else {
      rig.pointer = false;
      // no pointer: the hand rests near the act's centre on a slow Lissajous path and keeps a faint ink alive
      rig.hit.set(v3b.x + Math.sin(now * 0.23) * 1.2, v3b.y + Math.cos(now * 0.17) * 0.8, 0);
      if (fluid.live && s.loaded) {
        const portrait = state.size.width < state.size.height;
        const u = 0.5 + Math.sin(now * 0.23) * (portrait ? 0.2 : 0.28) + Math.sin(now * 0.071) * 0.1;
        const v = 0.5 + Math.cos(now * 0.17) * (portrait ? 0.14 : 0.24) + Math.cos(now * 0.053) * 0.1;
        const du = Math.cos(now * 0.23) * 0.23 * 0.28 * cdt;
        const dv = -Math.sin(now * 0.17) * 0.17 * 0.24 * cdt;
        // two inks only (spot and cyan): they mix to blues, never to grey
        const idleInk = Math.floor(now / 7) % 2 === 0 ? HAND_INKS[0] : HAND_INKS[3];
        inkAbsorbance(idleInk, abs, portrait ? 0.03 : 0.045);
        fluid.splat(u, v, du * 4000, dv * 4000, abs[0], abs[1], abs[2], portrait ? 1.8 : 2.6);
      }
      rig.speed += (0 - rig.speed) * Math.min(1, cdt * 6);
      rig.vel.multiplyScalar(Math.max(0, 1 - cdt * 6));
      lp.u = (s.pointerX + 1) / 2;
      lp.v = (s.pointerY + 1) / 2;
      lp.t = now;
    }
    damp(rig.hand, "x", rig.hit.x, 0.12, cdt);
    damp(rig.hand, "y", rig.hit.y, 0.12, cdt);
  }, -10);

  return null;
}
