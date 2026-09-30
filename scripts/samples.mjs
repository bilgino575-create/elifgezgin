/**
 * Procedural sample works.
 *
 * Until Elif's real work arrives, six pieces are rendered from SVG with sharp:
 * three Swiss-style posters, a book cover, a packaging label and a logo mark.
 * They are designed like real studio work (overprint, halftone gradients,
 * type at scale, printer's marks) so the portfolio reads as a designer's
 * from the first second. Each is written to content/works/<slug>/ with a
 * meta.json that carries `"sample": true`, so the UI marks it "Örnek".
 *
 * Runs only when content/works has no work folders at all, so deleting the
 * samples (README_ELIF.md) is permanent.
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

/** shared defs: paper grain, halftone patterns, a soft vignette */
function defs(w, h) {
  return `
<filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.07 0"/>
</filter>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <circle cx="11" cy="11" r="4.2" fill="${INK}"/>
</pattern>
<pattern id="dotsFine" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <circle cx="7" cy="7" r="1.8" fill="${INK}"/>
</pattern>
<pattern id="lines" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
  <rect width="16" height="6" fill="${INK}"/>
</pattern>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${INK}" stop-opacity="1"/>
  <stop offset="1" stop-color="${INK}" stop-opacity="0"/>
</linearGradient>
<radialGradient id="glow" cx="0.5" cy="0.45" r="0.6">
  <stop offset="0" stop-color="${SPOT}" stop-opacity="0.95"/>
  <stop offset="1" stop-color="${SPOT}" stop-opacity="0.35"/>
</radialGradient>
<mask id="halfFade"><rect width="${w}" height="${h}" fill="url(#fade)"/></mask>`;
}

function frame(w, h, body, bg = PAPER) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>${defs(w, h)}</defs>
<rect width="${w}" height="${h}" fill="${bg}"/>
${body}
<rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.9" style="mix-blend-mode:multiply"/>
</svg>`;
}

/** Registration mark used across the samples as a quiet signature. */
function regMark(x, y, r = 22, c = INK) {
  return `<g stroke="${c}" stroke-width="2" fill="none">
<circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x}" cy="${y}" r="${r * 0.35}"/>
<path d="M${x - r * 1.5} ${y}H${x + r * 1.5}M${x} ${y - r * 1.5}V${y + r * 1.5}"/></g>`;
}

/** Crop marks in the four corners. */
function cropMarks(w, h, m = 60, len = 40, c = INK) {
  const g = `stroke="${c}" stroke-width="2"`;
  return `<g ${g}>
<path d="M${m - len - 8} ${m}H${m - 8}M${m} ${m - len - 8}V${m - 8}"/>
<path d="M${w - m + 8} ${m}H${w - m + len + 8}M${w - m} ${m - len - 8}V${m - 8}"/>
<path d="M${m - len - 8} ${h - m}H${m - 8}M${m} ${h - m + 8}V${h - m + len + 8}"/>
<path d="M${w - m + 8} ${h - m}H${w - m + len + 8}M${w - m} ${h - m + 8}V${h - m + len + 8}"/></g>`;
}

const W = 1600;
const H = 2000;

const posters = [
  {
    slug: "ornek-afis-izgara",
    title: { tr: "Izgara Üzerine", en: "On the Grid" },
    text: {
      tr: "Bir tipografi sergisi için afiş: sekiz kolonlu ızgara, sayfayı dolduran tek bir sözcük ve üst baskıyla çakışan iki mürekkep.",
      en: "Poster for a typography exhibition: an eight-column grid, one word filling the sheet and two inks meeting in overprint.",
    },
    svg: () => {
      const cols = 8;
      const m = 100;
      const cw = (W - m * 2) / cols;
      let g = "";
      for (let i = 0; i <= cols; i++) g += `<line x1="${m + i * cw}" y1="${m}" x2="${m + i * cw}" y2="${H - m}" stroke="${INK}" stroke-opacity="0.16" stroke-width="2"/>`;
      for (let j = 0; j <= 12; j++) g += `<line x1="${m}" y1="${m + (j * (H - 2 * m)) / 12}" x2="${W - m}" y2="${m + (j * (H - 2 * m)) / 12}" stroke="${INK}" stroke-opacity="0.16" stroke-width="2"/>`;
      return `${g}
