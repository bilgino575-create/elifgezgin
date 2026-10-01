# RENK — plan (v2 of elifgezgin)

Colour becomes matter and the visitor sculpts it. The stage is black, the
inks are vivid, the type is huge, and the first three seconds have to make a
designer on a phone send the link to a friend.

v1 (ATÖLYE, `docs/ATOLYE.md`) stays as the architecture: content model,
HTML-first document, one persistent canvas after first paint, tiers, tests.
Everything the visitor sees is replaced.

## 1. Art direction

Five references, described rather than copied:

1. **The anamorphic room.** Felice Varini paints shapes across a whole room
   that read as one flat figure from a single point on the floor. Here,
   hundreds of coloured shards hang in black space and only from one exact
   viewpoint do they read "ELİF GEZGİN". The visitor is walked to that
   point, then allowed to break it.
2. **Living ink on a lightbox.** Marbling and suminagashi: thin pigment
   pushed around on water, colours that mix subtractively (cyan and yellow
   make green, magenta and cyan make violet), never neon additive blends.
   The whole stage is that water, and the hand is the comb.
3. **Glass on a dark bench.** The product-photography idiom of thick cast
   glass on black velvet: refraction, dispersion into a spectrum at the
   edges, a highlight that slides as the piece turns. The name is made of
   that glass, and the ink swirls behind it.
4. **Type as sculpture.** Kinetic typography where the word is the object:
   letters extruded along a ribbon, bending with it, catching light like
   painted metal. No decorative geometry; every solid in the scene is type,
   a frame, or an ink stream.
5. **The foil card.** Holographic-foil business cards under a moving light:
   a rainbow that lives in the surface, not on it. The last thing the visitor
   touches.

The rule that keeps it art-directed rather than chaotic: **one stage, one
light, five inks, two typefaces.** Colour is allowed to be loud because
everything else is quiet.

## 2. Palette

Default theme **Gece** (night). Secondary theme **Galeri** (gallery), same
inks on white.

| token | Gece | Galeri | role |
|---|---|---|---|
| `--stage` | `#0A0A12` | `#FAFAF7` | page and canvas clear colour |
| `--stage-2` | `#12122A` | `#F0F0EA` | ambient gradient top (violet-blue on Gece) |
| `--fg` | `#F6F6FA` | `#0A0A12` | all body and heading text |
| `--fg-2` | `#C9C9DA` | `#3A3A48` | secondary text (AA on stage: 12.4 : 1 / 9.7 : 1) |
| `--fg-3` | `#9A9AB4` | `#5C5C70` | tertiary metadata (AA: 6.9 : 1 / 5.9 : 1) |
| `--line` | `rgba(246,246,250,.14)` | `rgba(10,10,18,.14)` | hairlines |
| `--spot` | `content/site.ts → spotColor` (default `#2B3CFF`) | same | the thread |
| `--ink-u` | `#2B3CFF` | ultramarine |
| `--ink-m` | `#FF2E88` | magenta |
| `--ink-y` | `#FFD400` | sunflower |
| `--ink-c` | `#00C8FF` | cyan |
| `--ink-g` | `#19E68C` | fresh green, sparingly (machine output, one portal rim) |

Text on a coloured surface (chips, buttons, the card) is always `--stage`
or `--fg` chosen per surface by the contrast script, never guessed:
`scripts/contrast.mjs` walks every text node and every button state in the
rendered page and fails under 4.5 : 1 (3 : 1 for ≥ 24 px / bold ≥ 19 px).

Materials: glass (transmission + dispersion), holographic foil (thin-film
iridescence + a procedural diffraction-grating normal), chrome, pearlescent
paint (iridescence at low strength over a colour), and paper only as the
inside of the posters.

## 3. Typography

**Display: Bricolage Grotesque** (OFL, variable, three axes: `wght` 200–800,
`wdth` 75–100, `opsz` 12–96). Chosen because it is expressive without being
a novelty face: the wide, heavy end reads like a poster, the narrow light
end like a caption, and the optical-size axis gives real display cuts for
the 18 rem name. It has İ, ı, Ş, Ğ. The three axes are what the hand plays:
weight swells with proximity, width with velocity.

**Text: Instrument Sans** (OFL, variable `wght` 400–700, `wdth` 75–100).
A neutral grotesk with large x-height and open apertures; it stays legible
at 17 px on a phone and does not compete with the display face.

