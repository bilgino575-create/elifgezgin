import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { L, upper, works, type Lang } from "@/lib/content";
import { t } from "@/lib/i18n";

export const ogSize = { width: 1200, height: 630 };

/** The share card of a project: its cover on the right, its title in Archivo Black on its own ground colour. */
export async function workOg(lang: Lang, slug: string) {
  const w = works.find((x) => x.slug === slug);
  const black = await readFile(join(process.cwd(), "assets/fonts/Archivo-Condensed-Black.ttf"));
  if (!w) return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#07060f" }} />, { ...ogSize });
  // the renderer takes PNG; the small WebP derivative is converted once at build time
  const sharp = (await import("sharp")).default;
  const cover = await sharp(join(process.cwd(), "public", w.cover.small)).resize({ width: 420, height: 502, fit: "cover" }).png().toBuffer();
  const src = `data:image/png;base64,${cover.toString("base64")}`;
  const d = t(lang);
  const light = isLight(w.colors[0]);
  const fg = light ? "#07060f" : "#f7f6f2";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: w.colors[0], color: fg, fontFamily: "Archivo Condensed", padding: 64, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 620 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, opacity: 0.8 }}>{`${upper(d.work.project, lang)} · ${upper(d.categories[w.category], lang)} · ${w.year}`}</div>
          <div style={{ display: "flex", fontSize: 150, lineHeight: 0.86, letterSpacing: -2 }}>{upper(L(w.title, lang), lang)}</div>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 4 }}>ELİF GEZGİN</div>
        </div>
        <div style={{ position: "absolute", right: 64, top: 64, bottom: 64, width: 420, display: "flex", overflow: "hidden", borderRadius: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={420} height={502} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
        </div>
      </div>
    ),
    { ...ogSize, fonts: [{ name: "Archivo Condensed", data: black, weight: 900, style: "normal" }] }
  );
}

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5;
}
