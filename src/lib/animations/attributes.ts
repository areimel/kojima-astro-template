/**
 * Attribute helpers shared by components (`anim()`) and the engine
 * (`resolvePresetName`, `resolveSettings`, `resolveTargets`).
 */
import { ATTR, STAGGER } from "./config";
import { getPreset, isPresetName } from "./registry";
import type {
  AnimationPreset,
  AnimationSettings,
  AnimationTrigger,
  AnimationValue,
  PresetName,
} from "./types";

export interface AnimOptions {
  animation?: AnimationValue;
  desktop?: AnimationValue;
  mobile?: AnimationValue;
  trigger?: AnimationTrigger;
  delay?: number;
  duration?: number;
  stagger?: number;
  children?: string;
}

const OPTION_ATTRS: Record<keyof AnimOptions, string> = {
  animation: ATTR.animation,
  desktop: ATTR.desktop,
  mobile: ATTR.mobile,
  trigger: ATTR.trigger,
  delay: ATTR.delay,
  duration: ATTR.duration,
  stagger: ATTR.stagger,
  children: ATTR.children,
};

/** Builds data-attributes to spread onto an element: `<h1 {...anim({ animation: "decode" })}>`. */
export function anim(opts: AnimOptions): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(OPTION_ATTRS) as (keyof AnimOptions)[]) {
    const value = opts[key];
    if (value !== undefined) out[OPTION_ATTRS[key]] = String(value);
  }
  return out;
}

const warned = new Set<string>();
function warnOnce(message: string) {
  if (!import.meta.env.DEV || warned.has(message)) return;
  warned.add(message);
  console.warn(`[animations] ${message}`);
}

function attr(el: Element, name: string): string | null {
  const value = el.getAttribute(name)?.trim();
  return value ? value : null;
}

/** Resolves which preset applies at the current breakpoint, or null for none/invalid. */
export function resolvePresetName(
  el: Element,
  isMobile: boolean,
): PresetName | null {
  const base = attr(el, ATTR.animation);
  let value: string | null;
  if (isMobile) {
    value = attr(el, ATTR.mobile);
    if (value === null) {
      const basePreset = isPresetName(base) ? getPreset(base) : undefined;
      value = basePreset?.mobileFallback ?? base;
    }
  } else {
    value = attr(el, ATTR.desktop) ?? base;
  }
  if (value === null || value === "none") return null;
  if (!isPresetName(value)) {
    warnOnce(`Unknown animation "${value}"`);
    return null;
  }
  return value;
}

function num(el: Element, name: string): number | undefined {
  const raw = attr(el, name);
  if (raw === null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

const TRIGGERS: readonly string[] = ["load", "scroll", "hover", "loop"];

export function resolveSettings(
  el: Element,
  preset: AnimationPreset,
): AnimationSettings {
  const rawTrigger = attr(el, ATTR.trigger);
  const trigger = TRIGGERS.includes(rawTrigger ?? "")
    ? (rawTrigger as AnimationTrigger)
    : preset.defaultTrigger;
  return {
    delay: num(el, ATTR.delay) ?? preset.defaults.delay ?? 0,
    duration: num(el, ATTR.duration) ?? preset.defaults.duration,
    stagger: num(el, ATTR.stagger) ?? preset.defaults.stagger ?? STAGGER,
    trigger,
    children: attr(el, ATTR.children) ?? undefined,
  };
}

export function resolveTargets(
  el: HTMLElement,
  settings: AnimationSettings,
): HTMLElement[] {
  if (!settings.children) return [el];
  try {
    const found = Array.from(
      el.querySelectorAll<HTMLElement>(settings.children),
    );
    return found.length ? found : [el];
  } catch {
    warnOnce(`Invalid children selector "${settings.children}"`);
    return [el];
  }
}
