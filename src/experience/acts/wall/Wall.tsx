"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MultiplyBlending,
  PlaneGeometry,
  Texture,
  Vector2,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { damp } from "maath/easing";
import { store } from "@/lib/store";
import { site } from "@/lib/content";
import { works, type Work } from "@/content/works.generated";
import { workHref } from "@/i18n/dict";
import type { Lang } from "@/lib/content";
import { rig } from "../../rig/CameraRig";
import { embossNormal, paperMaterial, type PaperMaterial } from "../../materials/paper";
import { getWorkTexture } from "../../materials/textures";
import { loupeMaterial } from "../../materials/loupe";
import { useDispose, useDisposeAll } from "../../utils/useDispose";
import { v3a, v3b } from "../../utils/scratch";
import { audio } from "@/lib/audio";
import { layout, RAIL_Y, type Slot } from "./layout";

/** the last pointer hit over a work: which one, where on its artwork, where in the world */
const hover = { slug: null as string | null, uv: new Vector2(0.5, 0.5), point: new Vector3(), aspect: 0.8, tex: null as Texture | null };

/** registration drift from pointer velocity, shared by every print material */
const DRIFT_K = 0.00035 / 60;
const DRIFT_MAX = 0.0055;

function lang(): Lang {
  return document.documentElement.lang === "en" ? "en" : "tr";
}

function open(slug: string) {
  const s = store.get();
  if (s.opening) return;
  const href = workHref(lang(), slug);
  audio.thunk();
  if (s.reducedMotion) {
    window.location.href = href;
    return;
  }
  store.set({ opening: slug });
  window.setTimeout(() => {
    window.location.href = href;
  }, 750);
}

/**
 * Act II. The print wall: every work is a physical object matching its
 * category, arranged as one curated row along the wall. Hover lifts, the
 * loupe magnifies, click brings the object to the camera before the page
 * opens, and the filter re-arranges the row.
 */
export default function Wall() {
  const [filter, setFilter] = useState(store.get().filter);
  useEffect(() => store.subscribe(() => setFilter((f) => (f === store.get().filter ? f : store.get().filter))), []);
  const mobile = store.get().touch || (typeof window !== "undefined" && window.innerWidth < 768);
  const slots = useMemo(() => layout(works, filter, mobile), [filter, mobile]);
  const all = useMemo(() => layout(works, "all", mobile), [mobile]);
  const railW = useMemo(() => {
    const xs = all.map((s) => [s.x - s.w / 2, s.x + s.w / 2]).flat();
    return xs.length ? [Math.min(...xs) - 0.6, Math.max(...xs) + 0.6] : [4, 8];
  }, [all]);
  const group = useRef<Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = rig.p > 0.06 && rig.p < 0.5;
  });
  return (
    <group ref={group}>
      <Rail from={railW[0]} to={railW[1]} />
      {works.map((w) => (
        <WorkObject key={w.slug} work={w} slot={slots.find((s) => s.slug === w.slug) ?? null} rest={all.find((s) => s.slug === w.slug)!} />
      ))}
      <Loupe />
    </group>
  );
}

/** The clip rail: the spot-colour line, held by two ink brackets. */
function Rail({ from, to }: { from: number; to: number }) {
  const mat = useMemo(() => new MeshStandardMaterial({ color: site.spotColor, roughness: 0.45, metalness: 0.1 }), []);
  const ink = useMemo(() => new MeshStandardMaterial({ color: "#1a1a1c", roughness: 0.6 }), []);
  useDispose(mat);
  useDispose(ink);
  const w = to - from;
  const cx = (from + to) / 2;
  return (
    <group>
      <mesh material={mat} position={[cx, RAIL_Y, 0]} castShadow>
        <boxGeometry args={[w, 0.022, 0.022]} />
      </mesh>
      {[from + 0.1, to - 0.1].map((x) => (
        <mesh key={x} material={ink} position={[x, RAIL_Y / 2, -0.02]}>
          <boxGeometry args={[0.024, RAIL_Y, 0.024]} />
        </mesh>
      ))}
    </group>
  );
}

