"use client";

import { Suspense } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import CameraRig from "./rig/CameraRig";
import Tiering from "./Tiering";
import StatsWriter from "./StatsWriter";
import Backdrop from "./stage/Backdrop";
import FluidSim, { FLUID_BY_TIER } from "./fluid/Fluid";
import Name from "./acts/name/Name";
import Portals from "./acts/portals/Portals";
import Card from "./acts/card/Card";
import Ribbon from "./acts/ribbon/Ribbon";
import Machine from "./acts/machine/Machine";
import Morph from "./particles/Morph";
import Post from "./Post";
import { useStore } from "@/lib/store";
import { site } from "@/lib/content";

export default function Scene() {
  const tier = useStore((s) => s.tier);
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
        <Ribbon />
        <Machine />
        <Card />
        <Morph />
      </Suspense>
      <Post />
    </>
  );
}
