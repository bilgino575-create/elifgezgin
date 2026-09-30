"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BoxGeometry, CanvasTexture, Group, Mesh, MeshPhysicalMaterial, SRGBColorSpace, Texture, LinearFilter, LinearMipmapLinearFilter, type PerspectiveCamera } from "three";
import { damp } from "maath/easing";
import { loading, store } from "@/lib/store";
import { smoothstep } from "@/lib/acts";
import { site } from "@/lib/content";
import { rig } from "../rig/CameraRig";
import { embossNormal, paperMaterial } from "../materials/paper";
import { display, fontsReady } from "../utils/text";
import { useDispose } from "../utils/useDispose";
import { works } from "@/content/works.generated";
import { getWorkTexture } from "../materials/textures";
import { layout } from "./wall/layout";

/** where the first work rests on the wall: the sheet's destination */
const firstSlot = layout(works, "all", false)[0] ?? null;

/** sheet size in world units (a portrait sheet lying on the table) */
export const SHEET_W = 1.32;
export const SHEET_H = 1.76;
const THICK = 0.012;

interface Deboss {
  normal: CanvasTexture;
  mask: CanvasTexture;
  ink: CanvasTexture;
}

/** The name pressed into the paper; "Grafik Tasarımcı" smaller; the spot line printed in ink. */
function makeDeboss(spot: string, dark: boolean): Deboss {
  const W = 1536;
  const H = 2048;
  const { normal, mask } = embossNormal({
    width: W,
    height: H,
    blur: 4,
    strength: 13,
    sign: -1,
    draw: (ctx, w, h) => {
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      const x = w * 0.08;
      ctx.font = display(Math.round(w * 0.36));
      ctx.fillText(site.firstName, x, h * 0.36);
      ctx.fillText(site.lastName, x, h * 0.6);
      // registration mark, bottom right
      const cx = w * 0.9;
      const cy = h * 0.92;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.moveTo(cx - 44, cy);
      ctx.lineTo(cx + 44, cy);
      ctx.moveTo(cx, cy - 44);
      ctx.lineTo(cx, cy + 44);
      ctx.stroke();
    },
  });
  // the ink layer: paper colour with the spot line
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  paintInk(ctx, mask.image as HTMLCanvasElement, spot, dark);
  const ink = new CanvasTexture(c);
  ink.colorSpace = SRGBColorSpace;
  ink.minFilter = LinearMipmapLinearFilter;
  ink.magFilter = LinearFilter;
  ink.anisotropy = 8;
  return { normal, mask, ink };
}

/** Paper tone, a faint letterpress tint where the plate pressed, the spot line in ink. */
function paintInk(ctx: CanvasRenderingContext2D, mask: HTMLCanvasElement, spot: string, dark: boolean) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = dark ? "#1a1a1c" : "#f6f5f1";
  ctx.fillRect(0, 0, W, H);
  // the impression is a shade darker (light) / lighter (dark): the ink the plate left behind
  if (dark) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.12;
    ctx.drawImage(mask, 0, 0);
  } else {
    // invert the mask (white paper, black impression) and multiply it in
    const inv = document.createElement("canvas");
    inv.width = W;
    inv.height = H;
    const ictx = inv.getContext("2d")!;
    ictx.fillStyle = "#fff";
    ictx.fillRect(0, 0, W, H);
    ictx.globalCompositeOperation = "difference";
    ictx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.13;
    ctx.drawImage(inv, 0, 0);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  void spot;
}

/**
 * Act I. The hero sheet floats 0.08 above the table. Scroll lifts it, turns
 * it about x then y, so its back — the first work — faces the camera as we
 * move toward the wall.
 */
