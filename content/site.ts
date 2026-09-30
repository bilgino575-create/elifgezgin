/**
 * ELİF İÇİN — sitenin tek bilgi kaynağı.
 *
 * Buradaki her alan sitede olduğu gibi görünür. Bir şeyi değiştirmek için
 * tırnak içindeki metni düzenleyip kaydetmen yeterli; README_ELIF.md
 * adım adım anlatıyor. Boş bıraktığın alanlar (örneğin e-posta) sitede
 * görünmez, uydurulmaz.
 */

export type Lang = "tr" | "en";
export type Localized = Record<Lang, string>;

export interface SocialLink {
  /** behance | instagram | linkedin | dribbble */
  id: "behance" | "instagram" | "linkedin" | "dribbble";
  url: string;
}

export interface Skill {
  id: string;
  name: Localized;
  description: Localized;
  /** İstersen bir seviye sözcüğü ("ileri", "orta"); yoksa hiç gösterilmez. */
  level?: Localized;
}

export interface ProcessStep {
  id: string;
  title: Localized;
  text: Localized;
}

export const site = {
  name: "Elif Gezgin",
  firstName: "Elif",
  lastName: "Gezgin",
  initials: "EG",
  /**
   * Yayınlandığı adres (sitemap, OG etiketleri, kanonik bağlantı).
   * Alan adı alındığında Vercel'de NEXT_PUBLIC_SITE_URL değişkenini
   * "https://elifgezgin.com" yapman yeterli; burada bir şey değiştirme.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://elifgezgin.vercel.app",
  title: { tr: "Grafik Tasarımcı", en: "Graphic Designer" } as Localized,
  /** kısa açıklama: arama motorları ve sosyal paylaşım kartları */
  description: {
    tr: "Elif Gezgin, grafik tasarımcı. Marka kimliği, editoryal tasarım ve ambalaj; kâğıt, yazı ve ışıkla kurulan işler.",
    en: "Elif Gezgin, graphic designer. Brand identity, editorial design and packaging; work built from paper, type and light.",
  } as Localized,
  /** Hakkımda bölümündeki metin. Paragraflar boş satırla ayrılır. */
  bio: {
    tr: "Elif Gezgin bir grafik tasarımcı. Marka kimliği, editoryal tasarım ve ambalaj üzerine çalışıyor.\n\nİşlerinde kâğıdın dokusunu, yazının ölçüsünü ve ışığın düşüşünü aynı ciddiyetle ele alıyor; ekranda başlayan her fikri baskıda nasıl duracağını düşünerek kuruyor.",
    en: "Elif Gezgin is a graphic designer working across brand identity, editorial design and packaging.\n\nHer work treats the grain of paper, the measure of type and the fall of light with the same seriousness; every idea that starts on screen is built with the print in mind.",
  } as Localized,
  /** Boş bırakılırsa e-posta düğmeleri ve iletişim formu görünmez. */
  email: "",
  /** Sadece gerçekten var olan hesaplar; olmayanı listeden sil. */
  social: [] as SocialLink[],
  /** Sitenin tek vurgu rengi: ilk damla, camın tonu, portal çerçeveleri, folyonun ana rengi. */
  spotColor: "#2B3CFF",
  availability: { tr: "Yeni projelere açığım.", en: "Open to new projects." } as Localized,
  skills: [
    {
      id: "marka",
      name: { tr: "Marka kimliği", en: "Brand identity" },
      description: {
        tr: "Logo, renk, yazı ve kullanım kuralları: bir markanın her yüzeyde aynı sesle konuşması.",
        en: "Logo, colour, type and usage rules: a brand that speaks with one voice on every surface.",
      },
    },
    {
      id: "editoryal",
      name: { tr: "Editoryal tasarım", en: "Editorial design" },
      description: {
        tr: "Kitap, dergi ve katalog; ızgara, ritim ve okunurluk.",
        en: "Books, magazines and catalogues; grid, rhythm and readability.",
      },
    },
    {
      id: "ambalaj",
      name: { tr: "Ambalaj", en: "Packaging" },
      description: {
        tr: "Kutu, etiket ve yapısal tasarım; rafta ve elde çalışan çözümler.",
        en: "Boxes, labels and structural design; solutions that work on the shelf and in the hand.",
      },
    },
    {
      id: "tipografi",
      name: { tr: "Tipografi", en: "Typography" },
      description: {
        tr: "Yazı seçimi, harf aralığı ve hiyerarşi; metnin görünmez mimarisi.",
        en: "Type selection, spacing and hierarchy; the invisible architecture of text.",
      },
    },
    {
      id: "illustrasyon",
      name: { tr: "İllüstrasyon", en: "Illustration" },
      description: {
        tr: "Markaya ait çizim dili; ikon setlerinden kapak illüstrasyonlarına.",
        en: "A drawing language owned by the brand; from icon sets to cover illustrations.",
      },
    },
    {
      id: "sosyal",
      name: { tr: "Sosyal medya", en: "Social media" },
      description: {
        tr: "Akışta duran, marka dilini bozmayan görsel sistemler.",
        en: "Visual systems that hold up in the feed without breaking the brand language.",
      },
    },
    {
      id: "hareketli",
      name: { tr: "Hareketli grafik", en: "Motion graphics" },
      description: {
        tr: "Logo animasyonu, kısa tanıtım ve sosyal medya için hareket.",
        en: "Logo animation, short promos and motion for social.",
      },
    },
  ] as Skill[],
  tools: ["Illustrator", "Photoshop", "InDesign", "Figma", "After Effects", "Procreate"],
  process: [
    {
      id: "brief",
      title: { tr: "Brief", en: "Brief" },
      text: { tr: "Neyi, kim için, neden yaptığımızı birlikte yazıyoruz.", en: "We write down what we are making, for whom and why." },
    },
    {
      id: "arastirma",
      title: { tr: "Araştırma", en: "Research" },
      text: { tr: "Sektör, rakipler, referanslar; boş sayfaya bakmadan önce.", en: "The field, the competitors, the references; before facing the blank page." },
    },
    {
      id: "eskiz",
      title: { tr: "Eskiz", en: "Sketch" },
      text: { tr: "Kâğıt üzerinde çok, ekranda az: fikirler önce elde denenir.", en: "Many on paper, few on screen: ideas are tried by hand first." },
    },
    {
      id: "konsept",
      title: { tr: "Konsept", en: "Concept" },
      text: { tr: "Bir yön, bir hikâye; üç değil, bir doğru öneri.", en: "One direction, one story; not three options but one right proposal." },
    },
    {
      id: "uygulama",
      title: { tr: "Uygulama", en: "Execution" },
      text: { tr: "Sistemin her parçası: dosyalar, kurallar, varyasyonlar.", en: "Every part of the system: files, rules, variations." },
    },
    {
      id: "baski",
      title: { tr: "Baskı ve teslim", en: "Print and delivery" },
      text: { tr: "Prova, kâğıt seçimi, matbaa takibi; iş elimize değene kadar.", en: "Proofs, paper selection, press checks; until the piece is in our hands." },
    },
  ] as ProcessStep[],
};

export type Site = typeof site;
