# elifgezgin — Renk

The portfolio of Elif Gezgin, graphic designer, as one continuous real-time
3D stage where colour is matter and the visitor's hand sculpts it. Next.js
16 (App Router), React Three Fiber, drei and three.js. Turkish at `/`,
English at `/en`. The plan, measurements and honest limits are in
`docs/RENK.md` (v1, "Atölye", is kept in `docs/ATOLYE.md`).

- **The hand** a stable-fluids simulation runs across the whole stage; the
  cursor injects vivid ink that mixes like pigment (absorbance, not RGB).
  Nearby objects are pushed; the headline's variable axes follow the pointer.
- **Act 0** one drop of the spot colour falls as fonts, chunk and letterforms
  really load; its splash is the first ink on the stage.
- **Act I** the name written in ink: the glass letters stand whole from the
  first frame, filled with dense living ink and the grains of the portrait
  (a world-space mask of the traced letterforms drives both); scrolling
  shatters them into a Varini-style anamorphosis of ~900 shards and
  re-forms them as glass close up.
- **Act II** every work is a stencil portal into a room in its own colours;
  hover separates the cover's layers in depth; click flies through.
- **Act III–V** one GPU particle system (120 k / 60 k / 25 k) morphs through
  twelve atmosphere images along the scroll — the ribbon of light beside
  the skills, the colour machine beside the process (each stage drips its
  ink into the fluid), the halftone sphere, the desk, the portrait the hand
  scatters. Between images it explodes into a curl-noise cloud that streams
  to the next place and re-assembles; reversible.
- **Act VI** a holographic-foil business card; all the ink pours into it and
  the last line is written by the fluid.

Everything is procedural: no downloaded models or textures. Fonts are
Bricolage Grotesque and Instrument Sans, self-hosted through `next/font`.
The complete site is server-rendered HTML that stands on its own without
WebGL, with video loops captured from the real scene.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm run lint
npm run typecheck
```

`prebuild`/`predev` run `scripts/samples.mjs` (renders the six sample works
only while `content/works` is empty) and `scripts/prepare-content.mjs`
(WebP derivatives ≤ 2048 px, blur placeholders, a typed manifest in
`src/content/works.generated.ts`).

## Content

All content lives in `content/`: `site.ts` (name, bio, email, socials,
spot colour, skills, tools, process) and `works/<slug>/meta.json` with the
images next to it. `README_ELIF.md` explains it in plain Turkish for Elif.

## URL switches

`?nogl` HTML only · `?gl=1` force WebGL on a software renderer (the probe
refuses those) · `?tier=ultra|high|mid|low` pin a quality tier · `?debug`
the HUD (also the `D` key) · `?chaos=1` hold the shards before the snap ·
`?nopanels=1` hide the legends · `?capture=1` external frame clock (used by
`scripts/capture.mjs`) · `?nopost` bypass the bloom/vignette composer ·
`?debug` also exposes `window.__r3f` for `scripts/gltrace.mjs`. Typing
`elif` anywhere releases paper confetti.

## Screenshots and checks

```bash
node scripts/shoot.mjs --p 0,0.28,0.51 --tier high [--light] [--w 390 --h 844] [--nogl --full]
node scripts/hover.mjs                     # portal hover/open, skills index hover, card spin, confetti
node scripts/gltrace.mjs [query] [p]       # one frame's draw calls, framebuffers, GL errors, NaN/Inf counts (needs `next start`)
node scripts/verify.mjs keyboard|overflow|reduced|lang|bundle|memory|perf
node scripts/contrast.mjs [--gl]           # AA contrast against the rendered pixels
node scripts/capture.mjs --all             # video loops for the no-WebGL page (WebCodecs VP9 + WebM writer)
scripts/lighthouse.sh                      # mobile + desktop, needs `next start`
```

## Documentation

`docs/ATOLYE.md`: art direction, storyboard, scene graph, the lamp, quality
tiers, fallbacks, dependencies, techniques, measurements and honest
limitations. Screenshots in `docs/screenshots/`.
