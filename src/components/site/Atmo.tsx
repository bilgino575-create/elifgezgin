import { atmo } from "@/content/atmosphere.generated";
import type { Lang } from "@/lib/content";
import { t } from "@/i18n/dict";

/**
 * One atmosphere image as a section visual on the no-WebGL page: AVIF/WebP,
 * lazy, with slow CSS motion (Ken Burns + parallax drift). These are
 * abstract art-direction visuals, never works; the alt says so.
 */
export default function Atmo({ id, lang, className = "" }: { id: string; lang: Lang; className?: string }) {
  const a = atmo(id);
  if (!a) return null;
  const alt = t(lang).atmo[id as keyof ReturnType<typeof t>["atmo"]] ?? t(lang).atmo.generic;
  return (
    <figure className={`atmo html-only ${className}`} style={{ aspectRatio: `${a.w} / ${a.h}` }}>
      <picture>
        <source type="image/avif" srcSet={`${a.avif800} 800w, ${a.avif1600} 1600w`} sizes="(max-width: 767px) 92vw, 60vw" />
        <img src={a.webp1600} srcSet={`${a.webp800} 800w, ${a.webp1600} 1600w`} sizes="(max-width: 767px) 92vw, 60vw" alt={alt} loading="lazy" decoding="async" width={a.w} height={a.h} />
      </picture>
    </figure>
  );
}
