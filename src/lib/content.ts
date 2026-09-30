import { works, portrait, type Work } from "@/content/works.generated";
import { site, type Lang, type Localized } from "../../content/site";

export { works, portrait, site };
export type { Work, Lang, Localized };

export function L(v: Localized | null | undefined, lang: Lang): string {
  if (!v) return "";
  return v[lang] || v.tr || "";
}

export function workBySlug(slug: string): Work | undefined {
  return works.find((w) => w.slug === slug);
}

export function nextWork(slug: string): Work | undefined {
  const i = works.findIndex((w) => w.slug === slug);
  if (i < 0 || works.length < 2) return undefined;
  return works[(i + 1) % works.length];
}

export function siteUrl(path = "") {
  return site.url.replace(/\/$/, "") + path;
}
