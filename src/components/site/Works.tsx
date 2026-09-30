import Image from "next/image";
import { works, L } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t, workHref } from "@/i18n/dict";
import { Section } from "./Track";
import { WorkFilter, WorkIndex } from "@/components/ui/WorksClient";
import Loop from "./Loop";

export default function Works({ lang }: { lang: Lang }) {
  const d = t(lang);
  const cats = Array.from(new Set(works.map((w) => w.category)));
  const hasSamples = works.some((w) => w.sample);
  return (
    <Section id="isler" wide scrim>
      <p className="eyebrow mb-4">{d.works.eyebrow}</p>
      <h2 id="isler-title" className="display h2">
        {d.works.title}
      </h2>
      {cats.length > 1 ? (
        <WorkFilter
          lang={lang}
          categories={cats.map((c) => ({ id: c, label: d.works.categories[c] }))}
          allLabel={d.works.all}
          filterLabel={d.works.filterLabel}
        />
      ) : null}

      {/* 3D layout: a compact index; the objects on the wall are the visuals */}
      <div className="gl-only mt-6">
        <WorkIndex
          lang={lang}
          items={works.map((w, i) => ({
            slug: w.slug,
            n: String(i + 1).padStart(2, "0"),
            title: L(w.title, lang),
            category: w.category,
            categoryLabel: d.works.categories[w.category],
            sample: w.sample,
            href: workHref(lang, w.slug),
          }))}
          sampleLabel={d.works.sample}
        />
      </div>

      <Loop name="portals" label={d.works.loop} className="mt-10" />
      {/* HTML layout: the wall as an editorial grid */}
      <ul className="works-grid html-only mt-10" data-filter-list>
        {works.map((w) => (
          <li key={w.slug} className="work-card" data-category={w.category}>
            <a href={workHref(lang, w.slug)}>
              <figure>
                <div className="frame">
                  <Image
                    src={w.cover.src1024}
                    alt={L(w.title, lang)}
                    width={w.cover.w}
                    height={w.cover.h}
                    sizes="(max-width: 767px) 90vw, 30vw"
                    placeholder="blur"
                    blurDataURL={w.cover.blur}
                  />
                </div>
                <figcaption>
                  <span>
                    {L(w.title, lang)}
                    {w.sample ? (
                      <>
                        {" "}
                        <span className="tag" title={d.works.sampleHint}>
                          {d.works.sample}
                        </span>
                      </>
                    ) : null}
                  </span>
                  <span className="meta num">
                    {d.works.categories[w.category]}
                    {w.year ? ` · ${w.year}` : ""}
                  </span>
                </figcaption>
              </figure>
            </a>
          </li>
        ))}
      </ul>
      {hasSamples ? <p className="meta mt-6 html-only">{d.works.sampleHint}</p> : null}
    </Section>
  );
}
