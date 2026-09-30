import type { Work } from "@/content/works.generated";
import type { Category } from "@/i18n/dict";
import { actById } from "@/lib/acts";

export interface Slot {
  slug: string;
  category: Category;
  /** object footprint in world units */
  w: number;
  h: number;
  /** resting position (centre) */
  x: number;
  y: number;
  z: number;
  /** resting y-rotation */
  ry: number;
  aspect: number;
}

/** Object heights per category (world units); widths follow the artwork's aspect. */
const HEIGHT: Record<Category, number> = { poster: 1.15, editorial: 0.92, packaging: 0.58, identity: 0.36, social: 0.86 };
const GAP = 0.42;
/** the clip rail's height */
export const RAIL_Y = 1.72;

/**
 * A curated row along the wall: posters hang from the rail, everything else
 * stands on the table. Hidden works (filtered out) get no slot. The row is
 * centred on the act's x so the camera's walk covers it.
 */
export function layout(works: Work[], filter: Category | "all", mobile: boolean): Slot[] {
  const visible = works.filter((w) => filter === "all" || w.category === filter);
  const scale = mobile ? 0.82 : 1;
  const items = visible.map((w) => {
    const aspect = w.cover.w / w.cover.h;
    const h = HEIGHT[w.category] * scale;
    let width = h * aspect;
    if (w.category === "packaging") width = Math.min(width, 0.7 * scale);
    if (w.category === "identity") width = Math.min(width, 0.62 * scale);
    return { w, width, h, aspect };
  });
  const total = items.reduce((a, it) => a + it.width, 0) + GAP * Math.max(0, items.length - 1);
  const cx = actById("wall").x;
  let x = cx - total / 2;
  return items.map((it, i) => {
    const centre = x + it.width / 2;
    x += it.width + GAP;
    const c = it.w.category;
    const hung = c === "poster" || c === "social";
    const y = hung ? RAIL_Y - 0.09 - it.h / 2 : c === "packaging" ? it.h / 2 : c === "identity" ? it.h * 0.42 : it.h / 2 + 0.01;
    const z = hung ? 0 : c === "identity" ? 0.55 : 0.35;
    const ry = hung ? 0 : c === "packaging" ? -0.35 : c === "identity" ? -0.12 : 0.08 * (i % 2 ? 1 : -1);
    return { slug: it.w.slug, category: c, w: it.width, h: it.h, x: centre, y, z, ry, aspect: it.aspect };
  });
}
