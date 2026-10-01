"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Plane, PointLight, Raycaster, Vector2, Vector3 } from "three";
import { store } from "@/lib/store";
import { STOPS } from "@/lib/stops";
import { rig } from "./rig";

const ray = new Raycaster();
const ndc = new Vector2();
const plane = new Plane();
const hit = new Vector3();
const normal = new Vector3();
const anchor = new Vector3();

/**
 * The light the visitor carries. The pointer (or finger) is cast onto a
 * plane facing the camera through the stop's centre; a point light in the
 * stop's first ink sits a little in front of that point. With no pointer it
 * wanders slowly near the installation, so the stage never goes dark.
 */
export default function CursorLight() {
  const camera = useThree((s) => s.camera);
  const light = useRef<PointLight>(null);
  useFrame(() => {
    const s = store.get();
    const stop = STOPS[rig.i];
    const next = STOPS[Math.min(STOPS.length - 1, rig.i + 1)];
    anchor.set(stop.world[0] + (next.world[0] - stop.world[0]) * rig.k, stop.world[1] + (next.world[1] - stop.world[1]) * rig.k, stop.world[2] + (next.world[2] - stop.world[2]) * rig.k);
    camera.getWorldDirection(normal);
    plane.setFromNormalAndCoplanarPoint(normal, anchor);
    if (s.pointer && !s.reduced) {
      ndc.set(s.px, s.py);
      ray.setFromCamera(ndc, camera);
      if (!ray.ray.intersectPlane(plane, hit)) hit.copy(anchor);
    } else {
      const t = rig.time;
      hit.set(anchor.x + Math.sin(t * 0.31) * 2.2, anchor.y + Math.cos(t * 0.23) * 1.3, anchor.z);
    }
    // toward the camera a little, so the light rakes the objects from the front
    hit.addScaledVector(normal, -2.2);
    const l = 1 - Math.exp(-rig.dt / 0.09);
    rig.light.lerp(hit, l);
    const L = light.current;
    if (L) {
      L.position.copy(rig.light);
      L.color.copy(rig.a);
      L.intensity = s.pointer ? 26 : 14;
    }
  }, -80);
  return <pointLight ref={light} intensity={14} distance={16} decay={2} color="#1f3bff" />;
}
