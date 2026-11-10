import { type CanvasTexture, LineBasicMaterial } from "three";

import { dotTexture } from "../utils/canvas";

export interface PinAssets {
  color: string;
  line: LineBasicMaterial;
  texture: CanvasTexture;
}

/** Ref-counted per-colour line material + dot texture, shared between pins. */
export function createPinAssetCache() {
  const cache = new Map<string, PinAssets & { refs: number }>();
  return {
    acquire(color: string): PinAssets {
      let entry = cache.get(color);
      if (!entry) {
        entry = {
          color,
          line: new LineBasicMaterial({ color, fog: true }),
          texture: dotTexture(color),
          refs: 0,
        };
        cache.set(color, entry);
      }
      entry.refs++;
      return entry;
    },
    release(assets: PinAssets) {
      const entry = cache.get(assets.color);
      if (entry && --entry.refs <= 0) {
        entry.line.dispose();
        entry.texture.dispose();
        cache.delete(assets.color);
      }
    },
    dispose() {
      for (const entry of cache.values()) {
        entry.line.dispose();
        entry.texture.dispose();
      }
      cache.clear();
    },
  };
}
