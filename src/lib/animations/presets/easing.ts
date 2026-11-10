import { steps } from "animejs";

/**
 * Stepped easings for the terminal / CRT feel. anime v4 needs the function
 * (not a string); kept out of `config.ts` so config stays dependency-free.
 */
export const STEPPED = {
  /** Six even steps. */
  steps: steps(6),
  /** Hold each keyframe value, then snap to the next. */
  hold: steps(1),
} as const;
