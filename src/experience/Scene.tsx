"use client";

import { Suspense } from "react";
import CameraRig from "./rig/CameraRig";
import Tiering from "./Tiering";
import StatsWriter from "./StatsWriter";
import Sky from "./studio/Sky";
import Lamp from "./studio/Lamp";
import Table from "./studio/Table";
import Sheet from "./acts/Sheet";
import Wall from "./acts/wall/Wall";
import Swatches from "./acts/Swatches";
import Fold from "./acts/Fold";
import Portrait from "./acts/Portrait";
import Card from "./acts/Card";
import Post from "./Post";

export default function Scene() {
  return (
    <>
      <CameraRig />
      <Tiering />
      <StatsWriter />
      <Sky />
      <Lamp />
      <Table />
      <Suspense fallback={null}>
        <Sheet />
        <Wall />
        <Swatches />
        <Fold />
        <Portrait />
        <Card />
      </Suspense>
      <Post />
    </>
  );
}