/** Shared per-object motion: rest ↔ hidden, hover lift, the flight to the camera when opened. */
function useObjectMotion(slug: string, slot: Slot | null, rest: Slot, group: React.RefObject<Group | null>) {
  const camera = useThree((s) => s.camera);
  const first = works[0]?.slug === slug;
  const lift = useRef(0);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const s = store.get();
    const cdt = Math.min(dt, 1 / 20);
    const shown = !!slot;
    const target = slot ?? rest;
    const opening = s.opening === slug;
    if (opening) {
      // fly to a spot in front of the camera and face it
      camera.getWorldDirection(v3a);
      v3b.copy(camera.position).addScaledVector(v3a, 1.35);
      damp(g.position, "x", v3b.x, 0.12, cdt);
      damp(g.position, "y", v3b.y, 0.12, cdt);
      damp(g.position, "z", v3b.z, 0.12, cdt);
      const ry = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z);
      damp(g.rotation, "y", ry, 0.12, cdt);
      damp(g.scale, "x", 1.15, 0.15, cdt);
      damp(g.scale, "y", 1.15, 0.15, cdt);
      damp(g.scale, "z", 1.15, 0.15, cdt);
      return;
    }
    const hovered = s.hoverWork === slug;
    damp(lift, "current", hovered && shown ? 1 : 0, 0.18, cdt);
    const hiddenY = -0.6;
    damp(g.position, "x", target.x, 0.32, cdt);
    damp(g.position, "y", shown ? target.y + lift.current * 0.05 : hiddenY, 0.32, cdt);
    damp(g.position, "z", target.z + lift.current * 0.06, 0.32, cdt);
    damp(g.rotation, "y", target.ry, 0.32, cdt);
    const sc = shown ? 1 : 0.001;
    damp(g.scale, "x", sc, 0.3, cdt);
    damp(g.scale, "y", sc, 0.3, cdt);
    damp(g.scale, "z", sc, 0.3, cdt);
    g.visible = (shown || g.scale.x > 0.01) && (!first || rig.p >= 0.155);
  });
  return lift;
}

function useDrift(mats: PaperMaterial[]) {
  useFrame(() => {
    const vx = Math.max(-DRIFT_MAX, Math.min(DRIFT_MAX, rig.vel.x * DRIFT_K));
    const vy = Math.max(-DRIFT_MAX, Math.min(DRIFT_MAX, rig.vel.y * DRIFT_K));
    const reduced = store.get().reducedMotion;
    for (const m of mats) m.paper.uDrift.value.set(reduced ? 0 : vx, reduced ? 0 : -vy);
  });
}

function pointerHandlers(work: Work, tex: Texture) {
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      store.set({ hoverWork: work.slug });
      audio.rustle(0.3);
    },
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      if (!e.uv) return;
      hover.slug = work.slug;
      hover.uv.copy(e.uv);
      hover.point.copy(e.point);
      hover.aspect = work.cover.w / work.cover.h;
      hover.tex = tex;
    },
    onPointerOut: () => {
      if (store.get().hoverWork === work.slug) store.set({ hoverWork: null });
      if (hover.slug === work.slug) hover.slug = null;
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      open(work.slug);
    },
  };
}

function WorkObject({ work, slot, rest }: { work: Work; slot: Slot | null; rest: Slot }) {
  const group = useRef<Group>(null);
  const lift = useObjectMotion(work.slug, slot, rest, group);
  const tex = useMemo(() => getWorkTexture(work.slug, work.cover.src1024), [work]);
  const c = work.category;
  return (
    <group ref={group} position={[rest.x, rest.y, rest.z]} rotation-y={rest.ry}>
      {c === "poster" ? <Poster work={work} slot={rest} tex={tex} /> : null}
      {c === "editorial" ? <Book work={work} slot={rest} tex={tex} lift={lift} /> : null}
      {c === "packaging" ? <Box work={work} slot={rest} tex={tex} /> : null}
      {c === "identity" ? <Card work={work} slot={rest} tex={tex} lift={lift} /> : null}
      {c === "social" ? <Screen work={work} slot={rest} tex={tex} /> : null}
    </group>
  );
}

