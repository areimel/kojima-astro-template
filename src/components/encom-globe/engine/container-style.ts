import type { Palette } from "./types";

const VARS: Record<string, keyof Palette> = {
  "--encom-label": "label",
  "--encom-marker": "marker",
  "--encom-pin": "pin",
  "--encom-fog": "fog",
};

/** Make the container a paint-contained positioning root; returns a function restoring its old style. */
export function prepareContainer(container: HTMLElement): () => void {
  const prev = {
    position: container.style.position,
    overflow: container.style.overflow,
    contain: container.style.contain,
  };
  Object.assign(container.style, { position: "relative", overflow: "hidden", contain: "paint" });
  return () => {
    Object.assign(container.style, prev);
    for (const k of Object.keys(VARS)) container.style.removeProperty(k);
  };
}

/** Publish palette colours as CSS custom properties for the labels/HUD. */
export function applyContainerPalette(container: HTMLElement, palette: Palette): void {
  for (const [name, key] of Object.entries(VARS)) container.style.setProperty(name, palette[key] as string);
}
