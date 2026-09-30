"use client";

import { useEffect } from "react";
import { store, useStore } from "@/lib/store";
import { scrollToHash } from "@/lib/scroll";
import { toggleTheme } from "@/lib/theme";
import { audio } from "@/lib/audio";
import { t, homeHref } from "@/i18n/dict";
import type { Lang } from "@/lib/content";

type Link = { href: string; label: string };

const idOf: Record<string, string> = { "#isler": "isler", "#beceriler": "beceriler", "#surec": "surec", "#hakkimda": "hakkimda", "#iletisim": "iletisim" };

function useGo() {
  return (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    if (!document.getElementById(idOf[href] ?? "")) return; // not on the home page: let the browser navigate
    e.preventDefault();
    store.set({ menuOpen: false });
    scrollToHash(href);
  };
}

export default function NavLinks({ links, lang }: { links: Link[]; lang: Lang }) {
  const section = useStore((s) => s.section);
  const go = useGo();
  const active = section === "son" ? "#iletisim" : `#${section}`;
  return (
    <nav className="nav-links hidden md:flex" aria-label={t(lang).nav.works}>
      {links.map((l) => (
        <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)} aria-current={active === l.href ? "true" : undefined}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}

export function NavTools({ lang, links }: { lang: Lang; links: Link[] }) {
  const d = t(lang);
  const theme = useStore((s) => s.theme);
  const sound = useStore((s) => s.sound);
  const gl = useStore((s) => s.gl);
  const menuOpen = useStore((s) => s.menuOpen);
  const go = useGo();
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && store.set({ menuOpen: false });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const dark = theme === "dark";
  return (
    <div className="nav-tools">
      <a className="icon-btn" href={d.otherLangHref} lang={lang === "tr" ? "en" : "tr"} hrefLang={lang === "tr" ? "en" : "tr"}>
        {lang === "tr" ? "EN" : "TR"}
        <span className="sr-only"> {d.otherLang}</span>
      </a>
      <button type="button" className="icon-btn" onClick={toggleTheme} aria-pressed={dark} title={dark ? d.ui.themeLight : d.ui.theme}>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          {dark ? (
            <circle cx="8" cy="8" r="4.5" fill="currentColor" />
          ) : (
            <path d="M10.5 2.5a6 6 0 1 0 3 8.5A5 5 0 0 1 10.5 2.5Z" fill="currentColor" />
          )}
        </svg>
        <span className="sr-only">{dark ? d.ui.themeLight : d.ui.theme}</span>
      </button>
      {gl ? (
        <button
          type="button"
          className="icon-btn"
          aria-pressed={sound}
          onClick={() => audio.toggle().then((on) => store.set({ sound: on }))}
          title={sound ? d.ui.soundOn : d.ui.soundOff}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
            {sound ? <path d="M11 5.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
          </svg>
          <span className="sr-only">{sound ? d.ui.soundOn : d.ui.soundOff}</span>
        </button>
      ) : null}
      {links.length ? (
        <button
          type="button"
          className="icon-btn md:hidden"
          aria-expanded={menuOpen}
          aria-controls="menu"
          aria-label={menuOpen ? d.ui.close : d.ui.menu}
          onClick={() => store.set({ menuOpen: !menuOpen })}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 5h12M2 11h12" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      ) : null}
      {links.length ? (
        <div id="menu" hidden={!menuOpen} className="menu-sheet md:hidden">
          <nav aria-label={d.ui.menu}>
            {links.map((l) => (
              <a key={l.href} href={homeHref(lang, l.href)} onClick={(e) => go(e, l.href)}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
