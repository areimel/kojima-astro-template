import { PALETTE_PRESETS } from "../../presets";
import type { PalettePreset } from "../../presets";
import { DEFAULT_PALETTE } from "../types";
import type { Palette } from "../types";

let ctx2d: CanvasRenderingContext2D | null = null;
const hexCache = new Map<string, string>();

const hex2 = (n: number) => n.toString(16).padStart(2, "0");

/** Normalise any CSS colour (hex, rgb, oklch, ...) to `#rrggbb` via a 1x1 canvas round-trip. */
export function cssColorToHex(value: string): string {
  const key = value.trim();
  const cached = hexCache.get(key);
  if (cached) return cached;
  if (!ctx2d) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    ctx2d = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!ctx2d) return key;
  ctx2d.clearRect(0, 0, 1, 1);
  ctx2d.fillStyle = "#000000";
  ctx2d.fillStyle = key;
  ctx2d.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx2d.getImageData(0, 0, 1, 1).data;
  const hex = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  hexCache.set(key, hex);
  return hex;
}

/** Merge a partial palette over a base, ignoring undefined values. */
export function mergePalette(base: Palette, partial: Partial<Palette> = {}): Palette {
  const out: Palette = { ...base };
  for (const [key, value] of Object.entries(partial)) {
    if (value !== undefined) (out as unknown as Record<string, unknown>)[key] = value;
  }
  return out;
}

/** Read the Kojima theme tokens from CSS custom properties. */
export function readKojimaPalette(root: HTMLElement = document.documentElement, dark: boolean): Palette {
  const style = getComputedStyle(root);
  const read = (name: string, fallback: string) => {
    const raw = style.getPropertyValue(name).trim();
    return raw ? cssColorToHex(raw) : fallback;
  };
  const d = DEFAULT_PALETTE;
  const foreground = read("--foreground", d.pin);
  const primary = read("--primary", d.tile);
  const muted = read("--muted-foreground", d.introLines);
  return {
    tile: dark ? primary : read("--kojima-accent-ink", primary),
    pin: foreground,
    label: foreground,
    marker: primary,
    introLines: muted,
    satelliteWave: foreground,
    satelliteCore: primary,
    satelliteShield: read("--chart-3", d.satelliteShield),
    smoke: muted,
    atmosphere: primary,
    fog: read("--background", d.fog),
    background: null,
  };
}

/** Resolve a preset name or partial palette (merged over the live kojima palette) to a full Palette. */
export function resolvePalette(
  preset: PalettePreset | Partial<Palette>,
  dark: boolean,
  root?: HTMLElement,
): Palette {
  if (typeof preset === "object") return mergePalette(readKojimaPalette(root, dark), preset);
  const entry = PALETTE_PRESETS[preset];
  return entry === "kojima" ? readKojimaPalette(root, dark) : entry;
}
