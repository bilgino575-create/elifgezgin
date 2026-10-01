"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Box3,
  BoxGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  GLSL3,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Plane,
  PointLight,
  ShaderMaterial,
  Vector3,
  type PerspectiveCamera,
} from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { store, useStore } from "@/lib/store";
import { ACTS, NAME_VIEW, range } from "@/lib/acts";
import { INKS } from "@/lib/inks";
import { site } from "@/lib/content";
import { rig } from "../../rig/CameraRig";
import { useDispose } from "../../utils/useDispose";

/**
 * The statue: a stylised AI-made figure of Elif (Meshy image-to-3D from the
 * hero image, simplified for the web). It rises on a glossy black plinth
 * beside the name, turns toward the hand, and returns beside the bio where
 * it turns on its own and the hand spins it. One mesh, moved between the
 * two acts; nothing allocates per frame.
 */
export const STATUE_URL = { desktop: "/models/elif-heykel-masaustu.glb", mobile: "/models/elif-heykel-mobil.glb" } as const;

export function statueUrl(tier: string, touch: boolean) {
  return touch || tier === "low" ? STATUE_URL.mobile : STATUE_URL.desktop;
}

/** the plinth's height; its footprint follows the model's bounds */
const PLINTH_H = 0.34;
const RIM = [INKS[0], INKS[1], INKS[3]] as const;

const SHIMMER_VERT = /* glsl */ `
in float aSeed;
uniform float uTime;
uniform float uRise;
uniform float uPx;
out float vA;
out vec3 vC;
vec3 pal(float t) { return 0.55 + 0.45 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 n = normalize(mat3(modelMatrix) * normal);
  vec3 v = normalize(cameraPosition - wp.xyz);
  // only the silhouette shimmers: facing-away-from-the-eye normals
  float rim = pow(1.0 - abs(dot(n, v)), 2.6);
  float tw = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (2.0 + aSeed * 3.0) + aSeed * 40.0));
  vA = rim * tw * uRise;
  vC = pal(aSeed * 0.6 + uTime * 0.03);
  vec4 mv = viewMatrix * wp;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.2 + 1.6 * aSeed) * uPx / max(0.5, -mv.z);
}
`;
const SHIMMER_FRAG = /* glsl */ `
precision highp float;
in float vA;
in vec3 vC;
out vec4 fragColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.2, 0.5, d)) * vA;
  if (a < 0.01) discard;
  fragColor = vec4(vC * a, a);
}
`;

function surfacePoints(mesh: Mesh, count: number) {
  const sampler = new MeshSurfaceSampler(mesh).build();
  const pos = new Float32Array(count * 3);
  const nrm = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const p = new Vector3();
  const n = new Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(p, n);
    pos.set([p.x, p.y, p.z], i * 3);
    nrm.set([n.x, n.y, n.z], i * 3);
    seed[i] = (i * 0.618033988749895) % 1;
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nrm, 3));
  g.setAttribute("aSeed", new Float32BufferAttribute(seed, 1));
  return g;
}

/** a premium read of the Meshy texture: clearcoat over the base colour, a thin-film sheen, and a rim in the spot colour */
function premium(src: MeshStandardMaterial, spot: string) {
  const m = new MeshPhysicalMaterial({
    map: src.map,
    normalMap: src.normalMap,
    normalScale: src.normalScale,
    metalnessMap: src.metalnessMap,
    roughnessMap: src.roughnessMap,
    metalness: 0.15,
    roughness: 0.55,
    clearcoat: 0.65,
    clearcoatRoughness: 0.22,
    iridescence: 0.35,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [120, 420],
    envMapIntensity: 1.1,
    side: src.side,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = { value: new Color(spot) };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uRim;")
      .replace(
        "#include <dithering_fragment>",
        `float rimK = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), 3.5);
        gl_FragColor.rgb += uRim * rimK * 0.55;
        #include <dithering_fragment>`
      );
  };
  return m;
}

const tmp = new Vector3();
const clip = new Plane(new Vector3(0, 1, 0), 0);
const bbox = new Box3();
const bsize = new Vector3();
const bcen = new Vector3();

/** step response of a lightly under-damped spring (ζ 0.7), frame-rate independent */
function riseAt(tau: number) {
  if (tau <= 0) return 0;
  const w = 4.2;
  const z = 0.7;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau));
}

