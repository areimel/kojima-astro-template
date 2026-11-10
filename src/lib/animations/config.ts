/** Central tuning knobs for every animation preset. Change values here to update the whole site. */

/** Shared with `src/hooks/use-mobile.ts`; below this width the mobile attribute applies. */
export { MOBILE_BREAKPOINT, MOBILE_QUERY } from "@/lib/breakpoints";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Attribute names, kept in one place so the engine, helper, and CSS agree. */
export const ATTR = {
  animation: "data-animation",
  desktop: "data-desktop-animation",
  mobile: "data-mobile-animation",
  trigger: "data-anim-trigger",
  delay: "data-anim-delay",
  duration: "data-anim-duration",
  stagger: "data-anim-stagger",
  children: "data-anim-children",
  /** Set by the engine while a target is waiting to animate (CSS hides it). */
  pending: "data-anim-pending",
  /** Emitted by `anim()`: which breakpoints pre-hide the element (`both|desktop|mobile`) until processed. */
  hide: "data-anim-hide",
  /** Set by the engine once an element has been processed. */
  state: "data-anim-state",
} as const;

export const ANIMATED_SELECTOR = `[${ATTR.animation}],[${ATTR.desktop}],[${ATTR.mobile}]`;

/** Class added to <html> by the inline head script when JS + motion are available. */
export const READY_CLASS = "anim-ready";

/** Easing tokens (anime.js v4 names). Snappy and mechanical rather than bouncy. */
export const EASE = {
  out: "outExpo",
  inOut: "inOutQuad",
  linear: "linear",
} as const;

/** Duration tokens in ms. */
export const DURATION = {
  fast: 240,
  base: 600,
  slow: 1000,
  decode: 900,
} as const;

/** Default stagger between children in ms. */
export const STAGGER = 70;

/** Safety net: targets still hidden after this long are revealed. Must match the 4s failsafe in styles/animations/base.css. */
export const FAILSAFE_MS = 4000;

/** Typewriter cursor blink period in ms. Must match the 0.4s animation in styles/animations/text.css. */
export const TYPE_CURSOR_BLINK_MS = 400;

/** Glyph pool used by scramble/decode effects. */
export const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$/\\<>[]{}=+*_-";

/** IntersectionObserver tuning for scroll-triggered presets. */
export const SCROLL_OBSERVER = {
  threshold: 0.15,
  rootMargin: "0px 0px -8% 0px",
} as const;

/** Glitch channel colours. `--glitch-b-default` (with its hex fallback) is declared once in styles/animations/glitch.css. */
export const GLITCH_COLORS = {
  a: "var(--primary)",
  b: "var(--glitch-b-default)",
} as const;
