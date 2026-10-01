/**
 * Letterforms from the page's own font, at runtime, with no font parser:
 * the text is rasterised on a canvas, the ink mask is traced with marching
 * squares into closed contours, and the contours become three.js Shapes
 * (outer contours with their holes) for extrusion — plus a jittered grid
 * of ink samples for the anamorphic shards.
 */
import { Shape, Vector2 } from "three";

export interface Glyphs {
  /** shapes in a unit space: x to the right, y up, cap height ≈ 1 */
  shapes: Shape[];
  /** ink bounds in the same space */
  width: number;
  height: number;
  /** sample points (x, y) in the same space, one per grid cell of ink */
  samples: Float32Array;
}

function fontString(px: number, weight: number, family: string) {
  return `${weight} ${px}px ${family}`;
}

export function rasterise(text: string, family: string, weight = 700, px = 240) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.font = fontString(px, weight, family);
  const m = ctx.measureText(text);
  const pad = Math.ceil(px * 0.12);
  const W = Math.ceil(m.width) + pad * 2;
  const H = Math.ceil(px * 1.35) + pad * 2;
  c.width = W;
  c.height = H;
  ctx.font = fontString(px, weight, family);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, pad, pad + px * 1.05);
  const data = ctx.getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(W * H);
  let minX = W;
  let minY = H;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < W * H; i++) {
    const v = data[i * 4] > 127 ? 1 : 0;
    mask[i] = v;
    if (v) {
      const x = i % W;
      const y = (i / W) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { mask, W, H, minX, minY, maxX, maxY };
}

/**
 * Pixel-edge contours of a binary mask. Every boundary between an ink pixel
 * and a non-ink pixel is a unit segment, oriented clockwise around the ink
 * (in y-down pixel space); the segments are linked into closed loops. Outer
 * contours and holes come out with opposite winding, which `toShapes`
 * uses. The staircase is smoothed afterwards.
 */
export function traceContours(mask: Uint8Array, W: number, H: number): number[][] {
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : mask[y * W + x]);
  const VW = W + 1;
  const key = (x: number, y: number) => y * VW + x;
  // outgoing edges per vertex: up to two, stored as end-vertex keys (-1 = none)
  const out0 = new Int32Array(VW * (H + 1)).fill(-1);
  const out1 = new Int32Array(VW * (H + 1)).fill(-1);
  const add = (a: number, b: number) => {
    if (out0[a] < 0) out0[a] = b;
    else out1[a] = b;
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      if (!at(x, y - 1)) add(key(x, y), key(x + 1, y)); // top: left → right
      if (!at(x + 1, y)) add(key(x + 1, y), key(x + 1, y + 1)); // right: top → bottom
      if (!at(x, y + 1)) add(key(x + 1, y + 1), key(x, y + 1)); // bottom: right → left
      if (!at(x - 1, y)) add(key(x, y + 1), key(x, y)); // left: bottom → top
    }
  }
  const contours: number[][] = [];
  const take = (a: number, prevDir: number): number => {
    // choose the outgoing edge; at a saddle vertex prefer the right turn so touching blobs stay separate
    const b0 = out0[a];
    const b1 = out1[a];
    if (b0 < 0 && b1 < 0) return -1;
    if (b0 >= 0 && b1 < 0) {
      out0[a] = -1;
      return b0;
    }
    if (b1 >= 0 && b0 < 0) {
      out1[a] = -1;
      return b1;
    }
    // both present: directions are ±1 (x) or ±VW (y)
    const d0 = b0 - a;
    const d1 = b1 - a;
    const turn = (d: number) => {
      // right turn in y-down space: (+x → +y), (+y → -x), (-x → -y), (-y → +x)
      const pd = prevDir;
      const right = pd === 1 ? VW : pd === VW ? -1 : pd === -1 ? -VW : 1;
      return d === right ? 0 : 1;
    };
    if (turn(d0) <= turn(d1)) {
      out0[a] = -1;
      return b0;
    }
    out1[a] = -1;
    return b1;
  };
  for (let v = 0; v < out0.length; v++) {
    while (out0[v] >= 0 || out1[v] >= 0) {
      const pts: number[] = [];
      let cur = v;
      let dir = 0;
      let guard = 0;
      while (guard++ < 4_000_000) {
        pts.push(cur % VW, (cur / VW) | 0);
        const nxt = take(cur, dir);
        if (nxt < 0) break;
        dir = nxt - cur;
        cur = nxt;
        if (cur === v) break;
      }
      if (pts.length >= 8) contours.push(pts);
      else break;
    }
  }
  return contours;
}

/** Ramer–Douglas–Peucker on a closed polyline. */
export function simplify(pts: number[], tol: number): number[] {
  const n = pts.length / 2;
  if (n < 4) return pts;
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const ax = pts[a * 2];
    const ay = pts[a * 2 + 1];
    const bx = pts[b * 2];
    const by = pts[b * 2 + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let far = -1;
    let farD = tol;
    for (let i = a + 1; i < b; i++) {
      const px = pts[i * 2];
      const py = pts[i * 2 + 1];
      const d = Math.abs((px - ax) * dy - (py - ay) * dx) / len;
      if (d > farD) {
        farD = d;
        far = i;
      }
    }
    if (far > 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[i * 2], pts[i * 2 + 1]);
  return out;
}

/** One round of Chaikin corner cutting on a closed polyline (rounds the staircase left by the raster). */
export function smooth(pts: number[]): number[] {
  const n = pts.length / 2;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ax = pts[i * 2];
    const ay = pts[i * 2 + 1];
    const bx = pts[j * 2];
    const by = pts[j * 2 + 1];
    out.push(ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25, ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75);
  }
  return out;
}

