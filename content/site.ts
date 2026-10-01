/**
 * ELİF İÇİN — sitenin tek bilgi kaynağı.
 *
 * Buradaki her alan sitede olduğu gibi görünür. Bir şeyi değiştirmek için
 * tırnak içindeki metni düzenleyip kaydetmen yeterli; README_ELIF.md adım
 * adım anlatıyor. Boş bıraktığın alanlar (örneğin e-posta) sitede görünmez,
 * yerine bir şey uydurulmaz.
 */

export type Lang = "tr" | "en";
export type Localized = Record<Lang, string>;

export interface SocialLink {
  /** behance | instagram | linkedin | dribbble */
  id: "behance" | "instagram" | "linkedin" | "dribbble";
  url: string;
}

export const site = {
  name: "Elif Gezgin",
  firstName: "Elif",
  lastName: "Gezgin",
  initials: "EG",
  /**
   * Yayınlandığı adres (site haritası, paylaşım kartları, kanonik bağlantı).
   * Alan adı alındığında Vercel'de NEXT_PUBLIC_SITE_URL değişkenini
   * "https://elifgezgin.com" yapman yeterli; burada bir şey değiştirme.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://elifgezgin.vercel.app",
  title: { tr: "Grafik Tasarımcı", en: "Graphic Designer" } as Localized,
  /** arama motorları ve paylaşım kartları için kısa açıklama */
  description: {
    tr: "Elif Gezgin, grafik tasarımcı. Marka kimliği, görsel kimlik, tipografi, afiş, editoryal tasarım ve dijital sanat: bir portfolyo değil, yedi duraklı bir 3B gezi.",
    en: "Elif Gezgin, graphic designer. Brand identity, visual identity, typography, posters, editorial design and digital art: not a portfolio, a 3D journey in seven stops.",
  } as Localized,
  /** Giriş durağında mesleğin altındaki tek cümle. */
  tagline: {
    tr: "Renk, yazı ve ışıkla kurulan işler.",
    en: "Work built from colour, type and light.",
  } as Localized,
  /** Hakkımda durağındaki metin. Paragraflar boş satırla ayrılır. Gerçek olmayan hiçbir şey yazma. */
  bio: {
    tr: "Elif Gezgin bir grafik tasarımcı. Marka kimliği, tipografi, afiş, editoryal tasarım ve dijital sanat üzerine çalışıyor.\n\nHer işe aynı soruyla başlıyor: bu fikir kâğıtta, ekranda ve uzayda nasıl durur? Cevabı renkle, yazıyla ve ışıkla veriyor.",
    en: "Elif Gezgin is a graphic designer working across brand identity, typography, posters, editorial design and digital art.\n\nEvery piece starts with the same question: how does this idea stand on paper, on screen and in space? The answer is given in colour, type and light.",
  } as Localized,
  /** Hakkımda enstalasyonunda ismin etrafında dolaşan disiplinler. */
  disciplines: [
    { tr: "Grafik Tasarım", en: "Graphic Design" },
    { tr: "Marka Kimliği", en: "Branding" },
    { tr: "Görsel Kimlik", en: "Visual Identity" },
    { tr: "Sanat Yönetimi", en: "Art Direction" },
    { tr: "Tipografi", en: "Typography" },
    { tr: "Dijital Sanat", en: "Digital Art" },
  ] as Localized[],
  /** Boş bırakılırsa e-posta bağlantısı görünmez. */
  email: "",
  /** Sadece gerçekten var olan hesaplar; olmayanı listeden sil. */
  social: [] as SocialLink[],
  /** İletişim durağının son satırı. */
  availability: {
    tr: "Yeni projelere açık.",
    en: "Open to new projects.",
  } as Localized,
};

export function L(v: Localized, lang: Lang): string {
  return v[lang] ?? v.tr;
}
