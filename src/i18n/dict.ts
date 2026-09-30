import type { Lang } from "../../content/site";

export const LANGS: Lang[] = ["tr", "en"];

/** Category ids used in content/works/<slug>/meta.json */
export type Category = "poster" | "editorial" | "packaging" | "identity" | "social";
export const CATEGORIES: Category[] = ["poster", "editorial", "packaging", "identity", "social"];

const tr = {
  langName: "Türkçe",
  otherLang: "English",
  otherLangHref: "/en",
  skip: "İçeriğe geç",
  nav: {
    works: "İşler",
    skills: "Beceriler",
    process: "Süreç",
    about: "Hakkımda",
    contact: "İletişim",
  },
  hero: {
    scroll: "Kaydırarak keşfet",
    lampHint: "İmleç senin elin: mürekkebi karıştır, harfleri kır.",
    loop: "3B sahneden kayıt: ismin parçalardan toplanışı ve canlı mürekkep",
  },
  works: {
    eyebrow: "Seçilmiş işler",
    title: "Portallar",
    all: "Tümü",
    sample: "Örnek",
    sampleHint: "Bu iş, gerçek işler eklenene kadar duran bir örnektir.",
    open: "İşi aç",
    view: "İncele",
    year: "Yıl",
    role: "Rol",
    tools: "Araçlar",
    client: "Müşteri",
    next: "Sonraki iş",
    back: "Portallara dön",
    gallery: "Galeri",
    filterLabel: "Kategoriye göre süz",
    loop: "3B sahneden kayıt: işlerin portalları",
    categories: {
      poster: "Afiş",
      editorial: "Editoryal",
      packaging: "Ambalaj",
      identity: "Kimlik",
      social: "Sosyal",
    } as Record<Category, string>,
    objects: {
      poster: "Kâğıt katmanları derinlikte açılan afiş",
      editorial: "Sayfaları derinlikte açılan yayın",
      packaging: "Kapağı giydirilmiş dönen kutu",
      identity: "Krom ve folyo olarak dökülmüş marka işareti",
      social: "Işıklı çerçevesiz ekran",
    } as Record<Category, string>,
  },
  skills: {
    eyebrow: "Beceriler ve araçlar",
    title: "Kinetik yazı",
    tools: "Araçlar",
    toolsText: "Araçlar yörüngede dönen parlak jetonlar; logolar değil, harfler.",
  },
  process: {
    eyebrow: "Süreç",
    title: "Renk makinesi",
    step: "Adım",
  },
  about: {
    eyebrow: "Hakkımda",
    title: "Portre",
    monogram: "Noktalardan kurulan tipografik monogram",
  },
  contact: {
    eyebrow: "İletişim",
    title: "Holografik kart",
    copy: "E-postayı kopyala",
    copied: "Kopyalandı",
    write: "Yaz",
    formTitle: "Kısa bir mesaj",
    name: "Adın",
    message: "Mesajın",
    send: "E-posta uygulamasında aç",
    formHint: "Form, e-posta uygulamanı açar; sunucuya hiçbir şey gönderilmez.",
    front: "Ön yüz",
    back: "Arka yüz",
    loop: "3B sahneden kayıt: holografik kartvizit",
  },
  ending: {
    stack: "Yolculuktaki bütün mürekkep folyoya dolar.",
  },
  ui: {
    theme: "Gece",
    themeLight: "Galeri",
    sound: "Ses",
    soundOn: "Ses açık",
    soundOff: "Ses kapalı",
    motion: "Hareketi etkinleştir",
    motionOn: "Hareket açık",
    debug: "Hata ayıklama paneli",
    loading: "Yükleniyor",
    ready: "Hazır",
    menu: "Menü",
    close: "Kapat",
    confetti: "Kâğıt konfeti",
    spin: "Kartı çevir",
    glOff: "3B sahne bu cihazda kapalı; site yazı ve renk olarak tam.",
  },
  footer: {
    rights: "Tüm hakları saklıdır.",
    made: "Bir arkadaş hediyesi olarak yapıldı.",
  },
};

