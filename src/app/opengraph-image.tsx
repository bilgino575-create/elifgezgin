import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "../../content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${site.title.tr}`;

/** The stage in one frame: black, four inks bleeding at the edges, the name in the display face, the spot line. */
export default async function Image() {
  const display = await readFile(join(process.cwd(), "assets", "fonts", "BricolageGrotesque-800.ttf"));
  const blob = (color: string, x: string, y: string, s: number) => (
    <div style={{ position: "absolute", left: x, top: y, width: s, height: s, background: `radial-gradient(circle at 50% 50%, ${color} 0%, ${color}66 30%, ${color}00 68%)` }} />
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 96px", background: "#0a0a12", color: "#f6f6fa", fontFamily: "Bricolage", position: "relative", overflow: "hidden" }}>
        {blob(site.spotColor, "-360px", "-420px", 1000)}
        {blob("#ff2e88", "640px", "-460px", 980)}
        {blob("#00c8ff", "560px", "160px", 900)}
        {blob("#ffd400", "-420px", "220px", 760)}
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, letterSpacing: 4, color: "#c9c9da", textTransform: "uppercase" }}>
          <div style={{ width: 40, height: 4, background: site.spotColor, borderRadius: 2 }} />
          {site.title.tr.toLocaleUpperCase("tr-TR")}
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 176, lineHeight: 0.9, letterSpacing: -7, marginTop: 28 }}>
          <div style={{ display: "flex" }}>{site.firstName.toLocaleUpperCase("tr-TR")}</div>
          <div style={{ display: "flex" }}>{site.lastName.toLocaleUpperCase("tr-TR")}</div>
        </div>
        <div style={{ display: "flex", marginTop: 36, fontSize: 26, color: "#9a9ab4" }}>{site.url.replace(/^https?:\/\//, "")}</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Bricolage", data: display, style: "normal", weight: 800 }] }
  );
}
