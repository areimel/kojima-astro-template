import { createTimer } from "animejs";

import { DURATION, GLYPHS, STAGGER, TYPE_CURSOR_BLINK_MS } from "../config";
import { combine, withRestore } from "./lifecycle";
import type {
  AnimationHandle,
  AnimationPreset,
  AnimationSettings,
} from "../types";

const CURSOR_CLASS = "anim-typing";
const GLYPH_CYCLE_MS = 50;
/** 3 cursor blinks after typing (period is TYPE_CURSOR_BLINK_MS, matching text.css). */
const BLINK_MS = 3 * TYPE_CURSOR_BLINK_MS;
/** Elements whose `aria-label` is honoured; labelling plain span/div/p is prohibited. */
const NAMING_TAGS = /^(h[1-6]|a|button)$/i;

/** Every text node under `el` in document order (never touches element nodes). */
function collectTextNodes(el: HTMLElement): Text[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode())
    nodes.push(n as Text);
  return nodes;
}

/** Readable text: text nodes joined, `<br>` as a space, whitespace collapsed. */
function accessibleText(el: HTMLElement): string {
  const walker = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );
  let out = "";
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) out += (n as Text).data;
    else if ((n as Element).tagName === "BR") out += " ";
  }
  return out.replace(/\s+/g, " ").trim();
}

const canBeLabelled = (el: HTMLElement) =>
  NAMING_TAGS.test(el.tagName) || el.hasAttribute("role");

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
  /** Classes present while the effect runs. */
  classes?: readonly string[];
  /** Draw a frame. */
  frame(f: Frame, duration: number): void;
}

/**
 * Shared runner: one anime timer per target (offset by stagger), mutating only
 * text node data. A11y: while animating, an element with a naming role (heading,
 * link, button, explicit role) and no label gets an `aria-label` holding the
 * real text; other elements get `aria-busy="true"`. Both are removed on
 * finish/revert. The height is pinned via `min-height` so the text swap cannot
 * reflow. Style/class restoration goes through `withRestore`.
 */
function runTextEffect(
  targets: HTMLElement[],
  settings: AnimationSettings,
  makeEffect: EffectFactory,
): AnimationHandle {
  return combine(
    targets.map((el, i) => {
      const effect = makeEffect();
      const total = effect.total(settings.duration);
      const nodes = collectTextNodes(el);
      const originals = nodes.map((n) => n.data);
      const delay = settings.delay + settings.stagger * i;
      const label = !el.hasAttribute("aria-label") && canBeLabelled(el);
      const busy = !label && !el.hasAttribute("aria-busy");

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

      return withRestore(
        [el],
        {
          classes: effect.classes,
          restore: () => {
            nodes.forEach((n, k) => (n.data = originals[k]));
            if (label) el.removeAttribute("aria-label");
            if (busy) el.removeAttribute("aria-busy");
          },
        },
        (release) => {
          el.style.minHeight = `${el.getBoundingClientRect().height}px`;
          if (label) el.setAttribute("aria-label", accessibleText(el));
          if (busy) el.setAttribute("aria-busy", "true");
          draw(0); // synchronous frame 0 (before data-anim-pending is removed)
          return createTimer({
            duration: delay + total,
            onUpdate: (timer) => draw(timer.currentTime - delay),
            onComplete: release,
          });
        },
      );
    }),
  );
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
 * after the last character.
 */
const typewriterEffect: EffectFactory = () => ({
  classes: [CURSOR_CLASS],
  total: (d) => d + BLINK_MS,
  frame(f, duration) {
    const typed = Math.ceil(Math.min(1, f.t / duration) * f.count);
    f.render((i, ch) => (i < typed ? ch : ""));
  },
});

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
