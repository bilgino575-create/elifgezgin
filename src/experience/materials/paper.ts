import { CanvasTexture, Color, LinearFilter, LinearMipmapLinearFilter, MeshPhysicalMaterial, RepeatWrapping, SRGBColorSpace, Texture, Vector2 } from "three";

/**
 * Paper. One material language for every sheet: a procedural grain normal
 * (two octaves of value noise, tiled), an optional emboss normal map (text
 * drawn to a canvas → blurred height → Sobel → tangent-space normal), a
 * warm sheen so raking light produces the soft specular of coated stock.
 */

let grainTex: CanvasTexture | null = null;

/** Tiled paper-grain normal map, generated once (512², two octaves). */
export function grainNormal(): CanvasTexture {
  if (grainTex) return grainTex;
  const N = 512;
  const c = document.createElement("canvas");
  c.width = N;
  c.height = N;
  const ctx = c.getContext("2d")!;
  // value noise, tileable through modular sampling
  const rnd = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number, y: number, f: number) => {
    const gx = ((x * f) / N) % f;
    const gy = ((y * f) / N) % f;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = smooth(gx - x0);
    const fy = smooth(gy - y0);
    const x1 = (x0 + 1) % f;
    const y1 = (y0 + 1) % f;
    const a = rnd(x0, y0);
    const b = rnd(x1, y0);
    const cc = rnd(x0, y1);
    const d = rnd(x1, y1);
    return a + (b - a) * fx + (cc - a) * fy + (a - b - cc + d) * fx * fy;
  };
  const height = new Float32Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const h = noise(x, y, 64) * 0.55 + noise(x, y, 128) * 0.3 + noise(x, y, 256) * 0.15;
      // fibres: a faint directional streak
      const fibre = Math.sin((x * 0.9 + y * 0.15) * 0.7 + noise(x, y, 32) * 6) * 0.03;
      height[y * N + x] = h + fibre;
    }
  const img = ctx.createImageData(N, N);
  const strength = 2.2;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const l = height[y * N + ((x - 1 + N) % N)];
      const r = height[y * N + ((x + 1) % N)];
      const u = height[((y - 1 + N) % N) * N + x];
      const d = height[((y + 1) % N) * N + x];
      const nx = (l - r) * strength;
      const ny = (u - d) * strength;
      const len = Math.hypot(nx, ny, 1);
      const i = (y * N + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len) * 255;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  grainTex = new CanvasTexture(c);
  grainTex.wrapS = grainTex.wrapT = RepeatWrapping;
  // the repeat is applied in the shader (uGrainRepeat) so vNormalMapUv stays the plain uv for the emboss
  grainTex.minFilter = LinearMipmapLinearFilter;
  grainTex.magFilter = LinearFilter;
  grainTex.anisotropy = 4;
  return grainTex;
}

export interface EmbossOptions {
  width: number;
  height: number;
  /** draw the raised/pressed shapes in white on black */
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  /** blur radius in px: the softness of the paper's edge around the impression */
  blur?: number;
  /** normal strength */
  strength?: number;
  /** +1 emboss (raised), −1 deboss (pressed in) */
  sign?: 1 | -1;
}

/**
 * Emboss/deboss normal map from a drawing. White = pressed shape. The height
 * is the blurred mask; the normal is its gradient. Returns the normal
 * texture and the mask (for ink/ao passes).
 */
