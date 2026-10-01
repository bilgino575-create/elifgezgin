"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Box3, Color, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Vector3 } from "three";
import { store } from "@/lib/store";
import { t } from "@/lib/i18n";
import { rig } from "../rig";
import { damp } from "./common";

export const STATUE_URL = { desktop: "/models/elif-heykel-masaustu.glb", mobile: "/models/elif-heykel-mobil.glb" } as const;
const bbox = new Box3();
const bsize = new Vector3();
const bcen = new Vector3();

/** the Meshy base colour under a clear coat, a thin film and a lime rim: a lacquered sculpture */
function premium(src: MeshStandardMaterial) {
  const m = new MeshPhysicalMaterial({ map: src.map, normalMap: src.normalMap, normalScale: src.normalScale, metalnessMap: src.metalnessMap, roughnessMap: src.roughnessMap, metalness: 0.15, roughness: 0.5, clearcoat: 0.7, clearcoatRoughness: 0.2, iridescence: 0.35, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 420], envMapIntensity: 1.1, side: src.side });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = { value: new Color("#c8ff00") };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uRim;")
      .replace("#include <dithering_fragment>", `float rimK = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), 3.5);\ngl_FragColor.rgb += uRim * rimK * 0.45;\n#include <dithering_fragment>`);
  };
  return m;
}

/**
 * Elif's statue (her own GLB, meshopt-compressed, the phone file on touch
 * and LOW). It stands on a black plinth, sways a little, and turns under
 * the hand: drag spins it within ±66° (its back is a wall of panels, so it
 * never turns away). Everything it loads is disposed with it.
 */
export default function Statue({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const s0 = store.get();
  const url = s0.touch || s0.tier === "low" ? STATUE_URL.mobile : STATUE_URL.desktop;
  const { scene } = useGLTF(url, false, true);
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const st = useRef({ spin: 0, drag: false, dragX: 0, dragV: 0, yaw: 0 });
  const mesh = useMemo(() => {
    let m: Mesh | null = null;
    scene.traverse((o) => {
      if (!m && (o as Mesh).isMesh) m = o as Mesh;
    });
    return m as Mesh | null;
  }, [scene]);
  const material = useMemo(() => (mesh ? premium(mesh.material as MeshStandardMaterial) : null), [mesh]);
  const bounds = useMemo(() => {
    if (!mesh) return { h: 1.9, w: 1.7, d: 1.3, cx: 0, cz: 0, bottom: -0.95 };
    mesh.updateMatrixWorld(true);
    bbox.setFromObject(mesh);
    bbox.getSize(bsize);
    bbox.getCenter(bcen);
    return { h: bsize.y, w: bsize.x, d: bsize.z, cx: bcen.x, cz: bcen.z, bottom: bbox.min.y };
  }, [mesh]);
  useEffect(() => {
    return () => {
      material?.dispose();
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        const src = m.material as MeshStandardMaterial;
        src.map?.dispose();
        src.normalMap?.dispose();
        src.metalnessMap?.dispose();
        src.roughnessMap?.dispose();
        src.dispose();
      });
      useGLTF.clear(url);
    };
  }, [scene, url, material]);
  const d = t(document.documentElement.lang === "en" ? "en" : "tr");
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const S = st.current;
    S.drag = true;
    S.dragX = e.clientX;
    S.dragV = 0;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const S = st.current;
    if (!S.drag) return;
    const dx = e.clientX - S.dragX;
    S.dragX = e.clientX;
    S.spin = Math.max(-1.15, Math.min(1.15, S.spin + dx * 0.011));
    S.dragV = dx * 0.011 * 60;
  };
  const onUp = () => {
    st.current.drag = false;
  };
  useFrame(() => {
    const s = store.get();
    const S = st.current;
    const b = body.current;
    if (!b) return;
    if (!s.reduced) {
      if (!S.drag) {
        S.spin += S.dragV * rig.dt;
        S.dragV *= Math.max(0, 1 - 2.2 * rig.dt);
        const sway = Math.sin(rig.time * 0.21) * 0.5;
        S.spin += (sway - S.spin) * Math.min(1, 0.5 * rig.dt);
      }
      S.spin = Math.max(-1.15, Math.min(1.15, S.spin));
      S.yaw = damp(S.yaw, s.pointer && !S.drag ? s.px * 0.3 : 0, 0.4, rig.dt);
    } else {
      S.spin = 0;
      S.yaw = 0;
    }
    b.rotation.y = S.spin + S.yaw;
  });
  if (!mesh || !material) return null;
  return (
    <group ref={group} name="statue" position={position} scale={scale}>
      <mesh position={[bounds.cx, bounds.bottom - 0.17, bounds.cz]}>
        <boxGeometry args={[bounds.w * 1.1, 0.34, bounds.d * 1.1]} />
        <meshPhysicalMaterial color="#050509" metalness={0.75} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={0.6} />
      </mesh>
      <group ref={body} position={[0, -bounds.bottom + bounds.bottom, 0]}>
        <mesh
          geometry={mesh.geometry}
          material={material}
          position={mesh.position}
          quaternion={mesh.quaternion}
          scale={mesh.scale}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerOut={onUp}
          onPointerOver={(e) => {
            e.stopPropagation();
            store.set({ hover: "drag", hoverLabel: d.cursor.drag });
          }}
          onPointerLeave={() => {
            if (store.get().hover === "drag") store.set({ hover: null, hoverLabel: "" });
          }}
        />
      </group>
    </group>
  );
}
