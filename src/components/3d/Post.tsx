"use client";

import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ShaderPass } from "postprocessing";
import { useMemo } from "react";
import { GLSL3, ShaderMaterial, Vector2 } from "three";
import { useStore } from "@/lib/store";
import { budgetOf } from "@/lib/tiers";

/**
 * HIGH and ULTRA: bloom on the brightest edges (chrome highlights, neon),
 * a hair of chromatic aberration at the edges of the frame, grain and a
 * vignette. One pass before bloom replaces any non-finite value, because a
 * single NaN pixel would otherwise become a black frame through the blur.
 */
function makeSanitizePass() {
  const material = new ShaderMaterial({
    glslVersion: GLSL3,
    uniforms: { inputBuffer: { value: null } },
    vertexShader: /* glsl */ `
      out vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D inputBuffer;
      in vec2 vUv;
      out vec4 fragColor;
      void main() {
        vec4 c = texture(inputBuffer, vUv);
        bvec4 bad = bvec4(isnan(c.x) || isinf(c.x), isnan(c.y) || isinf(c.y), isnan(c.z) || isinf(c.z), isnan(c.w) || isinf(c.w));
        c = mix(c, vec4(0.0, 0.0, 0.0, 1.0), vec4(bad));
        fragColor = vec4(clamp(c.rgb, 0.0, 64.0), c.a);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
  return new ShaderPass(material, "inputBuffer");
}

export default function Post() {
  const tier = useStore((s) => s.tier);
  const sanitize = useMemo(() => makeSanitizePass(), []);
  const offset = useMemo(() => new Vector2(0.0011, 0.0009), []);
  const b = budgetOf(tier);
  if (!b.post) return null;
  return (
    <EffectComposer multisampling={tier === "ultra" ? 4 : 0} depthBuffer stencilBuffer={false}>
      <primitive object={sanitize} />
      <Bloom mipmapBlur luminanceThreshold={0.86} luminanceSmoothing={0.25} intensity={tier === "ultra" ? 0.85 : 0.65} radius={0.65} />
      <ChromaticAberration offset={offset} radialModulation modulationOffset={0.35} blendFunction={BlendFunction.NORMAL} />
      <Noise premultiply opacity={0.07} blendFunction={BlendFunction.SOFT_LIGHT} />
      <Vignette eskil={false} offset={0.3} darkness={0.42} />
    </EffectComposer>
  );
}
