import type { Lang, Work } from "@/lib/content";
import Stop from "./Stop";
import ProjectBlock from "./ProjectBlock";
import FallbackArt from "./FallbackArt";

/** 05 DİJİTAL SANAT — a generative piece projected on a sculpture, and a magazine spread that opens in space; a white studio. */
export default function DigitalArt({ lang, works }: { lang: Lang; works: Work[] }) {
  const projection = works.find((w) => w.presentation === "projection") ?? works[0];
  const spread = works.find((w) => w.presentation === "spread" && w !== projection);
  const art = (
    <div className="fb-digital">
      {projection ? <FallbackArt work={projection} round /> : null}
      {spread ? <FallbackArt work={spread} wide /> : null}
    </div>
  );
  return (
    <Stop id="dijital" lang={lang} art={art}>
      <div className="row">
        {projection ? <ProjectBlock work={projection} lang={lang} compact /> : null}
        {spread ? <ProjectBlock work={spread} lang={lang} compact /> : null}
      </div>
    </Stop>
  );
}
