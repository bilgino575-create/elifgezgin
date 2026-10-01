import type { Localized } from "@/lib/content";

/**
 * The seven stops of the journey. `p` is the master clock in [0, 1]: each
 * stop owns one seventh of it; inside a stop the camera holds for the
 * first HOLD of the segment and travels to the next stop in the rest.
 * World positions are where the stop's installation lives; the camera
 * path runs through `cam` looking at `look`.
 */
export type StopId = "renk" | "tipografi" | "marka" | "afis" | "dijital" | "elif" | "iletisim";

export interface Palette {
  /** the void's colour at this stop (backdrop + fog) */
  bg: string;
  /** a second, lower colour the backdrop drifts to */
  bg2: string;
  /** the three inks allowed at this stop */
  a: string;
  b: string;
  c: string;
  /** text colour on the stop's background, and the muted variant */
  fg: string;
  fg2: string;
  /** chrome reflects these: the environment's lights */
  env: [string, string, string];
}

export interface Stop {
  id: StopId;
  n: number;
  label: Localized;
  /** the editorial corner the HTML layer takes */
  corner: "bl" | "tr" | "tl" | "br" | "bc" | "l" | "c";
  palette: Palette;
  /** installation centre, camera position and look target at the stop */
  world: [number, number, number];
  cam: [number, number, number];
  look: [number, number, number];
  /** phones: a calmer, closer camera */
  camMobile: [number, number, number];
  lookMobile: [number, number, number];
  fov: number;
}

export const HOLD = 0.58;
export const COUNT = 7;

export const STOPS: Stop[] = [
  {
    id: "renk",
    n: 1,
    label: { tr: "Renk", en: "Colour" },
    corner: "bl",
    palette: { bg: "#07060f", bg2: "#140a2e", a: "#1f3bff", b: "#ff2e88", c: "#19e3ff", fg: "#f7f6f2", fg2: "#a9a6c2", env: ["#1f3bff", "#ff2e88", "#19e3ff"] },
    world: [0, 0, 0],
    cam: [0, 0.6, 13],
    look: [0, 0.2, 0],
    camMobile: [0, 1.2, 17],
    lookMobile: [0, 0.6, 0],
    fov: 38,
  },
  {
    id: "tipografi",
    n: 2,
    label: { tr: "Tipografi", en: "Typography" },
    corner: "tr",
    palette: { bg: "#f3eee3", bg2: "#e9e1cf", a: "#1f3bff", b: "#ff5a1f", c: "#111118", fg: "#111118", fg2: "#5e5a66", env: ["#f3eee3", "#1f3bff", "#ff5a1f"] },
    world: [26, 3, -6],
    cam: [25, 3.6, 5.5],
    look: [26, 2.9, -6],
    camMobile: [26, 3.8, 9],
    lookMobile: [26, 3.1, -6],
    fov: 36,
  },
  {
    id: "marka",
    n: 3,
    label: { tr: "Marka", en: "Branding" },
    corner: "tl",
    palette: { bg: "#1a0a3d", bg2: "#2a0f5e", a: "#e400ff", b: "#19e3ff", c: "#ff2e88", fg: "#f7f6f2", fg2: "#b8a7e0", env: ["#e400ff", "#19e3ff", "#6a2cff"] },
    world: [50, -2, 4],
    cam: [51.5, -0.8, 12],
    look: [50, -2.1, 4],
    camMobile: [50, -0.6, 15.5],
    lookMobile: [50, -2.2, 4],
    fov: 36,
  },
  {
    id: "afis",
    n: 4,
    label: { tr: "Afiş", en: "Poster" },
    corner: "br",
    palette: { bg: "#c8ff00", bg2: "#9fd400", a: "#07060f", b: "#ff2e88", c: "#1f3bff", fg: "#07060f", fg2: "#3f4f00", env: ["#c8ff00", "#ffffff", "#07060f"] },
    world: [74, 4, -8],
    cam: [72.5, 4.4, 2],
    look: [74, 4, -8],
    camMobile: [74, 4.6, 5.5],
    lookMobile: [74, 4, -8],
    fov: 40,
  },
  {
    id: "dijital",
    n: 5,
    label: { tr: "Dijital Sanat", en: "Digital Art" },
    corner: "bc",
    palette: { bg: "#f7f6f2", bg2: "#e4e2ea", a: "#19e3ff", b: "#ff2e88", c: "#6a2cff", fg: "#111118", fg2: "#6b6878", env: ["#ffffff", "#19e3ff", "#ff2e88"] },
    world: [98, 0, 6],
    cam: [97, 1.2, 17],
    look: [98, 0.3, 6],
    camMobile: [98, 1.4, 21],
    lookMobile: [98, 0.4, 6],
    fov: 34,
  },
  {
    id: "elif",
    n: 6,
    label: { tr: "Elif", en: "Elif" },
    corner: "l",
    palette: { bg: "#07060f", bg2: "#1b0b3a", a: "#6a2cff", b: "#c8ff00", c: "#19e3ff", fg: "#f7f6f2", fg2: "#b3a8d6", env: ["#6a2cff", "#c8ff00", "#19e3ff"] },
    world: [122, -3, -4],
    cam: [120.5, -1.6, 10],
    look: [122, -2.6, -4],
    camMobile: [122, -1.2, 14.5],
    lookMobile: [122, -2.4, -4],
    fov: 38,
  },
  {
    id: "iletisim",
    n: 7,
    label: { tr: "İletişim", en: "Contact" },
    corner: "c",
    palette: { bg: "#1a31f0", bg2: "#0e1fb8", a: "#19e3ff", b: "#ff2e88", c: "#f7f6f2", fg: "#f7f6f2", fg2: "#dfe4ff", env: ["#19e3ff", "#ff2e88", "#6a2cff"] },
    world: [146, 2, 0],
    cam: [146, 2.6, 12],
    look: [146, 2.2, 0],
    camMobile: [146, 3.2, 16],
    lookMobile: [146, 2.4, 0],
    fov: 36,
  },
];

export const stopById = (id: StopId) => STOPS.find((s) => s.id === id)!;

/** which stop owns p, and how far into its segment we are (0..1) */
export function segmentAt(p: number) {
  const x = Math.min(0.999999, Math.max(0, p)) * COUNT;
  const i = Math.floor(x);
  return { i, t: x - i };
}

/** 0 while holding at stop i, rising to 1 at stop i+1 (eased) */
export function travelAt(p: number) {
  const { i, t } = segmentAt(p);
  if (i >= COUNT - 1) return { i, k: 0 };
  const u = Math.max(0, (t - HOLD) / (1 - HOLD));
  const k = u * u * (3 - 2 * u);
  return { i, k };
}

/** scroll height of the track in viewport heights */
export const TRACK_VH = { desktop: 110 * COUNT, mobile: 92 * COUNT };
