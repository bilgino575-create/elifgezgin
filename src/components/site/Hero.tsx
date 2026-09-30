import { site, L } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t, noWidow } from "@/i18n/dict";
import { Section } from "./Track";

export default function Hero({ lang }: { lang: Lang }) {
  const d = t(lang);
  return (
    <Section id="giris">
      <p className="eyebrow mb-6">{L(site.title, lang)}</p>
      <h1 id="giris-title" className="display h1 press">
        {site.firstName}
        <br />
        {site.lastName}
      </h1>
      <span className="spot-line mt-7" aria-hidden="true" />
      <p className="lede mt-6">{noWidow(L(site.description, lang))}</p>
      <p className="meta mt-10 gl-only">
        {d.hero.scroll} · {d.hero.lampHint}
      </p>
    </Section>
  );
}
