import { site, L } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t, homeHref } from "@/i18n/dict";
import { Section } from "./Track";

export default function Ending({ lang }: { lang: Lang }) {
  const d = t(lang);
  return (
    <Section id="son" align="center" scrim>
      <p className="eyebrow mb-5 gl-only">{d.ending.stack}</p>
      <h2 id="son-title" className="display h2 press">
        {L(site.availability, lang)}
      </h2>
      <p className="mt-6">
        <a className="link" href={homeHref(lang, "#giris")}>
          {site.name} ↑
        </a>
      </p>
    </Section>
  );
}
