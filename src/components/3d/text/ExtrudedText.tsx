"use client";

import { useEffect, useMemo, useState } from "react";
import { ExtrudeGeometry, type Material } from "three";
import { buildGlyphs, type Glyphs } from "./glyphs";

/**
 * A word as a solid: traced from the page font, extruded with a bevel,
 * centred on its ink box. Fonts must be loaded first; the component waits
 * for them and renders nothing until the shapes exist.
 */
export interface ExtrudedTextProps {
  text: string;
  /** cap height in world units */
  size?: number;
  depth?: number;
  bevel?: number;
  weight?: number;
  stretch?: string;
  material: Material;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** called with the ink width and height in world units once built */
  onBuilt?: (w: number, h: number) => void;
  renderOrder?: number;
  castShadow?: boolean;
}

const cache = new Map<string, Glyphs>();
export function glyphsFor(text: string, weight: number, stretch: string) {
  const key = `${text}|${weight}|${stretch}`;
  let g = cache.get(key);
  if (!g) {
    g = buildGlyphs(text, "Archivo", weight, stretch);
    cache.set(key, g);
  }
  return g;
}

export function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let on = true;
    Promise.all([document.fonts.load("900 200px Archivo"), document.fonts.load("400 200px Archivo")])
      .then(() => document.fonts.ready)
      .then(() => on && setReady(true))
      .catch(() => on && setReady(true));
    return () => {
      on = false;
    };
  }, []);
  return ready;
}

export default function ExtrudedText({ text, size = 1, depth = 0.22, bevel = 0.03, weight = 900, stretch = "condensed", material, position, rotation, onBuilt, renderOrder }: ExtrudedTextProps) {
  const ready = useFontsReady();
  const geometry = useMemo(() => {
    if (!ready) return null;
    const g = glyphsFor(text, weight, stretch);
    if (!g.shapes.length) return null;
    const geo = new ExtrudeGeometry(g.shapes, {
      depth: depth / size,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel / size,
      bevelSize: (bevel * 0.85) / size,
      bevelSegments: 3,
      curveSegments: 4,
    });
    geo.translate(-g.width / 2, -g.height / 2, -depth / size / 2);
    geo.scale(size, size, size);
    geo.computeVertexNormals();
    // a vertex owned only by degenerate faces keeps a zero normal; normalize(0) is NaN on the GPU
    const n = geo.getAttribute("normal").array as Float32Array;
    for (let i = 0; i < n.length; i += 3) {
      const l = n[i] * n[i] + n[i + 1] * n[i + 1] + n[i + 2] * n[i + 2];
      if (!(l > 1e-12)) {
        n[i] = 0;
        n[i + 1] = 0;
        n[i + 2] = 1;
      }
    }
    geo.getAttribute("normal").needsUpdate = true;
    onBuilt?.(g.width * size, g.height * size);
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, text, size, depth, bevel, weight, stretch]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return <mesh geometry={geometry} material={material} position={position} rotation={rotation} renderOrder={renderOrder} />;
}
