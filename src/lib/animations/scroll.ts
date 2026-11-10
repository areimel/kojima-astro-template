/** IntersectionObservers for scroll-triggered presets. */
import { SCROLL_OBSERVER } from "./config";

const callbacks = new WeakMap<Element, () => void>();
let normal: IntersectionObserver | null = null;
/** threshold 0 for elements taller than the viewport (0.15 may never be reached). */
let tall: IntersectionObserver | null = null;

function makeObserver(threshold: number) {
  const observer: IntersectionObserver = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        if (!record.isIntersecting) continue;
        observer.unobserve(record.target);
        callbacks.get(record.target)?.();
      }
    },
    { ...SCROLL_OBSERVER, threshold },
  );
  return observer;
}

/** Observes `el` and calls `run` once it intersects; returns an unobserve function. */
export function observeScroll(el: HTMLElement, run: () => void) {
  callbacks.set(el, run);
  const isTall = el.getBoundingClientRect().height > window.innerHeight;
  const observer = isTall
    ? (tall ??= makeObserver(0))
    : (normal ??= makeObserver(SCROLL_OBSERVER.threshold));
  observer.observe(el);
  return () => observer.unobserve(el);
}

export function disconnectScroll() {
  normal?.disconnect();
  tall?.disconnect();
}
