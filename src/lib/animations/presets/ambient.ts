import { animate, utils } from "animejs";

import { DURATION, EASE, GLITCH_COLORS } from "../config";
import type {
  AnimationHandle,
  AnimationPreset,
  AnimationSettings,
} from "../types";

const CLASS = {
  pulse: "anim-pulse",
  glitch: "anim-glitch-hover",
} as const;

/** Hold each keyframe value, then snap to the next: mechanical, not smooth. */
const HOLD = EASE.hold;

/** One target's running pieces: anime handles plus any non-anime restore logic. */
interface Part {
  handles: AnimationHandle[];
  /** Undoes DOM writes anime does not own (text nodes, extra properties). */
  restore?: () => void;
}

/**
 * Shared "animate + class + cleanup" runner. `build` starts one target's
 * animation. The classes are added first and dropped when `finish` is called
 * (for one-shot effects, from anime's onComplete) or on revert. Classes the
 * author already set are never removed. `revert()` stops every animation, runs
 * every restore, and clears whatever this run added.
 */
function runTargets(
  targets: HTMLElement[],
  classes: readonly string[],
  build: (el: HTMLElement, index: number, finish: () => void) => Part,
): AnimationHandle {
  const runs = targets.map((el, index) => {
    const added = classes.filter((c) => !el.classList.contains(c));
    el.classList.add(...added);
    let released = false;
    const finish = () => {
      if (released) return;
      released = true;
      el.classList.remove(...added);
    };
    return { part: build(el, index, finish), finish };
  });

  return {
    revert() {
      for (const { part, finish } of runs) {
        part.handles.forEach((handle) => handle.revert());
        part.restore?.();
        finish();
      }
    },
  };
}

const delayFor = (s: AnimationSettings, index: number) =>
  s.delay + s.stagger * index;

/* blink: status-indicator light, hard on/off with randomised loop gaps. */
const blink: AnimationPreset = {
  name: "blink",
  defaultTrigger: "loop",
  defaults: { duration: 1200 },
  mobileFallback: "none",
  prehide: false,
  run(_el, targets, s) {
    return runTargets(targets, [], (el, i) => ({
      handles: [
        animate(el, {
          opacity: [1, 0.25, 1],
          duration: s.duration,
          delay: delayFor(s, i),
          ease: HOLD,
          loop: true,
          loopDelay: utils.random(0, 900),
        }),
      ],
    }));
  },
};

/* pulse: radar ping. anime drives `--pulse`; the `.anim-pulse::after` ring reads it. */
const pulse: AnimationPreset = {
  name: "pulse",
  defaultTrigger: "loop",
  defaults: { duration: 1600 },
  mobileFallback: "none",
  prehide: false,
  run(_el, targets, s) {
    return runTargets(targets, [CLASS.pulse], (el, i) => ({
      handles: [
        animate(el, {
          "--pulse": [0, 1],
          duration: s.duration,
          delay: delayFor(s, i),
          ease: EASE.out,
          loop: true,
        }),
      ],
    }));
  },
};

/* flicker: idle monitor, mostly full opacity with brief dips at random intervals. */
const FLICKER_KEYFRAMES = [1, 1, 1, 0.6, 1, 0.85, 1];
const flicker: AnimationPreset = {
  name: "flicker",
  defaultTrigger: "loop",
  defaults: { duration: 3000 },
  mobileFallback: "none",
  prehide: false,
  run(_el, targets, s) {
    return runTargets(targets, [], (el, i) => ({
      handles: [
        animate(el, {
          opacity: FLICKER_KEYFRAMES,
          duration: s.duration,
          delay: delayFor(s, i),
          ease: HOLD,
          loop: true,
          loopDelay: utils.random(1000, 4000),
        }),
      ],
    }));
  },
};

/* counter: counts the first number in the element's text up to its value. */
const NUMBER = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/;

interface CounterSpot {
  node: Text;
  original: string;
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
  grouped: boolean;
}

/** Finds the first text node holding a number. Only that node is ever written. */
function findCounterSpot(el: HTMLElement): CounterSpot | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const node = n as Text;
    const text = node.data;
    const match = NUMBER.exec(text);
    if (!match) continue;
    const token = match[0];
    const plain = token.replace(/,/g, "");
    return {
      node,
      original: text,
      prefix: text.slice(0, match.index),
      suffix: text.slice(match.index + token.length),
      target: Number(plain),
      decimals: plain.split(".")[1]?.length ?? 0,
      grouped: token.includes(","),
    };
  }
  return null;
}

function formatCount(
  value: number,
  spot: Pick<CounterSpot, "decimals" | "grouped">,
): string {
  const [whole, fraction] = value.toFixed(spot.decimals).split(".");
  const grouped = spot.grouped
    ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : whole;
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

const counter: AnimationPreset = {
  name: "counter",
  defaultTrigger: "scroll",
  defaults: { duration: DURATION.slow },
  prehide: false,
  run(_el, targets, s) {
    return runTargets(targets, [], (el, i) => {
      const spot = findCounterSpot(el);
      if (!spot) return { handles: [] };

      const count = { v: 0 };
      const write = () => {
        spot.node.data = spot.prefix + formatCount(count.v, spot) + spot.suffix;
      };
      const restore = () => {
        spot.node.data = spot.original;
      };
      write(); // frame 0 shows 0 before the first tick

      return {
        handles: [
          animate(count, {
            v: [0, spot.target],
            duration: s.duration,
            delay: delayFor(s, i),
            ease: EASE.out,
            onUpdate: write,
            onComplete: restore, // land on the exact original text
          }),
        ],
        restore,
      };
    });
  },
};

/* glitch-hover: a 250ms jitter plus RGB channel split, on every hover or focus. */
const glitchHover: AnimationPreset = {
  name: "glitch-hover",
  defaultTrigger: "hover",
  defaults: { duration: 250 },
  prehide: false,
  run(_el, targets, s) {
    return runTargets(targets, [CLASS.glitch], (el, i, finish) => {
      el.style.setProperty("--glitch-a", GLITCH_COLORS.a);
      el.style.setProperty("--glitch-b", GLITCH_COLORS.b);
      return {
        handles: [
          animate(el, {
            translateX: [0, -2, 2, -1, 1, 0],
            "--glitch-x": [0, 2, -2, 1, -1, 0],
            duration: s.duration,
            delay: delayFor(s, i),
            ease: HOLD,
            onComplete: finish, // class drops once the jitter lands on 0
          }),
        ],
        restore: () => {
          el.style.removeProperty("--glitch-a");
          el.style.removeProperty("--glitch-b");
        },
      };
    });
  },
};

export const ambientPresets: AnimationPreset[] = [
  blink,
  pulse,
  flicker,
  counter,
  glitchHover,
];
