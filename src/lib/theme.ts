"use client";

import { store, type Theme } from "./store";

const KEY = "eg-theme";

/** Inline script (runs before paint) that applies the stored or preferred theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;

export function readTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "dark" ? "dark" : "light";
}

export function setTheme(t: Theme, persist = true) {
  document.documentElement.dataset.theme = t;
  store.set({ theme: t });
  if (persist) {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* private mode */
    }
  }
}

export function toggleTheme() {
  setTheme(readTheme() === "dark" ? "light" : "dark");
}
