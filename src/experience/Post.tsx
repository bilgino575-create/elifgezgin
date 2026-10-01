"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { ShaderPass } from "postprocessing";
import { useMemo } from "react";
import { GLSL3, ShaderMaterial } from "three";
import { useStore } from "@/lib/store";

/**
 * One NaN pixel in the scene buffer becomes a black frame: bloom's mip chain
 * averages it into every pixel. This pass runs before bloom and replaces
 * non-finite values with black, and clamps the HDR range so the half-float
 * chain cannot overflow either. Fullscreen, one texture read per pixel.
 */
function makeSanitizePass() {
  const material = new ShaderMaterial({
    glslVersion: GLSL3,
    uniforms: { inputBuffer: { value: null } },
    vertexShader: /* glsl */ `
      out vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 1.0, 1.0);
      }
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

/**
 * HIGH/ULTRA only: bloom on the specular peaks (glass edges, foil) and a
 * faint vignette. The composer keeps a stencil buffer for the portals.
 * `?nopost` bypasses the composer (debug).
 */
export default function Post() {
  const tier = useStore((s) => s.tier);
  const sanitize = useMemo(() => makeSanitizePass(), []);
  const off = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("nopost");
  if (off || (tier !== "high" && tier !== "ultra")) return null;
  return (
    <EffectComposer multisampling={tier === "ultra" ? 4 : 0} stencilBuffer depthBuffer>
      <primitive object={sanitize} />
      <Bloom mipmapBlur luminanceThreshold={0.82} luminanceSmoothing={0.2} intensity={tier === "ultra" ? 1.0 : 0.8} radius={0.6} />
      <Vignette eskil={false} offset={0.28} darkness={0.35} />
    </EffectComposer>
  );
}
