"use client";

import { store, useStore } from "@/lib/store";

/** `?debug` or `D`. Numbers come straight from renderer.info; nothing is estimated. */
export default function DebugHud() {
  const debug = useStore((s) => s.debug);
  const stats = useStore((s) => s.stats);
  const tier = useStore((s) => s.tier);
  const gpuTier = useStore((s) => s.gpuTier);
  const act = useStore((s) => s.act);
  const progress = useStore((s) => s.progress);
  const gl = useStore((s) => s.gl);
  const theme = useStore((s) => s.theme);
  if (!debug) return null;
  return (
    <aside className="hud" aria-label="Debug">
      <div className="mb-2 flex items-center justify-between">
        <strong>atölye · debug</strong>
        <button type="button" onClick={() => store.set({ debug: false })} aria-label="Close">
          ✕
        </button>
      </div>
      <dl>
        <dt>renderer</dt>
        <dd>{gl ? "WebGL2" : "html"}</dd>
        <dt>fps</dt>
        <dd>{stats.fps.toFixed(0)}</dd>
        <dt>frame</dt>
        <dd>{stats.ms.toFixed(2)} ms</dd>
        <dt>draw calls</dt>
        <dd>{stats.calls}</dd>
        <dt>triangles</dt>
        <dd>{stats.triangles.toLocaleString("en")}</dd>
        <dt>geom / tex / prog</dt>
        <dd>
          {stats.geometries} / {stats.textures} / {stats.programs}
        </dd>
        <dt>gpu tier</dt>
        <dd>{gpuTier < 0 ? "…" : gpuTier}</dd>
        <dt>quality</dt>
        <dd>{tier}</dd>
        <dt>theme</dt>
        <dd>{theme}</dd>
        <dt>act</dt>
        <dd>{act}</dd>
        <dt>progress</dt>
        <dd>{progress.toFixed(4)}</dd>
      </dl>
    </aside>
  );
}
