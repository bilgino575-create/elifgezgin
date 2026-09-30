/**
 * Scroll → progress mapping shared by the DOM layer and the 3D layer.
 * `p` is the master clock in [0, 1]. Every act owns a range of `p`; every
 * HTML section owns an anchor inside an act where its panel is fully
 * visible and the camera has settled. See docs/RENK.md §4.
 */
export type ActId = "name" | "portals" | "ribbon" | "machine" | "portrait" | "card";

export interface Act {
  id: ActId;
  start: number;
  end: number;
  /** world x of the act's centre */
  x: number;
}

export const ACTS: Act[] = [
  { id: "name", start: 0.0, end: 0.16, x: 0 },
  { id: "portals", start: 0.16, end: 0.44, x: 10 },
  { id: "ribbon", start: 0.44, end: 0.58, x: 22 },
  { id: "machine", start: 0.58, end: 0.72, x: 32 },
  { id: "portrait", start: 0.72, end: 0.84, x: 42 },
  { id: "card", start: 0.84, end: 1.0, x: 52 },
];

export interface Section {
  id: string;
  act: ActId;
  anchor: number;
  from: number;
  to: number;
}

export const SECTIONS: Section[] = [
  { id: "giris", act: "name", anchor: 0.0, from: 0, to: 0.1 },
  { id: "isler", act: "portals", anchor: 0.28, from: 0.2, to: 0.42 },
  { id: "beceriler", act: "ribbon", anchor: 0.51, from: 0.46, to: 0.565 },
  { id: "surec", act: "machine", anchor: 0.65, from: 0.6, to: 0.705 },
  { id: "hakkimda", act: "portrait", anchor: 0.78, from: 0.735, to: 0.825 },
  { id: "iletisim", act: "card", anchor: 0.9, from: 0.865, to: 0.955 },
  { id: "son", act: "card", anchor: 1.0, from: 0.97, to: 1.0 },
];

export const TRACK_VH = { desktop: 760, mobile: 560 };

/** The anamorphic viewpoint of Act I: the camera distance and lens the name is fitted for. */
export const NAME_VIEW = { desktop: { d: 9, fov: 40 }, mobile: { d: 11, fov: 44 } };

export function actAt(p: number): ActId {
  for (let i = ACTS.length - 1; i >= 0; i--) if (p >= ACTS[i].start) return ACTS[i].id;
  return "name";
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
