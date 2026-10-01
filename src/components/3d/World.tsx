"use client";

import { Component, Suspense, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
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

/** the stage owes the loader one frame: the first one rendered */
function FirstFrame() {
  const paid = useRef(false);
  useFrame(() => {
    if (paid.current) return;
    paid.current = true;
    loading.done();
  });
  return null;
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
        <ColorScene lang={lang} />
      </Island>
      <Island name="tipografi">
        <TypographyScene lang={lang} />
      </Island>
      <Island name="marka">
        <BrandingScene lang={lang} />
      </Island>
      <Island name="afis">
        <PosterScene lang={lang} />
      </Island>
      <Island name="dijital">
        <DigitalArtScene lang={lang} />
      </Island>
      <Island name="elif">
        <AboutScene lang={lang} />
      </Island>
      <Island name="iletisim">
        <ContactScene />
      </Island>
      <Post />
      <Tiering />
      <FirstFrame />
    </>
  );
}
