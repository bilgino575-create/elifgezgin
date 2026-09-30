# ATÖLYE — design and engineering plan

The portfolio of Elif Gezgin, graphic designer, built as one continuous
real-time 3D world: a print studio made of paper, ink and light. This
document is written before the code and updated with measurements as the
build progresses (§9, §10). Everything stated as measured was measured in
the build container; §10 says what that container can and cannot measure.

## 1. Art direction

**Mood.** A bright studio at 10:00 in the morning. Daylight from a large
north window, one anglepoise lamp on the table, warm white paper, one
ink colour. Nothing glows. Nothing is neon. The only things that move are
the light (the visitor's hand) and the paper it touches. Reference points:
Apple product pages (restraint, whitespace, one accent), Swiss poster
tradition (grid, one colour, a single typographic gesture), letterpress
studios (the deboss that only shows in raking light).

**Palette.**

| token        | light `#`   | darkroom `#` | role                                             |
|--------------|-------------|--------------|--------------------------------------------------|
| paper        | `F6F5F1`    | `1A1A1C`     | every sheet, the page background                  |
| paper-2      | `EEEDE8`    | `232326`     | the second sheet, cards, subtle surfaces          |
| ink          | `111214`    | `F1EFE9`     | text, registration marks                          |
| ink-2        | `55565B`    | `A9A8A3`     | secondary text                                     |
| ink-3        | `9A9A98`    | `6E6E6A`     | metadata, hairlines                                |
| spot         | `content/site.ts → spotColor`, default `1F4BFF` | same | the one ink: underline, rail, rivet, crease, card |
| lamp         | `FFF6E6`    | `FFB26B` (safelight) | the cursor lamp's colour                   |

The spot colour is the only saturated colour on the site. Sample works are
designed so that they, too, use at most the spot colour plus black on paper,
so a visitor never sees a second accent unless Elif's real work brings it.

**Lighting.** Physically based, ACES filmic, exposure 1.0. Three lights:
1. **Sky** — a large, soft hemisphere + a wide area light from above-left
   (the window). Gives the paper its base tone and the soft ambient shadow
   under every sheet.
2. **Lamp** — the cursor. A spot light 0.9 units above the table plane,
   aimed at the cursor's hit point, 55° cone, with soft penumbra. On HIGH it
   casts a PCF-soft shadow; on LOW it is shadowless and the sheets carry a
   baked contact shadow (a gradient quad) instead.
3. **Rim** — a faint, cool directional light from behind-right so paper edges
   separate from the background.

Bloom is never used. On HIGH there is a very shallow depth of field (paper
out of the focus plane softens slightly, like a macro lens), 2 % film grain
and the halftone/loupe effects. On LOW: none of these.

**Materials.** One material language: `MeshPhysicalMaterial` with
`onBeforeCompile` injecting (a) a procedural paper grain normal (two
octaves of value noise, tangent-space, 0.35 strength), (b) an emboss normal
map generated on the client from text drawn into a canvas (blur → height →
Sobel → normal), (c) a sheen term (0.25, warm) so raking light produces the
soft specular fold of coated paper, (d) `clearcoat 0` everywhere except the
business card (0.15, matte varnish). Ink on paper is a second material with
the CMYK separation shader: the artwork texture is sampled per plate with
per-plate offsets driven by cursor velocity; plates recombine
multiplicatively (subtractive mixing), so mis-registration looks like print,
not like RGB chromatic aberration.

**Typography.** *Instrument Serif* (display: the name, act titles, the card)
and *Schibsted Grotesk* (UI and text: navigation, captions, bio, buttons).

Why this pair, for a type-literate audience:
- Instrument Serif is a high-contrast, slightly condensed transitional
  face drawn for large sizes; at 96–160 px its hairlines and ball terminals
  read as engraved, which is exactly the deboss the hero needs. It has a
  single regular weight and an italic: the constraint keeps the display
  voice quiet. Latin-ext covers İ ı Ş ş Ğ ğ Ç ç Ö ö Ü ü natively.
- Schibsted Grotesk is a newspaper grotesk (drawn for Schibsted's titles):
  narrow-ish, sturdy, with a large x-height and open apertures, so 13–15 px
  captions stay legible over paper texture; its slightly squared bowls sit
  well against the serif's roundness without competing. Six weights, italic,
  latin-ext.
- Both are OFL, both come through `next/font/google` (self-hosted at build,
  no runtime request to Google), both variable-ish enough to load as two
  files each.
- Turkish typography rules applied in CSS and code: `lang="tr"`, `«»`
  never; Turkish quotes are “ ” (Turkish uses the same as English by TDK)
  and the apostrophe in suffixes is ’; uppercase through
  `toLocaleUpperCase("tr")` so *i → İ* and *ı → I*; hanging punctuation
  via `hanging-punctuation: first last` where supported; widows prevented
  by joining the last two words of every paragraph with a no-break space at
  render time (server side, deterministic).

## 2. Storyboard and camera path

One world, one camera, no page loads. The studio table is the plane
`y = 0`; the acts are laid along `+x`, 6 units apart; the camera dollies
along `x` and changes height and pitch per act. Progress `p ∈ [0,1]` is
the master clock.

| act | p range     | camera (from → to)                                   | what happens |
|-----|-------------|------------------------------------------------------|--------------|
| 0   | preload     | static                                               | crop + registration marks draw themselves as SVG over the paper, assemble into the "EG" monogram; progress bound to font load, 3D chunk, textures |
| I   | 0.00 – 0.14 | (0, 2.4, 3.2) looking at (0, 0, 0), pitch −36°       | the sheet floats 0.08 above the table; name debossed; lamp reveals it. Scroll lifts the sheet (y 0.08 → 0.6), tilts it (−90° about x) and turns it (180° about y) so its back — work 1 — faces the camera |
| II  | 0.14 – 0.44 | dolly x 0 → 6, y 2.0, pitch −20°, then orbits ±12° with cursor | the print wall: objects hung/standing in a curated grid at x 6 ± 3; filter re-arranges (positions tween 0.8 s) |
| III | 0.44 – 0.60 | x 12, y 1.6 looking down at the swatch book         | the swatch fan opens on its rivet from −8° to +72° as p runs; hover lifts a chip |
| IV  | 0.60 – 0.76 | x 18, y 2.2, pitch −45°                               | the fold: a 6-panel sheet folds panel by panel; each panel carries one step |
| V   | 0.76 – 0.88 | x 24, y 1.4, pitch −12°                               | the printed portrait (halftone) and the bio |
| VI  | 0.88 – 1.00 | x 30, y 1.5 → pull back to (18, 6, 9) looking at the table | the business card tilts and flips; at the end every sheet settles into one stack; "Yeni projelere açığım." |

Mobile keys use the same anchors with the camera 20 % further back and
shallower pitches; the wall arranges into two columns.

Hash links `#isler #beceriler #surec #hakkimda #iletisim` map to the anchor
progress of acts II–VI; with WebGL off they are ordinary anchors.

## 3. Scene graph

```
<Canvas>                     one, persistent, dpr [1,2] HIGH / 1 LOW
 ├ CameraRig                 damped p → position/target/fov, cursor orbit
 ├ Lamp                      spot light + target following the cursor hit
 ├ Sky                       hemisphere + area (RectAreaLight on HIGH, directional on LOW)
 ├ Table                     one plane, paper-2, receives shadows
 ├ Act I  Sheet              the hero sheet (deboss normal map), 3 loose sheets, 1 ink swatch
 ├ Act II Wall               InstancedMesh per object type: rail clips, posters (bent plane), books (2 covers + spine, opens), boxes, cards, screens; one artwork material per work with its texture
 ├ Act III Swatches          InstancedMesh of chips (rounded box), rivet cylinder, tools card (emboss stamps)
 ├ Act IV Fold               one 6-panel plane with per-panel hinge skinning in the vertex shader, self-shadowing via the lamp's shadow map
 ├ Act V  Portrait           plane with the halftone material (photo or typographic monogram), bio is HTML
 ├ Act VI Card               rounded box, spot colour, front/back emboss maps; the stack at the end (InstancedMesh)
 ├ Confetti                  InstancedMesh (400 quads) for the "elif" easter egg, hidden until used
 └ Post (HIGH only)          DoF (shallow), Noise 0.02, Vignette 0.15
```

Rules: every repeated mesh is instanced; `useFrame` callbacks allocate
nothing (module-level scratch vectors); every geometry/material/texture is
disposed on unmount through `useDispose`; `frameloop` pauses when the tab is
hidden; touch devices run at a 30 fps cap through `demand` + `invalidate`.

## 4. Scroll → progress mapping

The HTML document is the scroll track: each act is a `<section>` of
`min-height: 100dvh` in the no-WebGL layout; with WebGL, the track is a
fixed height (`--track-vh`: 700 vh desktop, 520 vh mobile) and the sections
are `position: fixed` panels whose opacity `--vis` the scroll driver sets
from `p`. Lenis smooths the scroll (lerp 0.085); with reduced motion Lenis
is not loaded and the rig snaps to act anchors.

## 5. The cursor lamp

- The pointer is raycast against the table plane every frame (no allocation:
  one `Raycaster`, one `Plane`, one `Vector3`).
- The lamp's target is damped toward the hit (maath `damp`, λ = 6). The
  lamp body sits at `hit + (−0.6, 0.9, 0.6)`, so light rakes across the
  paper at ~34° elevation from the upper-left, the convention of every
  studio photograph of embossed paper.
- **Tilt**: each paper group's rotation is damped toward
  `(−dy · 0.06, dx · 0.06)` where `d` is the offset of the hit from the
  group's centre, clamped to ±3.5°. Spring: critically damped, λ = 4.
- **Registration drift**: the pointer velocity (pixels/s, EMA 0.15) becomes
  a per-plate offset: C ← −v·k, M ← +v·k rotated 90°, Y ← +v·k, K stays;
  k = 0.00035 uv per px/s, clamped to 0.006 uv. Stillness decays the
  offsets with λ = 5.
- **Cursor**: DOM. Crosshair registration mark (SVG, 28 px) everywhere;
  over a work it becomes a 120 px loupe whose content is a second, small
  3D render? No: the loupe is a mesh (a disc, renderOrder 10, depthTest
  off) that follows the hit point across the work and samples the same
  artwork texture at 3× magnification through the halftone shader (four
  screens at 15°, 45°, 75°, 90° with CMYK dot colours), so it reveals
  the dots of the print rather than blurring pixels.
- **Touch**: no custom cursor. The lamp follows the touch point; when there
  is no touch the lamp drifts slowly on a Lissajous path so the paper is
  never flat. Device orientation tilt sits behind an explicit
  "Hareketi etkinleştir" button (iOS permission prompt only after a tap).

## 6. Quality tiers and budgets

`detect-gpu` (self-hosted benchmarks) gives the starting tier; drei's
`PerformanceMonitor` (bounds 45–58 fps) with hysteresis (two declines to
drop, three inclines to rise, 6 s lock after any change, `flipflops=3`)
adjusts it. `?tier=high|low` pins it for measurement.

| tier | dpr        | shadows          | post                       | grain normal | halftone loupe |
|------|------------|------------------|----------------------------|--------------|----------------|
| HIGH | min(2, dev)| PCF soft, 2048   | DoF, grain, vignette       | 2 octaves    | yes            |
| LOW  | 1          | none, baked quad | none                       | 1 octave     | plain magnifier|

Budgets: initial JS before the 3D chunk ≤ 180 KB gzip (measured in §10);
≤ 90 draw calls per act; textures ≤ 2048 px with mipmaps, WebP, generated
at build by sharp; LCP is the HTML `<h1>`; CLS < 0.05 (the canvas is fixed;
the hero text keeps its box when the 3D deboss takes over, it only becomes
transparent).

## 7. Fallback plan

| condition | behaviour |
|---|---|
| no WebGL2, software renderer, `?nogl` | 3D chunk never loads; editorial HTML layout with CSS letterpress (text-shadow emboss), paper background, all sections stacked |
| render error, no frame for 25 s, stall > 12 s | error boundary / watchdog unmount the canvas and hand over to the HTML layout in place |
| `prefers-reduced-motion` | no Lenis, camera snaps to act anchors with a 400 ms crossfade, lamp static at upper-left, no tilt, no drift, no confetti |
| touch | shorter track, 30 fps cap, no hover-only information (descriptions are always in the HTML), tap targets ≥ 44 px, no custom cursor |
| keyboard only | every work/chip/step is a real focusable element in the HTML; focus moves the camera to its act; visible 2 px spot-colour focus ring |
| screen reader | canvas `aria-hidden`; all content in semantic HTML with headings and lists; images have `alt` from `meta.json` |
| no photo in `content/` | Act V shows a typographic monogram print instead |

## 8. Dependencies

| package | why |
|---|---|
| `three`, `@react-three/fiber`, `@react-three/drei` | the stack (given) |
| `@react-three/postprocessing` + `postprocessing` | DoF, grain and vignette on HIGH; nothing else in three does a stable, single-pass DoF |
| `maath` | `damp` for every spring (lamp, tilt, camera, drift decay) |
| `three-stdlib` | `RoundedBoxGeometry` for chips, the card and the boxes |
| `detect-gpu` | starting quality tier from the benchmark database |
| `lenis` | smooth scroll; 6 KB, no framer/gsap |
| `sharp` (build) | WebP/AVIF derivatives, ≤ 2048 px textures with mipmaps, sample works rasterised from SVG, OG image |
| `puppeteer` (dev) | screenshots and measurements in the self-critique loop |

## 9. Techniques

- **Paper is one material.** `paperMaterial()` wraps `MeshPhysicalMaterial`
  and injects two tangent-space normals through `onBeforeCompile`: a tiled
  value-noise grain (generated once, 512², repeated in the shader so the
  emboss keeps the plain uv) and an optional emboss map, blended with
  reoriented normal mapping. The emboss mask also darkens indirect light
  (letterpress ao). Sheen 0.3 with a warm tint gives raking light the soft
  specular of coated stock. Every sheet, chip, panel, cover and card on the
  site is this material with different inputs.
- **Deboss from text.** The name is drawn into a canvas with the site's own
  Instrument Serif (fonts resolved from the `--font-display` variable that
  `next/font` sets), blurred by 4 px so the paper yields around the plate,
  turned into a height field and differentiated with a Sobel kernel into a
  normal map. The same routine embosses the tools card, the identity cards
  (from the artwork's dark pixels) and both faces of the business card.
- **The hero sheet sits exactly under the HTML heading.** The hero camera
  looks straight down, so the table is parallel to the screen: the sheet is
  scaled so the pressed name has the `<h1>`'s computed font size and placed
  so the first baseline lands on the heading's. The HTML name then becomes
  transparent (its box stays, so nothing shifts) and the visitor sees one
  name, pressed into paper, lit by their hand.
- **The lamp.** One spot light at `hit + (−0.8, 1.05, 0.6)` where `hit` is
  the pointer's intersection with the table plane, damped with maath.
  Intensity breathes with pointer speed. With no pointer the target drifts on
  a Lissajous path so paper is never flat. PCF-soft 2048² shadow on HIGH.
- **Registration drift.** Print materials sample the artwork four times with
  per-plate offsets driven by the pointer's velocity (EMA), convert each
  sample to CMYK, keep its own plate and recombine subtractively, so a fast
  move mis-registers like a press and stillness snaps back. Zero drift
  reproduces the original pixels exactly.
- **The loupe.** A disc mesh that follows the pointer's uv on the hovered
  object and renders the artwork at 3.2× through four rotated halftone
  screens (C 15°, M 75°, Y 0°, K 45°) with paper-white between the dots;
  LOW tier gets the plain magnifier.
- **Wall objects.** Posters are 14-segment planes bowed in code, hung from a
  spot-colour rail by ink clips; the book is a page block with a hinged front
  cover that swings to −106° on hover, showing the first gallery image as
  the spread; the box is a rounded box whose y-rotation follows the pointer;
  the identity card is blind-embossed and grows four multiply-blended plate
  planes on hover that separate and recombine; screens are dark slabs with
  an emissive face. Every object damps toward its slot, sinks and shrinks to
  nothing when filtered out, and flies to 1.35 units in front of the camera
  when opened, 750 ms before the case-study page loads.
- **Hand-off.** The hero sheet's back carries the first work's cover (its
  uvs rotated so the flip reads upright); it travels to that work's slot and
  hides at p 0.155, where the wall's own object appears.
- **Swatch fan.** Seven rounded chips on a rivet, each printed with a tint
  of the one spot colour (100 % → 35 %) and its name at the tip, where a
  fanned book shows them. The fan opens to 77° over the act's first 11 %.
- **The fold.** Six hinged groups nested one inside the next; each hinge
  damps from a folded ±158° to flat as the visitor scrolls one sixth of the
  act. The strip runs away from the camera so every panel keeps its size;
  the panel textures are rotated a quarter turn to read from the front. The
  lamp's shadow map does the self-shadowing.
- **Halftone print.** A paper material whose `map_fragment` converts the
  image to a single-ink screen at 45°; the cell frequency and the blend
  toward continuous tone depend on the fragment's distance to the lamp
  target, so the picture resolves under the light.
- **Card and stack.** Spot-colour stock, name and title pressed and printed
  in white by a deterministic per-pixel stamp; the flip is scroll-driven
  plus a half-turn per click; the ending is one `InstancedMesh` of fourteen
  sheets easing from their acts' positions into a stack with a staggered
  arc.
- **Frame loop.** Desktop `always`; touch `demand` with a 30 fps
  `invalidate` loop; hidden tab `never`. `useFrame` callbacks use
  module-level scratch vectors; every geometry/material/texture is disposed
  through `useDispose`; artwork textures are shared through one cache and
  registered with the preloader.
- **HTML first.** Every act is a server-rendered section; with WebGL the
  panels become paper index cards over the scene, without it they are the
  editorial layout. Hash links, keyboard focus (focusing inside a hidden
  section moves the camera there), reduced motion (snap to stop keys, static
  lamp, no drift, open fan/fold), TR/EN dictionaries, locale-aware uppercase
  and no-widow paragraphs are all in the HTML layer.

## 10. Measurements

Every number below was measured in the build container on the Playwright
Chromium with SwiftShader (software WebGL, no GPU). Numbers that depend on
a GPU describe this machine, not a laptop or a phone; §11 says which.

### Build

| check | result |
|---|---|
| `npm run build` (Next 16.2.9, Turbopack) | passes, 21 static routes |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | passes |
| browser console, every act, desktop + mobile, light + dark | 0 errors, 0 warnings |

### Bundles (gzip, `node scripts/verify.mjs bundle`)

| bundle | size |
|---|---|
| initial JS before the 3D chunk (9 scripts referenced by the HTML) | **197.8 KB** — over the 180 KB budget |
| of which this site's own client code (scroll driver, store, nav, preloader, cursor, index lists) | 10.6 KB |
| of which Next.js 16 + React 19 runtime (react-dom 69.3 KB, app router 47.8 + 38.7 + 13.5 + 6.8 + 7.5 + 4.0 KB) | 186.9 KB |
| 3D chunk (three, fiber, drei, postprocessing, all six acts), loaded from an idle callback after first paint | 288.8 KB |
| other lazy chunks (lenis, HUD, confetti) | 12.5 KB |

The budget is missed by 17.8 KB and the miss is the framework floor: the
site's own initial code is 10.6 KB. The HUD and the confetti are lazy; the
dictionaries are the only remaining trim (≈ 3 KB) and were kept for the
language toggle. See §11.

### Tests (`node scripts/verify.mjs …`)

| test | result |
|---|---|
| keyboard only (Tab × 70, `?gl=1&tier=low`, 1440×900) | 68 focus stops (skip link, nav, theme, sound, 5 filter buttons, 6 works, 7 skills, the ending link, then the cycle repeats); every focused element inside the viewport, every one with a focus ring, 0 focused inside a still-hidden section (focusing a hidden panel drives the rig to it). Sections without focusable content (süreç, hakkımda, iletişim while `email` and `social` are empty) are reached by the nav links. |
| 390 px, no horizontal scroll | `scrollWidth` 390 = `clientWidth` in 3D mode and in HTML mode at every act anchor |
| reduced motion | `prefers-reduced-motion` matched; the rig sits exactly on stop keys 0, 0.24, 0.52, 0.68, 0.82, 0.92 for scroll targets 0.05, 0.30, 0.55, 0.70, 0.84, 0.94 (cuts, no flights) |
| TR/EN | `/` → `lang="tr"`, title "Elif Gezgin — Grafik Tasarımcı", toggle → `/en`; `/en` → `lang="en"`, "The print wall", toggle → `/`; hreflang alternates tr/en/x-default on both; work links `/isler/…` vs `/en/work/…` |
| memory after 5 full scroll cycles (HIGH) | geometries 34 / textures 49 / programs 24 after every cycle (before the first pass: 6 / 21 / 17, the scene is one world so everything is resident after cycle 1); JS heap 13 MB |
| README_ELIF.md | a `content/works/deneme-isi/` folder with `cover.jpg`, `01.jpg` and a `meta.json` (category `social`) was added by following the guide; the pipeline produced its derivatives and the manifest listed it seventh with one gallery entry; removing the folder removed it |
| WebGL disabled (`?nogl`) | complete editorial HTML at desktop and mobile, light and dark: `docs/screenshots/html-*.png` |
| hover, loupe, gift | pointer over the second poster: index row "Eş Merkezli" active, cursor in loupe mode, the loupe renders the CMYK halftone (`hover-loupe-desktop-light.png`); typing "elif" painted 1 474 confetti pixels after 1.2 s |

### Lighthouse 13 (headless Chromium + SwiftShader, `next start`, localhost)

| form | URL | Perf | A11y | BP | SEO | LCP | CLS | TBT | FCP |
|---|---|---|---|---|---|---|---|---|---|
| mobile (Moto G4 emulation, 4× CPU) | `/` (probe leaves WebGL off on SwiftShader → HTML-only page + preloader) | 60 | **100** | **100** | **100** | 3.79 s | 0 | 2 353 ms | 1.11 s |
| desktop | `/` | 71 | **100** | **100** | **100** | 0.80 s | 0 | 941 ms | 0.28 s |
| mobile | `/?gl=1` (WebGL forced on, rendered on the CPU) | 53 | **100** | **100** | **100** | 3.93 s | 0 | 19 588 ms | 0.91 s |
| desktop | `/?gl=1` | 62 | **100** | **100** | **100** | 0.90 s | 0 | 5 074 ms | 0.25 s |

The mobile LCP and TBT targets (2.5 s, 300 ms) are **not met on this
machine**. CLS is 0 everywhere (the debossed name replaces the `<h1>` pixels
in a box that never moves). The LCP element is the hero text in every run.
The blocking time is the throttled CPU compiling the framework chunks and,
under `?gl=1`, rasterising the first frames of the studio in software; the
3D chunk is fetched from an idle callback and is not on the LCP path. These
are container numbers; see §11.

### Frame time per act (`node scripts/verify.mjs perf`)

Headless Chromium on SwiftShader, so the frame times are CPU raster times
and say nothing about a GPU; the draw-call and triangle counts are exact.
Both runs force `?tier=high` so the counts are comparable (the touch profile
would otherwise drop shadows and cap at 30 fps); mobile = 390×844 with the
touch viewport and 4× CPU throttling.

| act | desktop 1440×900 fps / frame | draw calls | triangles | mobile 390 (4×) fps / frame | draw calls | triangles |
|---|---|---|---|---|---|---|
| I sheet (p 0) | 1.2 / 824 ms | 32 | 112 | 4.3 / 325 ms | 32 | 112 |
| II wall (p 0.24) | 2.1 / 822 ms | 50 | 1 286 | 3.0 / 329 ms | 22 | 186 |
| III swatch fan (p 0.52) | 1.7 / 1 021 ms | 100 | 4 910 | 3.3 / 350 ms | 100 | 4 910 |
| IV fold (p 0.68) | 1.2 / 911 ms | 85 | 158 | 3.5 / 329 ms | 85 | 158 |
| V portrait (p 0.82) | 1.1 / 969 ms | 30 | 634 | 3.0 / 347 ms | 30 | 634 |
| VI card (p 0.92) | 1.6 / 1 087 ms | 25 | 614 | 3.6 / 313 ms | 25 | 614 |
| ending stack (p 0.995) | 1.0 / 1 030 ms | 20 | 1 826 | 3.0 / 337 ms | 21 | 3 338 |

The swatch fan is the heaviest act: each of the seven chips carries a
six-entry material array (five paper edges and the printed face), so a chip
is six draw calls, and the HIGH-tier shadow pass draws every caster again.
Merging the edges into the face texture would take it to roughly a third;
it is the first thing to do if a device measurement shows the fan below
40 fps. The wall's mobile counts are lower because the phone rig frames
fewer objects at once.

### Screenshots

`docs/screenshots/final-{desktop,mobile}-{light,dark}-p*.png` at 1440×900
and 390×844 for p = 0, 0.24, 0.52, 0.68, 0.82, 0.92, 0.995;
`html-*.png` (no WebGL, full page), `reduced-*.png`, `low-*.png` (LOW
tier), `hover-loupe-*.png`, `confetti-*.png`.

## 11. Known limitations (honest)

- **Frame rate on real hardware is unmeasured.** The container has no GPU;
  SwiftShader renders the studio at about one frame per second, so the
  60 fps laptop and 40 fps Android targets are engineered for (one material,
  instanced stack, 30 fps cap and no shadows on touch, no post on LOW) but
  not verified on a device. Draw calls per act at HIGH are 20–100 (§10);
  the swatch fan (100) is the one above the 90-call budget set in §6.
- **Initial JS is 197.8 KB gzip against a 180 KB budget.** The site's own
  initial code is 10.6 KB; the remaining 187 KB is the Next.js 16 App Router
  and React 19 runtime, which cannot be trimmed from inside the project.
- **Lighthouse mobile LCP (3.8 s) and TBT (2.4 s) miss the 2.5 s / 300 ms
  targets on this machine.** The numbers come from a throttled CPU in a
  container with a software renderer; the HTML-only run has no 3D work on
  the LCP path, so the miss is the framework chunk's parse and hydration
  under 4× throttling. Real-device numbers were not measured. Accessibility,
  best practices and SEO (100 / 100 / 100) do not depend on the machine.
- **No content from Elif yet.** The six works are fictional samples marked
  "Örnek"; the bio and skill list are editable placeholders that describe
  a practice, not facts about a person; `email` and `social` are empty, so
  the copy button, the mailto form and the social links are hidden until
  she fills them in (nothing is invented).
- **Device-orientation tilt** on phones (the optional "Hareketi
  etkinleştir" button) is not built; the lamp follows touch, nothing else.
- **The registration drift and the loupe need a pointer**, so they do not
  exist on touch devices by design.
- **Halftone screens are procedural**, four rotated dot screens; a real
  press would use stochastic or elliptical dots and the moiré between the
  screens is visible when the print is small on screen.
- **Sound** is two synthesized cues (rustle, thunk) behind a toggle that
  defaults to off; there is no ambient bed.
- **Fold self-shadowing** relies on the lamp's shadow map and therefore
  exists only on HIGH.
