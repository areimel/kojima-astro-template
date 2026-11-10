import { createTimer } from "animejs";

import { DURATION, GLYPHS, STAGGER } from "../config";
import type { AnimationHandle, AnimationPreset, AnimationSettings } from "../types";

const CURSOR_CLASS = "anim-typing";
const GLYPH_CYCLE_MS = 50;
/** 3 cursor blinks after typing; keep in sync with the 0.4s period in text.css. */
const BLINK_MS = 3 * 400;

/** Every text node under `el` in document order (never touches element nodes). */
function collectTextNodes(el: HTMLElement): Text[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  return nodes;
}

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

interface Frame {
  /** Elapsed ms since this target's own delay elapsed (0 before). */
  t: number;
  /** Total characters across all text nodes. */
  count: number;
  /** Shared, document-ordered character index across all text nodes. */
  render(fn: (index: number, original: string) => string): void;
}

/** Effects are created per target so they can hold their own state. */
type EffectFactory = () => TextEffect;

interface TextEffect {
  /** Total timeline length in ms (after delay). */
  total(duration: number): number;
  /** Synchronous frame-0 state, before the engine unhides the element. */
  start?(el: HTMLElement): void;
  /** Draw a frame. */
  frame(f: Frame, duration: number): void;
  /** Extra cleanup of what `start` added. */
  cleanup?(el: HTMLElement): void;
}

/**
 * Shared runner: one anime timer per target (offset by stagger), mutating only
 * text node data. A11y: while animating, `aria-label` holds the real text
 * (only if the element had none) so assistive tech never reads glyph noise;
 * it is removed again on finish/revert. Inline-style `min-height` is also
 * pinned where an effect asks for it. `revert()` restores every node exactly.
 */
function runTextEffect(
  targets: HTMLElement[],
  settings: AnimationSettings,
  makeEffect: EffectFactory,
): AnimationHandle {
  const cleanups: Array<() => void> = [];
  const timers = targets.map((el, i) => {
    const effect = makeEffect();
    const total = effect.total(settings.duration);
    const nodes = collectTextNodes(el);
    const originals = nodes.map((n) => n.data);
    const delay = settings.delay + settings.stagger * i;
    const hadLabel = el.hasAttribute("aria-label");
    if (!hadLabel) el.setAttribute("aria-label", el.textContent?.trim() ?? "");

    const restore = () => nodes.forEach((n, k) => (n.data = originals[k]));
    const frame: Frame = {
      t: 0,
      count: originals.reduce((n, d) => n + [...d].length, 0),
      render(fn) {
        let index = 0;
        nodes.forEach((n, k) => {
          let out = "";
          for (const ch of originals[k]) out += fn(index++, ch);
          if (n.data !== out) n.data = out;
        });
      },
    };
    const draw = (elapsed: number) => {
      frame.t = Math.max(0, elapsed);
      effect.frame(frame, settings.duration);
    };
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      restore();
      effect.cleanup?.(el);
      if (!hadLabel) el.removeAttribute("aria-label");
    };
    cleanups.push(cleanup);

    effect.start?.(el);
    draw(0); // synchronous frame 0 (before data-anim-pending is removed)
    return createTimer({
      duration: delay + total,
      onUpdate: (timer) => draw(timer.currentTime - delay),
      onComplete: cleanup,
    });
  });

  return {
    revert() {
      timers.forEach((t) => t.revert());
      cleanups.forEach((c) => c());
    },
  };
}

/** Left-to-right glyph resolve; unresolved chars cycle random glyphs. Spaces stay. */
const decodeEffect: EffectFactory = () => {
  let bucket = -1;
  let glyphs: string[] = [];
  return {
    total: (d) => d,
    frame(f, duration) {
      const b = Math.floor(f.t / GLYPH_CYCLE_MS);
      if (b !== bucket) {
        bucket = b;
        glyphs = Array.from({ length: f.count }, randomGlyph);
      }
      const resolved = Math.floor(Math.min(1, f.t / duration) * f.count);
      f.render((i, ch) => (/\s/.test(ch) || i < resolved ? ch : glyphs[i]));
    },
  };
};

/**
 * Typewriter: reveals characters one by one; the block cursor is the
 * `.anim-typing::after` pseudo-element, which keeps blinking for ~3 beats
 * after the last character. Layout is held with a temporary min-height.
 */
const typewriterEffect: EffectFactory = () => {
  let prevMinHeight = "";
  return {
    total: (d) => d + BLINK_MS,
    start(el) {
      prevMinHeight = el.style.minHeight;
      el.style.minHeight = `${el.getBoundingClientRect().height}px`;
      el.classList.add(CURSOR_CLASS);
    },
    frame(f, duration) {
      const typed = Math.ceil(Math.min(1, f.t / duration) * f.count);
      f.render((i, ch) => (i < typed ? ch : ""));
    },
    cleanup(el) {
      el.classList.remove(CURSOR_CLASS);
      el.style.minHeight = prevMinHeight;
    },
  };
};

export const textPresets: AnimationPreset[] = [
  {
    name: "decode",
    defaultTrigger: "scroll",
    defaults: { duration: DURATION.decode, stagger: STAGGER },
    prehide: true,
    run: (_el, targets, settings) =>
      runTextEffect(targets, settings, decodeEffect),
  },
  {
    name: "typewriter",
    defaultTrigger: "scroll",
    defaults: { duration: DURATION.slow, stagger: STAGGER },
    prehide: true,
    run: (_el, targets, settings) =>
      runTextEffect(targets, settings, typewriterEffect),
  },
];
