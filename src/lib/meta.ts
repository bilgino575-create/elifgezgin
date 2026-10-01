import type { Metadata } from "next";
import { site, L, type Lang } from "@/lib/content";
import { home, workPath } from "@/lib/i18n";
import type { Work } from "@/lib/content";

const base = () => new URL(site.url);

export function homeMetadata(lang: Lang): Metadata {
  const title = `${site.name} — ${L(site.title, lang)}`;
  const description = L(site.description, lang);
  return {
    metadataBase: base(),
    title,
    description,
    alternates: {
      canonical: home(lang),
      languages: { tr: "/", en: "/en", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: home(lang),
      siteName: site.name,
      locale: lang === "tr" ? "tr_TR" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export function workMetadata(lang: Lang, w: Work): Metadata {
  const title = `${L(w.title, lang)} — ${site.name}`;
  const description = L(w.text, lang);
  return {
    metadataBase: base(),
    title,
    description,
    alternates: {
      canonical: workPath(lang, w.slug),
      languages: { tr: workPath("tr", w.slug), en: workPath("en", w.slug), "x-default": workPath("tr", w.slug) },
    },
    openGraph: { type: "article", title, description, url: workPath(lang, w.slug), siteName: site.name },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** JSON-LD: the person and, on project pages, the creative work */
export function personLd(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: L(site.title, lang),
    url: site.url,
    ...(site.email ? { email: site.email } : {}),
    ...(site.social.length ? { sameAs: site.social.map((s) => s.url) } : {}),
    knowsAbout: site.disciplines.map((d) => L(d, lang)),
  };
}
export function workLd(lang: Lang, w: Work) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: L(w.title, lang),
    description: L(w.text, lang),
    dateCreated: String(w.year),
    url: `${site.url}${workPath(lang, w.slug)}`,
    image: `${site.url}${w.cover.src}`,
    author: { "@type": "Person", name: site.name, url: site.url },
  };
}
