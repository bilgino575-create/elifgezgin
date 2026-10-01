"use client";

import { MeshTransmissionMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, Color, ExtrudeGeometry, type Material, MeshMatcapMaterial, SRGBColorSpace, type Group } from "three";
import type { Glyphs } from "./glyphs";
import { useStore, type Tier } from "@/lib/store";
import { useDispose } from "../../utils/useDispose";

/**
 * The solid name: the traced letterforms extruded with a bevel and cast in
 * transmissive glass. The living ink behind refracts through it, with
 * dispersion on HIGH/ULTRA. LOW uses a procedural matcap instead of
 * transmission (no scene buffer, one pass).
 */
export const GLASS = { depth: 0.09, bevel: 0.022 };

function buildGeometry(g: Glyphs) {
  const geo = new ExtrudeGeometry(g.shapes, {
    depth: GLASS.depth,
    bevelEnabled: true,
    bevelThickness: GLASS.bevel,
    bevelSize: GLASS.bevel * 0.9,
    bevelSegments: 3,
    curveSegments: 3,
  });
  geo.translate(0, 0, -GLASS.depth / 2);
  geo.computeVertexNormals();
  // a vertex owned only by degenerate triangles keeps a zero normal; normalize(0) is NaN on the GPU
  const n = geo.getAttribute("normal");
  const a = n.array as Float32Array;
  for (let i = 0; i < a.length; i += 3) {
    const l = a[i] * a[i] + a[i + 1] * a[i + 1] + a[i + 2] * a[i + 2];
    if (!(l > 1e-12)) {
      a[i] = 0;
      a[i + 1] = 0;
      a[i + 2] = 1;
    }
  }
  n.needsUpdate = true;
  return geo;
}

/** A procedural matcap: a lit glass sphere in the spot colour, drawn on a canvas. */
function makeMatcap(spot: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const body = ctx.createRadialGradient(150, 150, 20, 128, 128, 128);
  body.addColorStop(0, "#0e0e1c");
  body.addColorStop(0.55, spot);
  body.addColorStop(0.92, "#ffffff");
  body.addColorStop(1, "#ffffff");
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, 256, 256);
  const hi = ctx.createRadialGradient(84, 78, 4, 84, 78, 70);
  hi.addColorStop(0, "rgba(255,255,255,0.95)");
  hi.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hi;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export default function Glass({
  lines,
  layout,
  tier,
  spot,
  groupRef,
}: {
  lines: Glyphs[];
  layout: { x: number; y: number; s: number }[];
  tier: Tier;
  spot: string;
  groupRef: React.RefObject<Group | null>;
}) {
  const geometries = useMemo(() => lines.map(buildGeometry), [lines]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  const matcap = useDispose(useMemo(() => (tier === "low" ? makeMatcap(spot) : null), [tier, spot]));
  const lowMat = useDispose(useMemo(() => (matcap ? new MeshMatcapMaterial({ matcap, color: new Color("#e8ecff") }) : null), [matcap]));
  const samples = tier === "ultra" ? 6 : tier === "high" ? 4 : 2;
  const light = useStore((s) => s.theme) === "light";
  // the transmission material renders the whole scene into its buffer every frame while *it* is visible, whether or
  // not its mesh is: once the name is off stage, those two extra scene renders per frame go with it
  const mats = useRef<(Material | null)[]>([]);
  useFrame(() => {
    const v = groupRef.current?.visible ?? false;
    for (const m of mats.current) if (m && m.visible !== v) m.visible = v;
  });
  return (
    <group ref={groupRef} visible={false}>
      {geometries.map((geo, i) => (
        <mesh key={i} geometry={geo} position={[layout[i]?.x ?? 0, layout[i]?.y ?? 0, 0]} scale={layout[i]?.s ?? 1}>
          {lowMat ? (
            <primitive object={lowMat} attach="material" />
          ) : (
            <MeshTransmissionMaterial
              ref={(m) => void (mats.current[i] = m as Material | null)}
              samples={samples}
              resolution={tier === "ultra" ? 1024 : 512}
              transmission={1}
              thickness={0.5}
              roughness={0.06}
              ior={1.5}
              chromaticAberration={tier === "mid" ? 0 : 0.14}
              anisotropicBlur={0.12}
              distortion={0.25}
              distortionScale={0.6}
              temporalDistortion={0.08}
              color="#ffffff"
              attenuationColor="#dde2ff"
              envMapIntensity={2.4}
              clearcoat={1}
              clearcoatRoughness={0.1}
              emissive={spot}
              emissiveIntensity={0}
              attenuationDistance={light ? 2.5 : 3}
            />
          )}
        </mesh>
      ))}
    </group>
  );
}
