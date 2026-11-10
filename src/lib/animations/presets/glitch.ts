import { createTimeline, utils } from "animejs";

import { DURATION, EASE, GLITCH_COLORS, STAGGER } from "../config";
import type {
  AnimationHandle,
  AnimationPreset,
  AnimationSettings,
} from "../types";

/** Class that applies the channel-split filter (see styles/animations/glitch.css). */
const GLITCH_CLASS = "anim-glitch";
/** Custom properties driven by anime.js and consumed by `.anim-glitch`. */
const GLITCH_VARS = [
  "--glitch-x",
  "--glitch-y",
  "--glitch-a",
  "--glitch-b",
] as const;

/** Hard-cut keyframes: each value holds, then jumps, spread evenly across `total` ms. */
const stepped = (values: Array<number | string>, total: number) =>
  values.map((to) => ({
    to,
    duration: total / values.length,
    ease: EASE.hold,
  }));

/** Signed random integer in [-max, max] (never 0 so jitter is always visible). */
const jitter = (max: number) =>
  utils.random(1, max) * (Math.random() < 0.5 ? -1 : 1);

/**
 * Shared runner: snapshots inline styles, hides targets for frame 0, builds one
 * timeline with a per-target `build` and restores everything on finish/revert.
 */
function withCleanup(
  targets: HTMLElement[],
  { delay, duration, stagger }: AnimationSettings,
  build: (
    tl: ReturnType<typeof createTimeline>,
    el: HTMLElement,
    at: number,
  ) => void,
  classes: string[] = [],
): AnimationHandle {
  const saved = targets.map((el) => el.getAttribute("style"));
  targets.forEach((el) => {
    el.style.opacity = "0"; // frame 0 before data-anim-pending is removed
    el.classList.add(...classes);
    if (classes.length) {
      el.style.setProperty("--glitch-a", GLITCH_COLORS.a);
      el.style.setProperty("--glitch-b", GLITCH_COLORS.b);
    }
  });

  const restore = () => {
    targets.forEach((el, i) => {
      el.classList.remove(...classes);
      GLITCH_VARS.forEach((v) => el.style.removeProperty(v));
      if (saved[i] === null) el.removeAttribute("style");
      else el.setAttribute("style", saved[i]);
    });
  };

  const handle: AnimationHandle = {
    revert() {
      tl.revert();
      restore();
    },
  };
  const tl = createTimeline({
    defaults: { duration },
    onComplete: () => handle.revert(),
  });
  targets.forEach((el, i) => build(tl, el, delay + i * stagger));
  return handle;
}

const glitchIn: AnimationPreset = {
  name: "glitch-in",
  defaultTrigger: "scroll",
  defaults: { duration: DURATION.base, stagger: STAGGER },
  mobileFallback: "fade-up",
  prehide: true,
  run: (_el, targets, settings) =>
    withCleanup(
      targets,
      settings,
      (tl, el, at) => {
        const d = settings.duration;
        tl.add(
          el,
          {
            opacity: stepped([0.2, 1, 0.4, 1, 0.7, 1], d),
            x: stepped(
              [jitter(12), jitter(8), jitter(10), jitter(5), jitter(3), 0],
              d,
            ),
            "--glitch-x": stepped(
              [jitter(10), jitter(8), jitter(12), jitter(6), jitter(3), 0],
              d,
            ),
            "--glitch-y": stepped(
              [jitter(3), 0, jitter(4), 0, jitter(1), 0],
              d,
            ),
            duration: d,
            ease: EASE.linear,
          },
          at,
        );
      },
      [GLITCH_CLASS],
    ),
};

const slice: AnimationPreset = {
  name: "slice",
  defaultTrigger: "scroll",
  defaults: { duration: DURATION.base, stagger: STAGGER },
  mobileFallback: "fade-up",
  prehide: true,
  run: (_el, targets, settings) =>
    withCleanup(targets, settings, (tl, el, at) => {
      const d = settings.duration;
      const bands = utils.random(3, 6);
      const clips: string[] = [];
      const shifts: number[] = [];
      for (let b = 0; b < bands; b++) {
        const top = utils.random(0, 80);
        const height = utils.random(8, 30);
        clips.push(`inset(${top}% 0% ${Math.max(0, 100 - top - height)}% 0%)`);
        shifts.push(jitter(24));
      }
      // Final frames: whole element, then settle.
      clips.push("inset(0% 0% 0% 0%)");
      shifts.push(0);
      tl.add(
        el,
        {
          opacity: 1,
          clipPath: stepped(clips, d),
          x: stepped(shifts, d),
          duration: d,
          ease: EASE.linear,
        },
        at,
      );
    }),
};

const flickerIn: AnimationPreset = {
  name: "flicker-in",
  defaultTrigger: "scroll",
  defaults: { duration: DURATION.base, stagger: STAGGER },
  prehide: true,
  run: (_el, targets, settings) =>
    withCleanup(targets, settings, (tl, el, at) => {
      const d = settings.duration;
      tl.add(
        el,
        {
          opacity: stepped([0, 0.8, 0.1, 1, 0.3, 1], d),
          scaleY: { from: 0.02, to: 1, duration: d * 0.5, ease: EASE.out },
          filter: {
            from: "brightness(3)",
            to: "brightness(1)",
            duration: d,
            ease: EASE.out,
          },
          duration: d,
          ease: EASE.linear,
        },
        at,
      );
    }),
};

export const glitchPresets: AnimationPreset[] = [glitchIn, slice, flickerIn];
