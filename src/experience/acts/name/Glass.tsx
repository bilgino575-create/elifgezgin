"use client";

import { MeshTransmissionMaterial } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { CanvasTexture, Color, ExtrudeGeometry, MeshMatcapMaterial, SRGBColorSpace, type Group } from "three";
import type { Glyphs } from "./glyphs";
import { useStore, type Tier } from "@/lib/store";
import { useDispose } from "../../utils/useDispose";

/**
 * The solid name: the traced letterforms extruded with a bevel and cast in
 * transmissive glass. The living ink behind refracts through it, with
 * dispersion on HIGH/ULTRA. LOW uses a procedural matcap instead of
 * transmission (no scene buffer, one pass).
 */
export const GLASS = { depth: 0.22, bevel: 0.028 };

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
  return (
    <group ref={groupRef} visible={false}>
      {geometries.map((geo, i) => (
        <mesh key={i} geometry={geo} position={[layout[i]?.x ?? 0, layout[i]?.y ?? 0, 0]} scale={layout[i]?.s ?? 1}>
          {lowMat ? (
            <primitive object={lowMat} attach="material" />
          ) : (
            <MeshTransmissionMaterial
              samples={samples}
              resolution={tier === "ultra" ? 1024 : 512}
              transmission={1}
              thickness={0.9}
              roughness={0.12}
              ior={1.5}
              chromaticAberration={tier === "mid" ? 0 : 0.14}
              anisotropicBlur={0.12}
              distortion={0.25}
              distortionScale={0.6}
              temporalDistortion={0.08}
              color="#ffffff"
              attenuationColor={spot}
              envMapIntensity={3.0}
              clearcoat={1}
              clearcoatRoughness={0.1}
              emissive={spot}
              emissiveIntensity={light ? 0.04 : 0.14}
              attenuationDistance={light ? 1.2 : 2.2}
            />
          )}
        </mesh>
      ))}
    </group>
  );
}