export function embossNormal(o: EmbossOptions): { normal: CanvasTexture; mask: CanvasTexture } {
  const { width: W, height: H } = o;
  const src = document.createElement("canvas");
  src.width = W;
  src.height = H;
  const sctx = src.getContext("2d")!;
  sctx.fillStyle = "#000";
  sctx.fillRect(0, 0, W, H);
  sctx.fillStyle = "#fff";
  sctx.strokeStyle = "#fff";
  o.draw(sctx, W, H);
  // soften the edges: real paper yields around the plate
  const soft = document.createElement("canvas");
  soft.width = W;
  soft.height = H;
  const bctx = soft.getContext("2d")!;
  bctx.filter = `blur(${o.blur ?? 2}px)`;
  bctx.drawImage(src, 0, 0);
  bctx.filter = "none";
  const data = bctx.getImageData(0, 0, W, H).data;
  const height = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) height[i] = data[i * 4] / 255;
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const octx = out.getContext("2d")!;
  const img = octx.createImageData(W, H);
  const k = (o.strength ?? 6) * (o.sign ?? -1);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const l = height[y * W + Math.max(0, x - 1)];
      const r = height[y * W + Math.min(W - 1, x + 1)];
      const u = height[Math.max(0, y - 1) * W + x];
      const d = height[Math.min(H - 1, y + 1) * W + x];
      const nx = (l - r) * k;
      const ny = (d - u) * k; // canvas y is down; tangent-space +y is up
      const len = Math.hypot(nx, ny, 1);
      const i = (y * W + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len) * 255;
      img.data[i + 3] = 255;
    }
  octx.putImageData(img, 0, 0);
  const normal = new CanvasTexture(out);
  normal.minFilter = LinearMipmapLinearFilter;
  normal.magFilter = LinearFilter;
  normal.anisotropy = 8;
  const mask = new CanvasTexture(soft);
  mask.minFilter = LinearMipmapLinearFilter;
  mask.magFilter = LinearFilter;
  return { normal, mask };
}

export interface PaperOptions {
  color?: string;
  /** emboss normal to blend over the grain */
  emboss?: Texture | null;
  /** grain repeat per unit of the sheet (default 3 across) */
  grainScale?: number;
  grainStrength?: number;
  embossStrength?: number;
  roughness?: number;
  sheen?: number;
  /** a printed image on the paper */
  map?: Texture | null;
  /** darkening from the emboss mask (ink-free letterpress ao) */
  ao?: Texture | null;
  /** printed artwork: CMYK plates that drift with the cursor (registration) */
  print?: boolean;
  /** render a single plate (0 C, 1 M, 2 Y, 3 K) of the artwork; -1 = all plates */
  plate?: number;
}

/**
 * MeshPhysicalMaterial with a second normal map injected through
 * onBeforeCompile: `normalMap` is the tiled grain, `uEmboss` the impression.
 * Both are blended in tangent space (RNM) before lighting.
 */