/** A poster hung from the rail with two clips; the paper bows gently. */
function Poster({ work, slot, tex }: { work: Work; slot: Slot; tex: Texture }) {
  const geo = useMemo(() => {
    const g = new PlaneGeometry(slot.w, slot.h, 1, 14);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = pos.getY(i) / slot.h + 0.5; // 0 bottom .. 1 top
      // held at the top, the sheet bows out toward the bottom and curls back at the edge
      pos.setZ(i, Math.sin(v * Math.PI) * 0.028 + (1 - v) * 0.02);
    }
    g.computeVertexNormals();
    return g;
  }, [slot.w, slot.h]);
  const mat = useMemo(() => paperMaterial({ map: tex, print: true, grainScale: 2, grainStrength: 0.25, roughness: 0.62 }), [tex]);
  const back = useMemo(() => paperMaterial({ color: "#f0efe9", grainScale: 2 }), []);
  const clip = useMemo(() => new MeshStandardMaterial({ color: "#1a1a1c", roughness: 0.5, metalness: 0.2 }), []);
  useDispose(geo);
  useDispose(mat);
  useDispose(back);
  useDispose(clip);
  useDrift([mat]);
  const h = pointerHandlers(work, tex);
  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow {...h} />
      <mesh geometry={geo} material={back} rotation-y={Math.PI} position-z={-0.002} scale-x={-1} />
      {[-slot.w * 0.36, slot.w * 0.36].map((x) => (
        <group key={x} position={[x, slot.h / 2 + 0.04, 0.012]}>
          <mesh material={clip} position={[0, 0.02, 0]}>
            <boxGeometry args={[0.05, 0.12, 0.03]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A standing book: the front cover swings open on hover to a spread. */
function Book({ work, slot, tex, lift }: { work: Work; slot: Slot; tex: Texture; lift: React.RefObject<number> }) {
  const t = 0.07;
  const inner = useMemo(() => (work.gallery[0] ? getWorkTexture(work.slug + ":g1", work.gallery[0].src) : null), [work]);
  const coverGeo = useMemo(() => new BoxGeometry(slot.w, slot.h, 0.006), [slot.w, slot.h]);
  const pagesGeo = useMemo(() => new BoxGeometry(slot.w * 0.97, slot.h * 0.97, t - 0.012), [slot.w, slot.h]);
  const spineGeo = useMemo(() => new BoxGeometry(0.006, slot.h, t), [slot.h]);
  const cover = useMemo(() => paperMaterial({ map: tex, print: true, grainScale: 2, grainStrength: 0.2, roughness: 0.5 }), [tex]);
  const coverBack = useMemo(() => paperMaterial({ color: "#efeee8", grainScale: 2 }), []);
  const pages = useMemo(() => paperMaterial({ color: "#faf9f5", grainScale: 4, grainStrength: 0.15, roughness: 0.9 }), []);
  const spread = useMemo(() => paperMaterial({ map: inner, color: inner ? "#ffffff" : "#faf9f5", grainScale: 4, grainStrength: 0.12, roughness: 0.85 }), [inner]);
  const spine = useMemo(() => new MeshPhysicalMaterial({ color: site.spotColor, roughness: 0.55 }), []);
  useDisposeAll([coverGeo, pagesGeo, spineGeo]);
  useDisposeAll([cover, coverBack, pages, spread, spine]);
  useDrift([cover]);
  const hinge = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!hinge.current) return;
    const s = store.get();
    const want = s.hoverWork === work.slug && !s.reducedMotion ? -1.85 : 0;
    damp(hinge.current.rotation, "y", want, 0.28, Math.min(dt, 1 / 20));
    void lift;
  });
  const h = pointerHandlers(work, tex);
  // materials for the page block: +x, -x, +y, -y, +z (the spread), -z
  const pageMats = useMemo(() => [pages, pages, pages, pages, spread, pages], [pages, spread]);
  const coverMats = useMemo(() => [coverBack, coverBack, coverBack, coverBack, cover, coverBack], [cover, coverBack]);
  return (
    <group rotation-x={-0.06} {...h}>
      {/* page block and back cover */}
      <mesh geometry={pagesGeo} material={pageMats} position={[0, 0, 0]} castShadow receiveShadow />
      <mesh geometry={coverGeo} material={coverBack} position={[0, 0, -t / 2]} castShadow />
      <mesh geometry={spineGeo} material={spine} position={[-slot.w / 2, 0, 0]} castShadow />
      {/* front cover hinged on the spine */}
      <group ref={hinge} position={[-slot.w / 2, 0, t / 2]}>
        <mesh geometry={coverGeo} material={coverMats} position={[slot.w / 2, 0, 0]} castShadow />
      </group>
    </group>
  );
}

/** A box with the label on its face; it turns with the cursor. */
function Box({ work, slot, tex }: { work: Work; slot: Slot; tex: Texture }) {
  const d = Math.max(0.28, slot.w * 0.55);
  const geo = useMemo(() => new RoundedBoxGeometry(slot.w, slot.h, d, 3, 0.012), [slot.w, slot.h, d]);
  const label = useMemo(() => paperMaterial({ map: tex, print: true, grainScale: 2, grainStrength: 0.2, roughness: 0.55 }), [tex]);
  const board = useMemo(() => paperMaterial({ color: "#ebe9e2", grainScale: 3, roughness: 0.8 }), []);
  useDispose(geo);
  useDispose(label);
  useDispose(board);
  useDrift([label]);
  const mesh = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!mesh.current) return;
    const s = store.get();
    const want = s.reducedMotion ? 0 : s.pointerX * 0.55;
    damp(mesh.current.rotation, "y", want, 0.3, Math.min(dt, 1 / 20));
  });
  const h = pointerHandlers(work, tex);
  const mats = useMemo(() => [board, board, board, board, label, board], [board, label]);
  return <mesh ref={mesh} geometry={geo} material={mats} castShadow receiveShadow {...h} />;
}

