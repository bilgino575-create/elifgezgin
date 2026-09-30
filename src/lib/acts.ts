/**
 * Scroll → progress mapping shared by the DOM layer and the 3D layer.
 * `p` is the master clock in [0, 1]. Every act owns a range of `p`; every
 * HTML section owns an anchor inside an act where its panel is fully
 * visible and the camera has settled.
 */
export type ActId = "sheet" | "wall" | "swatch" | "fold" | "portrait" | "card";

export interface Act {
  id: ActId;
  start: number;
  end: number;
  /** world x of the act's centre on the studio table */
  x: number;
}

export const ACTS: Act[] = [
  { id: "sheet", start: 0.0, end: 0.14, x: 0 },
  { id: "wall", start: 0.14, end: 0.44, x: 6 },
  { id: "swatch", start: 0.44, end: 0.6, x: 12 },
  { id: "fold", start: 0.6, end: 0.76, x: 18 },
  { id: "portrait", start: 0.76, end: 0.88, x: 24 },
  { id: "card", start: 0.88, end: 1.0, x: 30 },
];

export interface Section {
  id: string;
  act: ActId;
  anchor: number;
  from: number;
  to: number;
}

export const SECTIONS: Section[] = [
  { id: "giris", act: "sheet", anchor: 0.0, from: 0, to: 0.1 },
  { id: "isler", act: "wall", anchor: 0.24, from: 0.17, to: 0.42 },
  { id: "beceriler", act: "swatch", anchor: 0.52, from: 0.46, to: 0.585 },
  { id: "surec", act: "fold", anchor: 0.68, from: 0.62, to: 0.745 },
  { id: "hakkimda", act: "portrait", anchor: 0.82, from: 0.775, to: 0.865 },
  { id: "iletisim", act: "card", anchor: 0.92, from: 0.895, to: 0.965 },
  { id: "son", act: "card", anchor: 1.0, from: 0.975, to: 1.0 },
];

export const TRACK_VH = { desktop: 700, mobile: 520 };

export function actAt(p: number): ActId {
  for (let i = ACTS.length - 1; i >= 0; i--) if (p >= ACTS[i].start) return ACTS[i].id;
  return "sheet";
}

export function actById(id: ActId): Act {
  return ACTS.find((a) => a.id === id)!;
}

export function sectionById(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id);
}

export function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export function range(p: number, a: number, b: number) {
  return clamp01((p - a) / (b - a));
}

/** 0..1 visibility of a section at progress p, with soft edges. */
export function sectionVisibility(s: Section, p: number) {
  const fade = 0.02;
  if (p < s.from - fade || p > s.to + fade) return 0;
  const inA = s.from <= 0 ? 1 : clamp01((p - (s.from - fade)) / (fade * 2));
  const outA = s.to >= 1 ? 1 : clamp01((s.to + fade - p) / (fade * 2));
  return Math.min(inA, outA);
}
