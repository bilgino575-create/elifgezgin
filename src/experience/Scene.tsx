"use client";

import { Suspense, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Environment, Lightformer } from "@react-three/drei";
import CameraRig from "./rig/CameraRig";
import Tiering from "./Tiering";
import StatsWriter from "./StatsWriter";
import Backdrop from "./stage/Backdrop";
import FluidSim, { FLUID_BY_TIER } from "./fluid/Fluid";
import Name from "./acts/name/Name";
import Portals from "./acts/portals/Portals";
import Card from "./acts/card/Card";
import Morph from "./particles/Morph";
import Statue, { statueUrl } from "./acts/statue/Statue";
import Post from "./Post";
import { store, useStore } from "@/lib/store";
import { site } from "@/lib/content";

export default function Scene() {
  const tier = useStore((s) => s.tier);
  // the statue loads after first paint (this chunk already does), the file chosen by tier and input; the particle portrait stands in until it arrives
  useEffect(() => {
    const url = statueUrl(tier, store.get().touch);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "fetch";
    link.href = url;
    document.head.appendChild(link);
    useGLTF.preload(url, false, true);
    return () => link.remove();
  }, [tier]);
  return (
    <>
      <CameraRig />
      <Tiering />
      <StatsWriter />
      <Backdrop />
      {tier !== "low" ? <FluidSim config={FLUID_BY_TIER[tier]} /> : null}
      {/* a procedural studio: one big soft top light, two coloured strips, no HDR asset */}
      <Environment resolution={tier === "low" ? 64 : 256} frames={1}>
        <Lightformer intensity={2.2} rotation-x={Math.PI / 2} position={[0, 5, -2]} scale={[12, 12, 1]} color="#ffffff" />
        <Lightformer intensity={1.6} rotation-y={Math.PI / 2} position={[-6, 1, 0]} scale={[8, 3, 1]} color={site.spotColor} />
        <Lightformer intensity={1.2} rotation-y={-Math.PI / 2} position={[6, -1, 0]} scale={[8, 3, 1]} color="#ff2e88" />
        <Lightformer intensity={0.8} position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} color="#00c8ff" />
      </Environment>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-4, 6, 5]} intensity={1.4} />
      <pointLight position={[4, -3, 4]} intensity={6} color="#ff2e88" distance={14} />
      <Suspense fallback={null}>
        <Name />
        <Portals />
        <Card />
        <Morph />
        <Suspense fallback={null}>
          <Statue />
        </Suspense>
      </Suspense>
      <Post />
    </>
  );
}
