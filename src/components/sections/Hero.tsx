import type { Lang } from "@/lib/content";
import { L, site, upper } from "@/lib/content";
import { t } from "@/lib/i18n";
import Stop from "./Stop";

/**
 * 01 RENK. The name is sculpture on the stage (chrome ELİF, holographic
 * GEZGİN); the profession is the typographic statement in HTML, bottom
 * left. Without WebGL the name comes back as giant type and the three
 * inks as light.
 */
export default function Hero({ lang }: { lang: Lang }) {
  const d = t(lang);
  const role = L(site.title, lang).split(" ");
  const art = (
    <div className="fb-hero">
      <p className="fb-name giant" aria-hidden="true">
        <span className="l1">{upper(site.firstName)}</span>
        <span className="l2 outline">{upper(site.lastName)}</span>
      </p>
      <i className="glow glow-a" />
      <i className="glow glow-b" />
      <i className="glow glow-c" />
      <svg className="fb-ribbon" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-50 420 C 200 120, 420 560, 640 300 S 1000 80, 1260 260" fill="none" stroke="var(--c)" strokeWidth="3" />
        <path d="M-50 470 C 220 180, 440 600, 660 350 S 1020 130, 1260 310" fill="none" stroke="var(--b)" strokeWidth="2" opacity="0.7" />
      </svg>
    </div>
  );
  return (
    <Stop id="renk" lang={lang} art={art}>
      <div className="hero">
        <h1 className="hero-h1">
          <span className="sr-only">{site.name} — </span>
          <span className="hero-role">
            {role.map((w, i) => (
              <span className="line" key={i}>{i ? " " : null}
                {upper(w, lang)}
              </span>
            ))}
          </span>
        </h1>
        <p className="serif-lead hero-tag">{L(site.tagline, lang)}</p>
        <p className="meta hero-hint">
          <span>{d.hero.scroll}</span>
          <span className="fine-only">· {d.hero.hint}</span>
        </p>
      </div>
    </Stop>
  );
}
