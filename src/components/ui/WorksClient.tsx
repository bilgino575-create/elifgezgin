"use client";

import { useEffect } from "react";
import { store, useStore } from "@/lib/store";
import type { Category } from "@/i18n/dict";
import type { Lang } from "@/lib/content";

export function WorkFilter({
  categories,
  allLabel,
  filterLabel,
}: {
  lang: Lang;
  categories: { id: Category; label: string }[];
  allLabel: string;
  filterLabel: string;
}) {
  const filter = useStore((s) => s.filter);
  // the HTML grid filters through a data attribute; the 3D wall reads the store
  useEffect(() => {
    const list = document.querySelector<HTMLElement>("[data-filter-list]");
    if (!list) return;
    list.querySelectorAll<HTMLElement>("[data-category]").forEach((el) => {
      el.hidden = filter !== "all" && el.dataset.category !== filter;
    });
  }, [filter]);
  const all: { id: Category | "all"; label: string }[] = [{ id: "all", label: allLabel }, ...categories];
  return (
    <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={filterLabel}>
      {all.map((c) => (
        <button key={c.id} type="button" className="chip" aria-pressed={filter === c.id} onClick={() => store.set({ filter: c.id })}>
          {c.label}
        </button>
      ))}
    </div>
  );
}

export function WorkIndex({
  items,
  sampleLabel,
}: {
  lang: Lang;
  items: { slug: string; n: string; title: string; category: Category; categoryLabel: string; sample: boolean; href: string }[];
  sampleLabel: string;
}) {
  const filter = useStore((s) => s.filter);
  const hover = useStore((s) => s.hoverWork);
  const visible = items.filter((i) => filter === "all" || i.category === filter);
  return (
    <ol className="index">
      {visible.map((w) => (
        <li key={w.slug} data-active={hover === w.slug}>
          <a
            href={w.href}
            onPointerEnter={() => store.set({ hoverWork: w.slug })}
            onPointerLeave={() => store.set({ hoverWork: null })}
            onFocus={() => store.set({ hoverWork: w.slug })}
            onBlur={() => store.set({ hoverWork: null })}
            onClick={(e) => {
              // let the 3D layer fly the object to the camera first
              if (store.get().gl && !store.get().reducedMotion) {
                e.preventDefault();
                store.set({ opening: w.slug });
                window.setTimeout(() => {
                  window.location.href = w.href;
                }, 950);
              }
            }}
          >
            <span className="n">{w.n}</span>
            <span className="t">
              {w.title}
              {w.sample ? (
                <>
                  {" "}
                  <span className="tag">{sampleLabel}</span>
                </>
              ) : null}
            </span>
            <span className="c">{w.categoryLabel}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
