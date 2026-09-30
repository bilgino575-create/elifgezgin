import type { CSSProperties, ReactNode } from "react";
import { TRACK_VH, sectionById } from "@/lib/acts";

/** The scroll track: fixed-height with WebGL, a plain document without. */
export default function Track({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="track" style={{ "--track-vh": TRACK_VH.desktop } as CSSProperties}>
      {children}
    </main>
  );
}

interface SectionProps {
  id: string;
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  wide?: boolean;
  /** render the panel as an index card (paper) over the 3D scene */
  card?: boolean;
}

export function Section({ id, children, className = "", align = "left", wide = false, card = false }: SectionProps) {
  const s = sectionById(id);
  const style = s ? ({ "--from": s.from, "--to": s.to } as CSSProperties) : undefined;
  return (
    <section
      id={id}
      className={`section ${className}`}
      style={style}
      data-anchor={s?.anchor}
      aria-labelledby={`${id}-title`}
    >
      <div className="panel">
        <div className={`panel-body align-${align}${wide ? " wide" : ""}${card ? " card-index" : ""}`}>{children}</div>
      </div>
    </section>
  );
}
