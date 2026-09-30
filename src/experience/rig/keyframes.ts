import type { ActId } from "@/lib/acts";
import { works } from "@/content/works.generated";
import { layout } from "../acts/wall/layout";

export interface Key {
  p: number;
  pos: [number, number, number];
  tgt: [number, number, number];
  fov: number;
  act: ActId;
  /** reduced motion snaps to stop keys */
  stop?: boolean;
}

/** the wall row's bounds (world x), from the real works */
const row = layout(works, "all", false);
const rowL = row.length ? Math.min(...row.map((s) => s.x - s.w / 2)) : 4;
const rowR = row.length ? Math.max(...row.map((s) => s.x + s.w / 2)) : 8;

/**
 * The camera walks along the wall. On desktop the index card covers the left
 * 45 % of the frame, so the walk starts with the row's first object just
 * right of the card and ends with the last object at the right edge.
 */
function wallWalk(mobile: boolean) {
  const dist = mobile ? 5.6 : 4.4;
  const fov = mobile ? 42 : 36;
  const aspect = mobile ? 390 / 844 : 1.6;
  const half = dist * Math.tan((fov * Math.PI) / 360) * aspect;
  const start = mobile ? rowL + half * 0.55 : rowL + 0.15;
  const end = Math.max(start + 0.5, rowR - half * (mobile ? 0.55 : 1.0));
  return { start, end, dist, fov };
}

export function makeKeys(mobile: boolean): Key[] {
  const w = wallWalk(mobile);
  // objects sit beside the index card on desktop (see each act's `side`); centred on phones
  const sSw = mobile ? -0.3 : 0.35;
  const sFo = mobile ? 0 : -0.75;
  const sPo = mobile ? 0 : -1.35;
  const sCa = mobile ? 0 : 0.55;
  // on phones the index card covers the lower half: aim a little further away so objects sit higher in frame
  const dz = mobile ? 0.9 : 0;
  const keys: Key[] = [
    // straight down: the table is parallel to the screen, so the debossed name sits exactly under the HTML heading
    { p: 0.0, pos: [0.0, mobile ? 4.2 : 3.2, 0.0004], tgt: [0.0, 0.0, 0.0], fov: mobile ? 36 : 32, act: "sheet", stop: true },
    { p: 0.08, pos: [0.6, 2.4, 2.4], tgt: [0.3, 0.45, -0.2], fov: 32, act: "sheet" },
    { p: 0.14, pos: [rowL - 1.0, 1.9, 3.8], tgt: [rowL + 0.6, 0.8, 0.0], fov: 34, act: "sheet" },
    { p: 0.24, pos: [w.start, 1.5, w.dist], tgt: [w.start, 0.85, 0.0], fov: w.fov, act: "wall", stop: true },
    { p: 0.44, pos: [w.end, 1.45, w.dist - 0.2], tgt: [w.end, 0.8, 0.0], fov: w.fov, act: "wall" },
    { p: 0.52, pos: [12.15 + sSw, 2.5, 2.3 + dz * 0.5], tgt: [12.15 + sSw, 0.05, -0.2 + dz], fov: 32, act: "swatch", stop: true },
    { p: 0.6, pos: [13.2 + sSw, 2.3, 2.6 + dz * 0.5], tgt: [12.5 + sSw, 0.05, -0.25 + dz], fov: 32, act: "swatch" },
    { p: 0.68, pos: [18.0 + sFo, 4.3, 0.9 + dz * 0.5], tgt: [18.0 + sFo, 0.0, -0.62 + dz], fov: 34, act: "fold", stop: true },
    { p: 0.76, pos: [19.0 + sFo, 3.6, 1.6 + dz * 0.5], tgt: [18.3 + sFo, 0.1, -0.6 + dz], fov: 34, act: "fold" },
    { p: 0.82, pos: [24.15 + sPo, 1.4, 2.9 + dz * 0.5], tgt: [24.15 + sPo, 0.6, 0.0 + dz], fov: 32, act: "portrait", stop: true },
    { p: 0.88, pos: [25.6 + sPo, 1.5, 3.1 + dz * 0.5], tgt: [24.9 + sPo, 0.55, 0.0 + dz], fov: 32, act: "portrait" },
    { p: 0.92, pos: [30.0 + sCa, 1.55, 1.75 + dz * 0.5], tgt: [30.0 + sCa, 0.05, 0.0 + dz], fov: 30, act: "card", stop: true },
    { p: 1.0, pos: [18.6, 4.3, 5.3], tgt: [17.5, 1.2, -0.2], fov: 34, act: "card", stop: true },
  ];
  if (!mobile) return keys;
  // phones: same anchors, camera further back and a wider lens (except the top-down hero and the wall walk)
  return keys.map((k, i) =>
    i === 0 || k.act === "wall"
      ? k
      : {
          ...k,
          pos: [k.pos[0] + (k.pos[0] - k.tgt[0]) * 0.25, k.pos[1] * 1.15 + 0.3, k.pos[2] * 1.3 + 0.6],
          fov: k.fov + 6,
        }
  );
}

export const DESKTOP_KEYS: Key[] = makeKeys(false);
export const MOBILE_KEYS: Key[] = makeKeys(true);
