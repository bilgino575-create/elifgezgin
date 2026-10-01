import type { Lang, Work } from "@/lib/content";
import Stop from "./Stop";
import ProjectBlock from "./ProjectBlock";
import FallbackArt from "./FallbackArt";

/** 04 AFİŞ — the floating poster that leans toward the hand, then the series that scatters into particles; acid green and black. */
export default function Poster({ lang, works }: { lang: Lang; works: Work[] }) {
  const poster = works.find((w) => w.presentation === "poster") ?? works[0];
  const series = works.find((w) => w.presentation === "particles" && w !== poster);
  const art = (
    <div className="fb-posters">
      {poster ? <FallbackArt work={poster} tilt /> : null}
      {series ? (
        <div className="fb-series">
          <FallbackArt work={series} small />
          {series.gallery.slice(0, 2).map((g, i) => (
            <FallbackArt key={i} work={series} image={g} small />
          ))}
        </div>
      ) : null}
    </div>
  );
  return (
    <Stop id="afis" lang={lang} art={art}>
      <div className="stack">
        {poster ? <ProjectBlock work={poster} lang={lang} size="h2" /> : null}
        {series ? <ProjectBlock work={series} lang={lang} compact /> : null}
      </div>
    </Stop>
  );
}
