/**
 * Attribute-driven animation engine. Scans for `ANIMATED_SELECTOR`, resolves a
 * preset per breakpoint and plays it according to its trigger. Island content
 * is never touched until Astro finishes hydrating it (`ssr` attribute removed).
 */
import {
  resolvePresetName,
  resolveSettings,
  resolveTargets,
} from "./attributes";
import {
  ANIMATED_SELECTOR,
  ATTR,
  FAILSAFE_MS,
  MOBILE_QUERY,
  READY_CLASS,
  REDUCED_MOTION_QUERY,
} from "./config";
import { awaitingReactHydration, inUnhydratedIsland } from "./hydration";
import { getPreset } from "./registry";
import { disconnectScroll, observeScroll } from "./scroll";
import type {
  AnimationHandle,
  AnimationPreset,
  AnimationSettings,
} from "./types";

interface Entry {
  handle?: AnimationHandle;
  cleanup?: () => void;
  targets: HTMLElement[];
}

const entries = new Map<HTMLElement, Entry>();
/** Elements whose one-shot (load/scroll) animation already played. */
let played = new WeakSet<HTMLElement>();
/** Targets hidden and waiting for a scroll trigger (exempt from the safety net). */
const waiting = new Set<HTMLElement>();

let initialized = false;
let reduced = false;
let isMobile = false;
let domObserver: MutationObserver | null = null;
let scanFrame = 0;
let safetyTimer = 0;

const root = () => document.documentElement;

function showTargets(targets: HTMLElement[]) {
  for (const t of targets) {
    t.removeAttribute(ATTR.pending);
    waiting.delete(t);
  }
}

function dropEntry(el: HTMLElement) {
  const entry = entries.get(el);
  if (!entry) return;
  entries.delete(el);
  entry.cleanup?.();
  try {
    entry.handle?.revert();
  } catch (error) {
    if (import.meta.env.DEV) console.error("[animations] revert failed", error);
  }
  showTargets(entry.targets);
}

function revertAll() {
  for (const el of Array.from(entries.keys())) dropEntry(el);
  disconnectScroll();
}

function play(
  el: HTMLElement,
  entry: Entry,
  preset: AnimationPreset,
  settings: AnimationSettings,
) {
  try {
    entry.handle?.revert();
    entry.handle = preset.run(el, entry.targets, settings);
  } catch (error) {
    if (import.meta.env.DEV)
      console.error(`[animations] "${preset.name}" failed`, error);
  }
  // Presets set their own from-state on frame 0; hand control over now.
  showTargets(entry.targets);
}

function inViewport(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return (
    r.bottom > 0 &&
    r.top < window.innerHeight &&
    r.right > 0 &&
    r.left < window.innerWidth
  );
}

function arm(el: HTMLElement) {
  const name = resolvePresetName(el, isMobile);
  const preset = name ? getPreset(name) : undefined;
  if (!preset) {
    el.setAttribute(ATTR.state, "none");
    return;
  }
  const settings = resolveSettings(el, preset);
  const { trigger } = settings;
  const oneShot = trigger === "load" || trigger === "scroll";
  if (oneShot && played.has(el)) {
    el.setAttribute(ATTR.state, "done");
    return;
  }

  const entry: Entry = { targets: resolveTargets(el, settings) };
  entries.set(el, entry);
  const run = () => {
    if (!entries.has(el)) return;
    play(el, entry, preset, settings);
    if (oneShot) {
      played.add(el);
      el.setAttribute(ATTR.state, "done");
    }
  };

  if (oneShot && preset.prehide) {
    for (const t of entry.targets) t.setAttribute(ATTR.pending, "");
  }
  // After pending: base.css hides [data-anim-hide] until state is set, so
  // targets go from "hidden by hide marker" to "hidden by pending" with no flash.
  el.setAttribute(ATTR.state, "armed");

  if (trigger === "scroll" && !inViewport(el)) {
    for (const t of entry.targets)
      if (t.hasAttribute(ATTR.pending)) waiting.add(t);
    entry.cleanup = observeScroll(el, run);
  } else if (trigger === "hover") {
    el.addEventListener("pointerenter", run);
    el.addEventListener("focusin", run);
    entry.cleanup = () => {
      el.removeEventListener("pointerenter", run);
      el.removeEventListener("focusin", run);
    };
  } else {
    run(); // load, loop, and scroll elements already in view
  }
}

