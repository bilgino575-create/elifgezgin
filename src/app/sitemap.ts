import type { MetadataRoute } from "next";
import { site, works } from "@/lib/content";
import { workPath } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "monthly", priority: 1, alternates: { languages: { tr: `${site.url}/`, en: `${site.url}/en` } } },
    { url: `${site.url}/en`, lastModified: now, changeFrequency: "monthly", priority: 0.9, alternates: { languages: { tr: `${site.url}/`, en: `${site.url}/en` } } },
  ];
  for (const w of works) {
    for (const lang of ["tr", "en"] as const) {
      pages.push({
        url: `${site.url}${workPath(lang, w.slug)}`,
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.7,
        alternates: { languages: { tr: `${site.url}${workPath("tr", w.slug)}`, en: `${site.url}${workPath("en", w.slug)}` } },
      });
    }
  }
  return pages;
}
