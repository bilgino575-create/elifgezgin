/**
 * Procedural sample works.
 *
 * Until Elif's real work arrives, six tasteful pieces are rendered from SVG
 * with sharp: three Swiss-style posters, a book cover, a packaging label and
 * a logo mark. Each is written to content/works/<slug>/ with a meta.json
 * that carries `"sample": true`, so the UI marks it "Örnek".
 *
 * The script runs only when content/works has no work folders at all, so
 * deleting the samples (README_ELIF.md) is permanent.
 *
 *   node scripts/samples.mjs [--force]
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const worksDir = join(root, "content", "works");
const force = process.argv.includes("--force");

// fontconfig must see the repo's fonts before sharp (libvips) initialises
const fontDir = join(root, "assets", "fonts");
const conf = join(fontDir, "fonts.conf");
writeFileSync(
  conf,
  `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${fontDir}</dir><cachedir>/tmp/elifgezgin-fontcache</cachedir></fontconfig>`
);
process.env.FONTCONFIG_FILE = conf;
const sharp = (await import("sharp")).default;

mkdirSync(worksDir, { recursive: true });
const existing = readdirSync(worksDir, { withFileTypes: true }).filter((d) => d.isDirectory());
if (existing.length && !force) {
  console.log(`samples: ${existing.length} work folder(s) present, nothing generated`);
  process.exit(0);
}

const siteTs = readFileSync(join(root, "content", "site.ts"), "utf8");
const SPOT = (siteTs.match(/spotColor:\s*"(#[0-9a-fA-F]{6})"/) || [, "#1F4BFF"])[1];
const PAPER = "#F6F5F1";
const INK = "#111214";
const SANS = "'Schibsted Grotesk', 'DejaVu Sans', sans-serif";
const SERIF = "'Instrument Serif', 'DejaVu Serif', serif";
const YEAR = new Date().getFullYear();


/** paper grain as an SVG filter, applied to the background rect */
const grain = `
<filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.06 0" result="g"/>
  <feComposite in="g" in2="SourceGraphic" operator="over"/>
</filter>`;

function frame(w, h, body, bg = PAPER) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>${grain}</defs>
<rect width="${w}" height="${h}" fill="${bg}"/>
${body}
<rect width="${w}" height="${h}" fill="${bg}" filter="url(#grain)" opacity="0.9" style="mix-blend-mode:multiply"/>
</svg>`;
}

/** Registration mark used across the samples as a quiet signature. */
function regMark(x, y, r = 22, c = INK) {
  return `<g stroke="${c}" stroke-width="2" fill="none">
<circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x}" cy="${y}" r="${r * 0.35}"/>
<path d="M${x - r * 1.5} ${y}H${x + r * 1.5}M${x} ${y - r * 1.5}V${y + r * 1.5}"/></g>`;
}

const W = 1600;
const H = 2000;

const posters = [
  {
    slug: "ornek-afis-izgara",
    title: { tr: "Izgara Üzerine", en: "On the Grid" },
    text: {
      tr: "Sekiz kolonlu bir ızgaranın kendisini afişe dönüştüren tipografik bir çalışma. Tek renk, tek yazı, tek jest.",
      en: "A typographic study that turns an eight-column grid into the poster itself. One colour, one face, one gesture.",
    },
    svg: () => {
      const cols = 8;
      const m = 100;
      const cw = (W - m * 2) / cols;
      let g = "";
      for (let i = 0; i <= cols; i++) g += `<line x1="${m + i * cw}" y1="${m}" x2="${m + i * cw}" y2="${H - m}" stroke="${INK}" stroke-opacity="0.18" stroke-width="2"/>`;
      for (let j = 0; j <= 12; j++) g += `<line x1="${m}" y1="${m + (j * (H - 2 * m)) / 12}" x2="${W - m}" y2="${m + (j * (H - 2 * m)) / 12}" stroke="${INK}" stroke-opacity="0.18" stroke-width="2"/>`;
      return `${g}
