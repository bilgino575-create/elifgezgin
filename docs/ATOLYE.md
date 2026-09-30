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

## 9. Techniques (filled in as built)

See §9 below the measurements once the acts exist.

## 10. Measurements

Filled in at the end of the build.

## 11. Known limitations

Filled in at the end of the build.
