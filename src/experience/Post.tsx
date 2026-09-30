"use client";

import { EffectComposer, DepthOfField, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction, type DepthOfFieldEffect } from "postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { useStore } from "@/lib/store";
import { rig } from "./rig/CameraRig";

/**
 * HIGH tier only: a very shallow depth of field (paper away from the act's
 * focus softens like a macro lens), 2 % grain and a faint vignette. No bloom.
 */
export default function Post() {
  const tier = useStore((s) => s.tier);
  const dof = useRef<DepthOfFieldEffect>(null);
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    const d = dof.current;
    if (!d) return;
    // focus on the act's subject; a wide range so only the far edges soften
    const dist = camera.position.distanceTo(rig.target);
    const cc = d.cocMaterial;
    if (Math.abs(cc.worldFocusDistance - dist) > 0.01) cc.worldFocusDistance = dist;
    if (Math.abs(cc.worldFocusRange - 3.2) > 0.01) cc.worldFocusRange = 3.2;
  });
  if (tier !== "high") return null;
  return (
    <EffectComposer multisampling={0} depthBuffer>
      <DepthOfField ref={dof} worldFocusDistance={3.5} worldFocusRange={3.2} bokehScale={1.1} />
      <Noise premultiply opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={0.32} darkness={0.22} />
    </EffectComposer>
  );
}
