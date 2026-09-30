import Image from "next/image";
import { site, portrait, L } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t, noWidow } from "@/i18n/dict";
import { Section } from "./Track";
import { Mark } from "./Mark";

export default function About({ lang }: { lang: Lang }) {
  const d = t(lang);
  const paragraphs = L(site.bio, lang).split(/\n\s*\n/).filter(Boolean);
  return (
    <Section id="hakkimda" wide align="right" card>
      <p className="eyebrow mb-4">{d.about.eyebrow}</p>
      <h2 id="hakkimda-title" className="display h2">
        {d.about.title}
      </h2>
      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,18rem)_1fr] md:items-start">
        <div className="print html-only">
          {portrait ? (
            <Image src={portrait.src} alt={site.name} width={portrait.w} height={portrait.h} sizes="(max-width: 767px) 90vw, 18rem" placeholder="blur" blurDataURL={portrait.blur} />
          ) : (
            <Mark className="h-2/5 w-2/5" title={d.about.monogram} />
          )}
          <div className="halftone" />
        </div>
        <div className="prose lede">
          {paragraphs.map((p, i) => (
            <p key={i}>{noWidow(p)}</p>
          ))}
        </div>
      </div>
    </Section>
  );
}
