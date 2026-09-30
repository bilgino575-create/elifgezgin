import type { Metadata } from "next";
import { site, siteUrl, L, workBySlug } from "./content";
import type { Lang } from "./content";
import { t } from "@/i18n/dict";

export function homeMetadata(lang: Lang): Metadata {
  const title = `${site.name} — ${L(site.title, lang)}`;
  const description = L(site.description, lang);
  return {
    metadataBase: new URL(site.url),
    title: { default: title, template: `%s — ${site.name}` },
    description,
    applicationName: site.name,
    authors: [{ name: site.name, url: site.url }],
    creator: site.name,
    alternates: {
      canonical: lang === "tr" ? "/" : "/en",
      languages: { tr: "/", en: "/en", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      locale: lang === "tr" ? "tr_TR" : "en_US",
      alternateLocale: lang === "tr" ? "en_US" : "tr_TR",
      url: lang === "tr" ? "/" : "/en",
      title,
      description,
      siteName: site.name,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    formatDetection: { email: false, address: false, telephone: false },
  };
}

export function workMetadata(lang: Lang, slug: string): Metadata {
  const w = workBySlug(slug);
  if (!w) return {};
  const d = t(lang);
  const title = L(w.title, lang);
  const description = L(w.text, lang) || `${d.works.categories[w.category]} — ${site.name}`;
  const path = lang === "tr" ? `/isler/${slug}` : `/en/work/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: path, languages: { tr: `/isler/${slug}`, en: `/en/work/${slug}` } },
    openGraph: {
      type: "article",
      url: path,
      title,
      description,
      images: [{ url: siteUrl(w.cover.src1024), width: 1024, height: Math.round((1024 * w.cover.h) / w.cover.w), alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [siteUrl(w.cover.src1024)] },
  };
}
