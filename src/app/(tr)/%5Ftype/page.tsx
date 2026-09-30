import type { Metadata } from "next";
import { site, L } from "@/lib/content";
import { t } from "@/i18n/dict";

export const metadata: Metadata = { title: "Type specimen", robots: { index: false, follow: false } };

/**
 * `/_type`: every text style of the site at the current viewport, for the
 * art-director loop (screenshotted at 1440 and 390). Not linked, not indexed.
 */
export default function Page() {
  const d = t("tr");
  const rows: { label: string; className: string; text: string; tag?: "h1" | "h2" | "h3" | "p" }[] = [
    { label: "hero name · .display.h1 · clamp(4.5rem, 16vw, 18rem)", className: "display h1", text: "ELİF\nGEZGİN", tag: "h1" },
    { label: "section title · .display.h2 · clamp(3rem, 8vw, 9rem)", className: "display h2", text: "İşler, Beceriler, Süreç", tag: "h2" },
    { label: "h3 · .display.h3", className: "display h3", text: "Işıklı çerçevesiz ekran", tag: "h3" },
    { label: "lead · .lead · clamp(1.25rem, 1rem + 1vw, 2rem)", className: "lead", text: L(site.description, "tr") },
    { label: "body · clamp(1.0625rem, 1rem + 0.25vw, 1.25rem) · 17px under 768", className: "prose", text: L(site.bio, "tr").split("\n\n")[1] },
    { label: "eyebrow · 14px 600 tracking 0.12em", className: "eyebrow", text: d.works.eyebrow },
    { label: "meta · 14px · --fg-3", className: "meta", text: "Afiş · 2025 · Örnek" },
    { label: "index title · .index .t", className: "index-sample", text: "Izgara Üzerine" },
    { label: "Turkish casing: İ ı Ş Ğ Ç Ö Ü — İşler ıslak ŞİŞLİ", className: "display h3", text: "İşler ıslak ŞİŞLİ Çağ Öğüt", tag: "h3" },
  ];
  return (
    <main id="main" className="wrap specimen">
      <p className="meta">Bricolage Grotesque (display, opsz/wdth/wght) · Instrument Sans (text, wdth/wght)</p>
      {rows.map((r) => (
        <section key={r.label}>
          <p className="label">{r.label}</p>
          {r.className === "index-sample" ? (
            <ol className="index">
              <li>
                <div className="row">
                  <span className="n">01</span>
                  <span className="t">{r.text}</span>
                  <span className="c">Afiş</span>
                </div>
              </li>
              <li data-active="true">
                <div className="row">
                  <span className="n">02</span>
                  <span className="t">Sessiz Seri</span>
                  <span className="c">Editoryal</span>
                </div>
              </li>
            </ol>
          ) : r.tag === "h1" ? (
            <h1 className={r.className}>
              {r.text.split("\n").map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </h1>
          ) : r.tag === "h2" ? (
            <h2 className={r.className}>{r.text}</h2>
          ) : r.tag === "h3" ? (
            <h3 className={r.className}>{r.text}</h3>
          ) : (
            <p className={r.className}>{r.text}</p>
          )}
        </section>
      ))}
      <section>
        <p className="label">buttons, chips, tags — every state is in the contrast report</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn">
            {d.contact.send}
          </button>
          <button type="button" className="btn btn-spot">
            {d.contact.copy}
          </button>
          <a className="btn btn-ghost" href="#main">
            Behance
          </a>
          <button type="button" className="chip" aria-pressed="true">
            {d.works.all}
          </button>
          <button type="button" className="chip" aria-pressed="false">
            {d.works.categories.poster}
          </button>
          <span className="tag">{d.works.sample}</span>
          <a className="link" href="#main">
            {d.works.back}
          </a>
        </div>
      </section>
      <section>
        <p className="label">card (no-WebGL) · CSS foil</p>
        <div className="card foil" style={{ maxWidth: "28rem" }}>
          <p className="meta" style={{ color: "#0a0a12" }}>
            {L(site.title, "tr")}
          </p>
          <p className="name">{site.name}</p>
        </div>
      </section>
    </main>
  );
}