export default function Sheet() {
  const group = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const [deboss, setDeboss] = useState<Deboss | null>(null);
  const [themeKey, setThemeKey] = useState(store.get().theme);
  const camera = useThree((st) => st.camera) as PerspectiveCamera;
  const size = useThree((st) => st.size);
  /** where the sheet rests so the debossed name sits exactly under the hero's <h1> */
  const fit = useRef({ x: 0.4, z: 0, scale: 1, stamp: -1 });
  const loose = useRef<Group>(null);

  useEffect(() => {
    let cancelled = false;
    fontsReady().then(() => {
      if (cancelled) return;
      setDeboss(makeDeboss(site.spotColor, store.get().theme === "dark"));
      store.set({ deboss: true });
      document.documentElement.classList.add("deboss");
      loading.done("scene");
    });
    const unsub = store.subscribe(() => {
      const t = store.get().theme;
      setThemeKey((k) => (k === t ? k : t));
    });
    return () => {
      cancelled = true;
      unsub();
      document.documentElement.classList.remove("deboss");
      store.set({ deboss: false });
    };
  }, []);
  // re-ink for the darkroom (the impression itself stays)
  useEffect(() => {
    if (!deboss) return;
    const dark = themeKey === "dark";
    const c = deboss.ink.image as HTMLCanvasElement;
    paintInk(c.getContext("2d")!, deboss.mask.image as HTMLCanvasElement, site.spotColor, dark);
    deboss.ink.needsUpdate = true;
  }, [themeKey, deboss]);

  const geo = useMemo(() => {
    const g = new BoxGeometry(SHEET_W, THICK, SHEET_H, 1, 1, 1);
    // face 3 (-y, the back) shows the artwork after the sheet stands up and turns: rotate its uvs 180°
    const uv = g.attributes.uv;
    for (let i = 12; i < 16; i++) uv.setXY(i, 1 - uv.getX(i), 1 - uv.getY(i));
    uv.needsUpdate = true;
    return g;
  }, []);
  const front = useMemo(
    () =>
      paperMaterial({
        emboss: deboss?.normal ?? null,
        ao: deboss?.mask ?? null,
        map: deboss?.ink ?? null,
        embossStrength: 1.15,
        grainScale: 2.2,
      }),
    [deboss]
  );
  const back = useMemo(() => {
    const first = works[0];
    const tex: Texture | null = first ? getWorkTexture(first.slug, first.cover.src1024) : null;
    return paperMaterial({ map: tex, grainScale: 2.2, grainStrength: 0.22, roughness: 0.6 });
  }, []);
  const edge = useMemo(() => new MeshPhysicalMaterial({ color: "#e9e7e0", roughness: 0.9 }), []);
  useDispose(geo);
  useDispose(front);
  useDispose(back);
  useDispose(edge);
  useDispose(deboss?.normal);
  useDispose(deboss?.mask);
  useDispose(deboss?.ink);

  // box face order: +x, -x, +y (top), -y (bottom), +z, -z
  const materials = useMemo(() => [edge, edge, front, back, edge, edge], [edge, front, back]);

  /**
   * With the hero camera looking straight down, the table is parallel to the
   * screen: the sheet is scaled so the pressed name has the <h1>'s font size
   * and placed so its first baseline lands on the heading's. The HTML name
   * is transparent while the deboss is on; its box stays, nothing shifts.
   */
  const fitToHero = () => {
    const h1 = document.querySelector<HTMLElement>("#giris .h1");
    const f = fit.current;
    if (!h1) return;
    const r = h1.getBoundingClientRect();
    if (r.width < 10) return;
    const fs = parseFloat(getComputedStyle(h1).fontSize) || 96;
    const camH = camera.position.y - 0.08;
    const upp = (2 * camH * Math.tan((camera.fov * Math.PI) / 360)) / size.height;
    // canvas font is 0.36 × canvas width; canvas width maps to SHEET_W × scale world units
    f.scale = Math.max(0.5, Math.min(3, (fs * upp) / (0.36 * SHEET_W)));
    const worldX = (px: number) => camera.position.x + (px - size.width / 2) * upp;
    const worldZ = (py: number) => camera.position.z + (py - size.height / 2) * upp;
    // first baseline: line-height 0.92 em, Instrument Serif ascent ≈ 0.78 em of the line box
    const baseline1 = r.top + fs * 0.92 * 0.78;
    f.x = worldX(r.left) - (0.08 - 0.5) * SHEET_W * f.scale;
    f.z = worldZ(baseline1) - (0.36 - 0.5) * SHEET_H * f.scale;
    if (store.get().debug) (window as Window & { __fit?: unknown }).__fit = { ...f, rect: [r.left, r.top, r.width, r.height], fs, upp };
  };

  useFrame((_, dt) => {
    const g = group.current;
    const t = tilt.current;
    if (!g || !t) return;
    const s = store.get();
    const cdt = Math.min(dt, 1 / 20);
    const p = rig.p;
    const f = fit.current;
    // refit when the viewport changes, while the camera is still in its top-down hero pose
    if (p < 0.01 && f.stamp !== size.width * 7919 + size.height) {
      fitToHero();
      f.stamp = size.width * 7919 + size.height;
    }
    // 0 → 0.14: lift, turn about x, then y (the back faces the camera)
    const lift = smoothstep(0.02, 0.1, p);
    const turn = smoothstep(0.05, 0.14, p);
    const y = 0.08 + lift * 0.55;
    const rx = -turn * Math.PI * 0.5; // stand it up toward the camera
    const ry = turn * Math.PI; // and flip it over
    const travel = smoothstep(0.06, 0.15, p);
    const endX = firstSlot ? firstSlot.x : 3.2;
    const endY = firstSlot ? firstSlot.y : 0.9;
    const endZ = firstSlot ? firstSlot.z : 0;
    const endScale = firstSlot ? firstSlot.h / SHEET_H : 1;
    const x = f.x + travel * (endX - f.x);
    const z = f.z + travel * (endZ - f.z);
    const yy = y + travel * (endY - y);
    const sc = f.scale + (endScale - f.scale) * travel;
    loose.current?.position.set(f.x, 0.006, f.z);
    loose.current?.scale.setScalar(f.scale);
    g.position.set(x, yy, z);
    g.rotation.set(rx, ry, 0);
    g.scale.setScalar(sc);
    // the wall's own object takes over once the sheet has arrived
    g.visible = p < 0.155;
    // tilt toward the lamp (air moving, not a gimmick)
    if (!s.reducedMotion && p < 0.12) {
      const dx = rig.lamp.x - x;
      const dz = rig.lamp.z;
      const a = 0.06;
      damp(t.rotation, "x", Math.max(-a, Math.min(a, -dz * 0.05)), 0.25, cdt);
      damp(t.rotation, "z", Math.max(-a, Math.min(a, dx * 0.05)), 0.25, cdt);
    } else {
      damp(t.rotation, "x", 0, 0.25, cdt);
      damp(t.rotation, "z", 0, 0.25, cdt);
    }
  });

  return (
    <>
      <group ref={group} position={[0.4, 0.08, 0]}>
        <group ref={tilt}>
          <mesh geometry={geo} material={materials} castShadow receiveShadow />
          <ContactShadow w={SHEET_W} h={SHEET_H} />
        </group>
      </group>
      <group ref={loose}>
        <LooseSheets />
      </group>
    </>
  );
}

