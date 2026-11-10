import { type CanvasTexture, LineBasicMaterial } from "three";

import { dotTexture } from "../utils/canvas";
import { createRefCache } from "../utils/ref-cache";

export interface PinAssets {
  color: string;
  line: LineBasicMaterial;
  texture: CanvasTexture;
}

/** Ref-counted per-colour line material + dot texture, shared between pins. */
export function createPinAssetCache() {
  const cache = createRefCache<string, PinAssets>(
    (color) => ({
      color,
      line: new LineBasicMaterial({ color, fog: true }),
      texture: dotTexture(color),
    }),
    (a) => {
      a.line.dispose();
      a.texture.dispose();
    },
  );
  return {
    acquire: (color: string): PinAssets => cache.acquire(color),
    release: (assets: PinAssets) => cache.release(assets.color),
    dispose: () => cache.clear(),
  };
}
