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

### Act I — the anamorphic name
- ~900 shards (instanced, one draw call per material family: paint, foil,
  glass) sampled from the rasterised glyphs of "ELİF GEZGİN" at 96 px per
  em, each pushed along its own ray from the anamorphic point to a random
  depth (3–14 units). From the point they tile the letters exactly; from
  anywhere else they scatter.
- Camera glide → snap. The pointer orbits the camera ±0.18 units, enough
  to fracture the letters and let them re-form.
- p 0.10–0.16: each shard flies to its place on the extruded letter and the
  glass letters fade in: `MeshTransmissionMaterial` with `chromaticAberration`,
  the fluid backdrop refracted through them; the HTML `<h1>` is transparent
  but keeps its box (no CLS).
- "Grafik Tasarımcı" under the name in HTML, variable axes driven by the
  hand (weight by distance, width by speed).

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
Skill names extruded from the same glyph outlines, bent along a torus knot
(p = 2, q = 3) in the vertex shader (arc-length LUT in a data texture),
each word its own two-colour gradient. The ribbon turns slowly; hovering
or focusing a word in the HTML index damps the rotation and pulls the word
forward; its description shows in the index. Tools orbit as rounded glossy
tokens with two-letter marks (Ai, Ps, Id, Fg, Ae, Pr), not logos.

### Act IV — the colour machine
Three glass tubes drop C, M and Y into a vessel, the mix runs through a
halftone drum and comes out as a printed sheet in `--spot`. Particles:
100 k on HIGH, 20 k on LOW, positions computed in a ping-pong FBO from a
route field (tube → vessel → drum → sheet) with curl noise; the pointer
adds a repulsion force. Six stages light up in sequence, labelled in
section-title type.

### Act V — the portrait
50 k instanced discs on a grid, colour from the portrait (or the monogram)
quantised to C, M, Y, K; spring-back sim in a ping-pong FBO; the hand
scatters, the springs return. Bio next to it in lead type.

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

## 10. Measurements

Filled in as they are taken; see the end of this file.
