"use client";

import { useStore } from "@/lib/store";

/** The six steps beside the colour machine; the active stage comes from the scene. */
export default function ProcessIndex({ steps }: { steps: { id: string; title: string }[] }) {
  const stage = useStore((s) => s.stage);
  const act = useStore((s) => s.act);
  return (
    <ol className="index gl-only mt-6" id="surec-index">
      {steps.map((s, i) => (
        <li key={s.id} data-step={i} data-active={act === "machine" && stage === i}>
          <div className="row">
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <span className="t">{s.title}</span>
            <span className="c" />
          </div>
        </li>
      ))}
    </ol>
  );
}