/** A blind-embossed card; on hover the ink separates into C/M/Y/K plates and recombines. */
function Card({ work, slot, tex, lift }: { work: Work; slot: Slot; tex: Texture; lift: React.RefObject<number> }) {
  const [emb, setEmb] = useState<{ normal: CanvasTexture; mask: CanvasTexture } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = work.cover.src640;
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      const W = 1024;
      const H = Math.round((W * work.cover.h) / work.cover.w);
      setEmb(
        embossNormal({
          width: W,
          height: H,
          blur: 2,
          strength: 9,
          sign: -1,
          draw: (ctx, w, h) => {
            // the artwork's ink becomes the plate: dark pixels press into the card
            ctx.drawImage(img, 0, 0, w, h);
            const d = ctx.getImageData(0, 0, w, h);
            const px = d.data;
            for (let i = 0; i < px.length; i += 4) {
              const l = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255;
              const v = l < 0.72 ? 255 : 0;
              px[i] = px[i + 1] = px[i + 2] = v;
              px[i + 3] = 255;
            }
            ctx.putImageData(d, 0, 0);
          },
        })
      );
    };
    return () => {
      cancelled = true;
    };
  }, [work]);
  const geo = useMemo(() => new RoundedBoxGeometry(slot.w, slot.h, 0.008, 2, 0.003), [slot.w, slot.h]);
  const plateGeo = useMemo(() => new PlaneGeometry(slot.w, slot.h), [slot.w, slot.h]);
  const card = useMemo(
    () => paperMaterial({ color: "#f8f7f3", emboss: emb?.normal ?? null, ao: emb?.mask ?? null, embossStrength: 1.3, grainScale: 1.6, grainStrength: 0.4, roughness: 0.75 }),
    [emb]
  );
  const plates = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => {
        const m = paperMaterial({ map: tex, print: true, plate: i, grainScale: 1.6, grainStrength: 0.1, roughness: 0.6 });
        m.transparent = true;
        m.blending = MultiplyBlending;
        m.depthWrite = false;
        m.opacity = 0;
        return m;
      }),
    [tex]
  );
  useDispose(geo);
  useDispose(plateGeo);
  useDispose(card);
  useDisposeAll(plates);
  useDispose(emb?.normal);
  useDispose(emb?.mask);
  useDrift(plates);
  const plateRefs = useRef<(Mesh | null)[]>([]);
  const phase = useRef(0);
  useFrame((_, dt) => {
    const s = store.get();
    const cdt = Math.min(dt, 1 / 20);
    const on = s.hoverWork === work.slug && !s.reducedMotion;
    damp(phase, "current", on ? 1 : 0, 0.35, cdt);
    const ph = phase.current;
    // separate (0 → 0.5) then recombine (0.5 → 1): sin curve, plates float above the card
    const sep = Math.sin(ph * Math.PI) * 0.09;
    plateRefs.current.forEach((m, i) => {
      if (!m) return;
      const dir = i === 0 ? -1 : i === 1 ? 1 : i === 2 ? -0.5 : 0.5;
      m.position.set(dir * sep, (i - 1.5) * sep * 0.6, 0.006 + ph * 0.012 + i * 0.004 + sep * i * 0.35);
      (m.material as MeshPhysicalMaterial).opacity = Math.min(1, ph * 2.5);
      m.visible = ph > 0.01;
    });
    void lift;
  });
  const h = pointerHandlers(work, tex);
  return (
    <group rotation-x={-0.35} {...h}>
      <mesh geometry={geo} material={card} castShadow receiveShadow />
      {plates.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            plateRefs.current[i] = el;
          }}
          geometry={plateGeo}
          material={m}
          visible={false}
          renderOrder={2 + i}
        />
      ))}
      {/* a small ink block props the card up */}
      <mesh position={[0, -slot.h * 0.45, -0.09]} rotation-x={0.35}>
        <boxGeometry args={[slot.w * 0.6, 0.05, 0.16]} />
        <meshStandardMaterial color="#1a1a1c" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** A thin, frameless screen standing on the table. */
