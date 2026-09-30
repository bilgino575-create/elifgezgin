"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, type Group } from "three";
import { NAME_VIEW, range } from "@/lib/acts";
import { loading, store, useStore } from "@/lib/store";
import { site } from "@/lib/content";
import { upper } from "@/i18n/dict";
import { rig } from "../../rig/CameraRig";
import { buildGlyphs, type Glyphs } from "./glyphs";
import Shards, { makeShardMaterial } from "./Shards";
import Glass from "./Glass";
import { useDispose } from "../../utils/useDispose";
import { fluid, inkAbsorbance } from "../../fluid/Fluid";

import { INKS } from "@/lib/inks";

const BEHIND = [INKS[3], INKS[0], INKS[1]];
const abs: [number, number, number] = [0, 0, 0];

/**
 * Act I. Builds the letterforms from the page font, fits them to the HTML
 * <h1>'s two lines as seen from the anamorphic viewpoint (so the HTML name
 * can go transparent without a jump), and drives the shards → glass
 * transition with scroll.
 */
/** shard grid on the 240 px raster: fine tiles on desktop, coarse on phones where the name is small on screen */
const CELL_PX = { desktop: 8, mobile: 11 };
const RASTER_PX = 240;

function displayFamily() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
  return v || "sans-serif";
}

interface Fit {
  lines: { x: number; y: number; s: number }[];
  uv: { x0: number; x1: number; y0: number; y1: number };
  center: [number, number];
  height: number;
  width: number;
}

