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
    lampHint: "İmleç bir atölye lambası: kâğıdın üzerinde gezdir.",
  },
  works: {
    eyebrow: "Seçilmiş işler",
    title: "Baskı duvarı",
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
    back: "Duvara dön",
    gallery: "Galeri",
    filterLabel: "Kategoriye göre süz",
    categories: {
      poster: "Afiş",
      editorial: "Editoryal",
      packaging: "Ambalaj",
      identity: "Kimlik",
      social: "Sosyal",
    } as Record<Category, string>,
    objects: {
      poster: "Klipsli rayda asılı baskı",
      editorial: "Açılan kitap",
      packaging: "Döner kutu",
      identity: "Kör kabartma kart",
      social: "Çerçevesiz ekran",
    } as Record<Category, string>,
  },
  skills: {
    eyebrow: "Beceriler ve araçlar",
    title: "Renk kartelası",
    tools: "Araçlar",
    toolsText: "Kartın üzerine kör kabartmayla basılı; lambayı yaklaştır.",
  },
  process: {
    eyebrow: "Süreç",
    title: "Katlanan sayfa",
    step: "Adım",
  },
  about: {
    eyebrow: "Hakkımda",
    title: "Basılı portre",
    monogram: "Tipografik monogram baskısı",
  },
  contact: {
    eyebrow: "İletişim",
    title: "Kartvizit",
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
  },
  ending: {
    stack: "Yolculuktaki her sayfa masada bir yığına dönüşür.",
  },
  ui: {
    theme: "Karanlık oda",
    themeLight: "Aydınlık oda",
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
    glOff: "3B görünüm bu cihazda kapalı; site yazı olarak tam.",
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
    lampHint: "The cursor is a studio lamp: move it across the paper.",
  },
  works: {
    eyebrow: "Selected work",
    title: "The print wall",
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
    back: "Back to the wall",
    gallery: "Gallery",
    filterLabel: "Filter by category",
    categories: {
      poster: "Poster",
      editorial: "Editorial",
      packaging: "Packaging",
      identity: "Identity",
      social: "Social",
    },
    objects: {
      poster: "Print hung on a clip rail",
      editorial: "A book that opens",
      packaging: "A box that turns",
      identity: "Blind-embossed card",
      social: "Frameless screen",
    },
  },
  skills: {
    eyebrow: "Skills and tools",
    title: "The swatch fan",
    tools: "Tools",
    toolsText: "Blind-embossed on the card; bring the lamp closer.",
  },
  process: {
    eyebrow: "Process",
    title: "The fold",
    step: "Step",
  },
  about: {
    eyebrow: "About",
    title: "The printed portrait",
    monogram: "Typographic monogram print",
  },
  contact: {
    eyebrow: "Contact",
    title: "The card",
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
  },
  ending: {
    stack: "Every sheet from the journey settles into one stack on the table.",
  },
  ui: {
    theme: "Darkroom",
    themeLight: "Daylight",
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
    glOff: "3D is off on this device; the site is complete as text.",
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
