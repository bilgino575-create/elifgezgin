/**
 * The ink bridge: a three-free queue the DOM layer (the drop, the hand)
 * writes to and the fluid simulation (3D chunk) drains. Lives in lib/ so
 * importing it never pulls three.js into the initial bundle.
 */
import type { Texture } from "three";

interface Splat {
  x: number;
  y: number;
  dx: number;
  dy: number;
  r: number;
  g: number;
  b: number;
  radius: number;
}

export class Fluid {
  dye: Texture | null = null;
  /** true while a simulation is mounted and stepping */
  live = false;
  /** 0..1 amount of ink on the stage (EMA of injected amounts), read by the ending */
  amount = 0;
  /** reduced motion: the simulation runs until this clock time (the drop's blot settles), then freezes */
  freezeAt = 0;
  private queue: Splat[] = [];
  private pool: Splat[] = [];
  splat(x: number, y: number, dx: number, dy: number, r: number, g: number, b: number, radius = 1) {
    if (!this.live) return;
    const s = this.pool.pop() ?? { x: 0, y: 0, dx: 0, dy: 0, r: 0, g: 0, b: 0, radius: 1 };
    s.x = x;
    s.y = y;
    s.dx = dx;
    s.dy = dy;
    s.r = r;
    s.g = g;
    s.b = b;
    s.radius = radius;
    this.queue.push(s);
    this.amount = Math.min(1, this.amount + 0.02 * (r + g + b));
  }
  drain(fn: (s: Splat) => void) {
    for (const s of this.queue) {
      fn(s);
      this.pool.push(s);
    }
    this.queue.length = 0;
  }
}
export const fluid = new Fluid();

/** Absorbance of an ink for the splat, normalised so every ink injects a comparable amount. */
export function inkAbsorbance(hex: string, out: [number, number, number], strength = 1) {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  const a = c.map((v) => -Math.log(Math.max(v, 0.03)));
  const m = Math.max(a[0], a[1], a[2], 1e-3);
  out[0] = (a[0] / m) * strength;
  out[1] = (a[1] / m) * strength;
  out[2] = (a[2] / m) * strength;
  return out;
}