<rect x="${m}" y="${m + 2 * ((H - 2 * m) / 12)}" width="${cw * 5}" height="${((H - 2 * m) / 12) * 5}" fill="${SPOT}"/>
<rect x="${m + cw * 3}" y="${m + 4 * ((H - 2 * m) / 12)}" width="${cw * 5}" height="${((H - 2 * m) / 12) * 5}" fill="${INK}" style="mix-blend-mode:multiply" opacity="0.92"/>
<rect x="${m + cw * 3}" y="${m + 4 * ((H - 2 * m) / 12)}" width="${cw * 5}" height="${((H - 2 * m) / 12) * 5}" fill="url(#dotsFine)" opacity="0.35" mask="url(#halfFade)"/>
<text x="${m - 6}" y="${H - m - 30}" font-family="${SANS}" font-weight="700" font-size="330" letter-spacing="-18" fill="${INK}">Izgara</text>
<text x="${m}" y="${m + 62}" font-family="${SANS}" font-weight="600" font-size="38" letter-spacing="2" fill="${INK}">TİPOGRAFİ SERGİSİ</text>
<text x="${W - m}" y="${m + 62}" text-anchor="end" font-family="${SANS}" font-weight="500" font-size="38" fill="${INK}">12.03 — 04.05.${YEAR}</text>
<text x="${m + 28}" y="${m + 2 * ((H - 2 * m) / 12) + 70}" font-family="${SANS}" font-weight="500" font-size="40" fill="${PAPER}">8 kolon · 12 satır · 2 mürekkep</text>
<g transform="translate(${W - m - 60} ${H * 0.5}) rotate(-90)"><text font-family="${SANS}" font-size="30" font-weight="500" letter-spacing="6" fill="${INK}">ÜST BASKI · PANTONE + SİYAH</text></g>
${cropMarks(W, H)}
${regMark(W - m - 30, m + 130)}`;
    },
  },
  {
    slug: "ornek-afis-daireler",
    title: { tr: "Sessiz Seri", en: "Quiet Series" },
    text: {
      tr: "Altı akşamlık bir konser dizisi için afiş. Eş merkezli halkalar ses dalgasıdır; siyah bant sahnenin kendisi.",
      en: "Poster for a six-evening concert series. The concentric rings are the sound; the black bar is the stage.",
    },
    svg: () => {
      let c = "";
      for (let i = 1; i <= 11; i++) {
        const r = i * 70;
        const spot = i % 3 === 0;
        c += `<circle cx="${W * 0.55}" cy="${H * 0.4}" r="${r}" fill="none" stroke="${spot ? SPOT : INK}" stroke-width="${spot ? 30 : 5 + (11 - i)}" opacity="${spot ? 1 : 0.9}"/>`;
      }
      return `
<rect x="0" y="0" width="${W}" height="${H * 0.78}" fill="url(#dotsFine)" opacity="0.08"/>
${c}
<circle cx="${W * 0.55}" cy="${H * 0.4}" r="820" fill="url(#lines)" opacity="0.12" style="mix-blend-mode:multiply"/>
<rect x="0" y="${H * 0.78}" width="${W}" height="${H * 0.22}" fill="${INK}"/>
<text x="100" y="${H * 0.78 + 190}" font-family="${SERIF}" font-size="210" fill="${PAPER}">Sessiz Seri</text>
<text x="100" y="${H * 0.78 + 290}" font-family="${SANS}" font-size="38" font-weight="500" fill="${PAPER}" opacity="0.8">Altı akşam · tek sahne · ${YEAR}</text>
<text x="${W - 100}" y="${H * 0.78 + 290}" text-anchor="end" font-family="${SANS}" font-size="38" font-weight="500" fill="${SPOT}">20:30</text>
<text x="100" y="150" font-family="${SANS}" font-size="40" font-weight="600" fill="${INK}">No. 02</text>
<text x="100" y="205" font-family="${SANS}" font-size="30" font-weight="500" fill="${INK}" opacity="0.6">konser dizisi</text>
${regMark(W - 130, 130)}
${cropMarks(W, H)}`;
    },
  },
  {
    slug: "ornek-afis-yedi",
    title: { tr: "Yedi", en: "Seven" },
    text: {
      tr: "Atölyenin yedinci yılı için afiş: halftone bir gradyanın içinden büyüyen tek rakam, kâğıdın dokusuyla birleşen nokta sıklığı.",
      en: "Poster for the studio's seventh year: a single numeral growing out of a halftone gradient whose dots merge with the paper's grain.",
    },
    svg: () => {
      let d = "";
      const n = 24;
      const gap = (W - 200) / n;
      for (let i = 0; i <= n; i++)
        for (let j = 0; j <= Math.round(n * 1.2); j++) {
          const y = 100 + j * gap;
          const t = y / H;
          const r = 2 + Math.pow(t, 1.6) * 16;
          d += `<circle cx="${100 + i * gap}" cy="${y}" r="${r.toFixed(1)}" fill="${INK}"/>`;
        }
      return `${d}
