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
  { p: 0.0, img: "elif-02-cam-parcalari", anchor: "name", z: -9, height: 9, dim: 0.35 },
  { p: 0.05, img: "elif-02-cam-parcalari", anchor: "name", z: -9, height: 9, dim: 0.35 },
  { p: 0.08, img: "elif-01-murekkep-damlasi", anchor: "name", z: -7, height: 8, dim: 0.5 },
  { p: 0.09, img: "elif-01-murekkep-damlasi", anchor: "name", z: -7, height: 8, dim: 0.5 },
  { p: 0.115, img: "elif-00-hero", anchor: "name", z: -1.8, height: 1.75, dim: 0.62 },
  { p: 0.16, img: "elif-00-hero", anchor: "name", z: -1.8, height: 1.75, dim: 0.62 },
  { p: 0.24, img: "elif-03-portal-cerceveler", z: -5, height: 6.5, dim: 0.5, dx: 1.5 },
  { p: 0.44, img: "elif-03-portal-cerceveler", z: -5, height: 6.5, dim: 0.5, dx: 1.5 },
  { p: 0.48, img: "elif-04-renk-kartelasi", z: -6, height: 7, dim: 0.55 },
  { p: 0.53, img: "elif-04-renk-kartelasi", z: -6, height: 7, dim: 0.55 },
  { p: 0.56, img: "elif-05-kinetik-kurdele", z: -6, height: 7, dim: 0.55 },
  { p: 0.59, img: "elif-05-kinetik-kurdele", z: -6, height: 7, dim: 0.55 },
  { p: 0.63, img: "elif-06-renk-makinesi", z: -8, height: 8, dim: 0.4, dy: 1.6 },
  { p: 0.72, img: "elif-06-renk-makinesi", z: -8, height: 8, dim: 0.4, dy: 1.6 },
  { p: 0.745, img: "elif-07-halftone-kure", z: -3, height: 5, dim: 1 },
  { p: 0.755, img: "elif-07-halftone-kure", z: -3, height: 5, dim: 1 },
  { p: 0.78, img: "elif-09-atolye-masasi", z: -2.5, height: 4.6, dim: 0.85 },
  { p: 0.81, img: "elif-09-atolye-masasi", z: -2.5, height: 4.6, dim: 0.85 },
  { p: 0.835, img: "elif-00-hero", z: -1.5, height: 3.8, dim: 1 },
  { p: 0.85, img: "elif-00-hero", z: -1.5, height: 3.8, dim: 1 },
  { p: 0.9, img: "elif-08-holografik-kartvizit", z: -5, height: 6.5, dim: 0.45, dy: 0.9 },
  { p: 1.0, img: "elif-08-holografik-kartvizit", z: -5, height: 6.5, dim: 0.45, dy: 0.9 },
];
