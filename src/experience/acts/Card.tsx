"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, DynamicDrawUsage, Group, InstancedMesh, LinearFilter, LinearMipmapLinearFilter, MeshStandardMaterial, SRGBColorSpace } from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { damp } from "maath/easing";
import { store } from "@/lib/store";
import { actById, smoothstep } from "@/lib/acts";
import { site } from "@/lib/content";
import { rig } from "../rig/CameraRig";
import { embossNormal, paperMaterial } from "../materials/paper";
import { display, fontsReady, text } from "../utils/text";
import { useDispose, useDisposeAll } from "../utils/useDispose";
import { dummy } from "../utils/scratch";
import { audio } from "@/lib/audio";

const CW = 0.85;
const CH = 0.55;

const SOCIAL: Record<string, string> = { behance: "Behance", instagram: "Instagram", linkedin: "LinkedIn", dribbble: "Dribbble" };

type Face = { normal: CanvasTexture; mask: CanvasTexture; ink: CanvasTexture };

/**
 * Print the pressed shapes (white on black in `mask`) in `ink` over what is
 * already on `ctx`. The mask is opaque, so it is used by luminance: light ink
 * is added, dark ink multiplies an inverted copy.
 */
export function stampInk(ctx: CanvasRenderingContext2D, mask: HTMLCanvasElement, ink: string) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const n = parseInt(ink.replace("#", ""), 16);
  const ir = (n >> 16) & 255;
  const ig = (n >> 8) & 255;
  const ib = n & 255;
  const m = mask.getContext("2d")!.getImageData(0, 0, W, H).data;
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  // per pixel: paper → ink by the mask's coverage (deterministic, no compositing modes)
  for (let i = 0; i < d.length; i += 4) {
    const k = m[i] / 255;
    if (k <= 0) continue;
    d[i] += (ir - d[i]) * k;
    d[i + 1] += (ig - d[i + 1]) * k;
    d[i + 2] += (ib - d[i + 2]) * k;
  }
  ctx.putImageData(img, 0, 0);
}

