"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, Color, DoubleSide, Group, Mesh, MeshPhysicalMaterial, PlaneGeometry, SRGBColorSpace, Vector2, type Texture } from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { damp } from "maath/easing";
import { ACTS, range } from "@/lib/acts";
import { site, L } from "@/lib/content";
import { store } from "@/lib/store";
import { upper } from "@/i18n/dict";
import { rig } from "../../rig/CameraRig";
import { fluid, inkAbsorbance } from "../../fluid/Fluid";
import { rasterise } from "../name/glyphs";

/**
 * Act VI. A business card in holographic foil: MeshPhysicalMaterial's
 * thin-film iridescence over a dark metallic base, with a procedural
 * diffraction-grating normal map so the rainbow lives in the surface and
 * slides as the card tilts toward the hand. Click spins it. At the ending
 * the stage's ink is sampled into the foil and the last line is written
 * by the fluid itself.
 */
const W = 3.5;
const H = 2.0;

function displayFamily() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
  return v || "sans-serif";
}
function textFamily() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-text").trim();
  return v || "sans-serif";
}

function printTexture(side: "front" | "back", lang: "tr" | "en") {
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 800;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0b0b16";
  ctx.fillRect(0, 0, c.width, c.height);
  // fine grating lines: the foil's texture, barely visible in the map, strong in the normal map
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = -800; x < 1400; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 800, 800);
    ctx.stroke();
  }
  ctx.fillStyle = "#f6f6fa";
  if (side === "front") {
    ctx.font = `700 150px ${displayFamily()}`;
    ctx.fillText(site.name, 90, 470);
    ctx.font = `500 44px ${textFamily()}`;
    ctx.fillStyle = "#c9c9da";
    ctx.fillText(upper(L(site.title, lang), lang), 96, 550);
    // EG mark
    ctx.strokeStyle = site.spotColor;
    ctx.lineWidth = 16;
    ctx.lineCap = "square";
    ctx.beginPath();
    ctx.moveTo(96, 120);
    ctx.lineTo(210, 120);
    ctx.moveTo(96, 120);
    ctx.lineTo(96, 330);
    ctx.lineTo(210, 330);
    ctx.moveTo(96, 225);
    ctx.lineTo(180, 225);
    ctx.stroke();
    ctx.strokeStyle = "#f6f6fa";
    ctx.beginPath();
    ctx.arc(330, 225, 82, 0.15 * Math.PI, 1.85 * Math.PI);
    ctx.moveTo(412, 225);
    ctx.lineTo(412, 300);
    ctx.moveTo(352, 225);
    ctx.lineTo(412, 225);
    ctx.stroke();
  } else {
    ctx.font = `600 52px ${textFamily()}`;
    ctx.fillText(site.name, 96, 140);
    ctx.font = `400 44px ${textFamily()}`;
    ctx.fillStyle = "#c9c9da";
    let y = 230;
    if (site.email) {
      ctx.fillText(site.email, 96, y);
      y += 70;
    }
    for (const s of site.social) {
      ctx.fillText(s.url.replace(/^https?:\/\/(www\.)?/, ""), 96, y);
      y += 70;
    }
    ctx.font = `700 92px ${displayFamily()}`;
    ctx.fillStyle = "#f6f6fa";
    ctx.fillText(L(site.availability, lang), 96, 690);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** a normal map of fine diagonal grooves (a diffraction grating) */
function gratingNormal() {
  const N = 512;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = (x + y) / 6;
      const slope = Math.cos(u * 2 * Math.PI) * 0.6; // derivative of a sine groove
      const nx = -slope * 0.7071;
      const ny = -slope * 0.7071;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const i = (y * N + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = 1000; // RepeatWrapping
  t.repeat.set(3, 2);
  return t;
}

const abs: [number, number, number] = [0, 0, 0];

export default function Card() {
  const root = useRef<Group>(null);
  const spinTarget = useRef(0);
  const spun = useRef(0);
  const writing = useRef<{ pts: Float32Array; i: number; box: { x0: number; y0: number; x1: number; y1: number } } | null>(null);
  const [fonts, setFonts] = useState(false);
  const lang = (document.documentElement.lang === "en" ? "en" : "tr") as "tr" | "en";

  useEffect(() => {
    let live = true;
    Promise.all([document.fonts.load(`700 150px ${displayFamily()}`), document.fonts.load(`500 44px ${textFamily()}`)])
      .catch(() => null)
      .then(() => live && setFonts(true));
    return () => {
      live = false;
    };
  }, []);

  const res = useMemo(() => {
    const geo = new RoundedBoxGeometry(W, H, 0.05, 4, 0.07);
    const front: Texture | null = fonts ? printTexture("front", lang) : null;
    const back: Texture | null = fonts ? printTexture("back", lang) : null;
    const normal = gratingNormal();
    const mat = new MeshPhysicalMaterial({
      map: front,
      emissiveMap: front,
      emissive: new Color("#ffffff"),
      emissiveIntensity: 0.5,
      color: "#ffffff",
      metalness: 0.78,
      roughness: 0.26,
      iridescence: 1,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [120, 520],
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      normalMap: normal,
      normalScale: new Vector2(0.22, 0.22),
      envMapIntensity: 2.6,
    });
    // the ink pours into the foil at the ending: a second sampler mixed in by uPour
    const uniforms = { uDye: { value: null as Texture | null }, uPour: { value: 0 }, uTime: { value: 0 }, uFoil: { value: 0.9 } };
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uDye = uniforms.uDye;
      shader.uniforms.uPour = uniforms.uPour;
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uFoil = uniforms.uFoil;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <map_pars_fragment>", "#include <map_pars_fragment>\nuniform sampler2D uDye;\nuniform float uPour;\nuniform float uTime;\nuniform float uFoil;")
        // the holographic foil: a diffraction rainbow whose phase moves with the view angle and slides along the grooves
        .replace(
          "#include <lights_fragment_end>",
          `#include <lights_fragment_end>
          {
            vec3 fV = normalize(vViewPosition);
            float fNV = clamp(dot(normal, fV), 0.0, 1.0);
            float fres = pow(1.0 - fNV, 2.0);
            // broad bands that travel with the view angle, a faint fine grating on top
            float phase = fNV * 2.6 + (vMapUv.x * 0.7 + vMapUv.y * 0.4) * 1.3 + uTime * 0.03;
            vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (phase + vec3(0.0, 0.33, 0.67)));
            float bands = 0.88 + 0.12 * sin((vMapUv.x + vMapUv.y) * 160.0 + fNV * 20.0);
            reflectedLight.indirectSpecular += rainbow * bands * (0.08 + 0.92 * fres) * uFoil;
          }`
        )
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
          if (uPour > 0.001) {
            vec3 A = max(texture2D(uDye, vMapUv).rgb, 0.0);
            float amount = A.r + A.g + A.b;
            vec3 dir = A / max(amount, 1e-4);
            vec3 T = exp(-dir * 5.5);
            float k = smoothstep(0.0, 0.14, amount) * uPour;
            diffuseColor.rgb = mix(diffuseColor.rgb, T * 0.95, k);
          }`
        );
    };
    const backGeo = new PlaneGeometry(W - 0.12, H - 0.12);
    const backMat = new MeshPhysicalMaterial({ map: back, metalness: 0.6, roughness: 0.35, iridescence: 0.6, iridescenceIOR: 1.3, side: DoubleSide, normalMap: normal, normalScale: new Vector2(0.12, 0.12) });
    return { geo, mat, backGeo, backMat, front, back, normal, uniforms };
  }, [fonts, lang]);
  useEffect(
    () => () => {
      res.geo.dispose();
      res.mat.dispose();
      res.backGeo.dispose();
      res.backMat.dispose();
      res.front?.dispose();
      res.back?.dispose();
      res.normal.dispose();
    },
    [res]
  );

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const s = store.get();
    const cdt = Math.min(dt, 1 / 20);
    const p = rig.p;
    g.visible = p > 0.8;
    if (!g.visible) return;
    // spin on click
    if (s.spin !== spun.current) {
      spun.current = s.spin;
      spinTarget.current += Math.PI * 2;
    }
    // tilt toward the hand
    const dx = rig.hand.x - g.position.x;
    const dy = rig.hand.y - g.position.y;
    const t = state.clock.elapsedTime;
    const idle = !rig.pointer;
    const tx = s.reducedMotion ? 0 : idle ? Math.sin(t * 0.5) * 0.12 : Math.max(-0.5, Math.min(0.5, -dy * 0.35));
    const ty = s.reducedMotion ? 0 : idle ? Math.cos(t * 0.4) * 0.18 : Math.max(-0.55, Math.min(0.55, dx * 0.4));
    damp(g.rotation, "x", tx, 0.2, cdt);
    damp(g.rotation, "y", ty + spinTarget.current, 0.45, cdt);
    // the ending: ink pours into the foil and writes the last line
    const pour = range(p, 0.95, 0.985);
    res.uniforms.uPour.value = pour;
    res.uniforms.uTime.value = t;
    res.uniforms.uDye.value = fluid.dye;
    if (fluid.live && !s.reducedMotion && p > 0.965) {
      if (!writing.current) {
        const h2 = document.querySelector<HTMLElement>("#son-title");
        if (h2 && h2.firstChild) {
          // the HTML heading's own line breaks: word ranges grouped by their top
          const text = h2.textContent ?? "";
          const words = text.split(/(\s+)/);
          const lines: { text: string; l: number; t: number; r: number; b: number }[] = [];
          let offset = 0;
          for (const w of words) {
            if (w.trim()) {
              const rg = document.createRange();
              rg.setStart(h2.firstChild, offset);
              rg.setEnd(h2.firstChild, offset + w.length);
              const rr = rg.getBoundingClientRect();
              const line = lines.find((ln) => Math.abs(ln.t - rr.top) < rr.height * 0.5);
              if (line) {
                line.text += " " + w;
                line.r = Math.max(line.r, rr.right);
                line.b = Math.max(line.b, rr.bottom);
              } else lines.push({ text: w, l: rr.left, t: rr.top, r: rr.right, b: rr.bottom });
            }
            offset += w.length;
          }
          const pts: number[] = [];
          const step = 5;
          const fam = displayFamily();
          for (const ln of lines) {
            const ras = rasterise(ln.text, fam, 700, 160);
            const box = { x0: ln.l / innerWidth, x1: ln.r / innerWidth, y0: 1 - ln.b / innerHeight, y1: 1 - ln.t / innerHeight };
            for (let x = ras.minX; x <= ras.maxX; x += step)
              for (let y = ras.minY; y <= ras.maxY; y += step)
                if (ras.mask[y * ras.W + x]) pts.push(box.x0 + ((x - ras.minX) / (ras.maxX - ras.minX + 1)) * (box.x1 - box.x0), box.y0 + (1 - (y - ras.minY) / (ras.maxY - ras.minY + 1)) * (box.y1 - box.y0));
          }
          // written line by line, left to right (points are pushed in that order)
          writing.current = { pts: new Float32Array(pts), i: 0, box: { x0: 0, x1: 1, y0: 0, y1: 1 } };
        }
      }
      const wr = writing.current;
      if (wr && wr.i < wr.pts.length / 2) {
        const perFrame = Math.max(2, Math.round((wr.pts.length / 2) * cdt * 0.4));
        inkAbsorbance(site.spotColor, abs, 0.5);
        for (let k = 0; k < perFrame && wr.i < wr.pts.length / 2; k++, wr.i++) {
          const u = wr.box.x0 + wr.pts[wr.i * 2] * (wr.box.x1 - wr.box.x0);
          const v = wr.box.y0 + wr.pts[wr.i * 2 + 1] * (wr.box.y1 - wr.box.y0);
          fluid.splat(u, v, 0, 0, abs[0], abs[1], abs[2], 0.25);
        }
      }
    } else if (p < 0.9) {
      writing.current = null;
    }
  });

  return (
    <group ref={root} position={[ACTS[5].x, 0, 0]} visible={false} scale={store.get().touch || window.innerWidth < 768 ? 0.9 : 1}>
      <mesh
        geometry={res.geo}
        material={res.mat}
        onPointerOver={(e) => {
          e.stopPropagation();
          store.set({ hoverCard: true });
        }}
        onPointerOut={() => store.set({ hoverCard: false })}
        onClick={(e) => {
          e.stopPropagation();
          store.set({ spin: store.get().spin + 1 });
        }}
      />
      <mesh geometry={res.backGeo} material={res.backMat} position={[0, 0, -0.027]} rotation={[0, Math.PI, 0]} />
      <pointLight position={[2.5, 2.0, 3.0]} intensity={3} color={new Color("#ffffff")} distance={10} />
    </group>
  );
}