Both are self-hosted through `next/font/google` (downloaded at build time,
served from `/_next/static`, no runtime request to Google). `latin-ext`
subset for Turkish.

Fluid scale (all `clamp()`):

| role | size | leading | notes |
|---|---|---|---|
| hero name | `clamp(4.5rem, 16vw, 18rem)` | 0.86 | Bricolage `wght` 700 `wdth` 90 `opsz` 96; HTML fallback and the overlay |
| section title | `clamp(3rem, 8vw, 9rem)` | 0.92 | `wght` 650, `wdth` 92, tracking −0.03em |
| lead | `clamp(1.25rem, 1rem + 1vw, 2rem)` | 1.3 | Bricolage `wght` 450 `opsz` 24 |
| body | `clamp(1.0625rem, 1rem + 0.25vw, 1.25rem)` | 1.55 | Instrument Sans, max 68ch; ≥ 17 px under 768 px |
| ui label | 14 px min | | Instrument Sans 600, tracking 0.06em, uppercase only for eyebrows |
| nav | 16 px min | | |

Turkish casing: `toLocaleUpperCase("tr-TR")` in every uppercase transform
in JS; CSS `text-transform` is avoided for Turkish strings (it handles İ/ı
correctly in modern browsers but `lang` must be set; it is, and the
specimen checks "İşler" and "ıslak").

`/_type` renders every style at the current viewport; the specimen is
screenshotted at 1440 and 390 and kept in `docs/screenshots/v2/type-*.png`.

## 4. Storyboard

Master clock `p ∈ [0, 1]` from scroll (Lenis on desktop). One world along
+x; every act has a centre `x`, the camera walks. Section anchors:
`#giris 0`, `#isler 0.28`, `#beceriler 0.51`, `#surec 0.65`, `#hakkimda 0.78`,
`#iletisim 0.90`, `#son 1.0`.

| act | p | desktop camera | mobile camera (390 × 844) |
|---|---|---|---|
| 0 drop | preloader | none (HTML/SVG over the hero) | same |
| I name | 0–0.16 | starts at (2.6, 1.4, 8.4) looking at the origin, chaos; glides to the anamorphic point (0, 0, 9) in 2.4 s after the drop, or with scroll 0–0.07; pointer breathes ±0.18 around it; 0.10–0.16 dolly to (0, 0, 3.2) as the shards become solid glass letters | shards laid out for two lines "ELİF / GEZGİN"; point (0, 0, 11), fov 44, dolly to (0, 0, 4.2) |
| II portals | 0.16–0.44 | walk from x = 10 to x = 10 + row width, height 0, dist 5.2, fov 36; portals 2.2 wide, 0.9 apart | portals stacked vertically in two columns, camera dist 6.4, fov 46; the walk is vertical |
| III ribbon | 0.44–0.58 | x = 22, orbit from (22, 1.2, 6) to (23.5, 0.6, 5.2), fov 34 | dist 8.6, fov 46, ribbon scaled 0.72 |
| IV machine | 0.58–0.72 | x = 32, dolly along the machine from (30.5, 1.6, 6.8) to (33.8, 0.4, 5.6) | machine vertical: drops fall down the screen; camera dist 9 |
| V portrait | 0.72–0.84 | x = 42, dist 4.6, slight orbit | dist 6.2, portrait above the text |
| VI card | 0.84–1 | x = 52, dist 3.4 → 2.6 at the ending, card fills 60 % of the width | dist 4.6, card fills 88 % of the width |

Reduced motion: no flights; the rig sits on the act's stop key and the
sections crossfade. The fluid is frozen on its first frame and the shards
are shown already aligned.

### Act 0 — the drop
An SVG drop of `--spot` hangs at the top of the viewport; its fall height is
the weighted sum of real loading units (fonts 1, 3D chunk 2, scene 2). At
100 % it lands at the centre and the splash blooms into "EG" drawn from
the splash rings; 500 ms later the overlay fades and the fluid receives one
injection at the same point and colour, so the drop is literally the first
ink on the stage. If loading stalls the drop hangs; nothing counts up.

### Act I — the name written in ink
- The name opens **whole**: from the first frame the extruded glass letters
  stand on the stage, fitted exactly to the `<h1>`'s line boxes (the HTML
  text is transparent but keeps its box, so no CLS).
