import type { Lang } from "@/lib/content";
import { L } from "@/lib/content";
import { STOPS, type StopId } from "@/lib/stops";
import { t } from "@/lib/i18n";

export const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One stop of the journey: a full-height section whose layer sticks to the
 * viewport while the camera holds, then scrolls away as the camera travels.
 * The section carries its own palette as CSS variables, so the layer, the
 * nav and the 2D journey all take the stop's colours.
 */
export default function Stop({ id, lang, children, art }: { id: StopId; lang: Lang; children: React.ReactNode; art?: React.ReactNode }) {
  const s = STOPS.find((x) => x.id === id)!;
  const d = t(lang);
  const pal = s.palette;
  const vars = { "--i": s.n - 1, "--bg": pal.bg, "--bg2": pal.bg2, "--a": pal.a, "--b": pal.b, "--c": pal.c, "--fg": pal.fg, "--fg2": pal.fg2, "--ring": pal.a === pal.fg ? pal.b : pal.a } as React.CSSProperties;
  return (
    <section id={`durak-${s.n}`} className={`stop corner-${s.corner}`} data-stop={s.id} data-n={s.n} style={vars} aria-label={`${d.route.stop} ${s.n}: ${L(s.label, lang)}`}>
      <div className="stop-layer">
        <p className="stop-head meta">
          <span className="num">{pad(s.n)}</span>
          <span className="sep" aria-hidden="true">
            / {pad(STOPS.length)}
          </span>
          <span className="name">{L(s.label, lang)}</span>
        </p>
        <div className="stop-body">{children}</div>
        {art ? (
          <div className="fb" aria-hidden="true">
            {art}
          </div>
        ) : null}
      </div>
    </section>
  );
}
