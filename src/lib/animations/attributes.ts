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

/**
 * Builds data-attributes to spread onto an element: `<h1 {...anim({ animation: "decode" })}>`.
 * Also emits `data-anim-hide` ("both" | "desktop" | "mobile") when the resolved
 * preset hides its target until the engine runs; base.css hides such elements
 * until the engine sets `data-anim-state`. Plain-HTML authors can add
 * `data-anim-hide="both"` by hand on elements with a prehiding preset.
 */
export function anim(opts: AnimOptions): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(OPTION_ATTRS) as (keyof AnimOptions)[]) {
    const value = opts[key];
    if (value !== undefined) out[OPTION_ATTRS[key]] = String(value);
  }
  const hide = hideBreakpoints(opts);
  if (hide) out[ATTR.hide] = hide;
  return out;
}

const TRIGGERS: readonly string[] = ["load", "scroll", "hover", "loop"];

const str = (v: unknown) => (v === undefined ? null : String(v).trim() || null);

/** Which breakpoints prehide: only one-shot (load/scroll) presets with `prehide`. */
function hideBreakpoints(
  opts: AnimOptions,
): "both" | "desktop" | "mobile" | null {
  const hides = (isMobile: boolean) => {
    const name = pickValue(
      str(opts.animation),
      str(opts.desktop),
      str(opts.mobile),
      isMobile,
    );
    const preset = name ? getPreset(name) : undefined;
    if (!preset?.prehide) return false;
    const trigger = TRIGGERS.includes(opts.trigger ?? "")
      ? opts.trigger
      : preset.defaultTrigger;
    return trigger === "load" || trigger === "scroll";
  };
  const desktop = hides(false);
  const mobile = hides(true);
  if (desktop && mobile) return "both";
  return desktop ? "desktop" : mobile ? "mobile" : null;
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
  return pickValue(
    attr(el, ATTR.animation),
    attr(el, ATTR.desktop),
    attr(el, ATTR.mobile),
    isMobile,
    true,
  );
}

/** Shared breakpoint resolution (mobileFallback, explicit desktop/mobile, "none"). */
function pickValue(
  base: string | null,
  desktop: string | null,
  mobile: string | null,
  isMobile: boolean,
  warn = false,
): PresetName | null {
  let value: string | null;
  if (isMobile) {
    value = mobile;
    if (value === null) {
      const basePreset = isPresetName(base) ? getPreset(base) : undefined;
      value = basePreset?.mobileFallback ?? base;
    }
  } else {
    value = desktop ?? base;
  }
  if (value === null || value === "none") return null;
  if (!isPresetName(value)) {
    if (warn) warnOnce(`Unknown animation "${value}"`);
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