<rect x="${m}" y="${m + 3 * ((H - 2 * m) / 12)}" width="${cw * 5}" height="${(H - 2 * m) / 12 * 4}" fill="${SPOT}"/>
<text x="${m + 28}" y="${H - m - 40}" font-family="${SANS}" font-weight="700" font-size="300" letter-spacing="-14" fill="${INK}">Izgara</text>
<text x="${m}" y="${m + 62}" font-family="${SANS}" font-weight="500" font-size="40" fill="${INK}">Tipografi sergisi</text>
<text x="${W - m}" y="${m + 62}" text-anchor="end" font-family="${SANS}" font-weight="500" font-size="40" fill="${INK}">${YEAR}</text>
<text x="${m + 28}" y="${m + 3 * ((H - 2 * m) / 12) + 70}" font-family="${SANS}" font-weight="500" font-size="44" fill="${PAPER}">8 kolon · 12 satır</text>
${regMark(W - m - 30, H - m - 30)}`;
    },
  },
  {
    slug: "ornek-afis-daireler",
    title: { tr: "Eş Merkezli", en: "Concentric" },
    text: {
      tr: "Eş merkezli daireler ve bir siyah bant. Bir konser dizisi için tasarlanmış afiş örneği.",
      en: "Concentric circles and one black bar. A sample poster for a concert series.",
    },
    svg: () => {
      let c = "";
      for (let i = 1; i <= 9; i++) c += `<circle cx="${W / 2}" cy="${H * 0.42}" r="${i * 78}" fill="none" stroke="${i % 3 === 0 ? SPOT : INK}" stroke-width="${i % 3 === 0 ? 26 : 6}"/>`;
      return `${c}
<rect x="0" y="${H * 0.78}" width="${W}" height="${H * 0.22}" fill="${INK}"/>
<text x="100" y="${H * 0.78 + 200}" font-family="${SERIF}" font-size="200" fill="${PAPER}">Sessiz Seri</text>
<text x="100" y="${H * 0.78 + 300}" font-family="${SANS}" font-size="40" font-weight="500" fill="${PAPER}" opacity="0.8">Altı akşam · tek sahne · ${YEAR}</text>
<text x="100" y="150" font-family="${SANS}" font-size="40" font-weight="600" fill="${INK}">No. 02</text>
${regMark(W - 130, 130)}`;
    },
  },
  {
    slug: "ornek-afis-yedi",
    title: { tr: "Yedi", en: "Seven" },
    text: {
      tr: "Nokta ızgarasından büyüyen tek bir rakam. Baskıda nokta sıklığı kâğıdın dokusuyla birleşir.",
      en: "A single numeral growing out of a dot grid. In print, the dot frequency merges with the paper's grain.",
    },
    svg: () => {
      let d = "";
      const n = 22;
      const gap = (W - 200) / n;
      for (let i = 0; i <= n; i++)
        for (let j = 0; j <= Math.round(n * 1.25); j++) {
          const r = 4 + ((i * 7 + j * 3) % 5);
          d += `<circle cx="${100 + i * gap}" cy="${100 + j * gap}" r="${r}" fill="${INK}" fill-opacity="0.9"/>`;
        }
      return `${d}
<text x="${W / 2}" y="${H * 0.62}" text-anchor="middle" font-family="${SERIF}" font-size="1500" fill="${SPOT}">7</text>
<rect x="100" y="${H - 220}" width="${W - 200}" height="6" fill="${INK}"/>
<text x="100" y="${H - 130}" font-family="${SANS}" font-size="44" font-weight="600" fill="${INK}">Yedinci yıl</text>
<text x="${W - 100}" y="${H - 130}" text-anchor="end" font-family="${SANS}" font-size="44" font-weight="500" fill="${INK}">Atölye sergisi</text>`;
    },
  },
];

const book = {
  slug: "ornek-kitap-kagit",
  category: "editorial",
  title: { tr: "Kâğıt Üzerine", en: "On Paper" },
  text: {
    tr: "Bir deneme kitabı için kapak ve iç düzen örneği. Serif başlık, dar sütun, geniş kenar boşluğu.",
    en: "Cover and interior layout sample for a book of essays. Serif title, narrow measure, generous margins.",
  },
  w: 1500,
  h: 2100,
  svg: () => `
<rect x="0" y="0" width="1500" height="2100" fill="${PAPER}"/>
<rect x="0" y="0" width="120" height="2100" fill="${SPOT}"/>
<text x="220" y="560" font-family="${SERIF}" font-size="190" fill="${INK}">Kâğıt</text>
<text x="220" y="760" font-family="${SERIF}" font-size="190" fill="${INK}">Üzerine</text>
<text x="220" y="880" font-family="${SERIF}" font-style="italic" font-size="70" fill="${INK}" opacity="0.7">Denemeler</text>
<line x1="220" y1="1500" x2="1320" y2="1500" stroke="${INK}" stroke-width="3"/>
<text x="220" y="1590" font-family="${SANS}" font-size="40" font-weight="500" fill="${INK}">Elif Gezgin · tasarım</text>
<text x="220" y="1950" font-family="${SANS}" font-size="34" fill="${INK}" opacity="0.6">Örnek yayın · ${YEAR}</text>
${regMark(1320, 1950, 18)}`,
};

const label = {
  slug: "ornek-ambalaj-etiket",
  category: "packaging",
  title: { tr: "Atölye Etiketi", en: "Studio Label" },
  text: {
    tr: "Bir kâğıt kutusu için sarmalayan etiket. Ön yüzde mühür, yan yüzlerde ürün bilgisi.",
    en: "A wrap-around label for a paper box. A seal on the front, product information on the sides.",
  },
  w: 2000,
  h: 1400,
  svg: () => `