function Screen({ work, slot, tex }: { work: Work; slot: Slot; tex: Texture }) {
  const geo = useMemo(() => new RoundedBoxGeometry(slot.w, slot.h, 0.018, 2, 0.008), [slot.w, slot.h]);
  const body = useMemo(() => new MeshPhysicalMaterial({ color: "#111214", roughness: 0.35, metalness: 0.4 }), []);
  const face = useMemo(() => new MeshStandardMaterial({ map: tex, emissive: "#ffffff", emissiveMap: tex, emissiveIntensity: 0.6, roughness: 0.2 }), [tex]);
  useDispose(geo);
  useDispose(body);
  useDispose(face);
  const h = pointerHandlers(work, tex);
  return (
    <group rotation-x={-0.1} {...h}>
      <mesh geometry={geo} material={body} castShadow />
      <mesh material={face} position={[0, 0, 0.0095]}>
        <planeGeometry args={[slot.w * 0.96, slot.h * 0.96]} />
      </mesh>
    </group>
  );
}

/** The loupe: follows the pointer over a work and magnifies its halftone. */
function Loupe() {
  const mat = useMemo(() => loupeMaterial(), []);
  const geo = useMemo(() => new CircleGeometry(0.21, 48), []);
  useDispose(mat);
  useDispose(geo);
  const mesh = useRef<Mesh>(null);
  const camera = useThree((s) => s.camera);
  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const s = store.get();
    const cdt = Math.min(dt, 1 / 20);
    const on = !s.touch && !s.opening && hover.slug && s.hoverWork === hover.slug && rig.act === "wall" && hover.tex;
    const u = mat.uniforms;
    damp(u.uOpacity, "value", on ? 1 : 0, 0.12, cdt);
    m.visible = u.uOpacity.value > 0.02;
    if (!on) return;
    u.uMap.value = hover.tex;
    u.uCenter.value.copy(hover.uv);
    u.uAspect.value = hover.aspect;
    u.uHalftone.value = s.tier === "high" ? 1 : 0;
    camera.getWorldDirection(v3a);
    v3b.copy(hover.point).addScaledVector(v3a, -0.14);
    damp(m.position, "x", v3b.x, 0.06, cdt);
    damp(m.position, "y", v3b.y, 0.06, cdt);
    damp(m.position, "z", v3b.z, 0.06, cdt);
    m.lookAt(camera.position);
  });
  return <mesh ref={mesh} geometry={geo} material={mat} renderOrder={20} visible={false} />;
}