export type Dict = typeof tr;

const en: Dict = {
  langName: "English",
  otherLang: "Türkçe",
  otherLangHref: "/",
  skip: "Skip to content",
  nav: {
    works: "Work",
    skills: "Skills",
    process: "Process",
    about: "About",
    contact: "Contact",
  },
  hero: {
    scroll: "Scroll to explore",
    lampHint: "The cursor is your hand: stir the ink, break the letters.",
    loop: "Recorded from the 3D stage: the name assembling from shards, and the living ink",
  },
  works: {
    eyebrow: "Selected work",
    title: "The portals",
    all: "All",
    sample: "Sample",
    sampleHint: "A placeholder piece until real work is added.",
    open: "Open the work",
    view: "View",
    year: "Year",
    role: "Role",
    tools: "Tools",
    client: "Client",
    next: "Next project",
    back: "Back to the portals",
    gallery: "Gallery",
    filterLabel: "Filter by category",
    loop: "Recorded from the 3D stage: the portals of the works",
    categories: {
      poster: "Poster",
      editorial: "Editorial",
      packaging: "Packaging",
      identity: "Identity",
      social: "Social",
    },
    objects: {
      poster: "Poster whose paper layers open in depth",
      editorial: "Publication whose pages open in depth",
      packaging: "Rotating box with the cover mapped on",
      identity: "Brand mark cast in chrome and foil",
      social: "Lit frameless screen",
    },
  },
  skills: {
    eyebrow: "Skills and tools",
    title: "Kinetic type",
    tools: "Tools",
    toolsText: "Tools orbit as glossy tokens; letters, not logos.",
  },
  process: {
    eyebrow: "Process",
    title: "The colour machine",
    step: "Step",
  },
  about: {
    eyebrow: "About",
    title: "Portrait",
    monogram: "Typographic monogram built from dots",
  },
  contact: {
    eyebrow: "Contact",
    title: "The holographic card",
    copy: "Copy email",
    copied: "Copied",
    write: "Write",
    formTitle: "A short message",
    name: "Your name",
    message: "Your message",
    send: "Open in your mail app",
    formHint: "The form opens your mail app; nothing is sent to a server.",
    front: "Front",
    back: "Back",
    loop: "Recorded from the 3D stage: the holographic card",
  },
  ending: {
    stack: "All the ink of the journey pours into the foil.",
  },
  ui: {
    theme: "Night",
    themeLight: "Gallery",
    sound: "Sound",
    soundOn: "Sound on",
    soundOff: "Sound off",
    motion: "Enable motion",
    motionOn: "Motion on",
    debug: "Debug panel",
    loading: "Loading",
    ready: "Ready",
    menu: "Menu",
    close: "Close",
    confetti: "Paper confetti",
    spin: "Spin the card",
    glOff: "The 3D stage is off on this device; the site is complete in type and colour.",
  },
  footer: {
    rights: "All rights reserved.",
    made: "Made as a gift from a friend.",
  },
};

export const dict: Record<Lang, Dict> = { tr, en };

export function t(lang: Lang): Dict {
  return dict[lang];
}

/** Locale-aware uppercase (Turkish i → İ, ı → I). */
export function upper(s: string, lang: Lang) {
  return s.toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US");
}

/** Join the last two words with a no-break space so no paragraph ends on a widow. */
export function noWidow(s: string) {
  const i = s.lastIndexOf(" ");
  if (i < 0 || s.length - i > 24) return s;
  return s.slice(0, i) + " " + s.slice(i + 1);
}

export function workHref(lang: Lang, slug: string) {
  return lang === "tr" ? `/isler/${slug}` : `/en/work/${slug}`;
}

export function homeHref(lang: Lang, hash = "") {
  return (lang === "tr" ? "/" : "/en") + hash;
}
