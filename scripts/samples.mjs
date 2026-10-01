/**
 * Örnek işler — sample work, rendered from SVG with sharp.
 *
 * Until Elif's real work arrives, six pieces are generated so the journey
 * has something physical at every stop: a poster, a typographic identity,
 * a brand identity system, a generative digital piece, a magazine spread
 * and a poster series. They are designed like real studio work in the
 * site's colour universe, and every one carries `"sample": true`, which the
 * site shows as "örnek proje / sample project". No clients, no awards.
 *
 * Runs only when content/works has no work folders (so deleting the samples
 * is permanent); `--force` regenerates them.
 *
 *   node scripts/samples.mjs [--force]
 */
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
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

const INK = "#07060f";
const OFF = "#f7f6f2";
const CREAM = "#f3eee3";
const ELECTRIC = "#1f3bff";
const CYAN = "#19e3ff";
const PINK = "#ff2e88";
const MAGENTA = "#e400ff";
const LIME = "#c8ff00";
const ORANGE = "#ff5a1f";
const YELLOW = "#ffd400";
const VIOLET = "#6a2cff";
const PURPLE = "#2a0f5e";
const SANS = "Archivo";
const SERIF = "'Instrument Serif'";
const YEAR = new Date().getFullYear();

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** Archivo text: weight 100–900, width as a font-stretch keyword (fontconfig maps the variable axis) */
function T(x, y, text, { size = 100, weight = 900, width = "normal", fill = INK, anchor = "start", italic = false, serif = false, ls = 0, opacity = 1 } = {}) {
  const fam = serif ? SERIF : SANS;
  return `<text x="${x}" y="${y}" font-family="${fam}" font-size="${size}" font-weight="${weight}" font-stretch="${width}"${italic ? ' font-style="italic"' : ""} fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}" opacity="${opacity}">${esc(text)}</text>`;
}
const grain = (id = "grain", a = 0.08) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 ${a} 0"/></filter>`;
const grainRect = (w, h, id = "grain") => `<rect width="${w}" height="${h}" filter="url(#${id})" style="mix-blend-mode:overlay"/>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
/** editorial meta row: small caps, tracked */
const meta = (x, y, text, fill, size = 26, anchor = "start") => T(x, y, text.toLocaleUpperCase("tr-TR"), { size, weight: 600, fill, ls: size * 0.14, anchor });

async function write(slug, file, markup) {
  const dir = join(worksDir, slug);
  mkdirSync(dir, { recursive: true });
  await sharp(Buffer.from(markup)).png({ compressionLevel: 8 }).toFile(join(dir, file));
}

// ─────────────────────────────────────────────────────────────────────────────
// 01  SESSİZ ŞEHİR — a poster for a sound-art exhibition (floating poster, stop 04)
// acid green sheet, one condensed black title stacked, a black disc with a thin ring, a column of meta
async function sessizSehir() {
  const W = 1600;
  const H = 2400;
  const title = (fill, dx = 0, dy = 0, opacity = 1) =>
    T(96 + dx, 760 + dy, "SESSİZ", { size: 520, weight: 900, width: "condensed", fill, opacity }) + T(96 + dx, 1230 + dy, "ŞEHİR", { size: 520, weight: 900, width: "condensed", fill, opacity });
  const disc = (bg, fg, dot) => `<circle cx="1180" cy="1690" r="330" fill="${bg}"/><circle cx="1180" cy="1690" r="392" fill="none" stroke="${bg}" stroke-width="6"/><circle cx="1180" cy="1690" r="118" fill="${fg}"/><circle cx="1180" cy="1690" r="40" fill="${dot}"/>`;
  const col = (c) => meta(96, 1500, "Ses sanatı üzerine bir sergi", c) + meta(96, 1548, "12.09 — 04.10", c) + meta(96, 1596, "Giriş ücretsiz", c) + T(96, 1700, "Şehrin sesi kesilince geriye ne kalır?", { size: 40, serif: true, italic: true, fill: c }) + T(96, 1752, "Dokuz sanatçı, dokuz oda, bir sessizlik.", { size: 40, serif: true, italic: true, fill: c });
  const rule = (c) => `<rect x="96" y="2210" width="1408" height="4" fill="${c}"/>` + meta(96, 2290, "Afiş 01 · 70 × 100 cm · iki renk serigrafi", c, 24) + meta(1504, 2290, `Örnek çalışma · ${YEAR}`, c, 24, "end");
  const grid = (c) => Array.from({ length: 9 }, (_, i) => `<line x1="${96 + i * 176}" y1="96" x2="${96 + i * 176}" y2="2304" stroke="${c}" stroke-opacity="0.12" stroke-width="2"/>`).join("");
  const cover = svg(W, H, `<defs>${grain()}</defs><rect width="${W}" height="${H}" fill="${LIME}"/>${grid(INK)}${title(PINK, 14, 14)}${title(INK)}${disc(INK, LIME, PINK)}${col(INK)}${rule(INK)}${grainRect(W, H)}`);
  await write("ornek-afis-sessiz-sehir", "cover.png", cover);
  const v2 = svg(W, H, `<defs>${grain("g2", 0.1)}</defs><rect width="${W}" height="${H}" fill="${INK}"/>${grid(LIME)}${title(LIME)}${disc(LIME, INK, PINK)}${col(LIME)}${rule(LIME)}${grainRect(W, H, "g2")}`);
  await write("ornek-afis-sessiz-sehir", "01.png", v2);
  const v3 = svg(W, H, `<defs>${grain("g3", 0.08)}</defs><rect width="${W}" height="${H}" fill="${LIME}"/><circle cx="800" cy="1120" r="640" fill="${INK}"/><circle cx="800" cy="1120" r="700" fill="none" stroke="${INK}" stroke-width="6"/><circle cx="800" cy="1120" r="230" fill="${LIME}"/><circle cx="800" cy="1120" r="76" fill="${PINK}"/>${T(96, 2150, "SESSİZ ŞEHİR", { size: 120, weight: 900, width: "condensed", fill: INK })}${meta(96, 2290, "Afiş 02 · 70 × 100 cm", INK, 24)}${grainRect(W, H, "g3")}`);
  await write("ornek-afis-sessiz-sehir", "02.png", v3);
  return {
    title: { tr: "Sessiz Şehir", en: "Silent City" },
    category: "poster",
    year: YEAR,
    role: { tr: "Konsept ve tasarım", en: "Concept and design" },
    tools: ["Illustrator", "InDesign"],
    text: {
      tr: "Bir ses sanatı sergisi için afiş sistemi: asit yeşili bir yaprak, yoğunlaştırılmış tek bir başlık ve şehrin susan hoparlörü olarak siyah bir disk. İki renk serigrafi; sistem iki afişe ve bir davetiyeye uzanıyor.",
      en: "A poster system for a sound-art exhibition: an acid-green sheet, one condensed title and a black disc as the city's silenced speaker. Two-colour screen print; the system extends to two posters and an invitation.",
    },
    presentation: "poster",
    stop: 4,
    colors: [LIME, INK, PINK],
    process: [
      { title: { tr: "Fikir", en: "Idea" }, text: { tr: "Sessizlik bir boşluk değil, bir disk: bir hoparlörün ses çıkarmayan yüzü.", en: "Silence is not a gap but a disc: the mute face of a speaker." } },
      { title: { tr: "Yazı", en: "Type" }, text: { tr: "Archivo'nun en dar, en ağır kesimi; iki satır, yaprağın yarısını doldurur.", en: "Archivo at its narrowest and heaviest; two lines fill half the sheet." } },
      { title: { tr: "Baskı", en: "Print" }, text: { tr: "İki renk serigrafi: siyah ve pembe, asit yeşili kâğıt üstünde.", en: "Two-colour screen print: black and pink on acid-green stock." } },
    ],
    sample: true,
    order: 1,
    cover: "cover.png",
    gallery: ["01.png", "02.png"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 02  SES — a typographic identity (chrome typography, stop 02)
// cream, cobalt expanded "SES" with an orange echo, a specimen of Archivo's widths as the system
async function ses() {
  const W = 2000;
  const H = 1400;
  const specimen = ["ultra-condensed", "extra-condensed", "condensed", "semi-condensed", "normal", "semi-expanded", "expanded"]
    .map((w, i) => T(1500, 300 + i * 100, "sessizlik", { size: 68, weight: 700, width: w, fill: INK }))
    .join("");
  const cover = svg(W, H, `<defs>${grain()}</defs><rect width="${W}" height="${H}" fill="${CREAM}"/>${T(130, 790, "SES", { size: 560, weight: 900, width: "expanded", fill: ORANGE })}${T(120, 780, "SES", { size: 560, weight: 900, width: "expanded", fill: ELECTRIC })}${specimen}${meta(1500, 180, "Yedi genişlik · tek aile", INK, 24)}${meta(120, 1040, "Tipografik kimlik", INK, 28)}${T(120, 1130, "Bir sesin genişliği", { size: 64, serif: true, italic: true, fill: INK })}${T(120, 1200, "yazının genişliğidir.", { size: 64, serif: true, italic: true, fill: INK })}<rect x="120" y="1290" width="1760" height="4" fill="${INK}"/>${meta(120, 1360, `Örnek çalışma · ${YEAR}`, INK, 24)}${grainRect(W, H)}`);
  await write("ornek-tipografi-ses", "cover.png", cover);
  const rows = ["ultra-condensed", "condensed", "normal", "semi-expanded", "expanded", "expanded"].map((w, i) => T(96, 460 + i * 320, "SES", { size: 360, weight: 900, width: w, fill: i % 2 ? ELECTRIC : ORANGE })).join("");
  const poster = svg(1600, 2400, `<defs>${grain("g2")}</defs><rect width="1600" height="2400" fill="${CREAM}"/>${rows}${meta(96, 2290, "Sesin genişlikleri · 70 × 100 cm", INK, 24)}${grainRect(1600, 2400, "g2")}`);
  await write("ornek-tipografi-ses", "01.png", poster);
  const sheet = svg(2000, 1400, `<defs>${grain("g3", 0.06)}</defs><rect width="2000" height="1400" fill="${ELECTRIC}"/>${T(120, 420, "AaĞğŞşİıÇçÖöÜü", { size: 220, weight: 900, width: "condensed", fill: CREAM })}${T(120, 700, "0123456789 &?!", { size: 220, weight: 500, width: "expanded", fill: ORANGE })}${T(120, 980, "SES SESSİZLİK SESLİ", { size: 150, weight: 300, width: "normal", fill: CREAM })}${meta(120, 1300, "Archivo · 62–125 genişlik · 100–900 ağırlık", CREAM, 26)}${grainRect(2000, 1400, "g3")}`);
  await write("ornek-tipografi-ses", "02.png", sheet);
  return {
    title: { tr: "SES", en: "SES" },
    category: "typography",
    year: YEAR,
    role: { tr: "Tipografik kimlik", en: "Typographic identity" },
    tools: ["Glyphs", "Illustrator", "After Effects"],
    text: {
      tr: "Bir ses stüdyosu için tipografik kimlik: tek bir kelime, yedi genişlik. Logo sabit değil; kelime sesin yüksekliğine göre daralır ve genişler. Kimlik krom harflerle uzayda yaşıyor.",
      en: "A typographic identity for a sound studio: one word, seven widths. The logo is not fixed; the word narrows and widens with the volume. The identity lives in space as chrome letters.",
    },
    presentation: "chrome-type",
    stop: 2,
    colors: [ELECTRIC, ORANGE, CREAM],
    process: [
      { title: { tr: "Sistem", en: "System" }, text: { tr: "Değişken bir yazı ailesinin genişlik ekseni logonun kendisi oldu.", en: "The width axis of a variable family became the logo itself." } },
      { title: { tr: "Hareket", en: "Motion" }, text: { tr: "Kelime sese tepki verir: sessizlikte en dar, çığlıkta en geniş.", en: "The word responds to sound: narrowest in silence, widest in a scream." } },
      { title: { tr: "Uzay", en: "Space" }, text: { tr: "Krom harfler ortamın rengini yansıtır; kimlik bulunduğu yere uyar.", en: "Chrome letters reflect the room; the identity adapts to where it stands." } },
    ],
    sample: true,
    order: 2,
    cover: "cover.png",
    gallery: ["01.png", "02.png"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 03  KÜP — a brand identity system (glass cube, stop 03)
// deep purple, a geometric cube mark, colour chips, a type lockup, a card and a pattern
function cubeMark(x, y, s, a, b, c) {
  const h = s * 0.5;
  const top = `${x},${y - h} ${x + s * 0.866},${y - h * 0.5} ${x},${y} ${x - s * 0.866},${y - h * 0.5}`;
  const left = `${x - s * 0.866},${y - h * 0.5} ${x},${y} ${x},${y + s} ${x - s * 0.866},${y + h}`;
  const right = `${x},${y} ${x + s * 0.866},${y - h * 0.5} ${x + s * 0.866},${y + h} ${x},${y + s}`;
  return `<polygon points="${top}" fill="${a}"/><polygon points="${left}" fill="${b}"/><polygon points="${right}" fill="${c}"/>`;
}
async function kup() {
  const W = 2000;
  const H = 2000;
  const chips = [MAGENTA, CYAN, PINK, VIOLET, OFF].map((c, i) => `<rect x="${1180 + i * 150}" y="1180" width="130" height="190" fill="${c}"/>` + meta(1180 + i * 150, 1410, c.replace("#", ""), OFF, 20)).join("");
  const pattern = Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, cI) => cubeMark(1240 + cI * 120 + (r % 2) * 60, 1560 + r * 70, 56, MAGENTA, CYAN, PINK)).join("")).join("");
  const card = `<rect x="120" y="1180" width="860" height="520" rx="12" fill="${OFF}"/>${cubeMark(220, 1300, 70, MAGENTA, CYAN, PINK)}${T(320, 1330, "KÜP", { size: 86, weight: 900, width: "expanded", fill: PURPLE })}${meta(170, 1560, "Seramik atölyesi", PURPLE, 22)}${meta(170, 1600, "kup.studio · örnek", PURPLE, 22)}${meta(170, 1640, "Kimlik sistemi · kartvizit 85 × 55", PURPLE, 22)}`;
  const cover = svg(W, H, `<defs>${grain("g", 0.06)}</defs><rect width="${W}" height="${H}" fill="${PURPLE}"/>${cubeMark(560, 480, 300, MAGENTA, CYAN, PINK)}${T(120, 1040, "KÜP", { size: 420, weight: 900, width: "expanded", fill: OFF })}${meta(120, 1110, "Marka kimliği sistemi", OFF, 28)}${meta(1180, 1130, "Renkler", OFF, 24)}${chips}${meta(1180, 1520, "Desen", OFF, 24)}<rect x="1180" y="1540" width="700" height="360" fill="${PURPLE}" stroke="${OFF}" stroke-opacity="0.35" stroke-width="2"/><clipPath id="pat"><rect x="1180" y="1540" width="700" height="360"/></clipPath><g clip-path="url(#pat)">${pattern}</g>${card}${meta(120, 1960, `Örnek çalışma · ${YEAR}`, OFF, 22)}${grainRect(W, H, "g")}`);
  await write("ornek-kimlik-kup", "cover.png", cover);
  const logos = svg(2000, 1400, `<defs>${grain("g2", 0.06)}</defs><rect width="2000" height="1400" fill="${OFF}"/>${cubeMark(400, 560, 260, PURPLE, MAGENTA, CYAN)}${cubeMark(1000, 560, 260, PURPLE, PURPLE, PURPLE)}${cubeMark(1600, 560, 260, MAGENTA, CYAN, PINK)}${T(220, 1060, "KÜP", { size: 200, weight: 900, width: "expanded", fill: PURPLE })}${T(820, 1060, "KÜP", { size: 200, weight: 900, width: "condensed", fill: PURPLE })}${T(1340, 1060, "küp", { size: 200, weight: 300, width: "normal", fill: PURPLE })}${meta(220, 1250, "Üç kullanım: renkli · tek renk · dar", PURPLE, 24)}${grainRect(2000, 1400, "g2")}`);
  await write("ornek-kimlik-kup", "01.png", logos);
  const pat2 = Array.from({ length: 14 }, (_, r) => Array.from({ length: 14 }, (_, cI) => cubeMark(cI * 160 + (r % 2) * 80, 60 + r * 108, 86, MAGENTA, CYAN, PINK)).join("")).join("");
  const patternSheet = svg(2000, 1400, `<defs>${grain("g3", 0.06)}</defs><rect width="2000" height="1400" fill="${PURPLE}"/>${pat2}${grainRect(2000, 1400, "g3")}`);
  await write("ornek-kimlik-kup", "02.png", patternSheet);
  return {
    title: { tr: "KÜP", en: "KÜP" },
    category: "identity",
    year: YEAR,
    role: { tr: "Marka kimliği", en: "Brand identity" },
    tools: ["Illustrator", "Figma", "InDesign"],
    text: {
      tr: "Bir seramik atölyesi için kimlik sistemi: üç eşkenar dörtgenden kurulu bir küp işareti, mor üstünde magenta-cyan-pembe üçlüsü, geniş bir kelime markası ve işaretin kendisinden türeyen bir desen. Sistem bir cam küpün içinde sergileniyor.",
      en: "An identity system for a ceramics studio: a cube mark built from three rhombi, a magenta–cyan–pink trio on deep purple, an expanded wordmark and a pattern grown from the mark itself. The system is shown inside a glass cube.",
    },
    presentation: "glass-cube",
    stop: 3,
    colors: [PURPLE, MAGENTA, CYAN],
    process: [
      { title: { tr: "İşaret", en: "Mark" }, text: { tr: "Üç yüzlü küp: hem bir kil kalıbı hem bir harf kutusu.", en: "A three-faced cube: a clay mould and a letter box at once." } },
      { title: { tr: "Renk", en: "Colour" }, text: { tr: "Mor zemin; magenta, cyan ve pembe üç yüzün ışığı.", en: "A purple ground; magenta, cyan and pink as the light on three faces." } },
      { title: { tr: "Sistem", en: "System" }, text: { tr: "İşaret bir desene, kelime markası üç genişliğe açılır.", en: "The mark opens into a pattern, the wordmark into three widths." } },
    ],
    sample: true,
    order: 3,
    cover: "cover.png",
    gallery: ["01.png", "02.png"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 04  RENK DALGASI — a generative digital piece (projection on a sculpture, stop 05)
function waveBands(W, H, phase, colors) {
  const bands = [];
  const n = 34;
  for (let i = 0; i < n; i++) {
    const y0 = (i / n) * H;
    const amp = 60 + 50 * Math.sin(i * 0.4 + phase);
    const freq = 0.0028 + 0.0008 * Math.sin(i * 0.9 + phase * 0.7);
    let d = `M 0 ${y0}`;
    for (let x = 0; x <= W; x += 20) d += ` L ${x} ${(y0 + amp * Math.sin(x * freq + i * 0.35 + phase)).toFixed(1)}`;
    d += ` L ${W} ${H} L 0 ${H} Z`;
    bands.push(`<path d="${d}" fill="${colors[i % colors.length]}" opacity="${0.55 + 0.45 * ((i % 3) / 2)}"/>`);
  }
  return bands.join("");
}
async function renkDalgasi() {
  const W = 2000;
  const H = 2000;
  const make = (phase, id) =>
    svg(W, H, `<defs>${grain(id, 0.12)}</defs><rect width="${W}" height="${H}" fill="${OFF}"/>${waveBands(W, H, phase, [CYAN, PINK, VIOLET, OFF])}${T(96, 1900, "RENK DALGASI", { size: 90, weight: 900, width: "condensed", fill: OFF })}${meta(96, 1950, `üretken seri · ${String(Math.round(phase * 100)).padStart(3, "0")} · örnek`, OFF, 22)}${grainRect(W, H, id)}`);
  await write("ornek-dijital-renk-dalgasi", "cover.png", make(0.6, "g1"));
  await write("ornek-dijital-renk-dalgasi", "01.png", make(1.9, "g2"));
  await write("ornek-dijital-renk-dalgasi", "02.png", make(3.4, "g3"));
  return {
    title: { tr: "Renk Dalgası", en: "Colour Wave" },
    category: "digital",
    year: YEAR,
    role: { tr: "Üretken tasarım ve sanat yönetimi", en: "Generative design and art direction" },
    tools: ["JavaScript", "Processing", "After Effects"],
    text: {
      tr: "Üretken bir dijital seri: otuz dört sinüs bandı, üç mürekkep ve bir faz değişkeni. Her kare aynı kuralın başka bir anı. Seri bir heykelin üzerine projeksiyonla gösteriliyor; yüzeyin kıvrımları dalgayı bozuyor.",
      en: "A generative digital series: thirty-four sine bands, three inks and one phase variable. Every frame is another moment of the same rule. The series is projected onto a sculpture; the surface's folds distort the wave.",
    },
    presentation: "projection",
    stop: 5,
    colors: [CYAN, PINK, VIOLET],
    process: [
      { title: { tr: "Kural", en: "Rule" }, text: { tr: "Tek bir fonksiyon: genlik ve frekans bandın sırasına bağlı.", en: "One function: amplitude and frequency follow the band's index." } },
      { title: { tr: "Faz", en: "Phase" }, text: { tr: "Faz değişkeni seriyi üretir; her kare bir çıktı.", en: "The phase variable generates the series; every frame is a print." } },
      { title: { tr: "Yüzey", en: "Surface" }, text: { tr: "Projeksiyon düz değil: kıvrımlı bir heykel dalgayı yeniden çizer.", en: "The projection is not flat: a folded sculpture redraws the wave." } },
    ],
    sample: true,
    order: 4,
    cover: "cover.png",
    gallery: ["01.png", "02.png"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 05  KÂĞIT — a magazine (spread, stop 05)
const COLUMN_TR = [
  "Kâğıt bir yüzey değil, bir karardır. Gramajı, dokusu ve rengi daha ilk harf basılmadan sayfanın tonunu belirler.",
  "Tipografi bu kararın üstüne kurulur: satır uzunluğu, satır aralığı ve kenar boşluğu kâğıdın ölçüsünden türer.",
  "Bu sayıda kâğıdı konu ediyoruz: üç baskı tekniği, iki yazı ailesi ve bir boşluk üzerine notlar.",
  "Boşluk, baskıda mürekkebin dokunmadığı yer değil; okumanın nefes aldığı yerdir.",
  "Dergi formatı 230 × 300 mm; metin 10/14 punto, dış kenar iç kenarın iki katı.",
];
const COLUMN_EN = [
  "Paper is not a surface but a decision. Its weight, grain and colour set the tone of the page before the first letter is printed.",
  "Typography is built on that decision: line length, leading and margin derive from the sheet's measure.",
  "This issue is about paper: three print methods, two type families and notes on white space.",
];
function columns(x, y, w, lines, fill, size = 26, lead = 38) {
  const out = [];
  let yy = y;
  const maxChars = Math.floor(w / (size * 0.52));
  for (const para of lines) {
    let line = "";
    for (const wd of para.split(" ")) {
      if ((line + " " + wd).trim().length > maxChars) {
        out.push(T(x, yy, line.trim(), { size, weight: 400, fill }));
        yy += lead;
        line = wd;
      } else line = (line + " " + wd).trim();
    }
    if (line) {
      out.push(T(x, yy, line, { size, weight: 400, fill }));
      yy += lead;
    }
    yy += lead * 0.6;
  }
  return out.join("");
}
async function kagit() {
  const W = 2400;
  const H = 1600;
  const left = `<rect x="0" y="0" width="1200" height="${H}" fill="${INK}"/>${T(80, 980, "KÂĞIT", { size: 520, weight: 900, width: "condensed", fill: OFF })}${T(80, 1120, "01", { size: 160, weight: 200, width: "expanded", fill: YELLOW })}${meta(80, 1500, "Sayı 01 · Kâğıt üzerine", OFF, 24)}${meta(1120, 1500, "02", OFF, 24, "end")}`;
  const right = `<rect x="1200" y="0" width="1200" height="${H}" fill="${OFF}"/>${columns(1280, 180, 330, COLUMN_TR.slice(0, 2), INK)}${columns(1660, 180, 330, COLUMN_TR.slice(2, 4), INK)}${columns(2040, 180, 300, COLUMN_TR.slice(4), INK)}${T(1280, 1140, "Boşluk, okumanın", { size: 84, serif: true, italic: true, fill: INK })}${T(1280, 1240, "nefes aldığı yerdir.", { size: 84, serif: true, italic: true, fill: INK })}<rect x="1280" y="1300" width="1040" height="4" fill="${YELLOW}"/>${meta(1280, 1500, "Örnek dergi · 230 × 300 mm", INK, 24)}${meta(2320, 1500, "03", INK, 24, "end")}`;
  const spread = svg(W, H, `<defs>${grain("g", 0.07)}</defs>${left}${right}<rect x="1198" y="0" width="4" height="${H}" fill="${INK}" opacity="0.25"/>${grainRect(W, H, "g")}`);
  await write("ornek-editoryal-kagit", "cover.png", spread);
  const coverPage = svg(1600, 2400, `<defs>${grain("g2", 0.07)}</defs><rect width="1600" height="2400" fill="${YELLOW}"/>${T(96, 760, "KÂĞIT", { size: 540, weight: 900, width: "condensed", fill: INK })}${T(96, 1000, "Kâğıt, yazı ve boşluk üzerine", { size: 72, serif: true, italic: true, fill: INK })}${T(96, 1090, "bir dergi.", { size: 72, serif: true, italic: true, fill: INK })}<rect x="96" y="1900" width="1408" height="4" fill="${INK}"/>${T(96, 2290, "01", { size: 280, weight: 200, width: "expanded", fill: INK })}${meta(1504, 2290, `Örnek · ${YEAR}`, INK, 24, "end")}${grainRect(1600, 2400, "g2")}`);
  await write("ornek-editoryal-kagit", "01.png", coverPage);
  const spread2 = svg(W, H, `<defs>${grain("g3", 0.07)}</defs><rect width="1200" height="${H}" fill="${OFF}"/>${columns(80, 180, 500, COLUMN_EN, INK, 28, 42)}${meta(80, 1500, "04", INK, 24)}<rect x="1200" y="0" width="1200" height="${H}" fill="${INK}"/><clipPath id="c2"><rect x="1200" y="0" width="1200" height="${H}"/></clipPath><g clip-path="url(#c2)" transform="translate(1200 0)">${waveBands(1200, H, 2.2, [YELLOW, OFF, INK])}</g>${meta(2320, 1500, "05", OFF, 24, "end")}${grainRect(W, H, "g3")}`);
  await write("ornek-editoryal-kagit", "02.png", spread2);
  return {
    title: { tr: "KÂĞIT", en: "KÂĞIT" },
    category: "editorial",
    year: YEAR,
    role: { tr: "Editoryal tasarım ve sanat yönetimi", en: "Editorial design and art direction" },
    tools: ["InDesign", "Illustrator"],
    text: {
      tr: "Kâğıt, yazı ve boşluk üzerine bir dergi: yoğun bir siyah sayfa ile üç kolonlu beyaz bir sayfa yan yana. Başlık kâğıdın kendisi kadar ağır, metin 10/14. Forma uzayda açılıyor: sol sayfa gelirken sağ sayfa katlanarak kalkıyor.",
      en: "A magazine on paper, type and white space: a dense black page beside a three-column white one. The title as heavy as the stock, the text at 10/14. The spread opens in space: the left page arrives as the right page folds up.",
    },
    presentation: "spread",
    stop: 5,
    colors: [INK, YELLOW, OFF],
    process: [
      { title: { tr: "Format", en: "Format" }, text: { tr: "230 × 300 mm; dış kenar iç kenarın iki katı.", en: "230 × 300 mm; the outer margin twice the inner." } },
      { title: { tr: "Yazı", en: "Type" }, text: { tr: "Başlıkta dar Archivo, metinde normal; alıntıda Instrument Serif italik.", en: "Condensed Archivo for titles, normal for text; Instrument Serif italic for quotes." } },
      { title: { tr: "Sayfa", en: "Page" }, text: { tr: "Her forma bir karşıtlık: siyah/beyaz, dolu/boş, dar/geniş.", en: "Every spread is a contrast: black/white, full/empty, narrow/wide." } },
    ],
    sample: true,
    order: 5,
    cover: "cover.png",
    gallery: ["01.png", "02.png"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 06  ÜÇ — a poster series (particles, stop 04)
async function uc() {
  const colors = [PINK, CYAN, YELLOW];
  const words = ["BİR", "İKİ", "ÜÇ"];
  const make = async (i, file) => {
    const c = colors[i];
    const n = String(i + 1);
    const outlines = Array.from({ length: 5 }, (_, k) => `<text x="${840 + k * 36}" y="${1500 + k * 30}" font-family="${SANS}" font-size="1500" font-weight="900" font-stretch="condensed" fill="none" stroke="${c}" stroke-width="3" opacity="${0.55 - k * 0.1}" text-anchor="middle">${n}</text>`).join("");
    const body = `<defs>${grain("g" + i, 0.1)}</defs><rect width="1600" height="2400" fill="${INK}"/>${outlines}<text x="800" y="1500" font-family="${SANS}" font-size="1500" font-weight="900" font-stretch="condensed" fill="${c}" text-anchor="middle">${n}</text>${T(96, 300, words[i], { size: 200, weight: 900, width: "expanded", fill: OFF })}${meta(96, 2210, "Üç afiş · bir sayı sistemi", OFF, 24)}${meta(96, 2260, `Seri ${n} / 3 · 70 × 100 cm`, OFF, 24)}${meta(1504, 2260, `Örnek · ${YEAR}`, OFF, 24, "end")}${grainRect(1600, 2400, "g" + i)}`;
    await write("ornek-afis-serisi-uc", file, svg(1600, 2400, body));
  };
  await make(0, "cover.png");
  await make(1, "01.png");
  await make(2, "02.png");
  return {
    title: { tr: "Üç", en: "Three" },
    category: "series",
    year: YEAR,
    role: { tr: "Afiş serisi", en: "Poster series" },
    tools: ["Illustrator", "InDesign"],
    text: {
      tr: "Üç afişlik bir sayı sistemi: siyah yaprak, her afişte tek bir dev rakam ve rakamın gölgesi gibi kayan beş kontur. Pembe, cyan, sarı. Seri uzayda parçacıklara dağılıp yeniden toplanıyor: bir afiş biterken diğeri aynı parçalardan kuruluyor.",
      en: "A numeral system across three posters: black sheets, one giant numeral per poster and five outlines sliding like its shadow. Pink, cyan, yellow. In space the series scatters into particles and gathers again: as one poster ends, the next is built from the same pieces.",
    },
    presentation: "particles",
    stop: 4,
    colors: [PINK, CYAN, YELLOW],
    process: [
      { title: { tr: "Sayı", en: "Numeral" }, text: { tr: "Rakam yaprağın tamamı: dar kesim, 1500 punto.", en: "The numeral is the whole sheet: condensed, 1500 pt." } },
      { title: { tr: "Gölge", en: "Shadow" }, text: { tr: "Beş kontur kayar; afiş durur, sayı hareket eder.", en: "Five outlines slide; the sheet is still, the numeral moves." } },
      { title: { tr: "Seri", en: "Series" }, text: { tr: "Aynı sistem, üç renk: yan yana bir ritim.", en: "The same system in three colours: a rhythm side by side." } },
    ],
    sample: true,
    order: 6,
    cover: "cover.png",
    gallery: ["01.png", "02.png"],
  };
}

const all = [
  ["ornek-afis-sessiz-sehir", sessizSehir],
  ["ornek-tipografi-ses", ses],
  ["ornek-kimlik-kup", kup],
  ["ornek-dijital-renk-dalgasi", renkDalgasi],
  ["ornek-editoryal-kagit", kagit],
  ["ornek-afis-serisi-uc", uc],
];
for (const [slug, fn] of all) {
  const m = await fn();
  writeFileSync(join(worksDir, slug, "meta.json"), JSON.stringify(m, null, 2) + "\n");
  console.log("samples:", slug);
}
