import { Color, Vector3 } from "three";
import { STOPS, segmentAt, travelAt, COUNT, type Palette } from "@/lib/stops";

/**
 * The shared frame state of the stage, written once per frame by CameraRig
 * (which runs first) and read by everything else. Plain object, no React.
 */
export const rig = {
  p: 0,
  /** the stop that owns p, and how far the camera has travelled toward the next (0..1) */
  i: 0,
  k: 0,
  /** 0 while the layer is held, 1 at the next stop: the same as k, kept for readability */
  t: 0,
  /** world position of the light the visitor carries (the pointer on a plane facing the camera) */
  light: new Vector3(0, 0, 4),
  /** whether a real pointer or finger is present */
  pointer: false,
  /** the blended palette of the moment */
  bg: new Color("#07060f"),
  bg2: new Color("#140a2e"),
  a: new Color("#1f3bff"),
  b: new Color("#ff2e88"),
  c: new Color("#19e3ff"),
  fg: new Color("#f7f6f2"),
  /** seconds since the stage started, and the real frame delta */
  time: 0,
  dt: 1 / 60,
  /** 1 once the loader has handed over; the hero's entrance runs from it */
  entered: 0,
  enteredAt: -1,
};

const ca = new Color();
const cb = new Color();
function lerpInk(out: Color, pa: Palette, pb: Palette, key: keyof Omit<Palette, "env" | "fg2">, k: number) {
  ca.set(pa[key] as string);
  cb.set(pb[key] as string);
  out.copy(ca).lerp(cb, k);
}

/** update the clock and the palette for this p */
export function tick(p: number) {
  const { i, t } = segmentAt(p);
  const { k } = travelAt(p);
  rig.p = p;
  rig.i = i;
  rig.t = t;
  rig.k = k;
  const pa = STOPS[i].palette;
  const pb = STOPS[Math.min(COUNT - 1, i + 1)].palette;
  lerpInk(rig.bg, pa, pb, "bg", k);
  lerpInk(rig.bg2, pa, pb, "bg2", k);
  lerpInk(rig.a, pa, pb, "a", k);
  lerpInk(rig.b, pa, pb, "b", k);
  lerpInk(rig.c, pa, pb, "c", k);
  lerpInk(rig.fg, pa, pb, "fg", k);
}

/** how present stop j is on screen: 1 held, fading through travel, 0 when two or more stops away */
export function presence(j: number) {
  if (j === rig.i) return 1 - rig.k;
  if (j === rig.i + 1) return rig.k;
  return 0;
}

/** 1 when the camera is within one stop of j (so its objects render), else 0 */
export function near(j: number) {
  return Math.abs(j - rig.i) <= 1 || (j === rig.i + 1 && rig.k > 0);
}
