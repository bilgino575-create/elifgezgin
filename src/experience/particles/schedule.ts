/**
 * Where the persistent particle system forms which atmosphere image, along
 * the scroll clock p (docs/RENK.md). Between two keys with different images
 * the particles explode into a curl cloud and assemble the next one; between
 * keys with the same image they hold (and glide with the camera target).
 * `anchor: "name"` centres on the fitted glass name; otherwise on the camera
 * target at that p. z is behind that centre, height is the formed image's
 * world height (a factor of the name's height for "name" anchors under 3),
 * dim its brightness (dimmed behind a legend so the text keeps AA).
 */
export interface MorphKey {
  p: number;
  img: string;
  anchor?: "name";
  z: number;
  height: number;
  dim: number;
  dx?: number;
  dy?: number;
}

export const MORPH_KEYS: MorphKey[] = [
  // the portrait stands behind the glass name from the first frame; the shatter (0.02–0.075) plays over it
  // the portrait forms inside the letterforms (the name mask clips it), just behind the glass so the clip stays true in perspective
  { p: 0.0, img: "elif-00-hero", anchor: "name", z: -0.4, height: 1.08, dim: 1 },
  { p: 0.16, img: "elif-00-hero", anchor: "name", z: -0.4, height: 1.08, dim: 1 },
  { p: 0.24, img: "elif-03-portal-cerceveler", z: -5, height: 6.5, dim: 0.5, dx: 1.5 },
  { p: 0.44, img: "elif-03-portal-cerceveler", z: -5, height: 6.5, dim: 0.5, dx: 1.5 },
  { p: 0.48, img: "elif-05-kinetik-kurdele", z: -2.5, height: 5.2, dim: 1 },
  { p: 0.535, img: "elif-05-kinetik-kurdele", z: -2.5, height: 5.2, dim: 1 },
  { p: 0.56, img: "elif-04-renk-kartelasi", z: -2.5, height: 5.2, dim: 1 },
  { p: 0.59, img: "elif-04-renk-kartelasi", z: -2.5, height: 5.2, dim: 1 },
  { p: 0.63, img: "elif-06-renk-makinesi", z: -3, height: 5.6, dim: 1 },
  { p: 0.72, img: "elif-06-renk-makinesi", z: -3, height: 5.6, dim: 1 },
  { p: 0.745, img: "elif-07-halftone-kure", z: -3, height: 5, dim: 1 },
  { p: 0.755, img: "elif-07-halftone-kure", z: -3, height: 5, dim: 1 },
  { p: 0.78, img: "elif-09-atolye-masasi", z: -2.5, height: 4.6, dim: 0.85 },
  { p: 0.81, img: "elif-09-atolye-masasi", z: -2.5, height: 4.6, dim: 0.85 },
  { p: 0.835, img: "elif-00-hero", z: -1.5, height: 3.8, dim: 1 },
  { p: 0.85, img: "elif-00-hero", z: -1.5, height: 3.8, dim: 1 },
  { p: 0.9, img: "elif-08-holografik-kartvizit", z: -5, height: 6.5, dim: 0.45, dy: 0.9 },
  { p: 1.0, img: "elif-08-holografik-kartvizit", z: -5, height: 6.5, dim: 0.45, dy: 0.9 },
];
