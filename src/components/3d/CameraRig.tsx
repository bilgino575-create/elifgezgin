"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, Vector3, type PerspectiveCamera } from "three";
import { store } from "@/lib/store";
import { COUNT, HOLD, STOPS, segmentAt } from "@/lib/stops";
import { rig, tick } from "./rig";

const pos = new Vector3();
const look = new Vector3();
const tmp = new Vector3();
const right = new Vector3();
const up = new Vector3(0, 1, 0);
const fwd = new Vector3();

/**
 * The camera journey. Seven stops, a Catmull-Rom path through their camera
 * positions and another through their look targets; the camera holds at a
 * stop for the first part of each segment and travels in the rest. The
 * pointer breathes it sideways, never enough to lose the subject. The final
 * position is damped in time, so a scroll jump is a glide, never a cut.
 */
export default function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const touch = store.get().touch;
  const { camPath, lookPath } = useMemo(() => {
    const cams = STOPS.map((s) => new Vector3(...(touch ? s.camMobile : s.cam)));
    const looks = STOPS.map((s) => new Vector3(...(touch ? s.lookMobile : s.look)));
    return { camPath: new CatmullRomCurve3(cams, false, "centripetal", 0.5), lookPath: new CatmullRomCurve3(looks, false, "centripetal", 0.5) };
  }, [touch]);
  const state = useRef({ cp: new Vector3(...(touch ? STOPS[0].camMobile : STOPS[0].cam)), cl: new Vector3(...(touch ? STOPS[0].lookMobile : STOPS[0].look)), fov: STOPS[0].fov, bx: 0, by: 0 });

  useFrame((st, dt) => {
    const s = store.get();
    const cdt = Math.min(0.05, dt);
    rig.time = st.clock.elapsedTime;
    rig.dt = cdt;
    rig.pointer = s.pointer;
    if (s.loaded && rig.enteredAt < 0) rig.enteredAt = rig.time;
    rig.entered = rig.enteredAt < 0 ? 0 : Math.min(1, (rig.time - rig.enteredAt) / 2.2);
    tick(s.p);

    // where on the path: stop i while holding, eased toward i+1 while travelling
    const { i } = segmentAt(s.p);
    const u = s.reduced ? i / (COUNT - 1) : (i + rig.k) / (COUNT - 1);
    camPath.getPoint(Math.min(1, Math.max(0, u)), pos);
    lookPath.getPoint(Math.min(1, Math.max(0, u)), look);
    const fovA = STOPS[i].fov;
    const fovB = STOPS[Math.min(COUNT - 1, i + 1)].fov;
    const fov = fovA + (fovB - fovA) * rig.k;

    // the hand's breath: a sideways and vertical offset along the camera's own axes
    const st0 = state.current;
    const bxT = s.pointer && !s.reduced ? s.px : 0;
    const byT = s.pointer && !s.reduced ? s.py : 0;
    const lerpB = 1 - Math.exp(-cdt / 0.35);
    st0.bx += (bxT - st0.bx) * lerpB;
    st0.by += (byT - st0.by) * lerpB;
    fwd.subVectors(look, pos).normalize();
    right.crossVectors(fwd, up).normalize();
    const amt = touch ? 0.25 : 0.55;
    tmp.copy(right).multiplyScalar(st0.bx * amt);
    pos.add(tmp);
    pos.y += st0.by * amt * 0.6;
    look.add(tmp.multiplyScalar(0.35));
    look.y += st0.by * amt * 0.2;
    if (!s.reduced) {
      // idle sway, barely there
      pos.x += Math.sin(rig.time * 0.21) * 0.06;
      pos.y += Math.sin(rig.time * 0.17 + 1) * 0.05;
    }

    // damping in time: a glide after a jump, no cut
    const tau = s.reduced ? 0.18 : 0.12;
    const l = 1 - Math.exp(-cdt / tau);
    st0.cp.lerp(pos, l);
    st0.cl.lerp(look, l);
    st0.fov += (fov - st0.fov) * l;
    camera.position.copy(st0.cp);
    camera.lookAt(st0.cl);
    if (Math.abs(camera.fov - st0.fov) > 0.01) {
      camera.fov = st0.fov;
      camera.updateProjectionMatrix();
    }
    void HOLD;
  }, -100);
  return null;
}
