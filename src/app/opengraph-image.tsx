import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/content";

export const alt = "Elif Gezgin — Grafik Tasarımcı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share card: the name in Archivo Black over the three inks of the first stop. */
export default async function Image() {
  const black = await readFile(join(process.cwd(), "assets/fonts/Archivo-Black.ttf"));
  const cond = await readFile(join(process.cwd(), "assets/fonts/Archivo-Condensed-Black.ttf"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#07060f", color: "#f7f6f2", position: "relative", padding: 72, fontFamily: "Archivo" }}>
        <div style={{ position: "absolute", left: 760, top: 40, width: 520, height: 520, borderRadius: 999, background: "#1f3bff", opacity: 0.95 }} />
        <div style={{ position: "absolute", left: 980, top: 300, width: 260, height: 260, borderRadius: 999, background: "#ff2e88" }} />
        <div style={{ position: "absolute", left: 700, top: 420, width: 120, height: 120, borderRadius: 999, background: "#19e3ff" }} />
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 4, color: "#a9a6c2" }}>01 / 07 — RENK</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", fontFamily: "Archivo Condensed", fontSize: 236, lineHeight: 0.82, letterSpacing: -4 }}>
          <span>ELİF</span>
          <span>GEZGİN</span>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 40, letterSpacing: 6, color: "#f7f6f2" }}>GRAFİK TASARIMCI</div>
        <div style={{ display: "flex", marginTop: 10, fontSize: 24, color: "#a9a6c2" }}>{site.url.replace(/^https?:\/\//, "")}</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: black, weight: 900, style: "normal" },
        { name: "Archivo Condensed", data: cond, weight: 900, style: "normal" },
      ],
    }
  );
}
