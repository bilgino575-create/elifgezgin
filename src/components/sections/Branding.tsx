import type { Lang, Work } from "@/lib/content";
import Stop from "./Stop";
import ProjectBlock from "./ProjectBlock";
import FallbackArt from "./FallbackArt";

/** 03 MARKA — the identity system inside a glass cube; deep purple, magenta, cyan. */
export default function Branding({ lang, works }: { lang: Lang; works: Work[] }) {
  const w = works[0];
  const art = w ? (
    <div className="fb-glass">
      <FallbackArt work={w} glass />
    </div>
  ) : null;
  return (
    <Stop id="marka" lang={lang} art={art}>
      {w ? <ProjectBlock work={w} lang={lang} /> : null}
    </Stop>
  );
}
