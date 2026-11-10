/** Easing functions (ported from tween.js where noted). Input/output in [0, 1]. */
export type Ease = (t: number) => number;

export const linear: Ease = (t) => t;

/** tween.js `Easing.Elastic.Out`. */
export const elasticOut: Ease = (t) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
};

export const easeOutCubic: Ease = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic: Ease = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Normalised progress of an animation that starts at `start` and lasts `duration` ms. */
export function progress(time: number, start: number, duration: number): number {
  if (duration <= 0) return time >= start ? 1 : 0;
  return Math.max(0, Math.min(1, (time - start) / duration));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * A time-based tween driven by the engine clock (no timers, no globals).
 * `value(time)` is pure, so layers can sample it every frame.
 */
export interface Tween {
  from: number;
  to: number;
  start: number;
  duration: number;
  ease: Ease;
}

export function tween(
  from: number,
  to: number,
  start: number,
  duration: number,
  ease: Ease = linear,
): Tween {
  return { from, to, start, duration, ease };
}

export function sampleTween(t: Tween, time: number): number {
  return lerp(t.from, t.to, t.ease(progress(time, t.start, t.duration)));
}

export function tweenDone(t: Tween, time: number): boolean {
  return time >= t.start + t.duration;
}

/**
 * True when animations should be skipped and the settled end state shown:
 * reduced motion, or the intro is disabled in the config.
 */
export function isSettled(
  frame: { reducedMotion: boolean },
  config: { intro: boolean },
): boolean {
  return frame.reducedMotion || !config.intro;
}
