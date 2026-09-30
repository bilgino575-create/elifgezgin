"use client";

import dynamic from "next/dynamic";
import type { Lang } from "@/lib/content";
import { useStore } from "@/lib/store";
import ScrollDriver from "./ScrollDriver";
import ExperienceLoader from "./ExperienceLoader";
import Preloader from "./Preloader";
import Cursor from "./Cursor";

// only fetched when first needed: the HUD on `?debug`/`D`, the confetti on the first "elif"
const DebugHud = dynamic(() => import("./DebugHud"), { ssr: false });
const Confetti = dynamic(() => import("./Confetti"), { ssr: false });

/** Everything client-side that sits around the document. */
export default function Chrome({ lang }: { lang: Lang }) {
  const debug = useStore((s) => s.debug);
  const confetti = useStore((s) => s.confetti);
  return (
    <>
      <ScrollDriver />
      <ExperienceLoader />
      <Preloader lang={lang} />
      <Cursor />
      {confetti > 0 ? <Confetti /> : null}
      {debug ? <DebugHud /> : null}
    </>
  );
}
