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

export function makeKeys(mobile: boolean): Key[] {
  const n = Math.max(1, works.length);
  const nv = mobile ? NAME_VIEW.mobile : NAME_VIEW.desktop;
  const [xN, xP, xR, xM, xPo, xC] = ACTS.map((a) => a.x);
  // legends: the works index sits left on desktop, so the portals are framed right of it (target shifted left)
  const sP = mobile ? 0 : -1.4;
  const sR = mobile ? 0 : 1.3;
  const sM = mobile ? 0 : -1.3;
  const sPo = mobile ? 0 : -1.4;
  const sC = mobile ? 0 : 1.1;
  const dz = mobile ? 1.3 : 0; // phones: legends cover the lower half, aim a little further so objects sit higher
  const dy = mobile ? 0.9 : 0;
  const rowEnd = mobile ? 0 : (n - 1) * PORTAL_GAP;
  const rowDrop = mobile ? -Math.floor((n - 1) / 2) * 3.0 : 0;
  const pd = mobile ? 6.6 : 5.2;
  const pf = mobile ? 46 : 36;
  const keys: Key[] = [
    { p: 0.0, pos: [xN, 0, nv.d], tgt: [xN, 0, 0], fov: nv.fov, act: "name", stop: true },
    { p: 0.07, pos: [xN, 0, nv.d], tgt: [xN, 0, 0], fov: nv.fov, act: "name" },
    { p: 0.16, pos: [xN, 0, mobile ? 4.4 : 3.6], tgt: [xN, 0, 0], fov: nv.fov, act: "name" },
    { p: 0.2, pos: [xP + sP - 1.5, dy, pd + 1.2], tgt: [xP + sP - 1.5, dy, 0], fov: pf, act: "portals" },
    { p: 0.28, pos: [xP + sP, dy, pd], tgt: [xP + sP, dy, 0], fov: pf, act: "portals", stop: true },
    { p: 0.44, pos: [(mobile ? xP : xP + rowEnd) + sP, dy + rowDrop, pd], tgt: [(mobile ? xP : xP + rowEnd) + sP, dy + rowDrop, 0], fov: pf, act: "portals" },
    { p: 0.51, pos: [xR + sR, 1.2 + dy, 6 + dz], tgt: [xR + sR, 0, 0], fov: 34, act: "ribbon", stop: true },
    { p: 0.58, pos: [xR + sR + 1.5, 0.6 + dy, 5.2 + dz], tgt: [xR + sR + 0.6, 0, 0], fov: 34, act: "ribbon" },
    { p: 0.65, pos: [xM + sM - 1.5, 1.6 + dy, 6.8 + dz], tgt: [xM + sM - 0.4, 0.2, 0], fov: 34, act: "machine", stop: true },
    { p: 0.72, pos: [xM + sM + 1.8, 0.4 + dy, 5.6 + dz], tgt: [xM + sM + 0.8, 0.1, 0], fov: 34, act: "machine" },
    { p: 0.78, pos: [xPo + sPo, 0.3 + dy, 4.6 + dz], tgt: [xPo + sPo, 0.2, 0], fov: 32, act: "portrait", stop: true },
    { p: 0.84, pos: [xPo + sPo + 1.0, 0.4 + dy, 4.8 + dz], tgt: [xPo + sPo + 0.5, 0.2, 0], fov: 32, act: "portrait" },
    { p: 0.9, pos: [xC + sC, 0.2 + dy, 3.4 + dz], tgt: [xC + sC, 0, 0], fov: 30, act: "card", stop: true },
    { p: 1.0, pos: [xC, 0.1 + dy * 0.5, 2.6 + dz * 0.7], tgt: [xC, 0, 0], fov: 30, act: "card", stop: true },
  ];
  if (!mobile) return keys;
  return keys.map((k) => (k.act === "name" || k.act === "portals" ? k : { ...k, fov: k.fov + 6 }));
}

export const DESKTOP_KEYS: Key[] = makeKeys(false);
export const MOBILE_KEYS: Key[] = makeKeys(true);
