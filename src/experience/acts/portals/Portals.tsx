"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlwaysStencilFunc,
  BackSide,
  BoxGeometry,
  Color,
  EqualStencilFunc,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  KeepStencilOp,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  ReplaceStencilOp,
  Shape,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { damp, damp3 } from "maath/easing";
import { works, site, type Work } from "@/lib/content";
import { loading, store } from "@/lib/store";
import { ACTS, range } from "@/lib/acts";
import { PORTAL_GAP } from "../../rig/keyframes";
import { rig } from "../../rig/CameraRig";
import { v3a } from "../../utils/scratch";

/**
 * Act II. Every work is a frame that is a real portal: the frame's inside
 * writes a stencil id, and a small world built from the work's own colours
 * renders only where that id is. No extra render passes; the depth is
 * real, so walking past a frame shows parallax inside. The cover's layers
 * separate in depth on hover, category decides the object inside.
 */
export const OUTER_W = 2.2;
const RIM = 0.07;
const ROOM_DEPTH = 2.6;

/** world position of every portal, read by the camera for the fly-through */
export const portalWorld = new Map<string, Vector3>();

function frameShape(w: number, h: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function stencil(m: Material, ref: number) {
  m.stencilWrite = true;
  m.stencilRef = ref;
  m.stencilFunc = EqualStencilFunc;
  m.stencilFail = KeepStencilOp;
  m.stencilZFail = KeepStencilOp;
  m.stencilZPass = KeepStencilOp;
  return m;
}

/** the room: a box seen from inside, back wall in c0, sides in c1, floor/ceiling in c2 */
function roomGeometry(w: number, h: number, colors: string[]) {
  const g = new BoxGeometry(w, h, ROOM_DEPTH);
  const pos = g.getAttribute("position");
  const nrm = g.getAttribute("normal");
  const col = new Float32Array(pos.count * 3);
  const c = [new Color(colors[0] ?? "#222"), new Color(colors[1] ?? "#333"), new Color(colors[2] ?? "#444")];
  for (let i = 0; i < pos.count; i++) {
    const nz = nrm.getZ(i);
    const ny = nrm.getY(i);
    // deeper = darker so the room reads as depth
    const depth = (pos.getZ(i) + ROOM_DEPTH / 2) / ROOM_DEPTH;
    const base = Math.abs(nz) > 0.5 ? c[0] : Math.abs(ny) > 0.5 ? c[2] : c[1];
    const k = 0.35 + 0.65 * depth;
    col[i * 3] = base.r * k;
    col[i * 3 + 1] = base.g * k;
    col[i * 3 + 2] = base.b * k;
  }
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  return g;
}

interface Slot {
  x: number;
  y: number;
  visible: boolean;
}
function slots(filter: string, mobile: boolean): Slot[] {
  let k = 0;
  const base = ACTS[1].x;
  return works.map((w) => {
    const visible = filter === "all" || w.category === filter;
    if (!visible) return { x: 0, y: 0, visible };
    const i = k++;
    return mobile ? { x: base + (i % 2 === 0 ? -1.15 : 1.15), y: -Math.floor(i / 2) * 3.0, visible } : { x: base + i * PORTAL_GAP, y: 0, visible };
  });
}

function usePortalTextures() {
  const [tex, setTex] = useState<Map<string, Texture[]> | null>(null);
  useEffect(() => {
    loading.register("portals", 1);
    const loader = new TextureLoader();
    const map = new Map<string, Texture[]>();
    let cancelled = false;
    Promise.all(
      works.map(async (w) => {
        const srcs = w.layers.length ? w.layers.map((l) => l.src) : [w.cover.src1024];
        const ts = await Promise.all(
          srcs.map(
            (src) =>
              new Promise<Texture>((res) => {
                loader.load(
                  src,
                  (t) => {
                    t.colorSpace = SRGBColorSpace;
                    t.anisotropy = 4;
                    res(t);
                  },
                  undefined,
                  () => res(new Texture())
                );
              })
          )
        );
        map.set(w.slug, ts);
      })
    ).then(() => {
      if (cancelled) {
        map.forEach((ts) => ts.forEach((t) => t.dispose()));
        return;
      }
      setTex(map);
      loading.done("portals");
    });
    return () => {
      cancelled = true;
      loading.done("portals");
    };
  }, []);
  useEffect(() => () => tex?.forEach((ts) => ts.forEach((t) => t.dispose())), [tex]);
  return tex;
}

function Portal({ work, index, textures, mobile }: { work: Work; index: number; textures: Texture[]; mobile: boolean }) {
  const ref = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const layersRef = useRef<Group>(null);
  const objRef = useRef<Mesh>(null);
  const spread = useRef(0);
  const scaleRef = useRef(1);
  const stencilId = index + 1;
  const aspect = work.cover.w / work.cover.h;
  const w = mobile ? 2.0 : OUTER_W;
  const h = Math.min(w * 1.3, Math.max(w * 0.7, w / aspect));
  const iw = w - RIM * 2;
  const ih = h - RIM * 2;
  const spot = site.spotColor;

  const res = useMemo(() => {
    const frameGeo = new ExtrudeGeometry(frameShape(w, h, 0.12), { depth: 0.08, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 });
    const hole = frameShape(iw, ih, 0.06);
    frameShape(w, h, 0.12).holes.push(hole);
    const ring = frameShape(w, h, 0.12);
    ring.holes.push(hole);
    const ringGeo = new ExtrudeGeometry(ring, { depth: 0.08, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 });
    frameGeo.dispose();
    const frameMat = new MeshPhysicalMaterial({ color: "#0e0e20", metalness: 0.8, roughness: 0.25, emissive: new Color(spot), emissiveIntensity: 0.12, clearcoat: 0.8 });
    const maskGeo = new PlaneGeometry(iw, ih);
    const maskMat = new MeshBasicMaterial({ colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: stencilId, stencilFunc: AlwaysStencilFunc, stencilZPass: ReplaceStencilOp });
    const roomGeo = roomGeometry(iw, ih, work.colors);
    const roomMat = stencil(new MeshBasicMaterial({ vertexColors: true, side: BackSide }), stencilId) as MeshBasicMaterial;
    const layerMats = textures.map((t, i) => stencil(new MeshStandardMaterial({ map: t, transparent: i > 0 || work.layers.length === 0 ? true : false, alphaTest: 0.02, roughness: 0.85, metalness: 0, depthWrite: i === 0 }), stencilId) as MeshStandardMaterial);
    const cover = textures[textures.length - 1];
    const c1 = new Color(work.colors[1] ?? spot);
    const c2 = new Color(work.colors[2] ?? "#333");
    let objGeo: BoxGeometry | RoundedBoxGeometry | PlaneGeometry | null = null;
    let objMat: Material | Material[] | null = null;
    if (work.category === "packaging") {
      objGeo = new BoxGeometry(iw * 0.5, ih * 0.62, iw * 0.3);
      const side = stencil(new MeshStandardMaterial({ color: c1, roughness: 0.6 }), stencilId);
      const front = stencil(new MeshStandardMaterial({ map: textures[0], roughness: 0.6 }), stencilId);
      objMat = [side, side, side, side, front, side];
    } else if (work.category === "identity") {
      objGeo = new RoundedBoxGeometry(iw * 0.62, iw * 0.62, 0.16, 4, 0.05);
      objMat = stencil(new MeshPhysicalMaterial({ map: cover, metalness: 1, roughness: 0.14, iridescence: 0.5, iridescenceIOR: 1.3, clearcoat: 1, envMapIntensity: 2.5, color: "#ffffff" }), stencilId);
    } else if (work.category === "social") {
      objGeo = new PlaneGeometry(iw * 0.72, (iw * 0.72) / aspect);
      objMat = stencil(new MeshBasicMaterial({ map: cover, toneMapped: false }), stencilId);
    }
    return { ringGeo, frameMat, maskGeo, maskMat, roomGeo, roomMat, layerMats, objGeo, objMat, c1, c2 };
  }, [w, h, iw, ih, textures, work, stencilId, spot, aspect]);

  useEffect(
    () => () => {
      res.ringGeo.dispose();
      res.frameMat.dispose();
      res.maskGeo.dispose();
      res.maskMat.dispose();
      res.roomGeo.dispose();
      res.roomMat.dispose();
      res.layerMats.forEach((m) => m.dispose());
      res.objGeo?.dispose();
      if (Array.isArray(res.objMat)) res.objMat.forEach((m) => m.dispose());
      else res.objMat?.dispose();
    },
    [res]
  );

  const open = (e?: ThreeEvent<MouseEvent>) => {
    e?.stopPropagation();
    const s = store.get();
    if (s.opening) return;
    const href = (document.querySelector<HTMLAnchorElement>(`.index a[href$="/${work.slug}"]`) ?? document.querySelector<HTMLAnchorElement>(`a[href$="/${work.slug}"]`))?.href;
    if (!href) return;
    if (s.reducedMotion) {
      window.location.href = href;
      return;
    }
    store.set({ opening: work.slug });
    window.setTimeout(() => {
      window.location.href = href;
    }, 950);
  };

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const s = store.get();
    const cdt = Math.min(dt, 1 / 20);
    const slot = slots(s.filter, mobile)[index];
    const hovered = s.hoverWork === work.slug;
    const opening = s.opening === work.slug;
    const p = rig.p;
    const vis = p > 0.13 && p < 0.48;
    g.visible = vis && (slot.visible || scaleRef.current > 0.02);
    if (!vis) return;
    // spring to the slot; hidden portals shrink and sink
    if (slot.visible) {
      v3a.set(slot.x, slot.y, 0);
      damp3(g.position, v3a, 0.32, cdt);
    } else {
      damp(g.position, "z", -1.5, 0.4, cdt);
    }
    scaleRef.current += ((slot.visible ? 1 : 0) - scaleRef.current) * Math.min(1, cdt * 5);
    g.scale.setScalar(Math.max(0.001, scaleRef.current));
    portalWorld.set(work.slug, g.position);
    // the hand tilts the frame a little toward itself
    const dx = rig.hand.x - g.position.x;
    const dy = rig.hand.y - g.position.y;
    const near = Math.exp(-(dx * dx + dy * dy) / 6);
    const tx = -dy * 0.06 * near;
    const ty = dx * 0.08 * near;
    damp(g.rotation, "x", s.reducedMotion ? 0 : tx, 0.25, cdt);
    damp(g.rotation, "y", s.reducedMotion ? 0 : ty, 0.25, cdt);
    // depth pop
    spread.current += ((hovered || opening ? 1 : 0) - spread.current) * Math.min(1, cdt * 6);
    const lay = layersRef.current;
    if (lay) {
      const n = lay.children.length;
      lay.children.forEach((c, i) => {
        const k = n > 1 ? i / (n - 1) : 0;
        c.position.z = -0.42 + k * (0.1 + spread.current * 0.6);
        c.position.x = (rig.hand.x - g.position.x) * 0.03 * k * spread.current;
        c.position.y = (rig.hand.y - g.position.y) * 0.03 * k * spread.current;
      });
    }
    const o = objRef.current;
    if (o && !s.reducedMotion) {
      o.rotation.y += cdt * (0.35 + spread.current * 1.2);
      if (work.category === "identity") o.rotation.x = Math.sin(state.clock.elapsedTime * 0.7) * 0.15;
    }
    res.frameMat.emissiveIntensity = 0.12 + spread.current * 0.9;
  });

  const layerGeo = useMemo(() => new PlaneGeometry(iw * 0.82, (iw * 0.82) / aspect), [iw, aspect]);
  useEffect(() => () => layerGeo.dispose(), [layerGeo]);

  const hasObject = work.category === "packaging" || work.category === "identity" || work.category === "social";
  return (
    <group ref={ref} position={[ACTS[1].x + index * PORTAL_GAP, 0, 0]}>
      <mesh geometry={res.ringGeo} material={res.frameMat} position={[0, 0, -0.04]} />
      <mesh
        geometry={res.maskGeo}
        material={res.maskMat}
        renderOrder={10}
        onPointerOver={(e) => {
          e.stopPropagation();
          store.set({ hoverWork: work.slug });
        }}
        onPointerOut={() => store.get().hoverWork === work.slug && store.set({ hoverWork: null })}
        onClick={open}
      />
      <group ref={inner}>
        <mesh geometry={res.roomGeo} material={res.roomMat} position={[0, 0, -ROOM_DEPTH / 2]} renderOrder={11} />
        {!hasObject || work.layers.length > 1 ? (
          <group ref={layersRef}>
            {res.layerMats.map((m, i) => (
              <mesh key={i} geometry={layerGeo} material={m} renderOrder={12 + i} position={[0, 0, -0.42 + (i / Math.max(1, res.layerMats.length - 1)) * 0.1]} />
            ))}
          </group>
        ) : null}
        {hasObject && res.objGeo && res.objMat ? <mesh ref={objRef} geometry={res.objGeo} material={res.objMat} position={[0, 0, -1.0]} renderOrder={16} /> : null}
      </group>
    </group>
  );
}

export default function Portals() {
  const textures = usePortalTextures();
  const mobile = useMemo(() => store.get().touch || window.innerWidth < 768, []);
  if (!textures) return null;
  return (
    <group>
      {works.map((w, i) => (
        <Portal key={w.slug} work={w} index={i} textures={textures.get(w.slug) ?? []} mobile={mobile} />
      ))}
    </group>
  );
}

export { range };
