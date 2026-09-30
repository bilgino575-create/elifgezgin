"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, Group, LinearFilter, LinearMipmapLinearFilter, Mesh, MeshStandardMaterial, SRGBColorSpace } from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { damp } from "maath/easing";
import { store } from "@/lib/store";
import { actById, range } from "@/lib/acts";
import { site } from "@/lib/content";
import { rig } from "../rig/CameraRig";
import { embossNormal, paperMaterial } from "../materials/paper";
import { display, fontsReady, text } from "../utils/text";
import { useDispose, useDisposeAll } from "../utils/useDispose";
import { audio } from "@/lib/audio";

const CHIP_L = 0.92;
const CHIP_W = 0.26;
const CHIP_T = 0.008;
const FAN = 1.35; // radians the book opens

/** mix the spot colour toward paper: the swatch book is one ink in tints */
function tint(hex: string, t: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const m = (c: number) => Math.round(c + (246 - c) * (1 - t));
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}

/** A chip's print: the tint block, the skill's name, the tint value. */
function chipTexture(name: string, t: number, dark: boolean) {
  const W = 1024;
  const H = Math.round((W * CHIP_W) / CHIP_L);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = dark ? "#1f1f22" : "#f7f6f2";
  ctx.fillRect(0, 0, W, H);
  // the colour block runs to the tip (the part a fanned book shows); the name sits on it
  const col = tint(site.spotColor, t);
  ctx.fillStyle = col;
  ctx.fillRect(W * 0.3, 0, W * 0.7, H);
  // a fanned book only shows the tips: the name and the tint value live there
  const onDark = t > 0.55;
  ctx.fillStyle = onDark ? "#ffffff" : "#111214";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "right";
  ctx.font = text(Math.round(H * 0.2), 600);
  ctx.fillText(name, W * 0.96, H * 0.47);
  ctx.font = text(Math.round(H * 0.13), 500);
  ctx.globalAlpha = 0.8;
  ctx.fillText(`EG ${Math.round(t * 100)}`, W * 0.96, H * 0.72);
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
  ctx.fillStyle = dark ? "#6e6e73" : "#9a9a98";
  ctx.font = text(Math.round(H * 0.13), 500);
  ctx.fillText(String(Math.round(t * 100)), W * 0.05, H * 0.6);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Act III. A Pantone-style swatch book on a rivet: one chip per skill, the
 * one spot colour in descending tints. Scrolling fans it open; hovering or
 * focusing a chip lifts it. The tools are blind-embossed on a card beside it.
 */
export default function Swatches() {
  const act = actById("swatch");
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState(store.get().theme);
  useEffect(() => {
    let on = true;
    fontsReady().then(() => on && setReady(true));
    const unsub = store.subscribe(() => setTheme((t) => (t === store.get().theme ? t : store.get().theme)));
    return () => {
      on = false;
      unsub();
    };
  }, []);
  const skills = site.skills;
  const n = skills.length;
  const textures = useMemo(
    () => (ready ? skills.map((s, i) => chipTexture(s.name.tr, 1 - (i / Math.max(1, n - 1)) * 0.65, theme === "dark")) : []),
    [ready, skills, n, theme]
  );
  useDisposeAll(textures);
  const geo = useMemo(() => new RoundedBoxGeometry(CHIP_L, CHIP_T, CHIP_W, 2, 0.004), []);
  useDispose(geo);
  const mats = useMemo(
    () => textures.map((tex) => paperMaterial({ map: tex, grainScale: 1.2, grainStrength: 0.25, roughness: 0.55, sheen: 0.35 })),
    [textures]
  );
  useDisposeAll(mats);
  const edge = useMemo(() => new MeshStandardMaterial({ color: "#e6e4dd", roughness: 0.9 }), []);
  const rivet = useMemo(() => new MeshStandardMaterial({ color: "#1a1a1c", roughness: 0.35, metalness: 0.6 }), []);
  useDispose(edge);
  useDispose(rivet);
  const chips = useRef<(Group | null)[]>([]);
  const root = useRef<Group>(null);

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    const p = rig.p;
    g.visible = p > 0.4 && p < 0.66;
    if (!g.visible) return;
    const s = store.get();
    const cdt = Math.min(dt, 1 / 20);
    // the book opens across the act; reduced motion shows it open
    const open = s.reducedMotion ? 1 : range(p, act.start + 0.01, act.start + 0.11);
    chips.current.forEach((c, i) => {
      if (!c) return;
      const k = n > 1 ? i / (n - 1) : 0;
      // the book fans toward the camera (rotation about y from 0 to -FAN)
      const target = 0.08 - k * FAN * open;
      damp(c.rotation, "y", target, 0.2, cdt);
      const hot = s.hoverSkill === skills[i].id;
      damp(c.position, "y", CHIP_T * (i + 1) + (hot ? 0.06 : 0), 0.15, cdt);
      damp(c.rotation, "z", hot ? 0.06 : 0, 0.15, cdt);
    });
  });

  const handlers = (id: string) => ({
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (store.get().hoverSkill !== id) {
        store.set({ hoverSkill: id });
        audio.rustle(0.2);
      }
    },
    onPointerOut: () => {
      if (store.get().hoverSkill === id) store.set({ hoverSkill: null });
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      store.set({ hoverSkill: store.get().hoverSkill === id ? null : id });
    },
  });

  // the rivet sits at the book's corner; chips extend along +x from it and fan around y
  const side = store.get().touch ? -0.3 : 0.35;
  return (
    <group ref={root} position={[act.x + side, 0, -0.45]} visible={false}>
      <mesh material={rivet} position={[0, CHIP_T * (n + 1), 0]}>
        <cylinderGeometry args={[0.022, 0.022, CHIP_T * (n + 2), 24]} />
      </mesh>
      {skills.map((s, i) => (
        <group
          key={s.id}
          ref={(el) => {
            chips.current[i] = el;
          }}
          position={[0, CHIP_T * (i + 1), 0]}
          rotation-y={0.08}
        >
          <mesh geometry={geo} material={mats[i] ? [edge, edge, mats[i], edge, edge, edge] : edge} position={[CHIP_L / 2 - 0.05, 0, 0]} castShadow receiveShadow {...handlers(s.id)} />
        </group>
      ))}
      <ToolsCard x={1.15} z={-0.35} ready={ready} />
    </group>
  );
}

