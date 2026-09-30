"use client";

/**
 * A tiny external store shared by the DOM layer and the 3D layer.
 * `useFrame` callbacks read `store.get()` directly; React components
 * subscribe with `useStore(selector)` through `useSyncExternalStore`.
 */
import { useSyncExternalStore } from "react";
import type { ActId } from "./acts";
import type { Category } from "@/i18n/dict";

export type Tier = "ultra" | "high" | "mid" | "low";
export const TIERS: Tier[] = ["low", "mid", "high", "ultra"];
export type Theme = "light" | "dark";

export interface AppState {
  progress: number;
  act: ActId;
  section: string;
  gl: boolean;
  glFailed: boolean;
  /** everything the preloader waits for has arrived */
  loaded: boolean;
  /** 0..1, bound to real loading events (fonts, chunk, textures) */
  loadProgress: number;
  tier: Tier;
  tierLocked: boolean;
  gpuTier: number;
  theme: Theme;
  reducedMotion: boolean;
  touch: boolean;
  debug: boolean;
  sound: boolean;
  /** device-orientation tilt enabled by the visitor */
  motion: boolean;
  menuOpen: boolean;
  /** pointer in normalized device coordinates */
  pointerX: number;
  pointerY: number;
  /** pointer is inside the viewport */
  pointerIn: boolean;
  /** clock time (s) of the last touch move; the hand paints while a finger moves */
  touchAt: number;
  /** work slug under the cursor (3D or HTML index) */
  hoverWork: string | null;
  /** skill id under the cursor / focus */
  hoverSkill: string | null;
  /** the holographic card is under the cursor */
  hoverCard: boolean;
  /** the card was clicked: spin counter */
  spin: number;
  /** the colour machine's live stage, 0..5 */
  stage: number;
  /** active category filter */
  filter: Category | "all";
  /** slug being opened (camera flight before navigation) */
  opening: string | null;
  /** counter: the easter egg was triggered */
  confetti: number;
  /** the 3D name is ready and fitted (the HTML name goes transparent) */
  deboss: boolean;
  /** the detected ceiling: the monitor never raises the tier above it */
  tierMax: Tier;
  stats: { fps: number; ms: number; calls: number; triangles: number; geometries: number; textures: number; programs: number };
}

type Listener = () => void;

const initial: AppState = {
  progress: 0,
  act: "name",
  section: "giris",
  gl: false,
  glFailed: false,
  loaded: false,
  loadProgress: 0,
  tier: "high",
  tierLocked: false,
  gpuTier: -1,
  theme: "light",
  reducedMotion: false,
  touch: false,
  debug: false,
  sound: false,
  motion: false,
  menuOpen: false,
  pointerX: 0,
  pointerY: 0,
  pointerIn: false,
  touchAt: -1,
  hoverWork: null,
  hoverSkill: null,
  hoverCard: false,
  spin: 0,
  stage: 0,
  filter: "all",
  opening: null,
  confetti: 0,
  deboss: false,
  tierMax: "ultra",
  stats: { fps: 0, ms: 0, calls: 0, triangles: 0, geometries: 0, textures: 0, programs: 0 },
};

let state: AppState = initial;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const store = {
  get: () => state,
  set(partial: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
    const next = typeof partial === "function" ? partial(state) : partial;
    let changed = false;
    const a = state as unknown as Record<string, unknown>;
    const b = next as unknown as Record<string, unknown>;
    for (const k in b) {
      if (a[k] !== b[k]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...next };
    emit();
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(initial)
  );
}

/**
 * Loading progress bound to real events. Each named unit is registered with
 * a weight and completed exactly once; the preloader shows the weighted sum.
 */
const units = new Map<string, { weight: number; done: boolean }>();
export const loading = {
  register(id: string, weight = 1) {
    if (!units.has(id)) units.set(id, { weight, done: false });
    recompute();
  },
  done(id: string) {
    const u = units.get(id);
    if (!u || u.done) return;
    u.done = true;
    recompute();
  },
};
function recompute() {
  let total = 0;
  let done = 0;
  units.forEach((u) => {
    total += u.weight;
    if (u.done) done += u.weight;
  });
  const p = total ? done / total : 0;
  store.set({ loadProgress: p, loaded: total > 0 && done >= total });
}
