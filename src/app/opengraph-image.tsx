import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "../../content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${site.title.tr}`;

/** A debossed-paper render of the name: paper tone, a soft emboss, the spot line. */
export default async function Image() {
  const serif = await readFile(join(process.cwd(), "assets", "fonts", "InstrumentSerif-Regular.ttf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #f8f7f3 0%, #f2f1ec 60%, #ebe9e2 100%)",
          color: "#111214",
          fontFamily: "Instrument",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, letterSpacing: 3, color: "#55565b", textTransform: "uppercase" }}>
          <div style={{ width: 36, height: 3, background: site.spotColor }} />
          {site.title.tr}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Instrument",
            fontSize: 212,
            lineHeight: 0.92,
            letterSpacing: -6,
            marginTop: 24,
            color: "#141517",
            textShadow: "0 1px 0 rgba(255,255,255,0.9), 0 -1px 0 rgba(0,0,0,0.18)",
          }}
        >
          {site.name}
        </div>
        <div style={{ display: "flex", marginTop: 40, width: 120, height: 5, background: site.spotColor, borderRadius: 3 }} />
        <div style={{ display: "flex", marginTop: 28, fontSize: 24, color: "#55565b" }}>{site.url.replace(/^https?:\/\//, "")}</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument", data: serif, style: "normal", weight: 400 },
      ],
    }
  );
}
