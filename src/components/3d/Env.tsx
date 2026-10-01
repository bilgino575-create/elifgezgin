"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, CubeCamera, DoubleSide, HalfFloatType, Mesh, MeshBasicMaterial, PlaneGeometry, Scene, WebGLCubeRenderTarget } from "three";
import { store, useStore } from "@/lib/store";
import { budgetOf } from "@/lib/tiers";
import { STOPS } from "@/lib/stops";

/** one soft light of the studio: a glowing rectangle in a virtual scene */
interface Lamp {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number];
  intensity: number;
  /** index into the stop's env inks, or a fixed colour */
  ink: 0 | 1 | 2 | string;
}
const LAMPS: Lamp[] = [
  { position: [0, 6, -2], rotation: [Math.PI / 2, 0, 0], scale: [14, 14], intensity: 2.4, ink: 0 },
  { position: [-7, 1, 0], rotation: [0, Math.PI / 2, 0], scale: [10, 3], intensity: 1.8, ink: 1 },
  { position: [7, -1, 0], rotation: [0, -Math.PI / 2, 0], scale: [10, 3], intensity: 1.5, ink: 2 },
  { position: [0, -6, 3], rotation: [-Math.PI / 2, 0, 0], scale: [12, 12], intensity: 0.7, ink: 1 },
  { position: [0, 2, 8], rotation: [0, 0, 0], scale: [6, 6], intensity: 0.5, ink: "#ffffff" },
];

const tmp = new Color();

/**
 * A procedural studio per stop: one big soft top light and two coloured
 * strips in the stop's env inks. Chrome and glass reflect this, so the
 * same chrome reads cobalt-and-orange at the typography stop and
 * magenta-and-cyan at the branding stop. One cube render target for the
 * whole route, re-rendered only when the stop changes; nothing is
 * allocated per stop, so a long visit leaves no trace in GPU memory.
 */
export default function Env() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const tier = useStore((s) => s.tier);
  const res = budgetOf(tier).envRes;
  const studio = useMemo(() => {
    const fbo = new WebGLCubeRenderTarget(res);
    fbo.texture.type = HalfFloatType;
    const camera = new CubeCamera(0.1, 100, fbo);
    const virtual = new Scene();
    const geometry = new PlaneGeometry(1, 1);
    const materials = LAMPS.map((l) => {
      const m = new MeshBasicMaterial({ side: DoubleSide, toneMapped: false });
      const mesh = new Mesh(geometry, m);
      mesh.position.set(...l.position);
      mesh.rotation.set(...l.rotation);
      mesh.scale.set(l.scale[0], l.scale[1], 1);
      virtual.add(mesh);
      return m;
    });
    return { fbo, camera, virtual, geometry, materials };
  }, [res]);
  const last = useRef(-1);
  useEffect(() => {
    scene.environment = studio.fbo.texture;
    last.current = -1;
    return () => {
      if (scene.environment === studio.fbo.texture) scene.environment = null;
      studio.fbo.dispose();
      studio.geometry.dispose();
      studio.materials.forEach((m) => m.dispose());
    };
  }, [scene, studio]);
  useFrame(() => {
    const stop = Math.min(STOPS.length - 1, store.get().stop);
    if (stop === last.current) return;
    last.current = stop;
    const env = STOPS[stop].palette.env;
    LAMPS.forEach((l, i) => {
      tmp.set(typeof l.ink === "string" ? l.ink : env[l.ink]).multiplyScalar(l.intensity);
      studio.materials[i].color.copy(tmp);
    });
    studio.camera.update(gl, studio.virtual);
  }, -95);
  return null;
}
