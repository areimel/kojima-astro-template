/** React-island hydration guards for the animation engine. */

export const inUnhydratedIsland = (el: Element) =>
  !!el.closest("astro-island[ssr]");

const HYDRATION_WAIT_MS = 1500;
const firstSeen = new WeakMap<Element, number>();
const hasFiber = (node: object) =>
  Object.keys(node).some((key) => key.startsWith("__reactFiber$"));

/**
 * Astro removes `ssr` as soon as it calls hydrateRoot(), but React hydrates
 * asynchronously. Rewriting text before React claims it causes hydration error
 * #418, so React islands wait until the element's subtree has been claimed
 * (or a timeout passes, so a stalled island never blocks the animation).
 */
export function awaitingReactHydration(el: HTMLElement) {
  const island = el.closest("astro-island");
  if (
    !island ||
    !Object.keys(island).some((k) => k.startsWith("__reactContainer$"))
  )
    return false;
  const start = firstSeen.get(el) ?? performance.now();
  firstSeen.set(el, start);
  if (performance.now() - start > HYDRATION_WAIT_MS) return false;
  return ![el, ...el.querySelectorAll("*")].every(hasFiber);
}
