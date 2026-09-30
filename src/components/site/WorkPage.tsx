import Image from "next/image";
import { notFound } from "next/navigation";
import { L, nextWork, workBySlug, site } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t, workHref, homeHref, noWidow } from "@/i18n/dict";

export default function WorkPage({ lang, slug }: { lang: Lang; slug: string }) {
  const w = workBySlug(slug);
  if (!w) notFound();
  const d = t(lang);
  const next = nextWork(slug);
  return (
    <main id="main" className="work-page" style={{ paddingTop: "calc(var(--nav-h) + 3rem)" }}>
      <article className="wrap">
        <p className="eyebrow mb-4">
          <a href={homeHref(lang, "#isler")} className="link" style={{ backgroundImage: "none" }}>
            {d.works.back}
          </a>
        </p>
        <header className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="display h2 press">{L(w.title, lang)}</h1>
            {w.sample ? (
              <p className="mt-3">
                <span className="tag">{d.works.sample}</span> <span className="meta">{d.works.sampleHint}</span>
              </p>
            ) : null}
          </div>
          <dl className="facts">
            <div>
              <dt>{d.works.categories[w.category]}</dt>
              <dd>{d.works.objects[w.category]}</dd>
            </div>
            {w.year ? (
              <div>
                <dt>{d.works.year}</dt>
                <dd className="num">{w.year}</dd>
              </div>
            ) : null}
            {w.role ? (
              <div>
                <dt>{d.works.role}</dt>
                <dd>{L(w.role, lang)}</dd>
              </div>
            ) : null}
            {w.tools.length ? (
              <div>
                <dt>{d.works.tools}</dt>
                <dd>{w.tools.join(", ")}</dd>
              </div>
            ) : null}
            {w.client ? (
              <div>
                <dt>{d.works.client}</dt>
                <dd>{w.client}</dd>
              </div>
            ) : null}
          </dl>
        </header>

        {L(w.text, lang) ? <p className="lead mt-8">{noWidow(L(w.text, lang))}</p> : null}

        <div className="gallery mt-12">
          <figure>
            <Image
              src={w.cover.src2048}
              alt={L(w.title, lang)}
              width={w.cover.w}
              height={w.cover.h}
              sizes="(max-width: 1200px) 92vw, 1100px"
              priority
              placeholder="blur"
              blurDataURL={w.cover.blur}
              style={{ maxHeight: "85vh", width: "auto" }}
            />
          </figure>
          {w.gallery.map((g, i) => (
            <figure key={g.src}>
              <Image
                src={g.src}
                alt={`${L(w.title, lang)} — ${d.works.gallery} ${i + 1}`}
                width={g.w}
                height={g.h}
                sizes="(max-width: 1200px) 92vw, 1100px"
                placeholder="blur"
                blurDataURL={g.blur}
                style={{ maxHeight: "85vh", width: "auto" }}
              />
            </figure>
          ))}
        </div>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
          <a className="link" href={homeHref(lang, "#isler")}>
            {d.works.back}
          </a>
          {next ? (
            <a className="btn" href={workHref(lang, next.slug)}>
              {d.works.next}: {L(next.title, lang)} →
            </a>
          ) : null}
        </footer>
        <p className="meta mt-8">{site.name}</p>
      </article>
    </main>
  );
}
