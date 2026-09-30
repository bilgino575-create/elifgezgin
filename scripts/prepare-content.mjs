/**
 * Build-time content pipeline (prebuild / predev).
 *
 * Reads content/works/<slug>/meta.json and the images next to it, writes
 * optimised WebP derivatives (≤ 2048 px, for textures with mipmaps; 1600 px
 * for galleries; 640 px for cards; a 24 px blur placeholder) to
 * public/works/<slug>/ and a typed manifest to src/content/works.generated.ts.
 * Also prepares content/portrait.jpg when present.
 *
 * Derivatives are only rewritten when the source is newer.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const worksDir = join(root, "content", "works");
const outDir = join(root, "public", "works");
const CATEGORIES = new Set(["poster", "editorial", "packaging", "identity", "social"]);

mkdirSync(worksDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const fresh = (src, out) => existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;

async function derivative(src, out, width, quality = 84) {
  if (fresh(src, out)) return sharp(out).metadata();
  const img = sharp(src).rotate();
  const meta = await img.metadata();
  const w = Math.min(width, meta.width ?? width);
  await img.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality, effort: 5 }).toFile(out);
  return sharp(out).metadata();
}

/** Three dominant colours of an image (k-means on a 32 px raster), as hex. The portal's room is built from them. */
async function palette(src, k = 3) {
  const { data, info } = await sharp(src).rotate().resize(32, 32, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < info.width * info.height; i++) px.push([data[i * 3], data[i * 3 + 1], data[i * 3 + 2]]);
  // seeds: spread by luminance
  const sorted = [...px].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  let c = Array.from({ length: k }, (_, i) => [...sorted[Math.floor(((i + 0.5) / k) * sorted.length)]]);
  for (let iter = 0; iter < 10; iter++) {
    const sum = c.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let best = 0;
      let bd = Infinity;
      for (let j = 0; j < k; j++) {
        const d = (p[0] - c[j][0]) ** 2 + (p[1] - c[j][1]) ** 2 + (p[2] - c[j][2]) ** 2;
        if (d < bd) {
          bd = d;
          best = j;
        }
      }
      sum[best][0] += p[0];
      sum[best][1] += p[1];
      sum[best][2] += p[2];
      sum[best][3]++;
    }
    c = c.map((old, j) => (sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : old));
    c.forEach((cc, j) => (cc[3] = sum[j][3]));
  }
  // most frequent first
  c.sort((a, b) => (b[3] ?? 0) - (a[3] ?? 0));
  const hex = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return c.map((cc) => `#${hex(cc[0])}${hex(cc[1])}${hex(cc[2])}`);
}

async function layerDerivative(src, out, width) {
  if (fresh(src, out)) return sharp(out).metadata();
  const img = sharp(src);
  const meta = await img.metadata();
  const w = Math.min(width, meta.width ?? width);
  await img.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 84, effort: 5, alphaQuality: 90 }).toFile(out);
  return sharp(out).metadata();
}