- **The ink writes the letters.** The traced letterforms are also rasterised
  into a world-space mask on the z = 0 plane (`acts/name/mask.ts`); the
  backdrop shader unprojects every pixel onto that plane and, inside the
  letters, multiplies the ink's absorbance ×3.2 while thinning the wash
  around them ×0.55 and lighting the edge with a halo from the blurred
  mask. The portrait's particle formation is clipped to the same mask, so
  the letters are filled with her portrait's colour grains and the living
  ink, under clear glass.
- Scroll 0.02–0.075 shatters the name into ~900 anamorphic shards (one
  instanced draw call; paint, foil and glass chips) pushed along their rays
  from the viewpoint; the pointer breathes the camera ±0.1 units, enough to
  fracture the letters and let them re-form. 0.10–0.16 re-forms them as
  glass close up (`MeshTransmissionMaterial`, dispersion on HIGH/ULTRA).
- "Grafik Tasarımcı" under the name in HTML, variable axes driven by the
  hand (weight by distance, width by speed).
- **The statue.** A stylised AI-made figure of Elif (Meshy image-to-3D from
  the hero image, simplified by Osman: 118 k triangles / 2048² WebP on
  desktop, 64 k / 1024² on phones and LOW, meshopt + quantization,
  1.5 / 0.8 MB) rises out of a glossy black plinth right of the name on
  desktop and below it on phones, once the file has arrived (prefetched
  after first paint, never on the LCP path; the particle portrait stands in
  until then). It turns toward the hand (yaw ±25°, pitch ±6°, damped
  springs), three rim lights in the inks orbit it, and 6 000 surface points
  shimmer on its silhouette (a facing-ratio term in the vertex shader). A
  finger drags it round on phones. Reduced motion: static pose, no lights
  moving.

### Act II — the portals
Each work is a frame 2.2 × (2.2 / aspect) with a `--spot` rim. Stencil
portals: the frame writes stencil `i`, the inside world renders only where
stencil = `i`; no extra render passes. Inside: a room in the work's own
colours (extracted at build time by `sharp`: the three dominant colours of
the cover), the cover as layers (`layers/*.png` when the work ships them,
the sample generator emits background / shapes / type; otherwise one layer)
that separate in depth on hover or focus. Category materials: poster =
paper layers; packaging = a rotating box with the cover mapped; identity =
the cover's mark as a chrome slab. Enter or click: camera flies through
the frame (0.9 s), the page crossfades to `/isler/[slug]`, whose hero
carries the same three colours. The filter reshuffles with spring physics
(maath damp on positions).

### Act III — kinetic type
The ribbon is an **image formation**: the particle system assembles the
"kinetik kurdele" atmosphere image (a knotted ribbon of light) beside the
skills index, then the colour chart image as the tools come up; the ink
beneath carries the same colours. (v2.0 built this act from extruded words
bent along a torus knot; it read as primitive 3D next to the ink and was
cut — the art direction is the images and the ink, not geometry.)

### Act IV — the colour machine
Also a formation: the "renk makinesi" image forms beside the process index,
and the six process stages are written into the ink itself — each stage,
as it lights up, drips its colour (cyan, magenta, yellow, the spot, white)
into the fluid at its own x, so the process is literally a run of inks
mixing. Then the halftone sphere image forms for the rotation into Act V.
(The v2.0 glass tubes, vessel, drum and sheet were cut for the same reason
as the ribbon.)

### Act V — the portrait
The statue returns beside the bio, swaying slowly (±38°, never showing its
back, which is a flat wall of panels), and the hand or a finger spins it
within ±66°. Behind it the desk image and then the portrait image form at
60–70 % as a backdrop; the hand scatters them, a click blows them apart,
the springs return them. Reduced motion: the images crossfade on a plane
and the statue stands still.

### Act VI — the holographic card
Card 3.5 × 2 with `MeshPhysicalMaterial` iridescence (thin-film) plus a
procedural grating normal map; tilt from the pointer, spin on click. At
p ≥ 0.96 the fluid's dye texture is sampled into the foil colour (the ink
pours in) and "Yeni projelere açığım." is written by the fluid itself
(the text mask injects dye).

## 5. The fluid

Stable fluids (Stam) in screen space, WebGL2, half-float targets:

