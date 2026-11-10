/**
 * Shared contracts for the attribute-driven animation system.
 * Every preset in `presets/` implements `AnimationPreset`; the engine only
 * talks to presets through this interface.
 */

/** The approved animation pool. Add a name here, then register it in `registry.ts`. */
export const PRESET_NAMES = [
  // Text
  "decode",
  "typewriter",
  // Glitch
  "glitch-in",
  "slice",
  "flicker-in",
  // Reveal
  "fade-up",
  "scan-wipe",
  "redact",
  "boot-stagger",
  // Ambient / hover
  "blink",
  "pulse",
  "flicker",
  "counter",
  "glitch-hover",
] as const;

export type PresetName = (typeof PRESET_NAMES)[number];

/** `"none"` explicitly disables animation for a breakpoint. */
export type AnimationValue = PresetName | "none";

/**
 * When a preset plays.
 * - `load`: as soon as the element is processed (above-the-fold content)
 * - `scroll`: once, the first time the element enters the viewport
 * - `hover`: on every pointerenter / focus
 * - `loop`: continuously (ambient effects)
 */
export type AnimationTrigger = "load" | "scroll" | "hover" | "loop";

/** Fully resolved per-element settings handed to `preset.run`. All times in ms. */
export interface AnimationSettings {
  delay: number;
  duration: number;
  stagger: number;
  trigger: AnimationTrigger;
  /** Optional selector; when set, `targets` are the matching children. */
  children?: string;
}

/** Anything the engine can stop and roll back (anime.js animations/timelines satisfy this). */
export interface AnimationHandle {
  revert(): unknown;
}

export interface AnimationPreset {
  name: PresetName;
  defaultTrigger: AnimationTrigger;
  /** Defaults used when the element sets no `data-anim-*` override. */
  defaults: { duration: number; stagger?: number; delay?: number };
  /**
   * Used on mobile when the element only sets `data-animation` (no
   * `data-mobile-animation`). Omit to reuse the same preset on mobile.
   */
  mobileFallback?: AnimationValue;
  /**
   * Whether the engine should hide targets (`data-anim-pending`) until the
   * preset runs. True for entrance presets, false for hover/loop presets.
   */
  prehide: boolean;
  /**
   * Plays the animation. `targets` is `[el]` or the `data-anim-children`
   * matches. Must leave targets fully visible and readable when finished, and
   * `revert()` must restore the original DOM/text/styles exactly.
   */
  run(
    el: HTMLElement,
    targets: HTMLElement[],
    settings: AnimationSettings,
  ): AnimationHandle;
}
