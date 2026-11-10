/** Central tuning knobs for every animation preset. Change values here to update the whole site. */

/** Shared with `src/hooks/use-mobile.ts`; below this width the mobile attribute applies. */
export const MOBILE_BREAKPOINT = 768;
export const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
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
  /** Stepped easing for terminal / CRT feel. */
  steps: "steps(6)",
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

/** Glyph pool used by scramble/decode effects. */
export const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$/\\<>[]{}=+*_-";

/** IntersectionObserver tuning for scroll-triggered presets. */
export const SCROLL_OBSERVER = {
  threshold: 0.15,
  rootMargin: "0px 0px -8% 0px",
} as const;

/** Theme colour tokens (CSS custom properties from kojima.css) used for glitch channels. */
export const GLITCH_COLORS = {
  a: "var(--primary)",
  b: "var(--chart-2, #5ad1e6)",
} as const;
