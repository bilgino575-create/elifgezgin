import { site } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t, homeHref } from "@/i18n/dict";
import { Mark } from "./Mark";
import NavLinks, { NavTools } from "@/components/ui/NavClient";

export default function Nav({ lang, minimal = false }: { lang: Lang; minimal?: boolean }) {
  const d = t(lang);
  const links = [
    { href: "#isler", label: d.nav.works },
    { href: "#beceriler", label: d.nav.skills },
    { href: "#surec", label: d.nav.process },
    { href: "#hakkimda", label: d.nav.about },
    { href: "#iletisim", label: d.nav.contact },
  ];
  return (
    <header className="nav">
      <div className="wrap">
        <a href={homeHref(lang)} className="brand">
          <Mark className="mark" />
          <span>{site.name}</span>
        </a>
        {!minimal ? <NavLinks links={links} lang={lang} /> : null}
        <NavTools lang={lang} links={minimal ? [] : links} />
      </div>
    </header>
  );
}
