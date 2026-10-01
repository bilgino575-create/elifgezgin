import type { Lang, Work } from "@/lib/content";
import { L } from "@/lib/content";
import Stop from "./Stop";
import ProjectBlock from "./ProjectBlock";
import FallbackArt from "./FallbackArt";

/** 02 TİPOGRAFİ — the typographic identity as chrome letters; cream, cobalt, orange. */
export default function Typography({ lang, works }: { lang: Lang; works: Work[] }) {
  const w = works[0];
  const word = w ? L(w.title, lang) : "SES";
  const art = (
    <div className="fb-type">
      <p className="fb-widths giant" aria-hidden="true">
        {[62, 75, 88, 100, 112, 125].map((s) => (
          <span key={s} style={{ fontStretch: `${s}%` }}>
            {word}
          </span>
        ))}
      </p>
      {w ? <FallbackArt work={w} tilt /> : null}
    </div>
  );
  return (
    <Stop id="tipografi" lang={lang} art={art}>
      {w ? <ProjectBlock work={w} lang={lang} /> : null}
    </Stop>
  );
}
