"use client";

import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { loading, store } from "@/lib/store";
import CameraRig from "./CameraRig";
import Backdrop from "./Backdrop";
import Env from "./Env";
import CursorLight from "./CursorLight";
import ParticleField from "./ParticleField";
import Floor from "./Floor";
import Post from "./Post";
import Tiering from "./Tiering";
import ColorScene from "./scenes/ColorScene";
import TypographyScene from "./scenes/TypographyScene";
import BrandingScene from "./scenes/BrandingScene";
import PosterScene from "./scenes/PosterScene";
import DigitalArtScene from "./scenes/DigitalArtScene";
import AboutScene from "./scenes/AboutScene";
import ContactScene from "./scenes/ContactScene";
import { useLang } from "./scenes/common";
import { near } from "./rig";

/**
 * The stage owes the loader one frame. Before it, every program the first
 * frame needs is compiled off the main thread where the driver allows
 * (KHR_parallel_shader_compile), so the first frame is a draw, not a stall.
 */
function FirstFrame() {
  const paid = useRef(false);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let alive = true;
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!alive || paid.current) return;
        paid.current = true;
        loading.done();
      });
    return () => {
      alive = false;
    };
  }, [gl, scene, camera]);
  // and if the driver cannot say when it is done, the first drawn frame pays
  useFrame(() => {
    if (paid.current) return;
    paid.current = true;
    loading.done();
  }, 2000);
  return null;
}

/**
 * An installation mounts when the camera first comes within one stop of
 * it (the entrance and its neighbour at once, the rest as the route is
 * walked), so the letterforms, geometry and textures of seven stops are
 * never built in one frame. Once mounted it stays.
 */
function Lazy({ j, children }: { j: number; children: ReactNode }) {
  const [on, setOn] = useState(j <= 1);
  useFrame(() => {
    if (!on && near(j)) setOn(true);
  });
  return on ? <>{children}</> : null;
}

/** one installation failing (a texture, a font) must not take the rest of the route with it */
class Island extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.error(`[stage] ${this.props.name} failed`, err);
    // the loader must never wait on a failed island
    if (this.props.name === "renk" && store.get().loadDone < store.get().loadTotal) loading.done();
  }
  render() {
    return this.state.failed ? null : <Suspense fallback={null}>{this.props.children}</Suspense>;
  }
}

/** everything on the stage, in draw order: the void, the lights, the dust, the floor, the seven installations, the post. */
export default function World() {
  const lang = useLang();
  return (
    <>
      <CameraRig />
      <Backdrop />
      <Env />
      <CursorLight />
      <ambientLight intensity={0.3} />
      <directionalLight position={[6, 9, 7]} intensity={1.0} color="#ffffff" />
      <ParticleField />
      <Floor />
      <Island name="renk">
        <Lazy j={0}>
          <ColorScene lang={lang} />
        </Lazy>
      </Island>
      <Island name="tipografi">
        <Lazy j={1}>
          <TypographyScene lang={lang} />
        </Lazy>
      </Island>
      <Island name="marka">
        <Lazy j={2}>
          <BrandingScene lang={lang} />
        </Lazy>
      </Island>
      <Island name="afis">
        <Lazy j={3}>
          <PosterScene lang={lang} />
        </Lazy>
      </Island>
      <Island name="dijital">
        <Lazy j={4}>
          <DigitalArtScene lang={lang} />
        </Lazy>
      </Island>
      <Island name="elif">
        <Lazy j={5}>
          <AboutScene lang={lang} />
        </Lazy>
      </Island>
      <Island name="iletisim">
        <Lazy j={6}>
          <ContactScene />
        </Lazy>
      </Island>
      <Post />
      <Tiering />
      <FirstFrame />
    </>
  );
}