/** Drops entries (and waiting targets) whose elements were removed from the document. */
function sweepDetached() {
  for (const el of Array.from(entries.keys()))
    if (!el.isConnected) dropEntry(el);
  for (const t of Array.from(waiting)) if (!t.isConnected) waiting.delete(t);
}

/** Arms every not-yet-processed animated element outside unhydrated islands. */
function scan() {
  scanFrame = 0;
  if (reduced) return;
  sweepDetached();
  let deferred = false;
  for (const el of document.querySelectorAll<HTMLElement>(ANIMATED_SELECTOR)) {
    if (el.hasAttribute(ATTR.state) || inUnhydratedIsland(el)) continue;
    if (awaitingReactHydration(el)) {
      deferred = true;
      continue;
    }
    arm(el);
  }
  if (deferred) scheduleScan();
  window.clearTimeout(safetyTimer);
  safetyTimer = window.setTimeout(releaseStuck, FAILSAFE_MS);
}

function scheduleScan() {
  if (!scanFrame) scanFrame = requestAnimationFrame(scan);
}

/** Safety net: nothing may stay invisible, except targets legitimately awaiting scroll. */
function releaseStuck() {
  for (const el of document.querySelectorAll<HTMLElement>(
    `[${ATTR.pending}]`,
  )) {
    if (!waiting.has(el)) el.removeAttribute(ATTR.pending);
  }
}

function resetDom() {
  waiting.clear();
  for (const el of document.querySelectorAll(`[${ATTR.pending}]`))
    el.removeAttribute(ATTR.pending);
  for (const el of document.querySelectorAll(`[${ATTR.state}]`))
    el.removeAttribute(ATTR.state);
}

function clearAll() {
  revertAll();
  window.clearTimeout(safetyTimer);
  cancelAnimationFrame(scanFrame);
  scanFrame = 0;
  resetDom();
}

function disable() {
  domObserver?.disconnect();
  clearAll();
  played = new WeakSet();
  root().classList.remove(READY_CLASS);
}

function observeDom() {
  domObserver?.disconnect();
  domObserver ??= new MutationObserver((mutations) => {
    let rescan = false;
    for (const m of mutations) {
      if (m.type === "attributes") return scan(); // island hydrated: arm in the same tick, no flash
      if (m.removedNodes.length) sweepDetached();
      for (const node of m.addedNodes) {
        if (
          node instanceof Element &&
          (node.matches(ANIMATED_SELECTOR) ||
            node.querySelector(ANIMATED_SELECTOR))
        ) {
          rescan = true;
        }
      }
    }
    if (rescan) scheduleScan();
  });
  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["ssr"],
  });
}

function enable() {
  root().classList.add(READY_CLASS);
  observeDom();
  scan();
}

/** Breakpoint changed: revert everything and re-resolve, without replaying finished one-shots. */
function rearmAll() {
  revertAll();
  resetDom();
  scan();
}

export function initAnimations() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const reducedMq = window.matchMedia(REDUCED_MOTION_QUERY);
  const mobileMq = window.matchMedia(MOBILE_QUERY);
  reduced = reducedMq.matches;
  isMobile = mobileMq.matches;

  reducedMq.addEventListener("change", (event) => {
    reduced = event.matches;
    if (reduced) disable();
    else enable();
  });
  mobileMq.addEventListener("change", (event) => {
    isMobile = event.matches;
    if (!reduced) rearmAll();
  });

  document.addEventListener("astro:before-swap", () => {
    domObserver?.disconnect();
    clearAll();
    played = new WeakSet();
  });
  document.addEventListener("astro:after-swap", () => {
    if (!reduced) root().classList.add(READY_CLASS);
  });
  // Fires on initial load too; also on every view-transition navigation.
  document.addEventListener("astro:page-load", () => {
    if (!reduced) enable();
  });

  if (reduced) {
    disable();
    return;
  }
  // Covers a missed astro:page-load; state attributes prevent double processing.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => !reduced && enable(), {
      once: true,
    });
  } else {
    enable();
  }
}
