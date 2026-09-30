"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BoxGeometry, CanvasTexture, Color, ExtrudeGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, SphereGeometry, SRGBColorSpace, Vector3, type BufferGeometry } from "three";
import { RoundedBoxGeometry, TorusKnot, mergeBufferGeometries } from "three-stdlib";
import { damp } from "maath/easing";
import { ACTS } from "@/lib/acts";
import { site, L } from "@/lib/content";
import { store } from "@/lib/store";
import { INKS, ON_INK, toolMark } from "@/lib/inks";
import { rig } from "../../rig/CameraRig";
import { buildGlyphs } from "../name/glyphs";
import { BEND_NORMAL, BEND_PARS, BEND_VERTEX, curveLUT } from "./lut";

/**
 * Act III. The skills as kinetic type: every word is extruded from the
 * page font and bent along a torus knot in the vertex shader (arc-length
 * frames in a float texture), each in its own two-ink gradient over
 * painted metal. Hovering or focusing a word in the index slows the knot
 * and lifts the word. The tools orbit as lettered tokens.
 */
const LETTER = 0.27;
const GAP = 0.32;

function displayFamily() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
  return v || "sans-serif";
}

function bend(mat: MeshPhysicalMaterial, uniforms: Record<string, { value: unknown }>) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\n" + BEND_PARS)
      .replace("#include <beginnormal_vertex>", BEND_NORMAL)
      .replace("#include <begin_vertex>", BEND_VERTEX);
  };
  mat.customProgramCacheKey = () => "bend";
  return mat;
}

