import Image from "next/image";
import Link from "next/link";
import type { Lang, Work } from "@/lib/content";
import { L, works, upper } from "@/lib/content";
import { home, t, workPath } from "@/lib/i18n";
import { workLd } from "@/lib/meta";
import Navigation from "@/components/ui/Navigation";
import CustomCursor from "@/components/ui/CustomCursor";
import SplitWord from "@/components/ui/SplitWord";
import WorkStage from "@/components/WorkStage";
import { pad } from "@/components/sections/Stop";

/**
 * A project's own experience: the artwork full-screen under the title, the
 * story and the facts, the piece lit on a small stage, the process, the
 * final work, the details, and the way on to the next one.
 */
export default function WorkPage({ lang, work }: { lang: Lang; work: Work }) {
  const d = t(lang);
  const index = works.indexOf(work);
  const next = works[(index + 1) % works.length];
  const vars = { "--bg": work.colors[0], "--bg2": work.colors[0], "--a": work.colors[1], "--b": work.colors[2] ?? work.colors[1], "--c": work.colors[2] ?? work.colors[1], "--fg": onColor(work.colors[0]), "--fg2": onColor(work.colors[0], true), "--ring": work.colors[1] } as React.CSSProperties;
  const title = L(work.title, lang);
  return (
    <div className="work" style={vars} data-stop="work">
      <a className="skip" href="#work-intro">
        {d.skip}
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(workLd(lang, work)) }} />
      <Navigation lang={lang} />
      <main id="main">
        <header className="work-hero">
          <div className="art" aria-hidden="true">
            <Image src={work.cover.src} alt="" width={work.cover.w} height={work.cover.h} priority sizes="100vw" placeholder="blur" blurDataURL={work.cover.blur} />
          </div>
          <p className="kicker meta">
            <Link href={`${home(lang)}#durak-${work.stop}`} className="back">
              ← {d.work.back}
            </Link>
            <span className="sep" aria-hidden="true">
              ·
            </span>
            <span>
              {d.work.project} {pad(index + 1)}
            </span>
            <span className="sep" aria-hidden="true">
              —
            </span>
            <span>{d.categories[work.category]}</span>
            <span className="num">{work.year}</span>
            {work.sample ? <span className="tag">{d.work.sample}</span> : null}
          </p>
          <h1 className="giant work-title">
            <SplitWord text={upper(title, lang)} />
          </h1>
        </header>

        <section className="work-intro" id="work-intro" aria-label={d.work.details}>
          <p className="lead">{L(work.text, lang)}</p>
          <dl className="meta">
            <div>
              <dt>{d.work.category}</dt>
              <dd>{d.categories[work.category]}</dd>
            </div>
            <div>
              <dt>{d.work.year}</dt>
              <dd className="num">{work.year}</dd>
            </div>
            <div>
              <dt>{d.work.role}</dt>
              <dd>{L(work.role, lang)}</dd>
            </div>
            {work.tools.length ? (
              <div>
                <dt>{d.work.tools}</dt>
                <dd>{work.tools.join(", ")}</dd>
              </div>
            ) : null}
            {work.client ? (
              <div>
                <dt>{lang === "tr" ? "Müşteri" : "Client"}</dt>
                <dd>{work.client}</dd>
              </div>
            ) : null}
            <div>
              <dt>{d.work.colors}</dt>
              <dd className="work-colors">
                {work.colors.map((c) => (
                  <i key={c} style={{ background: c }} title={c} />
                ))}
              </dd>
            </div>
          </dl>
        </section>

        <WorkStage work={work} lang={lang} />

        {work.process.length ? (
          <section className="work-section" aria-labelledby="process-title">
            <h2 id="process-title" className="meta">
              {d.work.process}
            </h2>
            <ol className="process cols">
              {work.process.map((s, i) => (
                <li key={i}>
                  <div>
                    <h3 className="h3">{L(s.title, lang)}</h3>
                    <p className="body">{L(s.text, lang)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="work-section" aria-labelledby="final-title">
          <h2 id="final-title" className="meta">
            {d.work.final}
          </h2>
        </section>
        <div className="gallery">
          {[work.cover, ...work.gallery].map((g, i) => (
            <figure key={i}>
              <Image src={g.src} alt={`${title} — ${pad(i + 1)}`} width={g.w} height={g.h} sizes="(max-width: 767px) 100vw, 60vw" placeholder="blur" blurDataURL={g.blur} loading={i === 0 ? "eager" : "lazy"} />
            </figure>
          ))}
        </div>

        {work.sample ? <p className="work-sample body">{d.work.sampleNote}</p> : null}

        <section className="work-next" aria-label={d.work.next}>
          <p className="meta">{d.work.next}</p>
          <Link href={workPath(lang, next.slug)} className="display" data-cursor="open">
            <SplitWord text={upper(L(next.title, lang), lang)} />
          </Link>
          <p className="meta">
            <Link href={home(lang)} className="cta">
              {d.work.allWork} <span aria-hidden="true">→</span>
            </Link>
          </p>
        </section>
      </main>
      <CustomCursor lang={lang} />
    </div>
  );
}

/** text colour for a hex ground: ink on light inks, off-white on dark ones */
function onColor(hex: string, muted = false) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  if (lum > 0.4) return muted ? "#3f3f4a" : "#07060f";
  return muted ? "#b9b6cc" : "#f7f6f2";
}
