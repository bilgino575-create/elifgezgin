import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "../../content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${site.title.tr}`;

/** The share image: the art-direction visual (blue splash, colour fan, no text by design) with the name set live in the display face, top-left. */
export default async function Image() {
  const display = await readFile(join(process.cwd(), "assets", "fonts", "BricolageGrotesque-800.ttf"));
  const bg = await readFile(join(process.cwd(), "content", "atmosphere", "elif-10-paylasim-og-1200x630.jpg"));
  const src = `data:image/jpeg;base64,${bg.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0a0a12", color: "#f6f6fa", fontFamily: "Bricolage" }}>
        <img src={src} width={1200} height={630} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
        <div style={{ position: "absolute", left: 72, top: 84, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, letterSpacing: 4, color: "#c9c9da" }}>
            <div style={{ width: 36, height: 4, background: site.spotColor, borderRadius: 2 }} />
            {site.title.tr.toLocaleUpperCase("tr-TR")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 128, lineHeight: 0.9, letterSpacing: -5, marginTop: 22 }}>
            <div style={{ display: "flex" }}>{site.firstName.toLocaleUpperCase("tr-TR")}</div>
            <div style={{ display: "flex" }}>{site.lastName.toLocaleUpperCase("tr-TR")}</div>
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 22, color: "#9a9ab4" }}>{site.url.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Bricolage", data: display, style: "normal", weight: 800 }] }
  );
}
