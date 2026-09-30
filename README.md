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
- **Act I** hundreds of shards read "ELİF GEZGİN" from one exact viewpoint
  (a Varini-style anamorphosis); moving the mouse fractures them; scroll
  snaps them into solid refractive glass with the ink swirling behind.
- **Act II** every work is a stencil portal into a room in its own colours;
  hover separates the cover's layers in depth; click flies through.
- **Act III** the skills as kinetic type bent around a torus knot; tools
  orbit as lettered tokens.
- **Act IV** a colour machine: C, M, Y particle streams mix and come out as
  a printed sheet, one stage per process step.
- **Act V** the portrait (or monogram) as 50 k halftone dots the hand scatters.
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
`scripts/capture.mjs`). Typing `elif` anywhere releases paper confetti.

## Screenshots and checks

```bash
node scripts/shoot.mjs --p 0,0.28,0.51 --tier high [--light] [--w 390 --h 844] [--nogl --full]
node scripts/hover.mjs                     # portal hover/open, ribbon hover, card spin, confetti
node scripts/verify.mjs keyboard|overflow|reduced|lang|bundle|memory|perf
node scripts/contrast.mjs [--gl]           # AA contrast against the rendered pixels
node scripts/capture.mjs --all             # video loops for the no-WebGL page (WebCodecs VP9 + WebM writer)
scripts/lighthouse.sh                      # mobile + desktop, needs `next start`
```

## Documentation

`docs/ATOLYE.md`: art direction, storyboard, scene graph, the lamp, quality
tiers, fallbacks, dependencies, techniques, measurements and honest
limitations. Screenshots in `docs/screenshots/`.