export default function Name() {
  const size = useThree((s) => s.size);
  const tier = useStore((s) => s.tier);
  const [glyphs, setGlyphs] = useState<{ lines: Glyphs[]; cell: number } | null>(null);
  const glass = useRef<Group>(null);
  const material = useDispose(useMemo(() => makeShardMaterial(), []));
  const mobile = store.get().touch || size.width < 768;
  const view = mobile ? NAME_VIEW.mobile : NAME_VIEW.desktop;

  // 1. letterforms from the real font
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const family = displayFamily();
      try {
        await document.fonts.load(`700 ${RASTER_PX}px ${family}`);
        await document.fonts.ready;
      } catch {
        /* draw with whatever is available */
      }
      if (cancelled) return;
      const cellPx = store.get().touch || window.innerWidth < 768 ? CELL_PX.mobile : CELL_PX.desktop;
      const lines = [upper(site.firstName, "tr"), upper(site.lastName, "tr")].map((t) => buildGlyphs(t, family, 700, RASTER_PX, cellPx));
      // cell size in unit space (the unit is the cap height, ≈ 0.72 em for this face)
      const capH = RASTER_PX * 0.72;
      setGlyphs({ lines, cell: cellPx / capH });
      loading.done("scene");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. fit to the HTML lines as seen from the viewpoint (recomputed on resize)
  const fit = useMemo<Fit | null>(() => {
    if (!glyphs) return null;
    const h1 = document.querySelector<HTMLElement>("#giris-title");
    const blocks = h1 ? Array.from(h1.querySelectorAll<HTMLElement>(".block")) : [];
    if (!h1 || blocks.length < 2) return null;
    const W = size.width;
    const H = size.height;
    const hh = view.d * Math.tan((view.fov * Math.PI) / 360);
    const hw = hh * (W / H);
    const fs = parseFloat(getComputedStyle(h1).fontSize);
    const family = displayFamily();
    const c = document.createElement("canvas").getContext("2d")!;
    c.font = `700 ${fs}px ${family}`;
    const m = c.measureText("E");
    const asc = m.fontBoundingBoxAscent || fs * 0.9;
    const desc = m.fontBoundingBoxDescent || fs * 0.25;
    const cap = m.actualBoundingBoxAscent || fs * 0.72;
    const lines = blocks.map((b) => {
      const r = b.getBoundingClientRect();
      const halfLeading = (r.height - (asc + desc)) / 2;
      const baseline = r.top + halfLeading + asc;
      // world coordinates on the z = 0 plane through the anamorphic camera; unit y = 0 is the baseline
      const wx = ((r.left / W) * 2 - 1) * hw;
      const wy = -((baseline / H) * 2 - 1) * hh;
      const s = (cap / H) * 2 * hh; // unit cap height (1) → world
      return { x: wx, y: wy, s };
    });
    // the name's box in uv (v up) for the ink that swirls behind the glass
    const top = blocks[0].getBoundingClientRect().top;
    const bot = blocks[1].getBoundingClientRect().bottom;
    const right = Math.max(...blocks.map((b) => b.getBoundingClientRect().left + (b.textContent?.length ?? 6) * fs * 0.62));
    const w0 = lines[0].s * glyphs.lines[0].width;
    const w1 = lines[1].s * glyphs.lines[1].width;
    const left = Math.min(lines[0].x, lines[1].x);
    const rightW = Math.max(lines[0].x + w0, lines[1].x + w1);
    const topW = lines[0].y + lines[0].s * glyphs.lines[0].height;
    const bottomW = lines[1].y - lines[1].s * 0.05;
    return {
      lines,
      uv: { x0: blocks[0].getBoundingClientRect().left / W, x1: Math.min(1, right / W), y0: 1 - bot / H, y1: 1 - top / H },
      center: [(left + rightW) / 2, (topW + bottomW) / 2],
      height: topW - bottomW,
      width: rightW - left,
    };
  }, [glyphs, size.width, size.height, view]);

  useEffect(() => {
    if (!fit || !glyphs) return;
    const u = material.uniforms;
    u.uLine0.value.set(fit.lines[0].x, fit.lines[0].y, fit.lines[0].s);
    u.uLine1.value.set(fit.lines[1].x, fit.lines[1].y, fit.lines[1].s);
    u.uView.value.set(0, 0, view.d);
    u.uCell.value = glyphs.cell;
    // the camera's close-up target
    rig.nameCenter.set(fit.center[0], fit.center[1]);
    rig.nameHeight = fit.height;
    rig.nameWidth = fit.width;
    store.set({ deboss: true });
  }, [fit, glyphs, view, material]);

  useEffect(() => () => void store.set({ deboss: false }), []);

  useFrame((state) => {
    if (!glyphs || !fit) return;
    const s = store.get();
    const u = material.uniforms;
    const p = rig.p;
    const converge = range(p, 0.1, 0.16);
    u.uConverge.value = converge;
    u.uTime.value = s.reducedMotion ? 0 : state.clock.elapsedTime;
    u.uHand.value.copy(rig.hand);
    u.uHandK.value = rig.pointer && !s.reducedMotion ? 1 : 0;
    u.uFade.value = range(converge, 0.62, 0.95);
    (u.uSpot.value as Color).set(site.spotColor);
    u.uLight.value = s.theme === "light" ? 1 : 0;
    const g = glass.current;
    if (g) {
      const k = range(converge, 0.3, 0.75);
      g.visible = k > 0 && p < 0.2;
      // the letters solidify: the extrusion grows out of the plane
      g.scale.z = Math.max(0.02, k);
    }
    // the ink swirls behind the glass: a few inks drift through the name's box during the close-up
    if (fluid.live && !s.reducedMotion && p > 0.08 && p < 0.19) {
      const t = state.clock.elapsedTime;
      const k = fit.uv;
      const i = Math.floor(t * 0.4) % 3;
      const u = k.x0 + (k.x1 - k.x0) * (0.5 + 0.45 * Math.sin(t * 0.9 + i * 2.1));
      const v = k.y0 + (k.y1 - k.y0) * (0.5 + 0.45 * Math.cos(t * 0.7 + i * 1.3));
      inkAbsorbance(BEHIND[i], abs, 0.07);
      fluid.splat(u, v, Math.cos(t * 0.9) * 700, -Math.sin(t * 0.7) * 700, abs[0], abs[1], abs[2], 3.5);
    }
    // hide everything once the portals begin
    material.visible = p < 0.19;
  });

  if (!glyphs) return null;
  return (
    <group>
      <Shards lines={glyphs.lines} cell={glyphs.cell} material={material} />
      {fit ? <Glass lines={glyphs.lines} layout={fit.lines} tier={tier} spot={site.spotColor} groupRef={glass} /> : null}
    </group>
  );
}
