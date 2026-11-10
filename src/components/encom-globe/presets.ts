import { DEFAULT_PALETTE } from "./engine/types";
import type { Palette } from "./engine/types";
import type { GlobeConfigInput } from "./schema";

export type PalettePreset = "kojima" | "encom" | "mono";

/** Sentinel: `kojima` is resolved live from the site's CSS variables. */
export const KOJIMA_PRESET = "kojima" as const;

export const PALETTE_PRESETS: Record<PalettePreset, Palette | typeof KOJIMA_PRESET> = {
  kojima: KOJIMA_PRESET,
  encom: DEFAULT_PALETTE,
  mono: {
    tile: "#d8d8d8",
    pin: "#ffffff",
    label: "#ffffff",
    marker: "#ffffff",
    introLines: "#9a9a9a",
    satelliteWave: "#ffffff",
    satelliteCore: "#ffffff",
    satelliteShield: "#bdbdbd",
    smoke: "#8a8a8a",
    atmosphere: "#bdbdbd",
    fog: "#000000",
    background: "#000000",
  },
};

export type ConfigPresetName = "default" | "boardroom" | "ambient";

export const CONFIG_PRESETS: Record<ConfigPresetName, GlobeConfigInput> = {
  default: {},
  boardroom: { viewAngle: 0.1 },
  ambient: { introLinesCount: 0, layers: { introLines: false, smoke: false } },
};
