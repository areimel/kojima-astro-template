import type { AnimationHandle } from "../types";

export interface RestoreOptions {
  /** Classes present while running. Only those the element lacked are added, and only those removed. */
  classes?: readonly string[];
  /** Inline custom properties / properties cleared on release (before the style snapshot is restored). */
  clearProps?: readonly string[];
  /** Extra undo for writes outside `style`/`class` (text nodes, attributes). Runs once on release. */
  restore?: (el: HTMLElement, index: number) => void;
}

type Startable = AnimationHandle | AnimationHandle[];

/** Merges several handles into one whose `revert()` reverts them all. */
export const combine = (handles: AnimationHandle[]): AnimationHandle => ({
  revert: () => handles.forEach((h) => h.revert()),
});

/**
 * Shared lifecycle: snapshot each target's `style` attribute, add classes,
 * run `start`, and put everything back when `release` fires (anime onComplete)
 * or the handle is reverted. Release is idempotent, so a completion followed
 * by an engine revert never re-applies a stale snapshot; the anime instance is
 * only reverted if the run had not already completed.
 */
export function withRestore(
  targets: HTMLElement[],
  { classes = [], clearProps = [], restore }: RestoreOptions,
  start: (release: () => void) => Startable,
): AnimationHandle {
  const snapshots = targets.map((el) => el.getAttribute("style"));
  const added = targets.map((el) =>
    classes.filter((c) => !el.classList.contains(c)),
  );
  targets.forEach((el, i) => el.classList.add(...added[i]));

  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    targets.forEach((el, i) => {
      el.classList.remove(...added[i]);
      clearProps.forEach((p) => el.style.removeProperty(p));
      restore?.(el, i);
      const snap = snapshots[i];
      if (snap === null) el.removeAttribute("style");
      else el.setAttribute("style", snap);
    });
  };

  const started = start(release);
  const handles = Array.isArray(started) ? started : [started];

  return {
    revert() {
      if (released) return;
      handles.forEach((h) => h.revert());
      release();
    },
  };
}
