import Link from "next/link";
import type { Lang, Work } from "@/lib/content";
import { L, works } from "@/lib/content";
import { t, workPath } from "@/lib/i18n";
import SplitWord from "@/components/ui/SplitWord";
import { pad } from "./Stop";

/** The editorial block of one work inside a stop: number, title, a line, meta, the way in. */
export default function ProjectBlock({ work, lang, compact = false, size = "display" }: { work: Work; lang: Lang; compact?: boolean; size?: "display" | "h2" }) {
  const d = t(lang);
  const index = works.indexOf(work) + 1;
  const href = workPath(lang, work.slug);
  return (
    <article className={`proj${compact ? " compact" : ""}`} aria-labelledby={`proj-${work.slug}`}>
      <p className="meta proj-kicker">
        <span>
          {d.work.project} {pad(index)}
        </span>
        <span className="sep" aria-hidden="true">
          —
        </span>
        <span>{d.categories[work.category]}</span>
        {work.sample ? <span className="tag">{d.work.sample}</span> : null}
      </p>
      <h2 id={`proj-${work.slug}`} className={compact ? "h3" : size}>
        <Link href={href} className="proj-title" data-cursor="open">
          <SplitWord text={L(work.title, lang)} />
        </Link>
      </h2>
      {!compact ? <p className="lead proj-text">{L(work.text, lang)}</p> : null}
      <dl className="proj-meta meta">
        <div>
          <dt>{d.work.year}</dt>
          <dd className="num">{work.year}</dd>
        </div>
        <div>
          <dt>{d.work.role}</dt>
          <dd>{L(work.role, lang)}</dd>
        </div>
      </dl>
      <Link href={href} className="cta" data-magnet data-cursor="open">
        <span>{d.work.open}</span>
        <span className="arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </article>
  );
}
