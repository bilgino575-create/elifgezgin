"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { BufferGeometry, Color, Float32BufferAttribute, GLSL3, Matrix4, ShaderMaterial, Vector2, Vector3 } from "three";
import { rig } from "./rig";
import { store } from "@/lib/store";

/**
 * The void. A fullscreen triangle drawn first, coloured by the direction
 * each pixel looks in: the stop's colour above the horizon, its ground
 * colour below, a line of the first ink where they meet; two slow pools of
 * ink in the sky, the light the visitor carries as a soft bloom, grain and
 * a vignette. The fog takes the ground colour, so the floor and anything
 * far dissolve into the same void and the next stop appears out of it.
 */
const VERT = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.99999, 1.0);
}
`;
const FRAG = /* glsl */ `
precision highp float;
out vec4 fragColor;
in vec2 vUv;
uniform vec3 uBg;
uniform vec3 uBg2;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform float uTime;
uniform vec2 uAspect;
uniform vec2 uLight;
uniform float uLightK;
uniform float uGrain;
uniform mat4 uInvPV;
uniform vec3 uCam;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  // the ray through this pixel
  vec4 f = uInvPV * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 dir = normalize(f.xyz / f.w - uCam);
  float e = dir.y;
  // ground below the horizon (exactly the fog's colour, so the floor dissolves into it), sky above
  float sky = smoothstep(0.0, 0.22, e);
  vec3 col = mix(uBg2, uBg, sky);
  // a line of the first ink just above the horizon
  float hz = exp(-abs(e - 0.05) * 18.0) * smoothstep(0.0, 0.05, e);
  col += uA * hz * 0.3;
  // pools of ink in the sky, anchored to the view direction so they parallax
  vec2 s = vec2(atan(dir.x, -dir.z), e) * vec2(1.6, 2.4);
  vec2 pa = vec2(0.5 + 0.18 * sin(uTime * 0.11), 0.45 + 0.1 * cos(uTime * 0.09));
  vec2 pb = vec2(-0.6 + 0.14 * cos(uTime * 0.07), 0.7 + 0.1 * sin(uTime * 0.13));
  vec2 pc = vec2(0.1 + 0.2 * sin(uTime * 0.05 + 2.0), 1.1 + 0.08 * cos(uTime * 0.1 + 1.0));
  float da = length(s - pa);
  float db = length(s - pb);
  float dc = length(s - pc);
  col += uA * exp(-da * da * 2.0) * 0.36 * sky;
  col += uB * exp(-db * db * 2.4) * 0.3 * sky;
  col += uC * exp(-dc * dc * 6.0) * 0.2 * sky;
  // the light in the visitor's hand
  vec2 p = (vUv - 0.5) * uAspect;
  float dl = length(p - uLight);
  col += uA * exp(-dl * dl * 9.0) * 0.45 * uLightK;
  col += vec3(1.0) * exp(-dl * dl * 60.0) * 0.1 * uLightK;
  // vignette and grain
  float v = smoothstep(1.35, 0.35, length(p));
  col *= 0.86 + 0.14 * v;
  float n = hash(vUv * 1024.0 + fract(uTime) * 7.0) - 0.5;
  col += n * uGrain;
  fragColor = vec4(col, 1.0);
}
`;

const tri = new BufferGeometry();
tri.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
tri.setAttribute("uv", new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));

const ndc = new Vector3();

export default function Backdrop() {
  const scene = useThree((s) => s.scene);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        glslVersion: GLSL3,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uBg: { value: new Color() },
          uBg2: { value: new Color() },
          uA: { value: new Color() },
          uB: { value: new Color() },
          uC: { value: new Color() },
          uTime: { value: 0 },
          uAspect: { value: new Vector2(1, 1) },
          uLight: { value: new Vector2(0, 0) },
          uLightK: { value: 0 },
          uGrain: { value: 0.035 },
          uInvPV: { value: new Matrix4() },
          uCam: { value: new Vector3() },
        },
      }),
    []
  );
  useFrame((st) => {
    const u = material.uniforms;
    const s = store.get();
    (u.uBg.value as Color).copy(rig.bg);
    (u.uBg2.value as Color).copy(rig.bg2);
    (u.uA.value as Color).copy(rig.a);
    (u.uB.value as Color).copy(rig.b);
    (u.uC.value as Color).copy(rig.c);
    u.uTime.value = s.reduced ? 0 : rig.time;
    (u.uAspect.value as Vector2).set(st.size.width / st.size.height, 1);
    const cam = st.camera;
    cam.updateMatrixWorld();
    (u.uInvPV.value as Matrix4).multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).invert();
    (u.uCam.value as Vector3).copy(cam.position);
    // the light's screen position: project it with the camera
    ndc.copy(rig.light).project(cam);
    (u.uLight.value as Vector2).set((ndc.x * st.size.width) / st.size.height / 2, ndc.y / 2);
    u.uLightK.value += ((rig.pointer ? 1 : 0.35) - u.uLightK.value) * 0.08;
    // the fog is the ground of the void
    const fog = scene.fog as { color: Color } | null;
    if (fog) fog.color.copy(rig.bg2);
  }, -90);
  return (
    <>
      <mesh geometry={tri} material={material} frustumCulled={false} renderOrder={-1000} />
      <fog attach="fog" args={["#140a2e", 16, 64]} />
    </>
  );
}