function area(pts: number[]) {
  let a = 0;
  const n = pts.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += pts[i * 2] * pts[j * 2 + 1] - pts[j * 2] * pts[i * 2 + 1];
  }
  return a / 2;
}
function inside(pts: number[], x: number, y: number) {
  let c = false;
  const n = pts.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = pts[i * 2];
    const yi = pts[i * 2 + 1];
    const xj = pts[j * 2];
    const yj = pts[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/**
 * Build shapes (with holes) from contours. A contour is a hole when it lies
 * inside an odd number of other contours; it is assigned to its smallest
 * containing contour.
 */
/**
 * Walk a contour into a Shape, dropping zero-length segments. A repeated
 * point (or a last point equal to the first) extrudes into a degenerate
 * triangle with a zero normal; one such pixel is NaN in the physical
 * shader, and bloom's mip chain spreads one NaN over the whole frame.
 */
function trace(s: Shape, p: number[], toUnit: (x: number, y: number) => [number, number]) {
  const EPS = 1e-6;
  let n = 0;
  let x0 = 0;
  let y0 = 0;
  let px = 0;
  let py = 0;
  for (let k = 0; k < p.length; k += 2) {
    const [x, y] = toUnit(p[k], p[k + 1]);
    if (n > 0 && Math.abs(x - px) < EPS && Math.abs(y - py) < EPS) continue;
    if (n === 0) {
      s.moveTo(x, y);
      x0 = x;
      y0 = y;
    } else if (k + 2 >= p.length && Math.abs(x - x0) < EPS && Math.abs(y - y0) < EPS) {
      break;
    } else {
      s.lineTo(x, y);
    }
    px = x;
    py = y;
    n++;
  }
  s.closePath();
}

export function toShapes(contours: number[][], toUnit: (x: number, y: number) => [number, number]): Shape[] {
  const items = contours.map((pts) => ({ pts, area: Math.abs(area(pts)), depth: 0, parent: -1 }));
  for (let i = 0; i < items.length; i++) {
    const p = items[i].pts;
    let best = -1;
    let bestArea = Infinity;
    for (let j = 0; j < items.length; j++) {
      if (i === j || items[j].area <= items[i].area) continue;
      if (inside(items[j].pts, p[0], p[1])) {
        items[i].depth++;
        if (items[j].area < bestArea) {
          bestArea = items[j].area;
          best = j;
        }
      }
    }
    items[i].parent = best;
  }
  const shapes: Shape[] = [];
  const shapeOf = new Map<number, Shape>();
  items.forEach((it, i) => {
    if (it.depth % 2 === 0) {
      const s = new Shape();
      trace(s, it.pts, toUnit);
      shapes.push(s);
      shapeOf.set(i, s);
    }
  });
  items.forEach((it) => {
    if (it.depth % 2 === 1 && it.parent >= 0) {
      const s = shapeOf.get(it.parent);
      if (!s) return;
      const hole = new Shape();
      trace(hole, it.pts, toUnit);
      s.holes.push(hole);
    }
  });
  return shapes;
}

/**
 * Everything the name needs, in a unit space where the cap height is 1 and y = 0 is the baseline.
 * `cell` is the shard grid spacing in pixels of the raster.
 */
export function buildGlyphs(text: string, family: string, weight = 700, px = 240, cell = 11, tol = 0.65): Glyphs {
  const r = rasterise(text, family, weight, px);
  // normalise by the CAP height (an "H" of the same font), not by the ink box: accents like the dot of İ would shrink the line
  const cap = rasterise("H", family, weight, px);
  const capH = Math.max(1, cap.maxY - cap.minY + 1);
  const inkH = Math.max(1, r.maxY - r.minY + 1);
  const inkW = r.maxX - r.minX + 1;
  // y = 0 is the baseline (the bottom of the "H"), x = 0 the left edge of the ink
  const baseline = cap.maxY + 1;
  const toUnit = (x: number, y: number): [number, number] => [(x - r.minX) / capH, (baseline - y) / capH];
  const raw = traceContours(r.mask, r.W, r.H);
  const contours = raw.map((c) => smooth(simplify(c, tol))).filter((c) => Math.abs(area(c)) > 4);
  const shapes = toShapes(contours, toUnit);
  const pts: number[] = [];
  const seed = 7;
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let y = r.minY; y <= r.maxY; y += cell) {
    for (let x = r.minX; x <= r.maxX; x += cell) {
      const jx = x + rnd() * cell;
      const jy = y + rnd() * cell;
      const ix = Math.min(r.W - 1, Math.round(jx));
      const iy = Math.min(r.H - 1, Math.round(jy));
      if (!r.mask[iy * r.W + ix]) continue;
      const [ux, uy] = toUnit(jx, jy);
      pts.push(ux, uy);
    }
  }
  return { shapes, width: inkW / capH, height: inkH / capH, samples: new Float32Array(pts) };
}

export function unitToCell(px: number, cell: number, inkH: number) {
  void px;
  return cell / inkH;
}

export const V2 = Vector2;
