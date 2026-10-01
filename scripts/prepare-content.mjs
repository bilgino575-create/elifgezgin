/**
 * Build-time content pipeline (prebuild / predev).
 *
 * Reads content/works/<slug>/meta.json and the images next to it, writes
 * optimised WebP derivatives to public/works/<slug>/ (2048 px for the
 * stage's textures, 1600 px for the project page, 800 px for small uses,
 * a 24 px blur placeholder) and a typed manifest to
 * src/content/works.generated.ts. Derivatives are only rewritten when the
 * source is newer.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const worksDir = join(root, "content", "works");
const outDir = join(root, "public", "works");
const CATEGORIES = new Set(["poster", "typography", "identity", "digital", "editorial", "series"]);
const PRESENTATIONS = new Set(["poster", "chrome-type", "glass-cube", "projection", "spread", "particles"]);
const defaultPresentation = { poster: "poster", typography: "chrome-type", identity: "glass-cube", digital: "projection", editorial: "spread", series: "particles" };
const defaultStop = { poster: 4, typography: 2, identity: 3, digital: 5, editorial: 5, series: 4 };

mkdirSync(worksDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const fresh = (src, out) => existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;

async function derivative(src, out, width, quality = 84) {
  if (!fresh(src, out)) {
    await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality, effort: 5 }).toFile(out);
  }
  const m = await sharp(out).metadata();
  return { w: m.width, h: m.height };
}
async function blur(src) {
  const buf = await sharp(src).rotate().resize(24, 24, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}
/** three dominant colours (k-means on a 32 px raster) when meta.json gives none */
async function palette(src, k = 3) {
  const { data, info } = await sharp(src).rotate().resize(32, 32, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < info.width * info.height; i++) px.push([data[i * 3], data[i * 3 + 1], data[i * 3 + 2]]);
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
    c = sum.map((s, j) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : c[j]));
  }
  return c.map((v) => "#" + v.map((x) => Math.round(x).toString(16).padStart(2, "0")).join(""));
}

const hex = /^#[0-9a-fA-F]{6}$/;
const loc = (v, fallback = "") => (v && typeof v === "object" ? { tr: String(v.tr ?? v.en ?? fallback), en: String(v.en ?? v.tr ?? fallback) } : { tr: String(v ?? fallback), en: String(v ?? fallback) });

const works = [];
for (const slug of readdirSync(worksDir).sort()) {
  const dir = join(worksDir, slug);
  if (!statSync(dir).isDirectory()) continue;
  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.warn(`works: "${slug}" skipped — folder names use a-z, 0-9 and - only`);
    continue;
  }
  const metaPath = join(dir, "meta.json");
  if (!existsSync(metaPath)) {
    console.warn(`works: ${slug}/meta.json missing — skipped`);
    continue;
  }
  const m = JSON.parse(readFileSync(metaPath, "utf8"));
  const category = CATEGORIES.has(m.category) ? m.category : "poster";
  const presentation = PRESENTATIONS.has(m.presentation) ? m.presentation : defaultPresentation[category];
  const stop = Number.isInteger(m.stop) && m.stop >= 2 && m.stop <= 5 ? m.stop : defaultStop[category];
  const coverName = m.cover || "cover.jpg";
  const coverSrc = join(dir, coverName);
  if (!existsSync(coverSrc)) {
    console.warn(`works: ${slug}/${coverName} missing — skipped`);
    continue;
  }
  const o = join(outDir, slug);
  mkdirSync(o, { recursive: true });
  const image = async (file, base) => {
    const src = join(dir, file);
    const big = await derivative(src, join(o, `${base}-2048.webp`), 2048);
    const mid = await derivative(src, join(o, `${base}-1600.webp`), 1600);
    await derivative(src, join(o, `${base}-800.webp`), 800, 80);
    return { src: `/works/${slug}/${base}-1600.webp`, texture: `/works/${slug}/${base}-2048.webp`, small: `/works/${slug}/${base}-800.webp`, w: mid.w, h: mid.h, tw: big.w, th: big.h, blur: await blur(src) };
  };
  const cover = await image(coverName, "cover");
  const gallery = [];
  for (const [i, g] of (Array.isArray(m.gallery) ? m.gallery : []).entries()) {
    if (existsSync(join(dir, g))) gallery.push(await image(g, `g${String(i + 1).padStart(2, "0")}`));
  }
  const colors = Array.isArray(m.colors) && m.colors.every((c) => hex.test(c)) && m.colors.length >= 2 ? m.colors.slice(0, 3) : await palette(coverSrc);
  const process = Array.isArray(m.process) ? m.process.map((s) => ({ title: loc(s.title), text: loc(s.text) })) : [];
  works.push({
    slug,
    title: loc(m.title, slug),
    category,
    presentation,
    stop,
    year: Number(m.year) || new Date().getFullYear(),
    role: loc(m.role),
    tools: Array.isArray(m.tools) ? m.tools.map(String) : [],
    text: loc(m.text),
    client: typeof m.client === "string" && m.client.trim() ? m.client.trim() : null,
    sample: m.sample === true,
    order: Number.isFinite(m.order) ? m.order : null,
    colors,
    cover,
    gallery,
    process,
  });
}
works.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || b.year - a.year || a.slug.localeCompare(b.slug));

const ts = `// GENERATED by scripts/prepare-content.mjs — do not edit; edit content/works/<slug>/meta.json
import type { Localized } from "../../content/site";

export type Category = "poster" | "typography" | "identity" | "digital" | "editorial" | "series";
export type Presentation = "poster" | "chrome-type" | "glass-cube" | "projection" | "spread" | "particles";
export interface WorkImage {
  /** 1600 px for pages, 2048 px for textures, 800 px for small uses; sizes of the 1600 and 2048 derivatives; a 24 px blur */
  src: string;
  texture: string;
  small: string;
  w: number;
  h: number;
  tw: number;
  th: number;
  blur: string;
}
export interface WorkProcessStep {
  title: Localized;
  text: Localized;
}
export interface Work {
  slug: string;
  title: Localized;
  category: Category;
  presentation: Presentation;
  /** the stop (2–5) where the work stands as an object */
  stop: number;
  year: number;
  role: Localized;
  tools: string[];
  text: Localized;
  client: string | null;
  sample: boolean;
  order: number | null;
  colors: string[];
  cover: WorkImage;
  gallery: WorkImage[];
  process: WorkProcessStep[];
}

export const works: Work[] = ${JSON.stringify(works, null, 2)};
`;
mkdirSync(join(root, "src", "content"), { recursive: true });
writeFileSync(join(root, "src", "content", "works.generated.ts"), ts);
console.log(`works: ${works.length} prepared → public/works, src/content/works.generated.ts`);