<text x="${W / 2}" y="${H * 0.66}" text-anchor="middle" font-family="${SERIF}" font-size="1600" fill="${SPOT}" style="mix-blend-mode:multiply">7</text>
<text x="${W / 2 + 26}" y="${H * 0.66 + 26}" text-anchor="middle" font-family="${SERIF}" font-size="1600" fill="none" stroke="${PAPER}" stroke-width="6" opacity="0.9">7</text>
<rect x="100" y="${H - 230}" width="${W - 200}" height="6" fill="${PAPER}"/>
<text x="100" y="${H - 140}" font-family="${SANS}" font-size="44" font-weight="600" fill="${PAPER}">Yedinci yıl</text>
<text x="${W - 100}" y="${H - 140}" text-anchor="end" font-family="${SANS}" font-size="44" font-weight="500" fill="${PAPER}">Atölye sergisi · ${YEAR}</text>
${cropMarks(W, H, 60, 40, PAPER)}`;
    },
  },
];

const book = {
  slug: "ornek-kitap-kagit",
  category: "editorial",
  title: { tr: "Kâğıt Üzerine", en: "On Paper" },
  text: {
    tr: "Bir deneme kitabı için kapak ve iç düzen. Serif başlık, dar sütun, geniş kenar boşluğu; sırtta tek renk, kapakta kör kabartma.",
    en: "Cover and interior for a book of essays. Serif title, narrow measure, generous margins; one colour on the spine, a blind emboss on the cover.",
  },
  w: 1500,
  h: 2100,
  svg: () => `
<rect x="0" y="0" width="130" height="2100" fill="${SPOT}"/>
<rect x="130" y="0" width="14" height="2100" fill="${INK}" opacity="0.12"/>
<circle cx="1000" cy="1180" r="360" fill="url(#dots)" opacity="0.1"/>
<circle cx="1000" cy="1180" r="360" fill="none" stroke="${INK}" stroke-width="3" opacity="0.5"/>
<text x="230" y="520" font-family="${SERIF}" font-size="200" fill="${INK}">Kâğıt</text>
<text x="230" y="720" font-family="${SERIF}" font-size="200" fill="${INK}">Üzerine</text>
<text x="230" y="840" font-family="${SERIF}" font-style="italic" font-size="72" fill="${INK}" opacity="0.7">Denemeler</text>
<text x="230" y="940" font-family="${SANS}" font-size="30" font-weight="500" letter-spacing="6" fill="${SPOT}">İKİNCİ BASKI</text>
<line x1="230" y1="1560" x2="1320" y2="1560" stroke="${INK}" stroke-width="3"/>
<text x="230" y="1650" font-family="${SANS}" font-size="40" font-weight="500" fill="${INK}">Elif Gezgin · tasarım</text>
<text x="230" y="1710" font-family="${SANS}" font-size="30" fill="${INK}" opacity="0.55">Kapak: 300 g kabartma karton · İç: 90 g kitap kâğıdı</text>
<text x="230" y="1980" font-family="${SANS}" font-size="32" fill="${INK}" opacity="0.6">Örnek yayın · ${YEAR}</text>
${regMark(1320, 1980, 18)}`,
};

const label = {
  slug: "ornek-ambalaj-etiket",
  category: "packaging",
  title: { tr: "Atölye Etiketi", en: "Studio Label" },
  text: {
    tr: "Bir kâğıt kutusu için sarmalayan etiket. Ön yüzde mühür, yan yüzlerde ürün bilgisi; kesim çizgileri ve kırım payı bırakılmış.",
    en: "A wrap-around label for a paper box. A seal on the front, product information on the sides; die-cut and fold allowances left in.",
  },
  w: 2000,
  h: 1400,
  svg: () => `