function tokenTexture(mark: string, ink: string, on: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = on;
  ctx.font = `700 118px ${displayFamily()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(mark, 128, 136);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

interface WordRes {
  id: string;
  geo: BufferGeometry;
  mat: MeshPhysicalMaterial;
  uniforms: Record<string, { value: unknown }>;
  offset: number;
  center: number;
}

export default function Ribbon() {
  const root = useRef<Group>(null);
  const orbit = useRef<Group>(null);
  const hits = useRef<Mesh[]>([]);
  const [fonts, setFonts] = useState(false);
  const offset = useRef(0);
  const speed = useRef(0.025);
  const mobile = useMemo(() => store.get().touch || window.innerWidth < 768, []);
  const lang = (document.documentElement.lang === "en" ? "en" : "tr") as "tr" | "en";

  useEffect(() => {
    let live = true;
    document.fonts
      .load(`700 160px ${displayFamily()}`)
      .catch(() => null)
      .then(() => live && setFonts(true));
    return () => {
      live = false;
    };
  }, []);

  const res = useMemo(() => {
    const curve = new TorusKnot(mobile ? 0.5 : 0.62);
    const lut = curveLUT(curve, 512);
    const shared = { uLut: { value: lut.texture }, uLutN: { value: lut.n }, uInvLen: { value: 1 / lut.length }, uRadius: { value: 0.16 } };
    // the ribbon: a long strip bent all the way around, in the spot colour
    const stripGeo = new BoxGeometry(lut.length, 0.05, 0.42, 600, 1, 1);
    stripGeo.translate(lut.length / 2, 0, 0);
    const stripMat = bend(new MeshPhysicalMaterial({ color: new Color(site.spotColor), metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 0.25 }), { ...shared, uOffset: { value: 0 }, uLift: { value: -0.19 }, uRadius: { value: 0.16 } });
    const words: WordRes[] = [];
    if (fonts) {
      const fam = displayFamily();
      const built = site.skills.map((s, i) => {
        const g = buildGlyphs(L(s.name, lang), fam, 700, 160, 40);
        // two half-depth extrusions back to back, the rear one mirrored, so the word reads from either side of the ribbon
        const front = new ExtrudeGeometry(g.shapes, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 3 });
        const back = front.clone();
        back.scale(-1, 1, -1);
        back.translate(g.width, 0, 0);
        const geo = mergeBufferGeometries([front, back]) ?? front;
        front.dispose();
        back.dispose();
        geo.scale(LETTER, LETTER, LETTER);
        const width = g.width * LETTER;
        // two-ink gradient along the word
        const c1 = new Color(INKS[i % INKS.length]);
        const c2 = new Color(INKS[(i + 2) % INKS.length]);
        const pos = geo.getAttribute("position");
        const col = new Float32Array(pos.count * 3);
        for (let k = 0; k < pos.count; k++) {
          const t = Math.max(0, Math.min(1, pos.getX(k) / Math.max(1e-3, width)));
          col[k * 3] = c1.r + (c2.r - c1.r) * t;
          col[k * 3 + 1] = c1.g + (c2.g - c1.g) * t;
          col[k * 3 + 2] = c1.b + (c2.b - c1.b) * t;
        }
        geo.setAttribute("color", new Float32BufferAttribute(col, 3));
        return { id: s.id, geo, width };
      });
      const total = built.reduce((a, b) => a + b.width, 0) + built.length * GAP;
      const scale = lut.length / total; // spread the words evenly around the whole loop
      let cursor = 0;
      for (const b of built) {
        const uniforms = { ...shared, uOffset: { value: cursor / lut.length }, uLift: { value: 0 }, uInvLen: { value: scale / lut.length } };
        const mat = bend(new MeshPhysicalMaterial({ vertexColors: true, metalness: 0.35, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.15, iridescence: 0.3, emissive: new Color("#000000") }), uniforms);
        words.push({ id: b.id, geo: b.geo, mat, uniforms, offset: cursor / lut.length, center: (cursor + (b.width * scale) / 2) / lut.length });
        cursor += (b.width + GAP) * scale;
      }
    }
    const tokens = site.tools.map((t, i) => {
      const ink = INKS[(i + 2) % INKS.length];
      const on = ON_INK[(i + 2) % ON_INK.length];
      const geo = new RoundedBoxGeometry(0.48, 0.48, 0.12, 3, 0.1);
      const map = fonts ? tokenTexture(toolMark(t), ink, on) : null;
      const side = new MeshPhysicalMaterial({ color: new Color(ink), clearcoat: 1, roughness: 0.25, metalness: 0.1 });
      const face = new MeshPhysicalMaterial({ map, color: map ? "#ffffff" : ink, clearcoat: 1, clearcoatRoughness: 0.08, roughness: 0.25, metalness: 0.05 });
      return { geo, mats: [side, side, side, side, face, side] as MeshPhysicalMaterial[], map };
    });
    const hitGeo = new SphereGeometry(0.42, 8, 8);
    const hitMat = new MeshBasicMaterial({ visible: false });
    return { lut, stripGeo, stripMat, words, tokens, hitGeo, hitMat };
  }, [fonts, mobile, lang]);

  useEffect(
    () => () => {
      res.lut.texture.dispose();
      res.stripGeo.dispose();
      res.stripMat.dispose();
      res.words.forEach((w) => {
        w.geo.dispose();
        w.mat.dispose();
      });
      res.tokens.forEach((t) => {
        t.geo.dispose();
        t.mats[0].dispose();
        t.mats[4].dispose();
        t.map?.dispose();
      });
      res.hitGeo.dispose();
      res.hitMat.dispose();
    },
    [res]
  );

  const v = useMemo(() => new Vector3(), []);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const s = store.get();
    const cdt = Math.min(dt, 1 / 20);
    const p = rig.p;
    g.visible = p > 0.42 && p < 0.62;
    if (!g.visible) return;
    const hovered = s.hoverSkill;
    // the knot turns; a hovered word slows it
    const target = s.reducedMotion ? 0 : hovered ? 0.004 : 0.025;
    speed.current += (target - speed.current) * Math.min(1, cdt * 4);
    offset.current = (offset.current + speed.current * cdt) % 1;
    res.stripMat.userData.t = offset.current;
    (res.stripMat as MeshPhysicalMaterial & { __u?: unknown }).__u = null;
    for (const w of res.words) {
      w.uniforms.uOffset.value = w.offset + offset.current;
      const lift = w.uniforms.uLift as { value: number };
      lift.value += (((hovered === w.id ? 0.28 : 0) - lift.value) * Math.min(1, cdt * 6));
      w.mat.emissiveIntensity = hovered === w.id ? 0.4 : 0;
      w.mat.emissive.set(hovered === w.id ? "#ffffff" : "#000000");
    }
    // strip uniforms are shared objects on the material's compiled shader: update through the uniforms map
    const stripU = res.stripMat.userData.uniforms as Record<string, { value: number }> | undefined;
    if (stripU) stripU.uOffset.value = offset.current;
    // hit targets on the curve
    res.words.forEach((w, i) => {
      const m = hits.current[i];
      if (!m) return;
      res.lut.at(w.center + offset.current, v);
      m.position.copy(v);
    });
    // the whole knot leans toward the hand a little
    const dx = rig.hand.x - g.position.x;
    const dy = rig.hand.y - g.position.y;
    damp(g.rotation, "y", s.reducedMotion ? 0 : dx * 0.08, 0.4, cdt);
    damp(g.rotation, "x", s.reducedMotion ? 0 : -dy * 0.06, 0.4, cdt);
    const o = orbit.current;
    if (o && !s.reducedMotion) o.rotation.y += cdt * 0.25;
  });

  // keep a handle on the strip's uniforms once compiled (onBeforeCompile runs on first render)
  useEffect(() => {
    const prev = res.stripMat.onBeforeCompile;
    res.stripMat.onBeforeCompile = (shader, renderer) => {
      prev(shader, renderer);
      res.stripMat.userData.uniforms = shader.uniforms;
    };
  }, [res]);

  return (
    <group ref={root} position={[ACTS[2].x, 0, 0]} visible={false}>
      <mesh geometry={res.stripGeo} material={res.stripMat} frustumCulled={false} />
      {res.words.map((w, i) => (
        <group key={w.id}>
          <mesh geometry={w.geo} material={w.mat} frustumCulled={false} />
          <mesh
            ref={(el) => {
              if (el) hits.current[i] = el;
            }}
            geometry={res.hitGeo}
            material={res.hitMat}
            onPointerOver={(e) => {
              e.stopPropagation();
              store.set({ hoverSkill: w.id });
            }}
            onPointerOut={() => store.get().hoverSkill === w.id && store.set({ hoverSkill: null })}
            onClick={(e) => {
              e.stopPropagation();
              store.set({ hoverSkill: store.get().hoverSkill === w.id ? null : w.id });
            }}
          />
        </group>
      ))}
      <group ref={orbit} rotation={[0.5, 0, 0.15]}>
        {res.tokens.map((t, i) => {
          const a = (i / res.tokens.length) * Math.PI * 2;
          const r = mobile ? 2.4 : 3.0;
          return <mesh key={i} geometry={t.geo} material={t.mats} position={[Math.cos(a) * r, Math.sin(a * 2) * 0.3, Math.sin(a) * r]} rotation={[0, -a + Math.PI / 2, 0]} />;
        })}
      </group>
    </group>
  );
}
