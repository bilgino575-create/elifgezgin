import Image from "next/image";
import type { Work, WorkImage } from "@/lib/content";

/**
 * The work as an image for the 2D journey (no WebGL) — never shown while
 * the stage runs. Tilt is a CSS 3D lean on hover; glass is a translucent
 * frame; round and wide are the sculpture's and the spread's shapes.
 */
export default function FallbackArt({ work, image, tilt, glass, small, round, wide }: { work: Work; image?: WorkImage; tilt?: boolean; glass?: boolean; small?: boolean; round?: boolean; wide?: boolean }) {
  const img = image ?? work.cover;
  const cls = ["fb-art", tilt ? "tilt" : "", glass ? "glass" : "", small ? "small" : "", round ? "round" : "", wide ? "wide" : ""].filter(Boolean).join(" ");
  return (
    <figure className={cls} style={{ "--ar": `${img.w} / ${img.h}` } as React.CSSProperties}>
      <Image src={small ? img.small : img.src} alt="" width={img.w} height={img.h} sizes={small ? "30vw" : "(max-width: 767px) 90vw, 46vw"} placeholder="blur" blurDataURL={img.blur} />
    </figure>
  );
}
