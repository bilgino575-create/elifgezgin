import type { Lang } from "@/lib/content";
import { L, site, upper } from "@/lib/content";
import { t } from "@/lib/i18n";
import Stop from "./Stop";

/** 06 ELİF — the installation: the name as sculpture, the disciplines drifting in depth, the statue. */
export default function About({ lang }: { lang: Lang }) {
  const d = t(lang);
  const paragraphs = L(site.bio, lang).split(/\n\s*\n/).filter(Boolean);
  const art = (
    <div className="fb-about" aria-hidden="true">
      {site.disciplines.map((w, i) => (
        <span className="fb-word meta" key={i} style={{ "--i": i } as React.CSSProperties}>
          {upper(L(w, lang), lang)}
        </span>
      ))}
      <p className="fb-name giant">
        <span className="l1">{upper(site.firstName)}</span>
        <span className="l2 outline">{upper(site.lastName)}</span>
      </p>
    </div>
  );
  return (
    <Stop id="elif" lang={lang} art={art}>
      <div className="about">
        <p className="meta eyebrow">{d.about.eyebrow}</p>
        <h2 className="h2 about-name">{site.name}</h2>
        <div className="about-prose lead">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <ul className="about-words meta" aria-label={d.about.eyebrow}>
          {site.disciplines.map((w, i) => (
            <li key={i}>{L(w, lang)}</li>
          ))}
        </ul>
        <p className="sr-only gl-only">{d.about.statue}</p>
      </div>
    </Stop>
  );
}
