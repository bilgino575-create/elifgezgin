"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Lang } from "@/lib/content";
import { L, site, upper } from "@/lib/content";
import { home, otherLang, t } from "@/lib/i18n";
import { STOPS } from "@/lib/stops";
import { scrollToStop } from "@/lib/scroll";
import { store, useStore } from "@/lib/store";

/**
 * The route's signage: the name top left, three words top right, the
 * language, and on phones a full-screen menu of the seven stops. It takes
 * the current stop's ink and shrinks once the journey has begun.
 */
export default function Navigation({ lang, onHome = false }: { lang: Lang; onHome?: boolean }) {
  const d = t(lang);
  const p = useStore((s) => s.p);
  const menu = useStore((s) => s.menu);
  const first = useRef<HTMLAnchorElement>(null);
  const base = home(lang);
  const go = (i: number) => (e: React.MouseEvent) => {
    if (!onHome) return;
    e.preventDefault();
    store.set({ menu: false });
    scrollToStop(i);
  };
  const stopHref = (i: number) => (onHome ? `#durak-${i + 1}` : `${base}#durak-${i + 1}`);

  // the menu: focus moves in, Escape closes, the page behind stays put
  useEffect(() => {
    if (!menu) return;
    document.documentElement.classList.add("menu-open");
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && store.set({ menu: false });
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("menu-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  return (
    <header className="nav" data-shrunk={p > 0.02 ? "true" : "false"} data-menu={menu ? "open" : "closed"}>
      <Link href={base} className="brand" data-magnet onClick={onHome ? go(0) : undefined}>
        <span className="brand-first">{upper(site.firstName)}</span>{" "}
        <span className="brand-last">{upper(site.lastName)}</span>
        <span className="sr-only"> — {L(site.title, lang)}</span>
      </Link>
      <nav className="nav-links" aria-label={lang === "tr" ? "Site" : "Site"}>
        <ul className="meta">
          <li>
            <a href={stopHref(1)} onClick={go(1)} data-magnet>
              {d.nav.work}
            </a>
          </li>
          <li>
            <a href={stopHref(5)} onClick={go(5)} data-magnet>
              {d.nav.about}
            </a>
          </li>
          <li>
            <a href={stopHref(6)} onClick={go(6)} data-magnet>
              {d.nav.contact}
            </a>
          </li>
          <li className="lang">
            <a href={home(otherLang(lang))} hrefLang={otherLang(lang)} aria-label={`${d.nav.switch} · ${d.nav.switchLabel}`} data-magnet>
              {d.nav.switch}
            </a>
          </li>
        </ul>
      </nav>
      <button type="button" className="menu-btn meta" aria-expanded={menu} aria-controls="menu" onClick={() => store.set({ menu: !menu })}>
        <span className="menu-btn-label">{menu ? d.nav.close : d.nav.menu}</span>
        <span className="menu-btn-icon" aria-hidden="true">
          <i />
          <i />
        </span>
      </button>
      <div id="menu" className="menu" role="dialog" aria-modal="true" aria-label={d.nav.menu} hidden={!menu}>
        <ol className="menu-stops">
          {STOPS.map((s, i) => (
            <li key={s.id}>
              <a href={stopHref(i)} onClick={go(i)} ref={i === 0 ? first : undefined} className="display">
                <span className="num meta">{String(s.n).padStart(2, "0")}</span>
                <span className="lbl">{L(s.label, lang)}</span>
              </a>
            </li>
          ))}
        </ol>
        <div className="menu-foot meta">
          <a href={home(otherLang(lang))} hrefLang={otherLang(lang)}>
            {d.nav.switchLabel}
          </a>
          <span className="muted">{L(site.title, lang)}</span>
        </div>
      </div>
    </header>
  );
}
