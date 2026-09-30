"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BoxGeometry, CanvasTexture, Group, LinearFilter, LinearMipmapLinearFilter, MeshStandardMaterial, SRGBColorSpace } from "three";
import { damp } from "maath/easing";
import { store } from "@/lib/store";
import { actById, clamp01 } from "@/lib/acts";
import { site } from "@/lib/content";
import { rig } from "../rig/CameraRig";
import { paperMaterial } from "../materials/paper";
import { display, fontsReady, text } from "../utils/text";
import { useDispose, useDisposeAll } from "../utils/useDispose";

const PANEL_W = 0.46;
const PANEL_D = 0.64;
const T = 0.006;

/** wrap a line of text to a width */
function wrap(ctx: CanvasRenderingContext2D, s: string, max: number) {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function panelTexture(i: number, title: string, body: string, dark: boolean, lang: "tr" | "en") {
  const W = 768;
  const H = Math.round((W * PANEL_D) / PANEL_W);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = dark ? "#1e1e21" : "#f7f6f2";
  ctx.fillRect(0, 0, W, H);
  const ink = dark ? "#f1efe9" : "#111214";
  const ink2 = dark ? "#a9a8a3" : "#55565b";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = site.spotColor;
  ctx.font = text(34, 600);
  ctx.fillText(String(i + 1).padStart(2, "0"), 64, 120);
  ctx.fillStyle = ink;
  ctx.font = display(100);
  const tl = wrap(ctx, title, W - 128);
  tl.forEach((l, k) => ctx.fillText(l, 64, 236 + k * 104));
  ctx.fillStyle = ink2;
  ctx.font = text(38, 400);
  const bl = wrap(ctx, body, W - 128);
  bl.forEach((l, k) => ctx.fillText(l, 64, 236 + tl.length * 104 + 52 + k * 52));
  // a crease mark on the right edge (the spot line continues panel to panel)
  ctx.fillStyle = site.spotColor;
  ctx.fillRect(W - 6, 0, 6, H);
  ctx.fillStyle = ink2;
  ctx.font = text(22, 500);
  ctx.fillText(lang === "tr" ? "Süreç" : "Process", 64, H - 60);
  const tex = new CanvasTexture(c);
  // the strip runs away from the camera: turn the print so it reads from the front
  tex.center.set(0.5, 0.5);
  tex.rotation = -Math.PI / 2;
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Act IV. A six-panel sheet, printed with one step per panel, unfolds like a
 * brochure as you scroll: real hinges (nested groups), the lamp's shadow
 * falling from panel to panel. Reduced motion shows it open.
 */
export default function Fold() {
  const act = actById("fold");
  const steps = site.process;
  const n = steps.length;
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
  const lang = (typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "tr") as "tr" | "en";
  const textures = useMemo(() => (ready ? steps.map((s, i) => panelTexture(i, s.title[lang], s.text[lang], theme === "dark", lang)) : []), [ready, steps, theme, lang]);
  useDisposeAll(textures);
  const geo = useMemo(() => new BoxGeometry(PANEL_W, T, PANEL_D), []);
  useDispose(geo);
  const mats = useMemo(() => textures.map((tex) => paperMaterial({ map: tex, grainScale: 1.2, grainStrength: 0.3, roughness: 0.7 })), [textures]);
  useDisposeAll(mats);
  const back = useMemo(() => paperMaterial({ color: "#efeee8", grainScale: 1.2 }), []);
  const edge = useMemo(() => new MeshStandardMaterial({ color: "#e6e4dd", roughness: 0.9 }), []);
  useDispose(back);
  useDispose(edge);
  const hinges = useRef<(Group | null)[]>([]);
  const root = useRef<Group>(null);
  const rows = useRef<HTMLElement[] | null>(null);

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    const p = rig.p;
    g.visible = p > 0.56 && p < 0.8;
    if (!g.visible) return;
    const s = store.get();
    const cdt = Math.min(dt, 1 / 20);
    // unfold one panel per slice of the act
    const t = s.reducedMotion ? n : clamp01((p - act.start - 0.01) / 0.13) * n;
    hinges.current.forEach((h, i) => {
      if (!h || i === 0) return;
      const open = clamp01(t - (i - 1)); // 0 folded … 1 flat
      const sign = i % 2 ? 1 : -1;
      const folded = Math.PI - 0.22;
      damp(h.rotation, "z", sign * folded * (1 - open), 0.16, cdt);
    });
    // mirror the state on the HTML index rows
    if (!rows.current) rows.current = Array.from(document.querySelectorAll<HTMLElement>("#surec-index li"));
    rows.current.forEach((el, i) => {
      const on = t >= i + 0.5;
      if (el.dataset.active !== String(on)) el.dataset.active = String(on);
    });
  });

  // nested hinges: panel i lives in hinge i, hinge i+1 sits on panel i's far edge
  const build = (i: number): React.ReactNode => {
    if (i >= n) return null;
    return (
      <group
        ref={(el) => {
          hinges.current[i] = el;
        }}
        position={i === 0 ? [0, 0, 0] : [PANEL_W, 0, 0]}
      >
        <mesh geometry={geo} material={mats[i] ? [edge, edge, mats[i], back, edge, edge] : edge} position={[PANEL_W / 2, 0, 0]} castShadow receiveShadow />
        {build(i + 1)}
      </group>
    );
  };

  const side = store.get().touch ? 0 : -1.75;
  return (
    <group ref={root} position={[act.x + side, T / 2 + 0.002, 0.75]} rotation-y={Math.PI / 2} visible={false}>
      {build(0)}
    </group>
  );
}