/** front: the name pressed into spot-colour stock, printed in paper-white; back: contact details on paper */
function makeFaces(dark: boolean): { front: Face; back: Face } {
  const W = 1024;
  const H = Math.round((W * CH) / CW);
  const build = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, bg: string, inkColor: string): Face => {
    const { normal, mask } = embossNormal({ width: W, height: H, blur: 2.5, strength: 9, sign: -1, draw });
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    stampInk(ctx, mask.image as HTMLCanvasElement, inkColor);
    const ink = new CanvasTexture(c);
    ink.colorSpace = SRGBColorSpace;
    ink.minFilter = LinearMipmapLinearFilter;
    ink.magFilter = LinearFilter;
    ink.anisotropy = 8;
    return { normal, mask, ink };
  };
  const front = build(
    (ctx, w, h) => {
      ctx.textBaseline = "alphabetic";
      ctx.font = display(Math.round(w * 0.13));
      ctx.fillText(site.firstName, w * 0.09, h * 0.5);
      ctx.fillText(site.lastName, w * 0.09, h * 0.5 + w * 0.13);
      ctx.font = text(Math.round(w * 0.028), 600);
      ctx.fillText(site.title.tr.toLocaleUpperCase("tr-TR").split("").join(" "), w * 0.09, h * 0.22);
      // registration mark
      const cx = w * 0.88;
      const cy = h * 0.22;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.moveTo(cx - 30, cy);
      ctx.lineTo(cx + 30, cy);
      ctx.moveTo(cx, cy - 30);
      ctx.lineTo(cx, cy + 30);
      ctx.stroke();
    },
    site.spotColor,
    "#ffffff"
  );
  const lines: string[] = [];
  if (site.email) lines.push(site.email);
  site.social.forEach((s) => lines.push(`${SOCIAL[s.id]} · ${s.url.replace(/^https?:\/\/(www\.)?/, "")}`));
  if (!lines.length) lines.push(site.title.tr, site.url.replace(/^https?:\/\//, ""));
  const back = build(
    (ctx, w, h) => {
      ctx.textBaseline = "alphabetic";
      ctx.font = text(Math.round(w * 0.032), 600);
      ctx.fillText(site.name, w * 0.09, h * 0.24);
      ctx.font = text(Math.round(w * 0.03), 500);
      lines.forEach((l, i) => ctx.fillText(l, w * 0.09, h * 0.42 + i * h * 0.12));
      ctx.fillRect(w * 0.09, h * 0.3, w * 0.09, 4);
    },
    dark ? "#1f1f22" : "#f7f6f2",
    dark ? "#f1efe9" : "#111214"
  );
  return { front, back };
}

/**
 * Act VI. A letterpress business card in the spot colour. It tilts toward
 * the lamp, flips as you scroll through the act (and on click), and at the
 * very end every sheet from the journey settles into one stack.
 */
export default function Card() {
  const act = actById("card");
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
  const faces = useMemo(() => (ready ? makeFaces(theme === "dark") : null), [ready, theme]);
  const geo = useMemo(() => new RoundedBoxGeometry(CW, 0.012, CH, 2, 0.005), []);
  const front = useMemo(
    () => paperMaterial({ color: faces ? "#ffffff" : site.spotColor, map: faces?.front.ink ?? null, emboss: faces?.front.normal ?? null, embossStrength: 1.3, grainScale: 1.2, grainStrength: 0.45, roughness: 0.62, sheen: 0.45 }),
    [faces]
  );
  const back = useMemo(
    () => paperMaterial({ map: faces?.back.ink ?? null, emboss: faces?.back.normal ?? null, ao: faces?.back.mask ?? null, embossStrength: 1.1, grainScale: 1.2, grainStrength: 0.45, roughness: 0.75 }),
    [faces]
  );
  const edge = useMemo(() => new MeshStandardMaterial({ color: "#e9e7e0", roughness: 0.9 }), []);
  useDispose(geo);
  useDispose(front);
  useDispose(back);
  useDispose(edge);
  useDisposeAll(faces ? [faces.front.normal, faces.front.mask, faces.front.ink, faces.back.normal, faces.back.mask, faces.back.ink] : []);
  const mats = useMemo(() => [edge, edge, front, back, edge, edge], [edge, front, back]);
  const root = useRef<Group>(null);
  const card = useRef<Group>(null);
  const flipped = useRef(0);
  const clicks = useRef(0);

  useFrame((_, dt) => {
    const g = root.current;
    const c = card.current;
    if (!g || !c) return;
    const p = rig.p;
    g.visible = p > 0.86;
    if (!g.visible) return;
    const s = store.get();
    const cdt = Math.min(dt, 1 / 20);
    // scroll flips the card once across the act; a click adds a half-turn
    const scrollFlip = s.reducedMotion ? (p > act.start + 0.05 ? 1 : 0) : smoothstep(act.start + 0.035, act.start + 0.075, p);
    const want = (scrollFlip + clicks.current) * Math.PI;
    damp(flipped, "current", want, 0.25, cdt);
    c.rotation.x = flipped.current;
    // tilt toward the lamp
    if (!s.reducedMotion) {
      const dx = rig.lamp.x - (act.x + side);
      const dz = rig.lamp.z;
      const a = 0.14;
      damp(c.rotation, "z", Math.max(-a, Math.min(a, dx * 0.12)), 0.2, cdt);
      damp(g.rotation, "x", Math.max(-a, Math.min(a, -dz * 0.12)), 0.2, cdt);
    }
    // lift a little while it turns
    c.position.y = 0.05 + Math.sin(Math.min(Math.PI, Math.abs(flipped.current % Math.PI))) * 0.12;
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    clicks.current += 1;
    audio.thunk();
  };

  const side = store.get().touch ? 0 : 0.55;
  return (
    <group ref={root} position={[act.x + side, 0, 0]} visible={false}>
      <group ref={card} position={[0, 0.05, 0]}>
        <mesh geometry={geo} material={mats} castShadow receiveShadow onClick={onClick} />
      </group>
      <Stack />
    </group>
  );
}

/** The ending: sheets from the whole journey settle into one neat stack on the table. */
function Stack() {
  const N = 14;
  const geo = useMemo(() => new RoundedBoxGeometry(1, 0.006, 1.3, 1, 0.002), []);
  const mat = useMemo(() => paperMaterial({ color: "#f4f3ee", grainScale: 2, grainStrength: 0.3 }), []);
  useDispose(geo);
  useDispose(mat);
  const mesh = useRef<InstancedMesh>(null);
  // where each sheet comes from (relative to the card act) and where it lands
  const from = useMemo(() => {
    const out: { x: number; y: number; z: number; ry: number; sx: number; sz: number }[] = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < N; i++) {
      const stage = i / N; // 0 hero … 1 portrait
      out.push({ x: -30 + stage * 26 + (rnd() - 0.5) * 2, y: 0.4 + rnd() * 1.8, z: (rnd() - 0.5) * 3, ry: (rnd() - 0.5) * 1.2, sx: 0.7 + rnd() * 0.6, sz: 0.7 + rnd() * 0.6 });
    }
    return out;
  }, []);
  const land = useMemo(() => from.map((_, i) => ({ x: -12.5 + (i % 3) * 0.02, y: 0.003 + i * 0.0065, z: 0.1, ry: ((i * 37) % 11) * 0.012 - 0.06 })), [from]);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const p = rig.p;
    m.visible = p > 0.945;
    if (!m.visible) return;
    const t = smoothstep(0.955, 0.995, p);
    for (let i = 0; i < N; i++) {
      const a = from[i];
      const b = land[i];
      // each sheet arrives a little after the previous one
      const ti = smoothstep(i / N * 0.35, i / N * 0.35 + 0.65, t);
      const e = 1 - Math.pow(1 - ti, 3);
      dummy.position.set(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e + Math.sin(e * Math.PI) * 0.6, a.z + (b.z - a.z) * e);
      dummy.rotation.set(0, a.ry + (b.ry - a.ry) * e, (1 - e) * 0.4);
      dummy.scale.set(a.sx + (0.92 - a.sx) * e, 1, a.sz + (0.92 - a.sz) * e);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  useEffect(() => {
    if (mesh.current) mesh.current.instanceMatrix.setUsage(DynamicDrawUsage);
  }, []);
  return <instancedMesh ref={mesh} args={[geo, mat, N]} castShadow receiveShadow visible={false} />;
}

