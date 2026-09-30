import { Texture, Vector3 } from "three";
import { paperMaterial, type PaperMaterial, type PaperOptions } from "./paper";

export type HalftoneMaterial = PaperMaterial & {
  halftone: { uLampPos: { value: Vector3 }; uCells: { value: number }; uStrength: { value: number }; uPaperTone: { value: number } };
};

/**
 * A printed photograph: the image becomes a single-ink halftone whose dots
 * are coarse away from the lamp and resolve into full tone where the light
 * falls. Built on the paper material so the print still has grain and sheen.
 */
export function halftoneMaterial(image: Texture, o: Omit<PaperOptions, "map"> = {}): HalftoneMaterial {
  const m = paperMaterial({ ...o, map: image }) as HalftoneMaterial;
  const halftone = {
    uLampPos: { value: new Vector3(0, 0, 0) },
    uCells: { value: 56 },
    uStrength: { value: 1 },
    uPaperTone: { value: 1 },
  };
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    prev(shader, renderer);
    Object.assign(shader.uniforms, halftone);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHtPos;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvHtPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <map_pars_fragment>",
        /* glsl */ `
        #include <map_pars_fragment>
        varying vec3 vHtPos;
        uniform vec3 uLampPos;
        uniform float uCells;
        uniform float uStrength;
        uniform float uPaperTone;
        float htDot(vec2 p, float angle, float value) {
          float s = sin(angle), c = cos(angle);
          vec2 q = mat2(c, -s, s, c) * p;
          vec2 cell = fract(q) - 0.5;
          float r = sqrt(clamp(value, 0.0, 1.0)) * 0.72;
          float d = length(cell);
          float aa = fwidth(d) * 1.2;
          return 1.0 - smoothstep(r - aa, r + aa, d);
        }
        `
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        #ifdef USE_MAP
          vec3 tex = texture2D( map, vMapUv ).rgb;
          float lum = dot(tex, vec3(0.299, 0.587, 0.114));
          float k = 1.0 - lum;
          // the lamp resolves the print: near it the screen is fine and the tone continuous
          float dist = distance(vHtPos, uLampPos);
          float near = smoothstep(1.4, 0.25, dist);
          float cells = uCells * mix(1.0, 2.4, near);
          float d = htDot(vMapUv * vec2(cells, cells * 1.25), 0.7854, k * uStrength);
          vec3 inkCol = vec3(0.07, 0.07, 0.08);
          vec3 dots = mix(vec3(uPaperTone), inkCol, d);
          vec3 tone = mix(vec3(uPaperTone), inkCol, k * 0.92);
          diffuseColor.rgb *= mix(dots, tone, near * 0.85);
        #endif
        `
      );
  };
  m.customProgramCacheKey = () => `halftone-${o.emboss ? 1 : 0}`;
  m.halftone = halftone;
  return m;
}
