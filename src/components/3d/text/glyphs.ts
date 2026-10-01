import { Shape, Vector2 } from "three";

/**
 * Letterforms without a font parser. The text is rasterised with the page
 * font on a canvas, the ink mask is traced into pixel-edge loops, the loops
 * are simplified (Ramer–Douglas–Peucker), rounded (Chaikin) and sorted
 * into outer contours and holes by containment depth. The result is a set
 * of three.js Shapes in a unit space where the cap height is 1 and y = 0 is
 * the baseline, ready for extrusion. Any font the browser can draw works —
 * including İ, Ğ, Ş, Ç, Ö, Ü.
 */
export interface Glyphs {
  shapes: Shape[];
  /** ink width and height in cap-height units */
  width: number;
  height: number;
}

interface Raster {
  mask: Uint8Array;
  W: number;
  H: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function rasterise(text: string, font: string, px: number, stretch: string): Raster {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const setFont = () => {
    ctx.font = font;
    const fs = ctx as CanvasRenderingContext2D & { fontStretch?: string };
    if ("fontStretch" in fs) fs.fontStretch = stretch as CanvasFontStretch;
  };
  setFont();
  const m = ctx.measureText(text);
  const pad = Math.ceil(px * 0.25);
  const W = Math.ceil(m.width) + pad * 2;
  const H = Math.ceil(px * 1.6);
  c.width = W;
  c.height = H;
  setFont();
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, pad, Math.round(px * 1.15));
  const d = ctx.getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(W * H);
  let minX = W;
  let maxX = -1;
  let minY = H;
  let maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (d[i * 4] < 128) {
        mask[i] = 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { mask, W, H, minX, maxX, minY, maxY };
}

/** directed boundary edges around filled pixels (clockwise in canvas space), linked into loops */
function traceContours(mask: Uint8Array, W: number, H: number): number[][] {
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : mask[y * W + x]);
  // key: vertex index (x + y*(W+1)); value: list of outgoing edge end vertices
  const out = new Map<number, number[]>();
  const key = (x: number, y: number) => x + y * (W + 1);
  const add = (ax: number, ay: number, bx: number, by: number) => {
    const k = key(ax, ay);
    const l = out.get(k);
    if (l) l.push(key(bx, by));
    else out.set(k, [key(bx, by)]);
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      if (!at(x, y - 1)) add(x, y, x + 1, y);
      if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!at(x - 1, y)) add(x, y + 1, x, y);
    }
  }
  const loops: number[][] = [];
  const stride = W + 1;
  for (const [start, ends] of out) {
    while (ends.length) {
      const loop: number[] = [];
      let cur = start;
      let prevDir = -1;
      for (let guard = 0; guard < 1e6; guard++) {
        const list = out.get(cur);
        if (!list || !list.length) break;
        // at a pinch (two ways out) turn right relative to where we came from, so touching loops stay separate
        let pick = 0;
        if (list.length > 1 && prevDir >= 0) {
          const cx = cur % stride;
          const cy = Math.floor(cur / stride);
          let best = -1;
          let bestScore = -Infinity;
          for (let i = 0; i < list.length; i++) {
            const nx = list[i] % stride;
            const ny = Math.floor(list[i] / stride);
            const dir = nx > cx ? 0 : ny > cy ? 1 : nx < cx ? 2 : 3;
            const turn = (dir - prevDir + 4) % 4; // 1 = right, 0 = straight, 3 = left
            const score = turn === 1 ? 3 : turn === 0 ? 2 : turn === 3 ? 1 : 0;
            if (score > bestScore) {
              bestScore = score;
              best = i;
            }
          }
          pick = best;
        }
        const next = list.splice(pick, 1)[0];
        const cx = cur % stride;
        const cy = Math.floor(cur / stride);
        const nx = next % stride;
        const ny = Math.floor(next / stride);
        prevDir = nx > cx ? 0 : ny > cy ? 1 : nx < cx ? 2 : 3;
        loop.push(cx, cy);
        cur = next;
        if (cur === start) break;
      }
      if (loop.length >= 6) loops.push(loop);
    }
  }
  return loops;
}

function simplify(pts: number[], tol: number): number[] {
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
    let fd = tol;
    for (let i = a + 1; i < b; i++) {
      const px = pts[i * 2];
      const py = pts[i * 2 + 1];
      const d = Math.abs((px - ax) * dy - (py - ay) * dx) / len;
      if (d > fd) {
        fd = d;
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

function chaikin(pts: number[], iterations = 2): number[] {
  let p = pts;
  for (let it = 0; it < iterations; it++) {
    const n = p.length / 2;
    const q: number[] = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const x0 = p[i * 2];
      const y0 = p[i * 2 + 1];
      const x1 = p[j * 2];
      const y1 = p[j * 2 + 1];
      q.push(x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25, x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75);
    }
    p = q;
  }
  return p;
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
function inside(poly: number[], x: number, y: number) {
  let inn = false;
  const n = poly.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i * 2];
    const yi = poly[i * 2 + 1];
    const xj = poly[j * 2];
    const yj = poly[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inn = !inn;
  }
  return inn;
}

/** walk a contour into a Shape, dropping zero-length segments (a repeated point extrudes into a zero-area face and a NaN normal) */
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
    } else if (k + 2 >= p.length && Math.abs(x - x0) < EPS && Math.abs(y - y0) < EPS) break;
    else s.lineTo(x, y);
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
 * Everything the stage needs for a word: shapes in a unit space where the
 * cap height is 1 and y = 0 is the baseline. `stretch` is a CSS
 * font-stretch keyword (condensed, expanded…) for the variable width axis.
 */
export function buildGlyphs(text: string, family = "Archivo", weight = 900, stretch = "normal", px = 220, tol = 0.6): Glyphs {
  const font = `${weight} ${px}px ${family}`;
  const r = rasterise(text, font, px, stretch);
  const cap = rasterise("H", font, px, stretch);
  const capH = Math.max(1, cap.maxY - cap.minY + 1);
  const baseline = cap.maxY + 1;
  if (r.maxX < 0) return { shapes: [], width: 0, height: 0 };
  const toUnit = (x: number, y: number): [number, number] => [(x - r.minX) / capH, (baseline - y) / capH];
  const raw = traceContours(r.mask, r.W, r.H);
  const contours = raw.map((c) => chaikin(simplify(c, tol), 2)).filter((c) => Math.abs(area(c)) > 6);
  const shapes = toShapes(contours, toUnit);
  return { shapes, width: (r.maxX - r.minX + 1) / capH, height: (r.maxY - r.minY + 1) / capH };
}

/** points on the outline of the shapes (for shimmer, shards and particles), in unit space */
export function outlinePoints(g: Glyphs, perUnit = 40): Vector2[] {
  const out: Vector2[] = [];
  for (const s of g.shapes) {
    const len = s.getLength();
    const n = Math.max(8, Math.round(len * perUnit));
    out.push(...s.getSpacedPoints(n));
    for (const h of s.holes) out.push(...h.getSpacedPoints(Math.max(6, Math.round(h.getLength() * perUnit))));
  }
  return out;
}
