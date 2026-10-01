"use client";

import { store } from "./store";

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen|virtualbox|vmware svga/i;

export function glForced() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("gl") === "1";
}

/**
 * Cheap, synchronous WebGL2 probe. Software renderers (VMs, remote desktops,
 * GPU acceleration off) get the complete HTML site; `?gl=1` forces the canvas
 * on (the measurement scripts run on a software renderer).
 */
export function probeWebGL(): { ok: boolean; reason: string; renderer: string } {
  const params = new URLSearchParams(window.location.search);
  if (params.has("nogl")) return { ok: false, reason: "disabled by ?nogl", renderer: "" };
  const forced = glForced();
  try {
    const c = document.createElement("canvas");
    const g = c.getContext("webgl2", { failIfMajorPerformanceCaveat: !forced }) as WebGL2RenderingContext | null;
    if (!g) return { ok: false, reason: "no webgl2 context (or a major performance caveat)", renderer: "" };
    const dbg = g.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(dbg ? g.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER));
    g.getExtension("WEBGL_lose_context")?.loseContext();
    if (!forced && SOFTWARE.test(renderer)) return { ok: false, reason: `software renderer: ${renderer}`, renderer };
    return { ok: true, reason: "ok", renderer };
  } catch (e) {
    return { ok: false, reason: `probe threw: ${(e as Error).message}`, renderer: "" };
  }
}

/**
 * The same probe as an inline script, run before the home page's sections
 * parse (Home.tsx), so the document takes its 3D shape before first paint
 * and nothing shifts when the driver hydrates. Values mirror TRACK_VH.
 */
export const glProbeScript = `(function(){try{var q=new URLSearchParams(location.search);if(q.has("nogl"))return;var f=q.get("gl")==="1";var c=document.createElement("canvas");var g=c.getContext("webgl2",{failIfMajorPerformanceCaveat:!f});if(!g)return;var d=g.getExtension("WEBGL_debug_renderer_info");var r=String(d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER));var e=g.getExtension("WEBGL_lose_context");if(e)e.loseContext();if(!f&&${SOFTWARE.toString()}.test(r))return;var h=document.documentElement;h.classList.add("gl");var t=matchMedia("(pointer: coarse)").matches||("ontouchstart" in window)||innerWidth<768;h.style.setProperty("--track-vh",t?"820":"1100");}catch(e){}})();`;

/** Hand the document back to the HTML layout. Safe to call more than once. */
export function disableGl(reason: string) {
  if (!store.get().gl) return;
  if (store.get().debug) console.warn("3d disabled:", reason);
  store.set({ gl: false, glFailed: true, deboss: false, loaded: true, loadProgress: 1 });
  const html = document.documentElement;
  html.classList.remove("gl", "deboss", "fine-pointer");
  html.style.removeProperty("--track-vh");
  html.style.removeProperty("--footer-vis");
  for (const s of Array.from(document.querySelectorAll<HTMLElement>("section.section"))) {
    s.style.removeProperty("--vis");
    delete s.dataset.hidden;
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

/** Last time the renderer produced a frame; the watchdog reads it. */
export const frameClock = { last: 0, frames: 0 };