| pass | target | notes |
|---|---|---|
| splat | velocity, dye | pointer position, velocity and colour; radius by tier |
| curl → vorticity | velocity | confinement 12 (HIGH), 6 (MID) |
| advect | velocity, dye | semi-Lagrangian, dissipation 0.995 / 0.985 |
| divergence, pressure × N, gradient subtract | pressure | N = 20 HIGH, 12 MID |

Dye stores **absorbance**, not colour: an ink with reflectance `c` adds
`−log(c)`; mixing is addition; display is `exp(−A)` lit by the stage
(Gece: the ink glows as backlit pigment over black; Galeri: it darkens
white paper). This is why cyan + yellow makes green.

The dye texture is drawn as the backdrop quad (first, depth off) and read
by every transmissive material through the scene buffer; the card samples
it directly at the ending.

Sizes: HIGH velocity 384 × 216, dye 1024 × 576; MID 192 × 108 / 512 × 288;
LOW no simulation, an animated noise field of the same colours.

## 6. Tier budgets

| | ULTRA | HIGH | MID | LOW |
|---|---|---|---|---|
| dpr | ≤ 2 | ≤ 1.5 | 1 | 1 |
| fluid | full | full | half | noise |
| transmission | 6 samples, dispersion | 4 samples, dispersion | 2 samples, no dispersion | matcap fake |
| bloom | yes | yes | no | no |
| particles (IV) | 100 k | 100 k | 50 k | 20 k |
| portrait dots | 50 k | 50 k | 30 k | 12 k |
| shadows | none (the stage is black; light is in the materials) | | | |
| draw calls per act | ≤ 60 | ≤ 60 | ≤ 45 | ≤ 30 |

Selection: `detect-gpu` tier 3 → ULTRA, 2 → HIGH, 1 → MID, 0 → HTML.
`PerformanceMonitor` moves one step down after two declines, one step up
after three inclines, six-second lock, three flip-flops max.

Rendering rules: no allocation in `useFrame` (scratch vectors), every
geometry/material/target disposed on unmount, `frameloop="never"` when the
tab is hidden, memory checked after five scroll cycles.

## 7. Fallback without WebGL

The HTML document is the same document, styled to be loud: the name in
`clamp(4.5rem, 16vw, 18rem)` with its axes animated by the pointer (CSS
custom properties, no canvas), a CSS colour field (five radial gradients of
the inks on the stage, drifting with keyframes and blurred), and three short
video loops captured from the real 3D (hero, portals, card) with posters,
`muted playsinline loop`, each ≤ 1.5 MB. No ffmpeg exists in the build
container, so the loops are encoded in the browser: frames rendered by the
real scene in headless Chromium → WebCodecs `VideoEncoder` (VP9) → a
minimal WebM writer in `scripts/capture.mjs`. Browsers without VP9 show the
poster.

## 8. Dependencies

