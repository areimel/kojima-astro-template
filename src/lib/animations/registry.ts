/**
 * The approved animation pool. The engine resolves attribute values through
 * this map, so it is the single source of truth for which presets exist.
 */
import { ambientPresets } from "./presets/ambient";
import { glitchPresets } from "./presets/glitch";
import { revealPresets } from "./presets/reveal";
import { textPresets } from "./presets/text";
import { PRESET_NAMES, type AnimationPreset, type PresetName } from "./types";

const all: AnimationPreset[] = [
  ...textPresets,
  ...glitchPresets,
  ...revealPresets,
  ...ambientPresets,
];

export const registry = Object.fromEntries(
  all.map((preset) => [preset.name, preset]),
) as Record<PresetName, AnimationPreset>;

export function isPresetName(
  value: string | null | undefined,
): value is PresetName {
  return !!value && (PRESET_NAMES as readonly string[]).includes(value);
}

export function getPreset(name: PresetName): AnimationPreset | undefined {
  return registry[name];
}
