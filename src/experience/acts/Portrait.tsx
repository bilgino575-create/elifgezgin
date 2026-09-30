"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, Group, LinearFilter, LinearMipmapLinearFilter, MeshStandardMaterial, SRGBColorSpace, Texture } from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { store } from "@/lib/store";
import { actById } from "@/lib/acts";
import { site, portrait as portraitImage } from "@/lib/content";
import { rig } from "../rig/CameraRig";
import { halftoneMaterial, type HalftoneMaterial } from "../materials/halftone";
import { paperMaterial } from "../materials/paper";
import { getWorkTexture } from "../materials/textures";
import { display, fontsReady, text } from "../utils/text";
import { useDispose } from "../utils/useDispose";

const W = 0.88;
const H = 1.1;

/** Without a photo: a typographic monogram print (the EG mark, the name, a rule). */
function monogramTexture() {
  const w = 1024;
  const h = Math.round((w * H) / W);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  // a soft grey field so the halftone has tone to work with
  const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 40, w * 0.5, h * 0.42, w * 0.8);
  g.addColorStop(0, "#bdbdbd");
  g.addColorStop(1, "#f2f2f2");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 62;
  ctx.lineCap = "square";
  ctx.save();
  ctx.translate(w * 0.5, h * 0.4);
  ctx.scale(6.4, 6.4);
  ctx.beginPath();
  ctx.moveTo(-24, -14);
  ctx.lineTo(-10, -14);
  ctx.moveTo(-24, -14);
  ctx.lineTo(-24, 14);
  ctx.lineTo(-10, 14);
  ctx.moveTo(-24, 0);
  ctx.lineTo(-14, 0);
  ctx.lineWidth = 4.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(8, 0, 10.5, -1.2, 4.3);
  ctx.moveTo(18.5, 0);
  ctx.lineTo(18.5, 8);
  ctx.lineTo(11.5, 8);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.font = display(96);
  ctx.fillText(site.name, w / 2, h * 0.76);
  ctx.font = text(30, 500);
  ctx.fillStyle = "#444";
  ctx.fillText(site.title.tr.toLocaleUpperCase("tr-TR").split("").join(" "), w / 2, h * 0.82);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Act V. The printed portrait: a halftone print standing on the table, its
 * dots resolving into tone where the lamp falls. A photo from content/ when
 * there is one, the typographic monogram otherwise.
 */
export default function Portrait() {
  const act = actById("portrait");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let on = true;
    fontsReady().then(() => on && setReady(true));
    return () => {
      on = false;
    };
  }, []);
  const image: Texture | null = useMemo(() => {
    if (portraitImage) return getWorkTexture("portrait", portraitImage.src);
    return ready ? monogramTexture() : null;
  }, [ready]);
  useDispose(portraitImage ? null : image);
  const geo = useMemo(() => new RoundedBoxGeometry(W, H, 0.012, 2, 0.004), []);
  const mat = useMemo(() => (image ? halftoneMaterial(image, { grainScale: 1.6, grainStrength: 0.3, roughness: 0.62, sheen: 0.4 }) : paperMaterial({ color: "#f7f6f2" })), [image]);
  const back = useMemo(() => paperMaterial({ color: "#efeee8", grainScale: 1.6 }), []);
  const block = useMemo(() => new MeshStandardMaterial({ color: "#1a1a1c", roughness: 0.6 }), []);
  const loose = useMemo(() => paperMaterial({ color: "#f3f2ed", grainScale: 2 }), []);
  useDispose(geo);
  useDispose(mat);
  useDispose(back);
  useDispose(block);
  useDispose(loose);
  const root = useRef<Group>(null);
  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const p = rig.p;
    g.visible = p > 0.72 && p < 0.905;
    if (!g.visible) return;
    const hm = mat as HalftoneMaterial;
    if (hm.halftone) {
      hm.halftone.uLampPos.value.set(rig.lamp.x, 0.6, rig.lamp.z);
      hm.halftone.uPaperTone.value = store.get().theme === "dark" ? 0.86 : 1;
    }
  });
  const mats = useMemo(() => [back, back, back, back, mat, back], [mat, back]);
  const side = store.get().touch ? 0 : -1.35;
  return (
    <group ref={root} position={[act.x + side, 0, 0]} visible={false}>
      <group position={[0.15, H / 2 + 0.02, 0]} rotation-x={-0.14}>
        <mesh geometry={geo} material={mats} castShadow receiveShadow />
      </group>
      <mesh material={block} position={[0.15, 0.04, -0.14]}>
        <boxGeometry args={[0.6, 0.08, 0.2]} />
      </mesh>
      {/* two loose prints on the table */}
      <mesh material={loose} position={[-0.95, 0.004, 0.45]} rotation-y={0.3} rotation-x={-Math.PI / 2} receiveShadow castShadow>
        <planeGeometry args={[0.7, 0.9]} />
      </mesh>
      <mesh material={loose} position={[1.25, 0.004, 0.6]} rotation-y={-0.2} rotation-x={-Math.PI / 2} receiveShadow castShadow>
        <planeGeometry args={[0.6, 0.8]} />
      </mesh>
    </group>
  );
}