<rect x="0" y="0" width="2000" height="1400" fill="${SPOT}"/>
<rect x="60" y="60" width="1880" height="1280" fill="${PAPER}"/>
<rect x="500" y="60" width="1000" height="1280" fill="url(#dotsFine)" opacity="0.06"/>
<circle cx="1000" cy="640" r="340" fill="none" stroke="${INK}" stroke-width="10"/>
<circle cx="1000" cy="640" r="300" fill="none" stroke="${INK}" stroke-width="3"/>
<circle cx="1000" cy="640" r="270" fill="${SPOT}" opacity="0.08"/>
<text x="1000" y="600" text-anchor="middle" font-family="${SERIF}" font-size="160" fill="${INK}">Atölye</text>
<text x="1000" y="720" text-anchor="middle" font-family="${SANS}" font-size="44" font-weight="600" letter-spacing="14" fill="${INK}">EL BASKISI</text>
<text x="1000" y="790" text-anchor="middle" font-family="${SANS}" font-size="30" font-weight="500" letter-spacing="4" fill="${SPOT}">EST. ${YEAR}</text>
<text x="140" y="1180" font-family="${SANS}" font-size="38" font-weight="500" fill="${INK}">250 g · %100 pamuk kâğıt</text>
<text x="140" y="1240" font-family="${SANS}" font-size="28" fill="${INK}" opacity="0.6">Elle sayılmış 50 yaprak</text>
<text x="1860" y="1180" text-anchor="end" font-family="${SANS}" font-size="38" font-weight="500" fill="${INK}">No. 04 / ${YEAR}</text>
<text x="1860" y="1240" text-anchor="end" font-family="${SANS}" font-size="28" fill="${INK}" opacity="0.6">Parti 07 · 1/50</text>
<line x1="500" y1="60" x2="500" y2="1340" stroke="${INK}" stroke-opacity="0.35" stroke-dasharray="14 18" stroke-width="3"/>
<line x1="1500" y1="60" x2="1500" y2="1340" stroke="${INK}" stroke-opacity="0.35" stroke-dasharray="14 18" stroke-width="3"/>
<text x="280" y="700" text-anchor="middle" font-family="${SANS}" font-size="26" font-weight="500" letter-spacing="8" fill="${INK}" opacity="0.5" transform="rotate(-90 280 700)">KIRIM PAYI</text>
${regMark(300, 400, 24)}${regMark(1700, 400, 24)}`,
};

const logo = {
  slug: "ornek-kimlik-eg",
  category: "identity",
  title: { tr: "EG Monogramı", en: "EG Monogram" },
  text: {
    tr: "İki harfin tek bir çizgide buluştuğu monogram; kartvizitte kör kabartma, afişte tek renk, ekranda hareketli.",
    en: "A monogram where two letters meet in one stroke; blind-embossed on the card, single colour on the poster, animated on screen.",
  },
  w: 1600,
  h: 1600,
  svg: () => `
<rect width="1600" height="1600" fill="${PAPER}"/>
<circle cx="800" cy="760" r="620" fill="url(#dotsFine)" opacity="0.05"/>
<g transform="translate(800 760)">
  <path d="M-330 -260 H90 M-330 -260 V300 H90 M-330 20 H10" fill="none" stroke="${SPOT}" stroke-width="86" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M330 -170 A250 250 0 1 0 330 190 V20 H150" fill="none" stroke="${INK}" stroke-width="86" stroke-linecap="square"/>
</g>
<text x="800" y="1400" text-anchor="middle" font-family="${SANS}" font-size="44" font-weight="600" letter-spacing="16" fill="${INK}">ELİF GEZGİN</text>
<text x="800" y="1460" text-anchor="middle" font-family="${SANS}" font-size="26" font-weight="500" letter-spacing="8" fill="${INK}" opacity="0.55">GRAFİK TASARIMCI · ${YEAR}</text>
${cropMarks(1600, 1600, 80, 36)}`,
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
  // two gallery images: a detail crop and the negative proof
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
    role: { tr: "Konsept ve tasarım", en: "Concept and design" },
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