<rect x="0" y="0" width="2000" height="1400" fill="${PAPER}"/>
<rect x="0" y="0" width="2000" height="90" fill="${SPOT}"/>
<rect x="0" y="1310" width="2000" height="90" fill="${SPOT}"/>
<circle cx="1000" cy="640" r="330" fill="none" stroke="${INK}" stroke-width="10"/>
<circle cx="1000" cy="640" r="290" fill="none" stroke="${INK}" stroke-width="3"/>
<text x="1000" y="600" text-anchor="middle" font-family="${SERIF}" font-size="150" fill="${INK}">Atölye</text>
<text x="1000" y="720" text-anchor="middle" font-family="${SANS}" font-size="46" font-weight="600" letter-spacing="14" fill="${INK}">EL BASKISI</text>
<text x="140" y="1180" font-family="${SANS}" font-size="40" font-weight="500" fill="${INK}">250 g · %100 pamuk kâğıt</text>
<text x="1860" y="1180" text-anchor="end" font-family="${SANS}" font-size="40" font-weight="500" fill="${INK}">No. 04 / ${YEAR}</text>
<line x1="500" y1="0" x2="500" y2="1400" stroke="${INK}" stroke-opacity="0.25" stroke-dasharray="14 18" stroke-width="3"/>
<line x1="1500" y1="0" x2="1500" y2="1400" stroke="${INK}" stroke-opacity="0.25" stroke-dasharray="14 18" stroke-width="3"/>
${regMark(300, 640, 24)}${regMark(1700, 640, 24)}`,
};

const logo = {
  slug: "ornek-kimlik-eg",
  category: "identity",
  title: { tr: "EG Monogramı", en: "EG Monogram" },
  text: {
    tr: "İki harfin tek bir çizgide buluştuğu monogram; kartvizitte kör kabartma, afişte tek renk.",
    en: "A monogram where two letters meet in one stroke; blind-embossed on the card, single colour on the poster.",
  },
  w: 1600,
  h: 1600,
  svg: () => `
<rect width="1600" height="1600" fill="${PAPER}"/>
<g transform="translate(800 800)">
  <path d="M-330 -260 H90 M-330 -260 V300 H90 M-330 20 H10" fill="none" stroke="${SPOT}" stroke-width="86" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M330 -170 A250 250 0 1 0 330 190 V20 H150" fill="none" stroke="${INK}" stroke-width="86" stroke-linecap="square"/>
</g>
<text x="800" y="1420" text-anchor="middle" font-family="${SANS}" font-size="46" font-weight="600" letter-spacing="16" fill="${INK}">ELİF GEZGİN</text>`,
};

async function render(svg, out, w, h) {
  await sharp(Buffer.from(svg), { density: 96 }).resize(w, h).jpeg({ quality: 90, mozjpeg: true }).toFile(out);
}

async function writeWork(work, index) {
  const dir = join(worksDir, work.slug);
  mkdirSync(dir, { recursive: true });
  const w = work.w ?? W;
  const h = work.h ?? H;
  const svg = frame(w, h, work.svg());
  await render(svg, join(dir, "cover.jpg"), w, h);
  // two gallery images: a detail crop and a negative
  const cover = sharp(join(dir, "cover.jpg"));
  await cover
    .clone()
    .extract({ left: Math.round(w * 0.1), top: Math.round(h * 0.1), width: Math.round(w * 0.5), height: Math.round(h * 0.5) })
    .resize(1600)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(join(dir, "01.jpg"));
  await cover.clone().negate({ alpha: false }).jpeg({ quality: 88, mozjpeg: true }).toFile(join(dir, "02.jpg"));
  const meta = {
    title: work.title,
    category: work.category ?? "poster",
    year: YEAR,
    role: { tr: "Tasarım", en: "Design" },
    tools: work.category === "identity" ? ["Illustrator"] : work.category === "editorial" ? ["InDesign", "Illustrator"] : ["Illustrator", "Photoshop"],
    text: work.text,
    sample: true,
    order: index + 1,
    cover: "cover.jpg",
    gallery: ["01.jpg", "02.jpg"],
  };
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  console.log("sample:", work.slug);
}

const all = [...posters, book, label, logo];
for (let i = 0; i < all.length; i++) await writeWork(all[i], i);
console.log(`samples: ${all.length} generated with spot ${SPOT}`);
