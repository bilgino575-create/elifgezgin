"use client";

import Image from "next/image";
import { useEffect, useState, type ComponentType } from "react";
import type { Lang, Work } from "@/lib/content";

/**
 * The piece on a small stage of its own: a WebGL canvas that arrives after
 * the page has painted (the sheet lit by the project's inks, leaning toward
 * the pointer); until then, and without WebGL, the still with a CSS lean.
 */
export default function WorkStage({ work, lang }: { work: Work; lang: Lang }) {
  const [Stage, setStage] = useState<ComponentType<{ work: Work; lang: Lang }> | null>(null);
  useEffect(() => {
    if (!document.documentElement.classList.contains("gl")) return;
    let on = true;
    const load = () => import("@/components/3d/WorkScene").then((m) => on && setStage(() => m.default));
    if ("requestIdleCallback" in window) window.requestIdleCallback(load, { timeout: 1500 });
    else setTimeout(load, 300);
    return () => {
      on = false;
    };
  }, []);
  return (
    <div className="work-stage" aria-hidden="true">
      {Stage ? (
        <Stage work={work} lang={lang} />
      ) : (
        <div className="still">
          <Image src={work.cover.src} alt="" width={work.cover.w} height={work.cover.h} sizes="(max-width: 767px) 90vw, 60vw" placeholder="blur" blurDataURL={work.cover.blur} />
        </div>
      )}
    </div>
  );
}
