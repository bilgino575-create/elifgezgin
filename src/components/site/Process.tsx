import { site, L } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t, noWidow } from "@/i18n/dict";
import { Section } from "./Track";

export default function Process({ lang }: { lang: Lang }) {
  const d = t(lang);
  return (
    <Section id="surec" wide align="right" card>
      <p className="eyebrow mb-4">{d.process.eyebrow}</p>
      <h2 id="surec-title" className="display h2">
        {d.process.title}
      </h2>
      <ol className="index gl-only mt-6" id="surec-index">
        {site.process.map((s, i) => (
          <li key={s.id} data-step={i}>
            <div className="row">
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="t">{L(s.title, lang)}</span>
              <span className="c" />
            </div>
          </li>
        ))}
      </ol>
      <ol className="steps html-only mt-10">
        {site.process.map((s) => (
          <li key={s.id}>
            <h3>{L(s.title, lang)}</h3>
            <p>{noWidow(L(s.text, lang))}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
