import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * A short video loop captured from the real 3D scene (scripts/capture.mjs),
 * shown only on the no-WebGL page. Muted, looping, with a poster, never
 * preloaded, so the LCP stays the HTML text. When a loop has not been
 * captured yet nothing renders; browsers without VP9 keep the poster.
 */
export default function Loop({ name, label, className = "" }: { name: string; label: string; className?: string }) {
  const dir = join(process.cwd(), "public", "loops");
  if (!existsSync(join(dir, `${name}.webm`)) || !existsSync(join(dir, `${name}.webp`))) return null;
  return (
    <figure className={`loop html-only ${className}`}>
      <video src={`/loops/${name}.webm`} poster={`/loops/${name}.webp`} muted loop playsInline autoPlay preload="none" width={1280} height={720} aria-label={label} />
    </figure>
  );
}
