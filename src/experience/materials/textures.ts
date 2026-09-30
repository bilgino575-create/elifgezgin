import { LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace, Texture, TextureLoader } from "three";
import { loading } from "@/lib/store";

const loader = new TextureLoader();
const cache = new Map<string, Texture>();

/**
 * Artwork textures, one per work, shared by every mesh that shows the same
 * cover (hero back, wall object, loupe). Registered with the preloader so
 * the percentage reflects real bytes.
 */
export function getWorkTexture(slug: string, src: string): Texture {
  const key = `${slug}:${src}`;
  let t = cache.get(key);
  if (t) return t;
  loading.register(`tex:${key}`, 1);
  t = loader.load(
    src,
    () => loading.done(`tex:${key}`),
    undefined,
    () => loading.done(`tex:${key}`)
  );
  t.colorSpace = SRGBColorSpace;
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  cache.set(key, t);
  return t;
}

export function disposeWorkTextures() {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