export default function Statue() {
  const tier = useStore((s) => s.tier);
  const touch = store.get().touch;
  const url = statueUrl(tier, touch);
  const { scene } = useGLTF(url, false, true);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const lights = useRef<(PointLight | null)[]>([]);
  const st = useRef({ yaw: 0, yawV: 0, pitch: 0, pitchV: 0, spin: 0, drag: false, dragX: 0, dragV: 0, loadedAt: -1 });

  const mesh = useMemo(() => {
    let m: Mesh | null = null;
    scene.traverse((o) => {
      if (!m && (o as Mesh).isMesh) m = o as Mesh;
    });
    return m as Mesh | null;
  }, [scene]);
  const material = useDispose(useMemo(() => (mesh ? premium(mesh.material as MeshStandardMaterial, site.spotColor) : null), [mesh]));
  // the model's bounds in the group's space (its node carries a scale): the plinth and the placement follow them
  const bounds = useMemo(() => {
    if (!mesh) return { h: 1.9, w: 1.7, d: 1.3, cx: 0, cz: 0, bottom: -0.95 };
    mesh.updateMatrixWorld(true);
    bbox.setFromObject(mesh);
    bbox.getSize(bsize);
    bbox.getCenter(bcen);
    return { h: bsize.y, w: bsize.x, d: bsize.z, cx: bcen.x, cz: bcen.z, bottom: bbox.min.y };
  }, [mesh]);
  const shimmerGeo = useDispose(useMemo(() => (mesh ? surfacePoints(mesh, touch ? 2500 : 6000) : null), [mesh, touch]));
  const shimmerMat = useDispose(
    useMemo(
      () =>
        new ShaderMaterial({
          vertexShader: SHIMMER_VERT,
          fragmentShader: SHIMMER_FRAG,
          glslVersion: GLSL3,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          uniforms: { uTime: { value: 0 }, uRise: { value: 0 }, uPx: { value: 1 } },
        }),
      []
    )
  );
  const plinthGeo = useDispose(useMemo(() => new BoxGeometry(bounds.w * 1.12, PLINTH_H, bounds.d * 1.12), [bounds]));
  const plinthMat = useDispose(
    useMemo(() => new MeshPhysicalMaterial({ color: "#050509", metalness: 0.75, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.55 }), [])
  );

  // the statue rises out of the plinth: everything under its top face is clipped
  useEffect(() => {
    gl.localClippingEnabled = true;
    if (material) material.clippingPlanes = [clip];
    shimmerMat.clippingPlanes = [clip];
  }, [gl, material, shimmerMat]);

  // the GLTF's own textures and geometry go when the statue unmounts
  useEffect(() => {
    return () => {
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        const src = m.material as MeshStandardMaterial;
        src.map?.dispose();
        src.normalMap?.dispose();
        src.metalnessMap?.dispose();
        src.roughnessMap?.dispose();
        src.dispose();
      });
      useGLTF.clear(url);
    };
  }, [scene, url]);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    const s = st.current;
    s.drag = true;
    s.dragX = e.clientX;
    s.dragV = 0;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const s = st.current;
    if (!s.drag) return;
    const dx = e.clientX - s.dragX;
    s.dragX = e.clientX;
    // the hand spins it within ±66°: the figure stays the subject, the back of the composition never faces the viewer
    s.spin = Math.max(-1.15, Math.min(1.15, s.spin + dx * 0.011));
    s.dragV = dx * 0.011 * 60;
  };
  const onUp = () => {
    st.current.drag = false;
  };

  useFrame((state, dt) => {
    const g = group.current;
    const b = body.current;
    if (!g || !b || !mesh) return;
    const s = store.get();
    const p = rig.p;
    const mobile = s.touch || size.width < 768;
    const t = state.clock.elapsedTime;
    const cdt = Math.min(dt, 1 / 20);
    const inHero = p < 0.19;
    const inAbout = p > 0.715 && p < 0.86;
    g.visible = inHero || inAbout;
    if (!g.visible) return;
    const S = st.current;
    if (S.loadedAt < 0) S.loadedAt = t;

    // placement: beside the name (right of its box on desktop, below it on phones), or beside the bio
    let scale: number;
    if (inHero) {
      const nv = mobile ? NAME_VIEW.mobile : NAME_VIEW.desktop;
      const hh = nv.d * Math.tan((nv.fov * Math.PI) / 360);
      const w = hh * (size.width / size.height);
      if (mobile) {
        scale = Math.min(1.1, (w * 1.6) / bounds.w);
        tmp.set(rig.nameCenter.x, -hh + PLINTH_H + 0.5 - bounds.bottom * scale, 0.2);
      } else {
        const right = rig.nameCenter.x + rig.nameWidth / 2;
        scale = Math.max(0.6, Math.min(1.45, (w - right - 0.8) / bounds.w));
        tmp.set((right + w) / 2 + 0.1, -hh * 0.78 + PLINTH_H - bounds.bottom * scale, 0.6);
      }
    } else {
      const a = ACTS[4];
      scale = mobile ? 1.05 : 1.35;
      tmp.set(a.x + (mobile ? 0 : 2.1), (mobile ? -0.3 : -0.35) - bounds.bottom * scale - bounds.h * scale * 0.5, 0.6);
    }
    g.position.copy(tmp);
    g.scale.setScalar(scale);

    // the rise: a spring step response in time (not per frame), from when the model arrived; instant beside the bio and with reduced motion
    const rise = inAbout || s.reducedMotion ? 1 : riseAt(t - S.loadedAt - 0.25);
    // the plinth's top face in world y; the body is clipped below it
    const top = tmp.y + bounds.bottom * scale;
    clip.constant = -(top - 0.002);
    b.position.y = -(1 - rise) * (bounds.h + 0.05);

    // the head turns toward the hand (hero), or the figure turns on its own and the hand spins it (about)
    let yawT = 0;
    let pitchT = 0;
    if (!s.reducedMotion) {
      if (rig.pointer && !S.drag) {
        yawT = Math.max(-1, Math.min(1, s.pointerX)) * (25 * Math.PI) / 180;
        pitchT = -Math.max(-1, Math.min(1, s.pointerY)) * (6 * Math.PI) / 180;
      }
      // beside the bio the figure turns slowly on its own: a sway of ±38°, never the back (the model's rear is a flat wall of panels)
      if (!S.drag) {
        S.spin += S.dragV * cdt;
        S.dragV *= Math.max(0, 1 - 2.2 * cdt);
        if (inAbout) {
          const sway = Math.sin(t * 0.21) * 0.66;
          S.spin += (sway - S.spin) * Math.min(1, 0.6 * cdt);
        } else {
          S.spin += (0 - S.spin) * Math.min(1, 1.5 * cdt);
        }
      }
      S.spin = Math.max(-1.15, Math.min(1.15, S.spin));
    } else {
      S.spin = 0;
    }
    const ky = 24;
    S.yawV += (yawT - S.yaw) * ky * cdt - S.yawV * 2 * 0.9 * Math.sqrt(ky) * cdt;
    S.yaw += S.yawV * cdt;
    S.pitchV += (pitchT - S.pitch) * ky * cdt - S.pitchV * 2 * 0.9 * Math.sqrt(ky) * cdt;
    S.pitch += S.pitchV * cdt;
    b.rotation.set(S.pitch, S.yaw + S.spin, 0);

    // the living ink's rim lights: three inks orbiting, slow and offset, static with reduced motion
    for (let i = 0; i < 3; i++) {
      const L = lights.current[i];
      if (!L) continue;
      const a = (s.reducedMotion ? 0 : t * (0.35 + i * 0.11)) + (i * Math.PI * 2) / 3;
      const r = bounds.w * 0.95;
      L.position.set(bounds.cx + Math.cos(a) * r, bounds.bottom + bounds.h * (0.6 + 0.3 * Math.sin(a * 0.7 + i)), bounds.cz + Math.sin(a) * r);
      L.intensity = (9 + 4 * Math.sin(t * 0.9 + i * 2.1)) * scale * scale * (0.2 + 0.8 * rise);
      L.distance = 4.5 * scale;
    }
    shimmerMat.uniforms.uTime.value = s.reducedMotion ? 0 : t;
    shimmerMat.uniforms.uRise.value = range(rise, 0.2, 1) * (mobile ? 0.8 : 1);
    const fov = (camera.fov * Math.PI) / 180;
    shimmerMat.uniforms.uPx.value = (size.height * 0.5) / Math.tan(fov / 2) * 0.012;
  });

  if (!mesh || !material || !shimmerGeo) return null;
  return (
    <group ref={group} visible={false}>
      <mesh geometry={plinthGeo} material={plinthMat} position={[bounds.cx, bounds.bottom - PLINTH_H / 2 + 0.002, bounds.cz]} />
      <group ref={body}>
        <mesh
          geometry={mesh.geometry}
          material={material}
          position={mesh.position}
          quaternion={mesh.quaternion}
          scale={mesh.scale}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerOut={onUp}
        />
        <points geometry={shimmerGeo} material={shimmerMat} position={mesh.position} quaternion={mesh.quaternion} scale={mesh.scale} frustumCulled={false} />
      </group>
      {RIM.map((c, i) => (
        <pointLight key={i} ref={(el) => void (lights.current[i] = el)} color={c} intensity={0} distance={5} decay={2} />
      ))}
    </group>
  );
}
