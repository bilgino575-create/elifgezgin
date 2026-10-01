import { CanvasTexture, LinearFilter, SRGBColorSpace, Vector4 } from "three";
import type { Glyphs } from "./glyphs";

/**
 * The name as a world-space mask on the z = 0 plane, rasterised from the
 * same traced shapes the glass is extruded from, so it matches the letters
 * exactly. R: the letterforms. G: a soft halo around them. The backdrop
 * fills the letters with dense ink and lights their edge; the particle
 * system forms the portrait inside them. `rect` is x, y, width, height in
 * world units; `k` is how much of the effect is on this frame.
 */
export const nameMask = {
  texture: null as CanvasTexture | null,
  rect: new Vector4(0, 0, 1, 1),
  k: 0,
};

const W = 1024;

export function buildNameMask(lines: Glyphs[], layout: { x: number; y: number; s: number }[]) {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  lines.forEach((g, i) => {
    const l = layout[i];
    if (!l) return;
    x0 = Math.min(x0, l.x);
    x1 = Math.max(x1, l.x + g.width * l.s);
    y0 = Math.min(y0, l.y - 0.28 * l.s);
    y1 = Math.max(y1, l.y + g.height * l.s);
  });
  if (!Number.isFinite(x0 + x1 + y0 + y1)) return;
  const pad = (y1 - y0) * 0.12;
  x0 -= pad;
  x1 += pad;
  y0 -= pad;
  y1 += pad;
  const scale = W / (x1 - x0);
  const H = Math.max(8, Math.round((y1 - y0) * scale));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const path = new Path2D();
  lines.forEach((g, i) => {
    const l = layout[i];
    if (!l) return;
    for (const shape of g.shapes) {
      const outer = shape.getPoints(2);
      const sub = new Path2D();
      outer.forEach((p, k) => {
        const X = (l.x + p.x * l.s - x0) * scale;
        const Y = (y1 - (l.y + p.y * l.s)) * scale;
        if (k === 0) sub.moveTo(X, Y);
        else sub.lineTo(X, Y);
      });
      sub.closePath();
      for (const hole of shape.holes) {
        hole.getPoints(2).forEach((p, k) => {
          const X = (l.x + p.x * l.s - x0) * scale;
          const Y = (y1 - (l.y + p.y * l.s)) * scale;
          if (k === 0) sub.moveTo(X, Y);
          else sub.lineTo(X, Y);
        });
        sub.closePath();
      }
      path.addPath(sub);
    }
  });
  // G: the halo (a blurred copy), then R: the crisp letterforms on top
  ctx.save();
  ctx.filter = `blur(${Math.round(H * 0.035)}px)`;
  ctx.fillStyle = "#00ff00";
  ctx.fill(path, "evenodd");
  ctx.restore();
  ctx.fillStyle = "#ff0000";
  ctx.globalCompositeOperation = "lighter";
  ctx.fill(path, "evenodd");
  ctx.globalCompositeOperation = "source-over";
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = false;
  nameMask.texture?.dispose();
  nameMask.texture = tex;
  nameMask.rect.set(x0, y0, x1 - x0, y1 - y0);
}

export function disposeNameMask() {
  nameMask.texture?.dispose();
  nameMask.texture = null;
  nameMask.k = 0;
}