export function paperMaterial(o: PaperOptions = {}): PaperMaterial {
  const grain = grainNormal();
  const m = new MeshPhysicalMaterial({
    color: new Color(o.color ?? "#f6f5f1"),
    roughness: o.roughness ?? 0.72,
    metalness: 0,
    normalMap: grain,
    normalScale: new Vector2(o.grainStrength ?? 0.35, o.grainStrength ?? 0.35),
    sheen: o.sheen ?? 0.3,
    sheenRoughness: 0.9,
    sheenColor: new Color("#fff5e6"),
    map: o.map ?? null,
    envMapIntensity: 0.4,
  });
  if (o.map) o.map.colorSpace = SRGBColorSpace;
  const uniforms = {
    uEmboss: { value: o.emboss ?? null },
    uEmbossStrength: { value: o.emboss ? (o.embossStrength ?? 1) : 0 },
    uAo: { value: o.ao ?? null },
    uAoStrength: { value: o.ao ? 0.5 : 0 },
    uGrainRepeat: { value: o.grainScale ?? 3 },
    /** registration drift in uv units (x: cursor velocity direction) */
    uDrift: { value: new Vector2(0, 0) },
    uPlate: { value: o.plate ?? -1 },
  };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    if (o.print && o.map) {
      // CMYK separation: each plate samples the artwork at its own offset and the
      // plates recombine subtractively, so mis-registration looks like print
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        /* glsl */ `
        #ifdef USE_MAP
          vec2 mUv = vMapUv;
          vec3 sC = texture2D( map, mUv + uDrift * vec2(-1.0, 0.15) ).rgb;
          vec3 sM = texture2D( map, mUv + uDrift * vec2(0.45, 0.9) ).rgb;
          vec3 sY = texture2D( map, mUv + uDrift * vec2(1.0, -0.4) ).rgb;
          vec3 sK = texture2D( map, mUv ).rgb;
          float kk = 1.0 - max(sK.r, max(sK.g, sK.b));
          float inv = max(1.0 - kk, 1e-3);
          float c = clamp((1.0 - sC.r - kk) / inv, 0.0, 1.0);
          float mm = clamp((1.0 - sM.g - kk) / inv, 0.0, 1.0);
          float yy = clamp((1.0 - sY.b - kk) / inv, 0.0, 1.0);
          vec3 rgb;
          if (uPlate < -0.5) {
            rgb = vec3((1.0 - c) * (1.0 - kk), (1.0 - mm) * (1.0 - kk), (1.0 - yy) * (1.0 - kk));
          } else if (uPlate < 0.5) {
            rgb = vec3(1.0 - c, 1.0, 1.0);          // cyan plate on white
          } else if (uPlate < 1.5) {
            rgb = vec3(1.0, 1.0 - mm, 1.0);         // magenta
          } else if (uPlate < 2.5) {
            rgb = vec3(1.0, 1.0, 1.0 - yy);         // yellow
          } else {
            rgb = vec3(1.0 - kk);                   // black
          }
          diffuseColor.rgb *= rgb;
        #endif
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_pars_fragment>",
        /* glsl */ `
        #include <map_pars_fragment>
        uniform vec2 uDrift;
        uniform float uPlate;
        `
      );
    }
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `
        #ifdef USE_NORMALMAP
          vec3 gN = texture2D( normalMap, vNormalMapUv * uGrainRepeat ).xyz * 2.0 - 1.0;
          gN.xy *= normalScale;
          vec3 eN = vec3(0.0, 0.0, 1.0);
          if (uEmbossStrength > 0.0) {
            eN = texture2D( uEmboss, vNormalMapUv ).xyz * 2.0 - 1.0;
            eN.xy *= uEmbossStrength;
          }
          // reoriented normal mapping: grain over emboss
          vec3 t = eN + vec3(0.0, 0.0, 1.0);
          vec3 u = gN * vec3(-1.0, -1.0, 1.0);
          vec3 mapN = normalize(t * dot(t, u) / t.z - u);
          normal = normalize( tbn * mapN );
        #endif
        `
      )
      .replace(
        "#include <aomap_fragment>",
        /* glsl */ `
        #include <aomap_fragment>
        if (uAoStrength > 0.0) {
          float m = texture2D( uAo, vNormalMapUv ).r;
          reflectedLight.indirectDiffuse *= 1.0 - m * uAoStrength;
          reflectedLight.directDiffuse *= 1.0 - m * uAoStrength * 0.6;
        }
        `
      );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normalmap_pars_fragment>",
      /* glsl */ `
      #include <normalmap_pars_fragment>
      uniform sampler2D uEmboss;
      uniform float uEmbossStrength;
      uniform sampler2D uAo;
      uniform float uAoStrength;
      uniform float uGrainRepeat;
      `
    );
  };
  // three caches programs by these keys; different emboss presence needs a distinct key
  m.customProgramCacheKey = () => `paper-${o.emboss ? 1 : 0}-${o.ao ? 1 : 0}-${o.print && o.map ? 1 : 0}`;
  (m as PaperMaterial).paper = uniforms;
  return m as PaperMaterial;
}

export type PaperUniforms = {
  uEmboss: { value: Texture | null };
  uEmbossStrength: { value: number };
  uAo: { value: Texture | null };
  uAoStrength: { value: number };
  uGrainRepeat: { value: number };
  uDrift: { value: Vector2 };
  uPlate: { value: number };
};
export type PaperMaterial = MeshPhysicalMaterial & { paper: PaperUniforms };
