import { animate, stagger, utils } from "animejs";

import { DURATION, EASE, STAGGER } from "../config";
import type {
  AnimationHandle,
  AnimationPreset,
  AnimationSettings,
  PresetName,
} from "../types";

type Value = number | string;
/** Anime.js keyframe list, e.g. `[{ to: 0.4 }, { to: 1 }]`. */
type Keyframes = Array<{ to: Value }>;

interface RevealSpec {
  name: PresetName;
  defaults: AnimationPreset["defaults"];
  /** Classes present on targets while the animation runs. */
  classes?: string[];
  /** Starting state, applied synchronously so nothing flashes before the first frame. */
  from: Record<string, Value>;
  /**
   * End state. A scalar tweens from `from[key]`; a keyframe list plays its steps
   * (starting from `from`, or the current value when `from` is absent).
   */
  to: Record<string, Value | Keyframes>;
  ease: string;
}

/**
 * Shared runner for every reveal preset: applies the start state and classes
 * synchronously, animates the targets, and restores the original inline styles
 * and classes on completion or revert.
 */
function play(
  targets: HTMLElement[],
  settings: AnimationSettings,
  spec: RevealSpec,
): AnimationHandle {
  const classes = spec.classes ?? [];
  // Snapshot inline styles so the element ends (or reverts) exactly as it started.
  const originalStyles = targets.map((target) => target.getAttribute("style"));

  const restore = () => {
    targets.forEach((target, i) => {
      target.classList.remove(...classes);
      const style = originalStyles[i];
      if (style === null) target.removeAttribute("style");
      else target.setAttribute("style", style);
    });
  };

  const tweens = Object.fromEntries(
    Object.entries(spec.to).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : [spec.from[key], value],
    ]),
  );

  targets.forEach((target) => target.classList.add(...classes));
  utils.set(targets, spec.from);

  const animation = animate(targets, {
    ...tweens,
    duration: settings.duration,
    delay: stagger(settings.stagger, { start: settings.delay }),
    ease: spec.ease,
    onComplete: restore,
  });

  return {
    revert() {
      animation.revert();
      restore();
    },
  };
}

function createReveal(spec: RevealSpec): AnimationPreset {
  return {
    name: spec.name,
    defaultTrigger: "scroll",
    defaults: spec.defaults,
    prehide: true,
    run: (_el, targets, settings) => play(targets, settings, spec),
  };
}

const timing = (duration: number) => ({ duration, stagger: STAGGER });

const fadeUp = createReveal({
  name: "fade-up",
  defaults: timing(DURATION.base),
  from: { opacity: 0, translateY: 16 },
  to: { opacity: 1, translateY: 0 },
  ease: EASE.out,
});

const scanWipe = createReveal({
  name: "scan-wipe",
  defaults: timing(DURATION.slow),
  classes: ["anim-scan"],
  // `--scan` drives the scanline position and tracks the bottom edge of the clip.
  from: { clipPath: "inset(0 0 100% 0)", "--scan": "0%" },
  to: { clipPath: "inset(0 0 0% 0)", "--scan": "100%" },
  ease: EASE.inOut,
});

const redact = createReveal({
  name: "redact",
  defaults: timing(DURATION.base),
  classes: ["anim-redact"],
  // `--redact` scales the bar away; `--redact-text` fades the text in beneath it.
  from: { "--redact": 1, "--redact-text": 0 },
  to: { "--redact": 0, "--redact-text": 1 },
  ease: EASE.out,
});

const bootStagger = createReveal({
  name: "boot-stagger",
  defaults: timing(DURATION.fast * 2),
  from: { opacity: 0, translateX: -6 },
  // Stepped flicker: dark -> dim -> dimmer -> online.
  to: {
    opacity: [{ to: 0.4 }, { to: 0.1 }, { to: 1 }],
    translateX: 0,
  },
  ease: EASE.linear,
});

export const revealPresets: AnimationPreset[] = [
  fadeUp,
  scanWipe,
  redact,
  bootStagger,
];
