"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Group, Object3D } from "three";
import { SRGBColorSpace, type Texture } from "three";
import { useTexture } from "@react-three/drei";
import type { Lang, WorkImage } from "@/lib/content";
import { t, workPath } from "@/lib/i18n";
import { store, useStore } from "@/lib/store";
import { budgetOf } from "@/lib/tiers";
import { STOPS } from "@/lib/stops";
import { rig, near } from "../rig";

/** the document's language, for the cursor's words and the project routes */
export function useLang(): Lang {
  // the stage mounts after hydration, so the document is there to ask
  const [lang] = useState<Lang>(() => (typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "tr"));
  return lang;
}

/** a scene group is rendered only while the camera is within one stop of it */
export function useStopGroup(j: number, ref: RefObject<Group | null>) {
  useFrame(() => {
    const g = ref.current;
    if (g) g.visible = near(j);
  }, -50);
}

/** the image derivative a tier can afford as a texture */
export function textureUrl(img: WorkImage) {
  const max = budgetOf(store.get().tier).textureMax;
  return max >= 2048 ? img.texture : max >= 1600 ? img.src : img.small;
}

/** a work's image as a colour-managed texture (suspends) */
export function useWorkTexture(img: WorkImage, anisotropy = 8): Texture {
  const tier = useStore((s) => s.tier);
  const url = useMemo(() => textureUrl(img), [img, tier]); // eslint-disable-line react-hooks/exhaustive-deps
  const tex = useTexture(url);
  useEffect(() => {
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = anisotropy;
    tex.needsUpdate = true;
  }, [tex, anisotropy]);
  return tex;
}

/** frame-rate independent damping toward a target */
export const damp = (cur: number, target: number, tau: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-dt / tau));

/** pointer handlers that make a 3D object a way into its project */
export function useProjectHandlers(lang: Lang, slug: string) {
  const d = t(lang);
  const nav = (url: string) => {
    window.location.assign(url);
  };
  return {
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      store.set({ hover: "project", hoverLabel: d.cursor.open });
    },
    onPointerOut: () => {
      if (store.get().hover === "project") store.set({ hover: null, hoverLabel: "" });
    },
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      store.set({ hover: null, hoverLabel: "" });
      nav(workPath(lang, slug));
    },
  };
}

/** the world centre of stop j */
export const worldOf = (j: number) => STOPS[j].world;

/** a slow float: y bob and a gentle roll, phase by seed */
export function floatObject(o: Object3D, seed: number, amp = 0.12, speed = 0.6) {
  const t0 = rig.time * speed + seed * 7.3;
  o.position.y += Math.sin(t0) * amp * rig.dt * 6;
  o.rotation.z = Math.sin(t0 * 0.7) * 0.04;
}

/** local progress inside a stop's hold: 0 at arrival, 1 at the end of the hold */
export function holdProgress(j: number) {
  if (rig.i !== j) return rig.i > j ? 1 : 0;
  return Math.min(1, rig.t / 0.58);
}

export function useReduced() {
  return useStore((s) => s.reduced);
}

export function useTouch() {
  return useStore((s) => s.touch);
}

export const rand = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export { rig };
export const refOf = <T,>(r: RefObject<T | null>) => r.current;
export const useRefState = useRef;
