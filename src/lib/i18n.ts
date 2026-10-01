import type { Lang } from "@/lib/content";

const tr = {
  lang: "tr" as Lang,
  skip: "İçeriğe geç",
  nav: { work: "İşler", about: "Hakkımda", contact: "İletişim", menu: "Menü", close: "Kapat", switch: "EN", switchLabel: "English" },
  route: { stop: "Durak", of: "/" },
  hero: {
    role: "Grafik Tasarımcı",
    scroll: "Kaydır: gezi başlıyor",
    hint: "İmleç senin ışığın.",
  },
  work: {
    project: "Proje",
    sample: "Örnek proje",
    sampleNote: "Bu iş gerçek bir müşteri işi değil; sitenin dilini göstermek için üretilmiş örnek bir çalışma.",
    open: "Projeyi aç",
    openShort: "AÇ",
    year: "Yıl",
    category: "Kategori",
    role: "Rol",
    tools: "Araçlar",
    process: "Süreç",
    final: "Son iş",
    details: "Detaylar",
    back: "Geziye dön",
    next: "Sonraki proje",
    allWork: "Tüm işler",
    colors: "Renkler",
  },
  categories: {
    poster: "Afiş",
    typography: "Tipografi",
    identity: "Marka kimliği",
    digital: "Dijital sanat",
    editorial: "Editoryal",
    series: "Afiş serisi",
  } as Record<string, string>,
  about: {
    eyebrow: "Hakkımda",
    statue: "Elif Gezgin'i temsil eden stilize 3B heykel (yapay zekâ ile üretilmiş bir figür, fotoğraf değil); imleçle ya da parmakla döndürülebilir.",
  },
  contact: {
    line1: "Birlikte",
    line2: "tuhaf",
    line3: "bir şey",
    line4: "yapalım.",
    email: "E-posta",
    copy: "Adresi kopyala",
    copied: "Kopyalandı",
    soon: "E-posta ve hesaplar yakında burada.",
  },
  loader: { label: "Yükleniyor", enter: "Geziye gir" },
  cursor: { open: "AÇ", drag: "ÇEVİR", view: "BAK" },
  fallback: {
    note: "Bu tarayıcıda 3B sahne açılamadı; gezi iki boyutta devam ediyor.",
  },
  footer: { made: "Tasarım ve kod: bu site Elif Gezgin için yapıldı." },
  notFound: { title: "Bu durak yok.", text: "Aradığın sayfa rotada değil.", home: "Başa dön" },
};

const en: typeof tr = {
  lang: "en",
  skip: "Skip to content",
  nav: { work: "Work", about: "About", contact: "Contact", menu: "Menu", close: "Close", switch: "TR", switchLabel: "Türkçe" },
  route: { stop: "Stop", of: "/" },
  hero: {
    role: "Graphic Designer",
    scroll: "Scroll: the journey begins",
    hint: "The cursor is your light.",
  },
  work: {
    project: "Project",
    sample: "Sample project",
    sampleNote: "This is not a client job; it is a sample piece made to show the language of the site.",
    open: "Open the project",
    openShort: "OPEN",
    year: "Year",
    category: "Category",
    role: "Role",
    tools: "Tools",
    process: "Process",
    final: "Final work",
    details: "Details",
    back: "Back to the journey",
    next: "Next project",
    allWork: "All work",
    colors: "Colours",
  },
  categories: {
    poster: "Poster",
    typography: "Typography",
    identity: "Brand identity",
    digital: "Digital art",
    editorial: "Editorial",
    series: "Poster series",
  },
  about: {
    eyebrow: "About",
    statue: "Stylised 3D statue representing Elif Gezgin (an AI-generated figure, not a photograph); turn it with the cursor or a finger.",
  },
  contact: {
    line1: "Let's",
    line2: "make",
    line3: "something",
    line4: "strange.",
    email: "Email",
    copy: "Copy the address",
    copied: "Copied",
    soon: "Email and accounts will appear here soon.",
  },
  loader: { label: "Loading", enter: "Enter" },
  cursor: { open: "OPEN", drag: "TURN", view: "LOOK" },
  fallback: {
    note: "The 3D stage could not open in this browser; the journey continues in two dimensions.",
  },
  footer: { made: "Design and code: this site was made for Elif Gezgin." },
  notFound: { title: "No such stop.", text: "The page you asked for is not on the route.", home: "Back to the start" },
};

export type Dict = typeof tr;
export const t = (lang: Lang): Dict => (lang === "en" ? en : tr);

/** route helpers */
export const home = (lang: Lang) => (lang === "en" ? "/en" : "/");
export const workPath = (lang: Lang, slug: string) => (lang === "en" ? `/en/work/${slug}` : `/isler/${slug}`);
export const otherLang = (lang: Lang): Lang => (lang === "en" ? "tr" : "en");
