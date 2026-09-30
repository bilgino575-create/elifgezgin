# elifgezgin — Atölye

The portfolio of Elif Gezgin, graphic designer, as one continuous real-time
3D print studio made of paper, ink and light. Next.js 16 (App Router),
React Three Fiber, drei and three.js. Turkish at `/`, English at `/en`.

- **Act 0** crop and registration marks draw themselves into the EG monogram
  while fonts, the 3D chunk and textures actually load.
- **Act I** her name is debossed into a sheet of paper; the cursor is a studio
  lamp that rakes across it. Scroll lifts and turns the sheet: its back is
  the first work.
- **Act II** the print wall: posters on a clip rail, a book that opens, a box
  that turns, a blind-embossed card whose CMYK plates separate, a screen.
  Hover lifts, the loupe magnifies the halftone, click opens the case study.
- **Act III** a Pantone-style fan of the spot colour's tints, one chip per
  skill; the tools blind-embossed on a card.
- **Act IV** a six-panel sheet unfolds one step at a time.
- **Act V** a halftone print that resolves where the light falls.
- **Act VI** a letterpress business card; every sheet settles into a stack.

Everything is procedural: no downloaded models or textures. Fonts are
Instrument Serif and Schibsted Grotesk, self-hosted through `next/font`.
The complete site is server-rendered HTML that stands on its own without
WebGL.

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
refuses those) · `?tier=high|low` pin a quality tier · `?debug` the HUD
(also the `D` key). Typing `elif` anywhere releases paper confetti.

## Screenshots and checks

```bash
node scripts/shoot.mjs --p 0,0.24,0.52 --tier high [--dark] [--w 390 --h 844] [--nogl --full]
node scripts/hover.mjs                     # loupe + confetti interaction check
node scripts/verify.mjs keyboard|overflow|reduced|lang|bundle|memory|perf
scripts/lighthouse.sh                      # mobile + desktop, needs `next start`
```

## Documentation

`docs/ATOLYE.md`: art direction, storyboard, scene graph, the lamp, quality
tiers, fallbacks, dependencies, techniques, measurements and honest
limitations. Screenshots in `docs/screenshots/`.