No new runtime dependency. `three-custom-shader-material` was considered
for the ribbon and the shards and not needed: the ribbon bends a
`MeshPhysicalMaterial` through `onBeforeCompile` (as v1's paper did) and the
shards use one raw `ShaderMaterial`. The fluid, portals (stencil), grating
normal and WebM writer are written here.

## 9. Bugs from v1 fixed in v2

1. active filter chip: text colour follows the chip surface; every button
   state is in the contrast report;
2. `NEXT_PUBLIC_SITE_URL` (fallback `https://elifgezgin.vercel.app`) drives
   canonical, OG, sitemap and JSON-LD;
3. empty `email` hides the copy button and the form (kept from v1, now
   tested in the keyboard run);
4. the no-WebGL page is designed, not a fallback.

## 10. Techniques, in one paragraph each

- **Living ink.** Stam's stable fluids on the GPU: velocity and dye in
  half-float ping-pong targets (velocity ≈ ¼ of the canvas, dye ≈ ⅔ on
  HIGH), vorticity confinement, 20 Jacobi pressure iterations, semi-Lagrangian
  advection. The dye stores absorbance; the backdrop shader turns the mixed
  absorbance direction into a saturated hue and its length into coverage,
  so cyan and yellow make green and thin ink stays vivid instead of pale.
  Everything transmissive (the glass name) refracts that backdrop because
  `MeshTransmissionMaterial` renders the scene into its own buffer.
- **Letterforms without a font parser.** The page font is rasterised on a
  canvas, the ink mask is traced into pixel-edge loops, simplified (RDP),
  rounded (Chaikin) and classified into outer contours and holes by
  containment depth. The result is a `three.Shape` per letter, extruded with
  a bevel. Cap height is the unit, the baseline is y = 0, so the 3D name
  can be fitted exactly to the `<h1>`'s line boxes and the HTML text goes
  transparent without a jump (`html.deboss`).
- **Anamorphosis.** Each glyph sample becomes a shard placed on its own ray
  from the anamorphic viewpoint at a random depth; the vertex shader scales
  it by that depth so the apparent size is constant. One instanced draw
  call; convergence, idle drift, the hand's push and the paint / foil /
  glass shading all live in the shader.
- **Stencil portals.** The frame's inner plane writes a stencil id with
  colour writes off; the room, layers and object behind it test for that
  id. No render-to-texture per portal, real depth and parallax, and the
  post-processing composer keeps a stencil buffer so bloom still applies.
- **The name mask.** The same `three.Shape`s the glass is extruded from
  are drawn into a 1024-wide canvas with the letters' world transform
  (R = letterforms, G = a blurred halo). Both the backdrop and the particle
  shader sample it in **world space** (the backdrop unprojects each pixel
  with the inverse view-projection onto z = 0), so it stays exact when the
  camera dollies in and on every viewport, and costs one texture read.
- **One NaN, one black frame.** On HIGH tier at p = 0 the whole canvas
  rendered black. Bisecting with `scripts/gltrace.mjs` (wraps the draw calls,
  reads the composer's buffers back mid-frame): the scene buffer held exactly
  one NaN pixel from a degenerate bevel triangle of the extruded name (a
  repeated contour point → zero-area face → zero normal → `normalize(0)`),
  and bloom's mip chain averaged it into all 324 000 pixels. Fixed at the
  source (the tracer drops zero-length segments, zero normals are replaced)
  and guarded: a one-read fullscreen pass before bloom replaces non-finite
  values and clamps the HDR range.
- **Foil.** Thin-film iridescence (`iridescence`, thickness 120–520 nm) over
  a dark metallic base, a procedural diffraction-grating normal map, and a
  view-angle rainbow term added to the indirect specular in the shader.
  At the ending the dye texture is mixed into the print by `uPour`.
- **One particle system for the whole site.** A single 346² (HIGH) / 245²
  (MID) / 158² (LOW, phones) grid of GPU particles lives from the hero to
  the card. Twelve art-direction images (never works) are reduced at build
  time to 256² colour targets; along the scroll clock a schedule names
  which image forms where (`particles/schedule.ts`). Each particle samples
  its colour and relief (luminance → z) from the two current targets and
  springs toward mix(A, B) with its own stagger; mid-transition a curl-noise
  cloud term swells (sin πt), so leaving a section is an explosion into a
  swirling volume that streams along the path and re-forms as the next
  image, reversible because it is a pure function of p plus dynamics. The
  hand's repulsion is velocity-sensitive, a click blows the formation apart,
  and while clouded the images' colours are splatted into the living ink.
  Position and velocity are two float MRT targets in a ping-pong; the step
  is fixed 1/60 substeps; nothing allocates per frame. Reduced motion shows
  the images themselves crossfading on planes.
- **The statue's material.** The Meshy texture is kept as the base colour
  (it holds up at close range: eyes, lips, the hand on the pen, the coat's
  edges are all whole) under `MeshPhysicalMaterial` with clearcoat 0.65, a
  thin-film iridescence of 0.35 and a view-angle rim in the spot colour
  added in `onBeforeCompile`. The suit shows its facets up close (the
  simplification), which the clearcoat reads as a lacquered sculpture
  rather than cloth. The plinth is a clipping plane as much as a box: the
  figure's material clips below the plinth's top face, so it rises out of
  the plinth instead of through it, driven by the closed-form step response
  of a ζ = 0.7 spring in time (frame-rate independent, no per-frame
  integration).
- **Video loops without ffmpeg.** `scripts/capture.mjs` drives the real scene
  frame by frame (`?capture=1`, `window.__advance`), encodes each frame with
  WebCodecs' VP9 encoder inside headless Chromium and muxes the chunks with
  a 90-line WebM writer. Posters are WebP.

## 11. Measurements

Filled in from the scripts as they were run; nothing here is estimated.

All numbers from this container: headless Chromium on SwiftShader (no
GPU), `next start`. Frame times are CPU raster times and say nothing about a
device; draw calls, triangles, bundle sizes, contrast ratios and the
accessibility/SEO scores are exact.

### Build

`npm run build`, `npm run lint`, `npm run typecheck` pass; every screenshot
run reports a clean console.

### Bundles (gzip, `node scripts/verify.mjs bundle`)

| bundle | size |
|---|---|
| initial JS before the 3D chunk (10 scripts) | **202.5 KB** (budget 180 KB; the site's own initial code ≈ 15 KB, the rest is the Next.js 16 + React 19 runtime; unchanged by the statue, +0.3 KB of copy) |
| 3D chunk (three, fiber, drei, postprocessing, fluid, particles, all acts, GLTF loader + meshopt decoder + surface sampler), fetched from an idle callback after first paint | 345 KB (was 325 before the statue) |
| other lazy chunks | 12.6 KB |
| the statue (`public/models/`, fetched after first paint, not JS) | 1.49 MB desktop / 0.80 MB phones and LOW |

An earlier build had the drop preloader importing the fluid module and
pulled three.js into the initial bundle (439 KB); the ink queue now lives in
`src/lib/ink.ts` without three.

### Lighthouse 13 (mobile: Moto G4 emulation, 4× CPU)

| form | URL | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| mobile | `/` (HTML page on the software renderer) | 53 | **100** | **100** | **100** | 5.7 s | 0 | 1 449 ms |
| desktop | `/` | 68 | **100** | **100** | **100** | 0.93 s | 0.011 | 1 924 ms |
| mobile / desktop | `/?gl=1` | not measured this round: with the statue, a software-rendered frame exceeds Lighthouse's screenshot timeout (`Page.captureScreenshot`); the previous build measured 46 / 60 with CLS ≤ 0.001 | | | | | | |

The mobile LCP and TBT targets (2.5 s, 300 ms) are **not met on this
machine**; CLS is ≤ 0.011 everywhere because the WebGL probe runs inline
before the sections parse, so the document never changes shape on
hydration. Real-device numbers were not measured. The statue's 1.5 MB is
not on the LCP path: the LCP is HTML text, the file is prefetched from the
3D chunk after first paint.

### Frame time per act (`node scripts/verify.mjs perf`, HIGH tier forced)

| act | 1440×900 fps / frame / calls / tris | 390×844 4× CPU fps / frame / calls / tris |
|---|---|---|
| I name (statue beside it) | 0.7 / 1 627 ms / 69 / 501 057 | 0.9 / 1 226 ms / 80 / 310 490 |
| II portals | 0.3 / 1 857 ms / 80 / — | 2.5 / 1 337 ms / 71 / 3 867 |
| III ribbon (formation) | 0.5 / 552 ms / 59 / 58 | 1.6 / 921 ms / 59 / 58 |
| IV machine (formation) | 0.5 / 871 ms / 59 / 58 | 1.7 / 770 ms / 59 / 58 |
| V portrait (statue) | 0.1 / 1 572 ms / 83 / 118 700 | 0.9 / 852 ms / 62 / 64 294 |
| VI card | 0.7 / 1 974 ms / 183 / 1 154 | 1.5 / 890 ms / 61 / 1 032 |

At 0.3–2 fps the sampler's stats lag the stop by a frame or two, so the
triangle column is the honest signal, not the fps: in the hero the statue
is drawn three times per frame (once for the view, once into each glass
line's transmission buffer: 118 k × 3 + the shards ≈ 500 k); beside the bio
it is drawn once (118 700 desktop, 64 294 phones) since this build, because
the transmission materials now stop rendering their buffers while the name
is off stage — before that fix every act after the hero paid two extra
scene renders per frame (355 k triangles at Act V). The formations are
point sprites (58 triangles: the backdrop, the plinth). Draw calls include
the fluid's passes (≈ 28) and the particle substeps.

### Tests (`node scripts/verify.mjs …`)

| test | result |
|---|---|
| keyboard only (Tab × 70, `?gl=1&tier=low`) | 68 focus stops, every one inside the viewport with a focus ring, 0 inside a still-hidden section; sections without focusable content are reached from the nav |
| 390 px, no horizontal scroll | scrollWidth 390 = clientWidth in 3D and HTML mode at every act anchor |
| reduced motion | media matched; the rig sits exactly on the stop keys; the fluid freezes after the drop, the particle system shows the images themselves crossfading, the statue stands still with its lights still |
| TR/EN | `/` → lang tr, "Portallar", toggle → `/en`; `/en` → lang en, "The portals", toggle → `/`; hreflang tr/en/x-default; work links `/isler/…` vs `/en/work/…` |
| memory after 5 full scroll cycles (HIGH, statue loaded) | geometries 54 / textures 72 / programs 43 after cycle 2 and identical through cycle 5 (26 / 44 / 26 before the first); JS heap 35 MB |
| AA contrast (`node scripts/contrast.mjs`, rendered pixels behind every glyph run, hover and focus states) | 1 162 glyph runs at 1440 and 390, Gece and Galeri, hover and focus states: **0 failures** |
| AA contrast in 3D mode (`--gl`, at the seven scroll stops, Gece + Galeri, 1440 + 390) | 406 glyph runs over the live scene: **0 failures** |
| interaction (`node scripts/hover.mjs`) | pointer over the first portal: index row "Izgara Üzerine" active, cursor in hover mode; click: fly-through then navigation to `/isler/ornek-afis-izgara`; skills index hover: "Editoryal tasarım"; card click: act "card", spin; typing "elif": confetti canvas visible; console clean |
| the statue's mesh at close range (`three.js` inspection page, both files, face / hands / coat edges / feet, textured and normal-coloured) | no holes or broken silhouettes found; the suit shows its facets up close, the hair is ribbons; the back of the composition is a flat wall of panels, so the figure never turns past ±66° |
| README_ELIF.md | tested in v1 with a `content/works/deneme-isi/` folder; the pipeline and the guide are unchanged except the optional `layers/` folder, `content/atmosphere/` and the two statue files, all exercised by the shipped content |

### Screenshots

`docs/screenshots/v2/`: `final-{desktop,mobile}-{dark,light}-p*.png` at
1440×900 and 390×844 for p = 0, 0.16, 0.28, 0.51, 0.65, 0.78, 0.9, 0.99
(the statue at p = 0 and 0.78 on every one); `statue-*` (Galeri on a phone
at 0.78, reduced motion at 0 and 0.78); `seq-{a,b,c}-*` frame sequences of
three transitions on both viewports; `chaos-*`, `low-*`, `reduced-*`,
`html-*` (no WebGL, full page, both themes), `type-*` (the specimen at
1440 and 390), `hover-*`, `open-*`, `card-spin-*`, `confetti-*`.


## 12. Known limitations (honest)

- **Frame rate on real hardware is unmeasured.** No GPU in the container;
  SwiftShader renders the stage at 0.2–3 fps. The 60 fps laptop / 40 fps
  Android targets are engineered for (tiers, dpr caps, 30–45 fps touch cap,
  one draw call for 120 k particles, stencil portals without extra passes)
  and not verified on a device.
- **Initial JS is 202.5 KB gzip against 180 KB.** ≈ 187 KB of it is the
  framework runtime; the site's own initial code is ≈ 15 KB.
- **Lighthouse mobile LCP (5.7 s) and TBT (1.4 s) miss the targets on this
  throttled CPU.** Not measured on a device; the 3D-mode run could not
  complete with the statue on the software renderer.
- **The twelve atmosphere images are AI-generated art direction**, never
  presented as works; the six sample works are fictional and tagged
  "Örnek"; `email` and `social` are empty until Elif fills them.
- **The statue is drawn three times per frame in the hero** (the view and
  the two glass lines' transmission buffers, ≈ 355 k triangles); if a mid
  laptop drops under 60 fps there, the fix is to hide it from the
  transmission passes (it is never behind the glass), which drei's
  `MeshTransmissionMaterial` does not expose a hook for yet.
- **The particle transitions are scroll-linked, not time-linked**: a fast
  flick crosses a transition in a few frames and the cloud has no time to
  bloom; Lenis's easing softens this on desktop, native scrolling on phones
  does not.
- **The statue is an AI-generated figure**, not a scan or a photograph; the
  copy says so (sr-only text in the hero and the bio). Its back is a wall of
  panels (the hero image's background became geometry), so it never turns
  past ±66°. Its 1.5 MB (0.8 MB on phones) is fetched after first paint and
  is not in any JS bundle; whether a mid-range Android holds 40 fps with it
  is unmeasured.
- **Device-orientation tilt** on phones is not built; the hand is the finger.
- **Sound** is two synthesized cues behind a toggle that defaults to off.

