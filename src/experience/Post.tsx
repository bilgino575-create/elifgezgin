"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useStore } from "@/lib/store";

/**
 * HIGH/ULTRA only: bloom on the specular peaks (glass edges, foil) and a
 * faint vignette. The composer keeps a stencil buffer for the portals.
 */
export default function Post() {
  const tier = useStore((s) => s.tier);
  if (tier !== "high" && tier !== "ultra") return null;
  return (
    <EffectComposer multisampling={tier === "ultra" ? 4 : 0} stencilBuffer depthBuffer>
      <Bloom mipmapBlur luminanceThreshold={0.82} luminanceSmoothing={0.2} intensity={tier === "ultra" ? 1.0 : 0.8} radius={0.6} />
      <Vignette eskil={false} offset={0.28} darkness={0.35} />
    </EffectComposer>
  );
}