async function blur(src) {
  const buf = await sharp(src).rotate().resize(24).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

const works = [];
const dirs = readdirSync(worksDir, { withFileTypes: true }).filter((d) => d.isDirectory());
for (const d of dirs) {
  const dir = join(worksDir, d.name);
  const metaPath = join(dir, "meta.json");
  if (!existsSync(metaPath)) {
    console.warn(`content: ${d.name} has no meta.json, skipped`);
    continue;
  }
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  const slug = d.name;
  const coverFile = meta.cover ?? "cover.jpg";
  const coverSrc = join(dir, coverFile);
  if (!existsSync(coverSrc)) {
    console.warn(`content: ${slug} has no ${coverFile}, skipped`);
    continue;
  }
  if (!CATEGORIES.has(meta.category)) {
    console.warn(`content: ${slug} category "${meta.category}" unknown, using "poster"`);
    meta.category = "poster";
  }
  const o = join(outDir, slug);
  mkdirSync(o, { recursive: true });
  const c2048 = await derivative(coverSrc, join(o, "cover-2048.webp"), 2048, 86);
  await derivative(coverSrc, join(o, "cover-1024.webp"), 1024, 84);
  await derivative(coverSrc, join(o, "cover-640.webp"), 640, 80);
  const gallery = [];
  const files = Array.isArray(meta.gallery)
    ? meta.gallery
    : readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && f !== coverFile).sort();
  let i = 0;
  for (const f of files) {
    const src = join(dir, f);
    if (!existsSync(src)) continue;
    i++;
    const m = await derivative(src, join(o, `gallery-${i}-1600.webp`), 1600, 84);
    gallery.push({ src: `/works/${slug}/gallery-${i}-1600.webp`, w: m.width, h: m.height, blur: await blur(src) });
  }
  // optional layers for the portal's depth pop: content/works/<slug>/layers/*.png|jpg, sorted by name (back to front)
  const layers = [];
  const layerDir = join(dir, "layers");
  if (existsSync(layerDir)) {
    const lf = readdirSync(layerDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
    let li = 0;
    for (const f of lf) {
      li++;
      const m = await layerDerivative(join(layerDir, f), join(o, `layer-${li}-1024.webp`), 1024);
      layers.push({ src: `/works/${slug}/layer-${li}-1024.webp`, w: m.width, h: m.height, blur: "" });
    }
  }
  works.push({
    slug,
    category: meta.category,
    colors: await palette(coverSrc),
    layers,
    year: meta.year ?? null,
    role: meta.role ?? null,
    tools: meta.tools ?? [],
    title: meta.title,
    text: meta.text ?? { tr: "", en: "" },
    client: meta.client ?? null,
    sample: meta.sample === true,
    order: typeof meta.order === "number" ? meta.order : 1000,
    cover: {
      src2048: `/works/${slug}/cover-2048.webp`,
      src1024: `/works/${slug}/cover-1024.webp`,
      src640: `/works/${slug}/cover-640.webp`,
      w: c2048.width,
      h: c2048.height,
      blur: await blur(coverSrc),
    },
    gallery,
  });
}
works.sort((a, b) => a.order - b.order || (b.year ?? 0) - (a.year ?? 0) || a.slug.localeCompare(b.slug));

let portrait = null;
// the file name comes from content/site.ts (`portrait: "..."`), default portrait.jpg
const siteTs = readFileSync(join(root, "content", "site.ts"), "utf8");
const portraitFile = (siteTs.match(/portrait:\s*"([^"]+)"/) || [, "portrait.jpg"])[1];
const portraitSrc = join(root, "content", portraitFile);
if (existsSync(portraitSrc)) {
  mkdirSync(join(root, "public", "portrait"), { recursive: true });
  const m = await derivative(portraitSrc, join(root, "public", "portrait", "portrait-1600.webp"), 1600, 86);
  portrait = { src: "/portrait/portrait-1600.webp", w: m.width, h: m.height, blur: await blur(portraitSrc) };
}

const ts = `/* generated by scripts/prepare-content.mjs — do not edit */
import type { Category } from "@/i18n/dict";
import type { Localized } from "../../content/site";

export interface WorkImage { src: string; w: number; h: number; blur: string }
export interface Work {
  slug: string;
  category: Category;
  year: number | null;
  role: Localized | null;
  tools: string[];
  title: Localized;
  text: Localized;
  client: string | null;
  sample: boolean;
  order: number;
  cover: { src2048: string; src1024: string; src640: string; w: number; h: number; blur: string };
  gallery: WorkImage[];
  /** three dominant colours of the cover, most frequent first */
  colors: string[];
  /** optional depth layers, back to front */
  layers: WorkImage[];
}
export const works: Work[] = ${JSON.stringify(works, null, 2)};
export const portrait: WorkImage | null = ${JSON.stringify(portrait)};
`;
mkdirSync(join(root, "src", "content"), { recursive: true });
writeFileSync(join(root, "src", "content", "works.generated.ts"), ts);
console.log(`content: ${works.length} work(s)${portrait ? ", portrait" : ""} → src/content/works.generated.ts`);
