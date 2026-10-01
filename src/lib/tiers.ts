import type { Tier } from "@/lib/store";

/**
 * Quality tiers. One table, read by every part of the stage, so a device
 * never gets a half-measure: a tier is a whole look.
 */
export interface Budget {
  dpr: number;
  particles: number;
  shimmer: number;
  envRes: number;
  textureMax: number;
  post: boolean;
  dof: boolean;
  reflector: number;
  antialias: boolean;
  glassSamples: number;
  shardCount: number;
}

export const BUDGET: Record<Tier, Budget> = {
  ultra: { dpr: 2, particles: 7000, shimmer: 1, envRes: 256, textureMax: 2048, post: true, dof: true, reflector: 1024, antialias: true, glassSamples: 6, shardCount: 3600 },
  high: { dpr: 1.75, particles: 4500, shimmer: 1, envRes: 256, textureMax: 2048, post: true, dof: false, reflector: 768, antialias: true, glassSamples: 4, shardCount: 2600 },
  mid: { dpr: 1.5, particles: 2200, shimmer: 0.6, envRes: 128, textureMax: 1600, post: false, dof: false, reflector: 512, antialias: true, glassSamples: 2, shardCount: 1600 },
  low: { dpr: 1, particles: 900, shimmer: 0.3, envRes: 64, textureMax: 800, post: false, dof: false, reflector: 0, antialias: false, glassSamples: 1, shardCount: 900 },
};

export const budgetOf = (t: Tier) => BUDGET[t];
export const ORDER: Tier[] = ["low", "mid", "high", "ultra"];
export const lower = (t: Tier): Tier => ORDER[Math.max(0, ORDER.indexOf(t) - 1)];
export const higher = (t: Tier): Tier => ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(t) + 1)];
