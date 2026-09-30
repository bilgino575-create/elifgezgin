import { ACTS, NAME_VIEW, type ActId } from "@/lib/acts";
import { works } from "@/content/works.generated";

export interface Key {
  p: number;
  pos: [number, number, number];
  tgt: [number, number, number];
  fov: number;
  act: ActId;
  /** reduced motion snaps to stop keys */
  stop?: boolean;
}

/** portal row: world x of each frame */
export const PORTAL_GAP = 3.1;
export function portalX(i: number, mobile: boolean) {
  const a = ACTS[1];
  return mobile ? a.x : a.x + i * PORTAL_GAP;
}
/** on phones the portals stack vertically (two columns), the walk is downwards */
export function portalY(i: number, mobile: boolean) {
  return mobile ? -Math.floor(i / 2) * 3.0 : 0;
}
export function portalXMobile(i: number) {
  return ACTS[1].x + (i % 2 === 0 ? -1.15 : 1.15);
}

/** captures (scripts/capture.mjs) hide the legends, so the objects are framed centrally */
const noLegend = typeof window !== "undefined" && /[?&](capture|nopanels)=1/.test(window.location.search);

export function makeKeys(mobile: boolean): Key[] {
  const n = Math.max(1, works.length);
  const nv = mobile ? NAME_VIEW.mobile : NAME_VIEW.desktop;
  const [xN, xP, xR, xM, xPo, xC] = ACTS.map((a) => a.x);
  // legends: a legend on the LEFT means the target shifts left (negative) so the objects sit right of it, and vice versa
  const side = mobile || noLegend ? 0 : 1;
  const sP = -2.1 * side; // works index left: the framed portal sits at ≈ +2.1 world, right of the legend
  const sR = -2.0 * side; // skills index left
  const sM = 2.3 * side; // process index right (the machine spans x −1.1 … 4.5, so aim right of its middle)
  const sPo = 2.1 * side; // about right
  const sC = -1.0 * side; // contact left
  const dz = mobile ? 1.3 : 0; // phones: legends cover the lower half, aim a little further so objects sit higher
  const dy = mobile ? -1.15 : 0; // phones: aim below the objects so they sit in the upper half of the screen
  const rowEnd = mobile ? 0 : (n - 1) * PORTAL_GAP;
  const rowDrop = mobile ? -Math.floor((n - 1) / 2) * 3.0 : 0;
  const pd = mobile ? 8.8 : 7.6;
  const pf = mobile ? 46 : 36;
  const keys: Key[] = [
    { p: 0.0, pos: [xN, 0, nv.d], tgt: [xN, 0, 0], fov: nv.fov, act: "name", stop: true },
    { p: 0.07, pos: [xN, 0, nv.d], tgt: [xN, 0, 0], fov: nv.fov, act: "name" },
    { p: 0.16, pos: [xN, 0, mobile ? 4.4 : 3.6], tgt: [xN, 0, 0], fov: nv.fov, act: "name" },
    { p: 0.2, pos: [xP + sP - 1.2, dy, pd + 1.2], tgt: [xP + sP - 1.2, dy, 0], fov: pf, act: "portals" },
    { p: 0.28, pos: [xP + sP, dy, pd], tgt: [xP + sP, dy, 0], fov: pf, act: "portals", stop: true },
    { p: 0.44, pos: [(mobile ? xP : xP + rowEnd) + sP, dy + rowDrop, pd], tgt: [(mobile ? xP : xP + rowEnd) + sP, dy + rowDrop, 0], fov: pf, act: "portals" },
    { p: 0.51, pos: [xR + sR, 1.0 + dy, mobile ? 13 : 9.2], tgt: [xR + sR, dy, 0], fov: 34, act: "ribbon", stop: true },
    { p: 0.58, pos: [xR + sR + 2.0, 0.4 + dy, mobile ? 12.5 : 8.6], tgt: [xR + sR + 0.6, dy, 0], fov: 34, act: "ribbon" },
    { p: 0.65, pos: [xM + 1.7 + sM - 1.0, mobile ? -1.0 : 0.6, mobile ? 13 : 11], tgt: [xM + 1.7 + sM - 0.4, mobile ? -2.2 : 0, 0], fov: 34, act: "machine", stop: true },
    { p: 0.72, pos: [xM + 1.7 + sM + 1.4, mobile ? -1.2 : 0.2, mobile ? 12 : 10], tgt: [xM + 1.7 + sM + 0.6, mobile ? -2.3 : -0.2, 0], fov: 34, act: "machine" },
    { p: 0.78, pos: [xPo + sPo, 0.3 + dy, mobile ? 10 : 8], tgt: [xPo + sPo, dy * 0.5, 0], fov: 32, act: "portrait", stop: true },
    { p: 0.84, pos: [xPo + sPo + 1.2, 0.5 + dy, mobile ? 10 : 8.2], tgt: [xPo + sPo + 0.4, dy * 0.5, 0], fov: 32, act: "portrait" },
    { p: 0.9, pos: [xC + sC, 0.2 + dy, mobile ? 12.5 : 7.5], tgt: [xC + sC, dy, 0], fov: 30, act: "card", stop: true },
    { p: 1.0, pos: [xC, 0.1 + dy * 0.5, mobile ? 11 : 6.0], tgt: [xC, dy * 0.5, 0], fov: 30, act: "card", stop: true },
  ];
  if (!mobile) return keys;
  return keys.map((k) => (k.act === "name" || k.act === "portals" ? k : { ...k, fov: k.fov + 6 }));
}

export const DESKTOP_KEYS: Key[] = makeKeys(false);
export const MOBILE_KEYS: Key[] = makeKeys(true);
