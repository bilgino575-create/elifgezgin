import type { MetadataRoute } from "next";
import { works, siteUrl } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const home: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), lastModified: now, changeFrequency: "monthly", priority: 1, alternates: { languages: { tr: siteUrl("/"), en: siteUrl("/en") } } },
    { url: siteUrl("/en"), lastModified: now, changeFrequency: "monthly", priority: 0.9, alternates: { languages: { tr: siteUrl("/"), en: siteUrl("/en") } } },
  ];
  const pages: MetadataRoute.Sitemap = works.flatMap((w) => [
    { url: siteUrl(`/isler/${w.slug}`), lastModified: now, changeFrequency: "yearly" as const, priority: 0.7, alternates: { languages: { tr: siteUrl(`/isler/${w.slug}`), en: siteUrl(`/en/work/${w.slug}`) } } },
    { url: siteUrl(`/en/work/${w.slug}`), lastModified: now, changeFrequency: "yearly" as const, priority: 0.6, alternates: { languages: { tr: siteUrl(`/isler/${w.slug}`), en: siteUrl(`/en/work/${w.slug}`) } } },
  ]);
  return [...home, ...pages];
}
