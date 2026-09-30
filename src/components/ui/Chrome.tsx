"use client";

import type { Lang } from "@/lib/content";
import ScrollDriver from "./ScrollDriver";
import ExperienceLoader from "./ExperienceLoader";
import Preloader from "./Preloader";
import Cursor from "./Cursor";
import DebugHud from "./DebugHud";
import Confetti from "./Confetti";

/** Everything client-side that sits around the document. */
export default function Chrome({ lang }: { lang: Lang }) {
  return (
    <>
      <ScrollDriver />
      <ExperienceLoader />
      <Preloader lang={lang} />
      <Cursor />
      <Confetti />
      <DebugHud />
    </>
  );
}
