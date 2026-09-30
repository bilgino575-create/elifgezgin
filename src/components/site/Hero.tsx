import { site, L } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t, noWidow, upper } from "@/i18n/dict";
import { Section } from "./Track";
import HandType from "@/components/ui/HandType";
import Loop from "./Loop";
import Atmo from "./Atmo";

/** One span per letter so the variable axes can follow the hand. */
function Letters({ text, lang }: { text: string; lang: Lang }) {
  const word = upper(text, lang);
  return (
    <>
      {Array.from(word).map((ch, i) => (
        <span key={i} className="l" aria-hidden="true" style={{ "--i": i } as React.CSSProperties}>
          {ch}
        </span>
      ))}
      <span className="sr-only">{word}</span>
    </>
  );
}

export default function Hero({ lang }: { lang: Lang }) {
  const d = t(lang);
  return (
    <Section id="giris">
      <div className="field html-only" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <p className="eyebrow mb-6">{L(site.title, lang)}</p>
      <h1 id="giris-title" className="display h1 press" data-hand>
        <span className="block">
          <Letters text={site.firstName} lang={lang} />
        </span>
        <span className="block">
          <Letters text={site.lastName} lang={lang} />
        </span>
      </h1>
      <p className="lead mt-8">{noWidow(L(site.description, lang))}</p>
      <p className="meta mt-8 gl-only">
        {d.hero.scroll} · {d.hero.lampHint}
      </p>
      <Atmo id="elif-01-murekkep-damlasi" lang={lang} className="hero-atmo" />
      <Loop name="hero" label={d.hero.loop} className="hero-loop" />
      <HandType />
    </Section>
  );
}
