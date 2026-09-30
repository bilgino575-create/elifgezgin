import type { CSSProperties } from "react";
import { site, L } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t, noWidow } from "@/i18n/dict";
import { Section } from "./Track";
import { INKS } from "@/lib/inks";
import ProcessIndex from "@/components/ui/ProcessIndex";

export default function Process({ lang }: { lang: Lang }) {
  const d = t(lang);
  return (
    <Section id="surec" wide align="right" scrim>
      <p className="eyebrow mb-4">{d.process.eyebrow}</p>
      <h2 id="surec-title" className="display h2">
        {d.process.title}
      </h2>
      <ProcessIndex steps={site.process.map((s) => ({ id: s.id, title: L(s.title, lang) }))} />
      <ol className="steps html-only mt-10">
        {site.process.map((s, i) => (
          <li key={s.id} style={{ "--c": INKS[i % INKS.length] } as CSSProperties}>
            <h3>{L(s.title, lang)}</h3>
            <p>{noWidow(L(s.text, lang))}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
