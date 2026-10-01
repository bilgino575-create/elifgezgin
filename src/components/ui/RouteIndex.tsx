"use client";

import type { Lang } from "@/lib/content";
import { L } from "@/lib/content";
import { t } from "@/lib/i18n";
import { STOPS } from "@/lib/stops";
import { scrollToStop } from "@/lib/scroll";
import { useStore } from "@/lib/store";

/** The route map on the left edge (desktop) and a small "03 / 07" at the bottom on phones. Only with the stage. */
export default function RouteIndex({ lang }: { lang: Lang }) {
  const d = t(lang);
  const stop = useStore((s) => s.stop);
  const gl = useStore((s) => s.gl);
  if (!gl) return null;
  return (
    <>
      <nav className="route" aria-label={d.route.stop}>
        <ol>
          {STOPS.map((s, i) => (
            <li key={s.id} data-active={i === stop ? "true" : "false"}>
              <a
                href={`#durak-${s.n}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToStop(i);
                }}
                aria-current={i === stop ? "step" : undefined}
              >
                <span className="num meta">{String(s.n).padStart(2, "0")}</span>
                <span className="lbl meta">{L(s.label, lang)}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
