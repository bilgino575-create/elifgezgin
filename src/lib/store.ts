"use client";

import { useSyncExternalStore } from "react";

export type Tier = "ultra" | "high" | "mid" | "low";
export type HoverKind = null | "link" | "project" | "drag" | "view";

export interface State {
  /** master clock, 0..1 along the journey */
  p: number;
  /** index of the stop that owns p */
  stop: number;
  tier: Tier;
  /** WebGL stage is on (decided before paint by the inline probe) */
  gl: boolean;
  touch: boolean;
  reduced: boolean;
  /** loader: real units done / total, and the handover */
  loadDone: number;
  loadTotal: number;
  loaded: boolean;
  /** pointer in NDC (−1..1, y up), css px, and whether a real pointer is present */
  px: number;
  py: number;
  cx: number;
  cy: number;
  pointer: boolean;
  /** what the pointer is over, for the cursor and the stage */
  hover: HoverKind;
  hoverLabel: string;
  menu: boolean;
  /** renderer numbers for the HUD */
  stats: { fps: number; ms: number; calls: number; tris: number };
}

const initial: State = {
  p: 0,
  stop: 0,
  tier: "high",
  gl: false,
  touch: false,
  reduced: false,
  loadDone: 0,
  loadTotal: 5,
  loaded: false,
  px: 0,
  py: 0,
  cx: -100,
  cy: -100,
  pointer: false,
  hover: null,
  hoverLabel: "",
  menu: false,
  stats: { fps: 0, ms: 0, calls: 0, tris: 0 },
};

type Listener = () => void;
let state = initial;
const listeners = new Set<Listener>();

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    let changed = false;
    for (const k in patch) {
      if ((state as unknown as Record<string, unknown>)[k] !== (patch as unknown as Record<string, unknown>)[k]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(state), () => selector(initial));
}

/** one loading unit done (fonts, the 3D chunk, the scene, the first textures) */
export const loading = {
  /** the stage steps aside: the document becomes the 2D journey, the loader is paid, the canvas unmounts */
  fallback() {
    const h = document.documentElement;
    h.classList.remove("gl");
    h.classList.add("nogl");
    const s = store.get();
    store.set({ gl: false, loadDone: s.loadTotal, loaded: true });
  },
  done() {
    const s = store.get();
    store.set({ loadDone: Math.min(s.loadTotal, s.loadDone + 1) });
  },
};
