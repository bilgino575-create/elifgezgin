import type { CSSProperties, ReactNode } from "react";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "@/app/globals.css";
import { site, siteUrl, works, L } from "@/lib/content";
import { t } from "@/i18n/dict";
import type { Lang } from "@/lib/content";
import { themeScript } from "@/lib/theme";
import Nav from "./Nav";
import Footer from "./Footer";
import Chrome from "@/components/ui/Chrome";

// Display: Bricolage Grotesque, variable on wght 200–800, wdth 75–100 and opsz 12–96 (see docs/RENK.md §3).
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  display: "swap",
});
// Text: Instrument Sans, variable on wght 400–700 and wdth 75–100.
const text = Instrument_Sans({
  variable: "--font-text",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

const safeJson = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

export default function Shell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const d = t(lang);
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": siteUrl("/#person"),
    name: site.name,
    givenName: site.firstName,
    familyName: site.lastName,
    jobTitle: L(site.title, lang),
    description: L(site.description, lang),
    url: siteUrl("/"),
    ...(site.email ? { email: `mailto:${site.email}` } : {}),
    ...(site.social.length ? { sameAs: site.social.map((s) => s.url) } : {}),
    knowsAbout: site.skills.map((s) => L(s.name, lang)),
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": siteUrl("/#website"),
    name: site.name,
    url: siteUrl("/"),
    inLanguage: lang,
    author: { "@id": siteUrl("/#person") },
  };
  const creative = works.map((w) => ({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": siteUrl(`${lang === "tr" ? "/isler/" : "/en/work/"}${w.slug}`),
    name: L(w.title, lang),
    genre: d.works.categories[w.category],
    ...(w.year ? { dateCreated: String(w.year) } : {}),
    image: siteUrl(w.cover.src1024),
    author: { "@id": siteUrl("/#person") },
    inLanguage: lang,
  }));

  return (
    <html
      lang={lang}
      className={`${display.variable} ${text.variable}`}
      style={{ "--spot": site.spotColor } as CSSProperties}
      suppressHydrationWarning
    >
      <body>
        {/* runs before the body paints: applies the stored or preferred theme */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(person) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(website) }} />
        {creative.length ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(creative) }} />
        ) : null}
        <a className="skip" href="#main">
          {d.skip}
        </a>
        <Nav lang={lang} />
        {children}
        <Footer lang={lang} />
        <Chrome lang={lang} />
      </body>
    </html>
  );
}
