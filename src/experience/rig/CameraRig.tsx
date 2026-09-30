"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from "three";
import { damp } from "maath/easing";
import { store } from "@/lib/store";
import { actAt, smoothstep } from "@/lib/acts";
import { DESKTOP_KEYS, MOBILE_KEYS, type Key } from "./keyframes";
import { v3a, v3b, v3c } from "../utils/scratch";

/**
 * Shared, allocation-free state read by every act: smoothed progress, the
 * lamp's target on the table, pointer velocity for the registration drift.
 */
export const rig = {
  p: 0,
  act: "sheet" as Key["act"],
  /** where the pointer ray hits the table plane (world) */
  hit: new Vector3(0, 0, 0),
  /** damped lamp target */
  lamp: new Vector3(0, 0, 0),
  /** pointer velocity in px/s (EMA) and its direction in NDC units */
  speed: 0,
  vel: new Vector2(),
  /** camera look-at */
  target: new Vector3(),
  keys: DESKTOP_KEYS,
  /** true while the lamp has a real pointer to follow */
  pointer: false,
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
const plane = new Plane(new Vector3(0, 1, 0), 0);
const ndc = new Vector2();

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

function snapKey(keys: Key[], p: number): number {
  let best = keys[0].p;
  for (const k of keys) if (k.stop && k.p <= p + 0.02) best = k.p;
  return best;
}

export default function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const smoothed = useRef({ p: 0 });
  const lastPointer = useRef({ x: 0, y: 0, t: 0 });
  const keys = useMemo(() => (store.get().touch || window.innerWidth < 768 ? MOBILE_KEYS : DESKTOP_KEYS), []);

  useEffect(() => {
    rig.keys = keys;
    camera.near = 0.05;
    camera.far = 80;
    camera.updateProjectionMatrix();
    rig.snap = (p: number) => {
      smoothed.current.p = p;
      rig.p = p;
      rig.act = sample(keys, p, v3a, v3b).act;
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
    let p: number;
    if (s.reducedMotion) {
      p = snapKey(keys, s.progress);
      smoothed.current.p = p;
    } else {
      damp(smoothed.current, "p", s.progress, 0.2, cdt);
      p = smoothed.current.p;
    }
    rig.p = p;
    const { fov, act } = sample(keys, p, v3a, v3b);
    rig.act = act;

    // the cursor orbits the camera a little around its target (not on touch, not reduced)
    if (!s.touch && !s.reducedMotion && s.pointerIn) {
      v3c.subVectors(v3b, v3a);
      const rx = v3c.z;
      const rz = -v3c.x;
      const len = Math.hypot(rx, rz) || 1;
      const amt = act === "sheet" ? 0.12 : 0.22;
      v3a.x += (rx / len) * s.pointerX * amt;
      v3a.z += (rz / len) * s.pointerX * amt;
      v3a.y += s.pointerY * amt * 0.5;
    }
    camera.position.copy(v3a);
    camera.lookAt(v3b);
    rig.target.copy(v3b);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    // pointer → table plane hit (the lamp target) and velocity
    const now = state.clock.elapsedTime;
    const hasPointer = s.pointerIn || s.touch;
    if (hasPointer && !s.reducedMotion) {
      ndc.set(s.pointerX, s.pointerY);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, v3c)) {
        // keep the hit near the current act so the lamp never wanders to the horizon
        v3c.x = Math.min(Math.max(v3c.x, v3b.x - 6), v3b.x + 6);
        v3c.z = Math.min(Math.max(v3c.z, v3b.z - 4), v3b.z + 4);
        rig.hit.copy(v3c);
      }
      rig.pointer = true;
      const lp = lastPointer.current;
      const dtp = Math.max(1e-3, now - lp.t);
      const vx = ((s.pointerX - lp.x) * window.innerWidth) / 2 / dtp;
      const vy = ((s.pointerY - lp.y) * window.innerHeight) / 2 / dtp;
      if (dtp > 1 / 240) {
        const sp = Math.hypot(vx, vy);
        rig.speed += (sp - rig.speed) * Math.min(1, cdt * 12);
        rig.vel.x += (vx - rig.vel.x) * Math.min(1, cdt * 12);
        rig.vel.y += (vy - rig.vel.y) * Math.min(1, cdt * 12);
        lp.x = s.pointerX;
        lp.y = s.pointerY;
        lp.t = now;
      }
    } else {
      // no pointer: the lamp drifts on a slow Lissajous path so paper is never flat
      rig.pointer = false;
      rig.hit.set(v3b.x + 0.25 + Math.sin(now * 0.23) * 0.7, 0, v3b.z + 0.1 + Math.cos(now * 0.17) * 0.45);
      rig.speed += (0 - rig.speed) * Math.min(1, cdt * 6);
      rig.vel.multiplyScalar(Math.max(0, 1 - cdt * 6));
    }
    damp(rig.lamp, "x", rig.hit.x, 0.16, cdt);
    damp(rig.lamp, "z", rig.hit.z, 0.16, cdt);
  }, -10);

  return null;
}
