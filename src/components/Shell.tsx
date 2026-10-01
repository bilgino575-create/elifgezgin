import type { Lang } from "@/lib/content";
import { probeScript } from "@/lib/probe";
import "@/styles/fonts.css";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/type.css";
import "@/styles/ui.css";
import "@/styles/stops.css";
import "@/styles/work.css";

/** The document: fonts preloaded, the probe run before paint, nothing else in the way of the first paint. */
export default function Shell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html lang={lang} className="nojs">
      {/* eslint-disable-next-line @next/next/no-head-element -- the root layout owns <head> in the app router; the probe must run before paint */}
      <head>
        <link rel="preload" href="/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/archivo-latin-ext.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: probeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
