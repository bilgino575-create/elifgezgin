export { site, L } from "../../content/site";
export type { Lang, Localized, SocialLink } from "../../content/site";
export { works } from "@/content/works.generated";
export type { Work, WorkImage, WorkProcessStep, Presentation, Category } from "@/content/works.generated";

/** Turkish-aware upper case: i → İ, ı → I, under any lang (the names are Turkish). */
export function upper(s: string, lang: "tr" | "en" = "tr") {
  return lang === "tr" ? s.toLocaleUpperCase("tr-TR") : s.toLocaleUpperCase("en-US");
}