/** The tools, blind-embossed on a card: the lamp reveals them. */
function ToolsCard({ x, z, ready }: { x: number; z: number; ready: boolean }) {
  const W = 1.0;
  const H = 0.68;
  const emb = useMemo(() => {
    if (!ready) return null;
    return embossNormal({
      width: 1024,
      height: Math.round((1024 * H) / W),
      blur: 2.5,
      strength: 9,
      sign: -1,
      draw: (ctx, w, h) => {
        ctx.textBaseline = "alphabetic";
        ctx.font = text(Math.round(w * 0.045), 600);
        const cols = 2;
        const rows = Math.ceil(site.tools.length / cols);
        site.tools.forEach((tool, i) => {
          const cx = w * 0.09 + (i % cols) * w * 0.46;
          const cy = h * 0.28 + Math.floor(i / cols) * (h * 0.62) / Math.max(1, rows - 1);
          ctx.fillText(tool, cx, cy);
        });
        ctx.font = display(Math.round(w * 0.06), true);
        ctx.fillText("Araçlar", w * 0.09, h * 0.14);
      },
    });
  }, [ready]);
  useDispose(emb?.normal);
  useDispose(emb?.mask);
  const geo = useMemo(() => new RoundedBoxGeometry(W, 0.012, H, 2, 0.004), []);
  const mat = useMemo(() => paperMaterial({ color: "#f5f4ef", emboss: emb?.normal ?? null, ao: emb?.mask ?? null, embossStrength: 1.2, grainScale: 1.4, grainStrength: 0.35, roughness: 0.78 }), [emb]);
  useDispose(geo);
  useDispose(mat);
  const mesh = useRef<Mesh>(null);
  return <mesh ref={mesh} geometry={geo} material={mat} position={[x, 0.006, z]} rotation-y={-0.18} castShadow receiveShadow />;
}
