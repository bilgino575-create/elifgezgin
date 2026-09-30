import { DoubleSide, ShaderMaterial, Texture, Vector2 } from "three";

/**
 * The loupe: a disc that samples the hovered artwork magnified around the
 * pointer's uv and renders it as four halftone screens (C 15°, M 75°,
 * Y 0°, K 45°) with a soft rim. `uHalftone` 0 gives a plain magnifier (LOW).
 */
export function loupeMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uMap: { value: null as Texture | null },
      uCenter: { value: new Vector2(0.5, 0.5) },
      uZoom: { value: 3.2 },
      uAspect: { value: 0.8 },
      uHalftone: { value: 1 },
      uCells: { value: 42 },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D uMap;
      uniform vec2 uCenter;
      uniform float uZoom;
      uniform float uAspect;
      uniform float uHalftone;
      uniform float uCells;
      uniform float uOpacity;
      varying vec2 vUv;

      float screenDot(vec2 p, float angle, float value) {
        float s = sin(angle), c = cos(angle);
        vec2 q = mat2(c, -s, s, c) * p * uCells;
        vec2 cell = fract(q) - 0.5;
        float r = sqrt(clamp(value, 0.0, 1.0)) * 0.72;
        float d = length(cell);
        return 1.0 - smoothstep(r - 0.06, r + 0.06, d);
      }

      void main() {
        vec2 d = vUv - 0.5;
        float rr = length(d);
        if (rr > 0.5) discard;
        // magnified sample around the pointer (keep the artwork's aspect)
        vec2 uv = uCenter + vec2(d.x, d.y / uAspect) / uZoom;
        uv = clamp(uv, 0.001, 0.999);
        vec3 tex = texture2D(uMap, uv).rgb;
        vec3 col = tex;
        if (uHalftone > 0.5) {
          float k = 1.0 - max(tex.r, max(tex.g, tex.b));
          float inv = max(1.0 - k, 1e-3);
          float c = clamp((1.0 - tex.r - k) / inv, 0.0, 1.0);
          float m = clamp((1.0 - tex.g - k) / inv, 0.0, 1.0);
          float y = clamp((1.0 - tex.b - k) / inv, 0.0, 1.0);
          vec2 p = d * 2.0;
          float dc = screenDot(p, 0.2618, c);
          float dm = screenDot(p, 1.309, m);
          float dy = screenDot(p, 0.0, y);
          float dk = screenDot(p, 0.7854, k);
          vec3 paper = vec3(0.985, 0.98, 0.965);
          col = paper;
          col *= mix(vec3(1.0), vec3(0.0, 0.62, 0.9), dc);
          col *= mix(vec3(1.0), vec3(0.93, 0.0, 0.55), dm);
          col *= mix(vec3(1.0), vec3(1.0, 0.92, 0.0), dy);
          col *= mix(vec3(1.0), vec3(0.08), dk);
        }
        // glass: a soft rim and a faint highlight
        float rim = smoothstep(0.5, 0.44, rr);
        float edge = smoothstep(0.47, 0.5, rr) * 0.35;
        float hi = smoothstep(0.32, 0.5, rr) * 0.08;
        col = mix(col, vec3(0.06), edge) + hi;
        gl_FragColor = vec4(col, rim * uOpacity);
      }
    `,
  });
}

export type LoupeMaterial = ReturnType<typeof loupeMaterial>;