/** A soft, baked contact shadow under a floating sheet (cheap on every tier). */
export function ContactShadow({ w, h, y = -0.079, opacity = 0.2 }: { w: number; h: number; y?: number; opacity?: number }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 30, 128, 128, 128);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.6, "rgba(0,0,0,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const t = new CanvasTexture(c);
    return t;
  }, []);
  useDispose(tex);
  const mesh = useRef<Mesh>(null);
  useFrame(() => {
    if (!mesh.current) return;
    const m = mesh.current.material as MeshPhysicalMaterial;
    m.opacity = store.get().theme === "dark" ? opacity * 1.6 : opacity;
  });
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[0, y, 0]} renderOrder={-1}>
      <planeGeometry args={[w * 1.25, h * 1.2]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} color="#000000" />
    </mesh>
  );
}

/** Two loose sheets and an ink swatch resting around the hero, slightly out of focus. */
function LooseSheets() {
  const mat = useMemo(() => paperMaterial({ color: "#f2f1ec", grainScale: 2, grainStrength: 0.3 }), []);
  const swatch = useMemo(() => new MeshPhysicalMaterial({ color: site.spotColor, roughness: 0.55, sheen: 0.4, sheenColor: "#ffffff" }), []);
  const geo = useMemo(() => new BoxGeometry(SHEET_W * 0.78, THICK, SHEET_H * 0.78), []);
  const swatchGeo = useMemo(() => new BoxGeometry(0.34, 0.006, 0.22), []);
  useDispose(mat);
  useDispose(swatch);
  useDispose(geo);
  useDispose(swatchGeo);
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = rig.p < 0.16;
  });
  return (
    <group ref={g}>
      <mesh geometry={geo} material={mat} position={[1.55, 0, -0.75]} rotation-y={0.16} receiveShadow castShadow />
      <mesh geometry={geo} material={mat} position={[1.95, 0, 0.9]} rotation-y={-0.12} receiveShadow castShadow />
      <mesh geometry={swatchGeo} material={swatch} position={[1.1, 0.003, 1.5]} rotation-y={0.35} receiveShadow castShadow />
    </group>
  );
}
