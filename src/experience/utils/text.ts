/**
 * Fonts for canvas drawing come from the CSS variables next/font sets on
 * <html>, so the 3D deboss uses the same self-hosted faces as the page.
 */
let displayFamily = "'Instrument Serif', serif";
let textFamily = "'Schibsted Grotesk', sans-serif";

export function resolveFonts() {
  if (typeof document === "undefined") return;
  const cs = getComputedStyle(document.documentElement);
  const d = cs.getPropertyValue("--font-display").trim();
  const t = cs.getPropertyValue("--font-text").trim();
  if (d) displayFamily = d;
  if (t) textFamily = t;
}

export function display(px: number, italic = false) {
  return `${italic ? "italic " : ""}400 ${px}px ${displayFamily}`;
}
export function text(px: number, weight = 500) {
  return `${weight} ${px}px ${textFamily}`;
}

/** Wait for the two faces so canvas text is drawn with the real fonts. */
export async function fontsReady() {
  resolveFonts();
  if (!document.fonts) return;
  try {
    await Promise.all([document.fonts.load(display(64)), document.fonts.load(text(32)), document.fonts.load(text(32, 600))]);
  } catch {
    /* fall back to whatever is loaded */
  }
  await document.fonts.ready;
  resolveFonts();
}
