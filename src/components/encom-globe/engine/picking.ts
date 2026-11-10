import { Raycaster, Vector2 } from "three";
import type { Intersection, Object3D } from "three";

import type { GlobeEngine } from "./globe-engine";
import type { GlobeItem, GlobeLayer } from "./types";
import { isFacingCamera } from "./utils/geo";

const CLICK_DRAG_THRESHOLD = 5;

function sameItem(a: GlobeItem | null, b: GlobeItem | null): boolean {
  if (a === b) return true;
  return !!a && !!b && a.kind === b.kind && a.item.id === b.item.id;
}

export function createPicking(engine: GlobeEngine, container: HTMLElement): () => void {
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  let hovered: { layer: GlobeLayer; item: GlobeItem } | null = null;
  let pending: PointerEvent | null = null;
  let raf = 0;
  let downX = 0;
  let downY = 0;
  let dragged = false;

  function pick(e: { clientX: number; clientY: number }): { layer: GlobeLayer; item: GlobeItem } | null {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, engine.camera);
    raycaster.camera = engine.camera; // required for sprites
    let best: { layer: GlobeLayer; hit: Intersection<Object3D> } | null = null;
    for (const layer of engine.getLayers()) {
      const objects = layer.pickables?.();
      if (!objects?.length || !layer.resolvePick) continue;
      for (const hit of raycaster.intersectObjects(objects, false)) {
        if (!isFacingCamera(hit.point, engine.camera.position)) continue;
        if (!best || hit.distance < best.hit.distance) best = { layer, hit };
        break; // hits are sorted by distance
      }
    }
    if (!best) return null;
    const item = best.layer.resolvePick?.(best.hit.object, best.hit.instanceId) ?? null;
    return item ? { layer: best.layer, item } : null;
  }

  function setHover(next: { layer: GlobeLayer; item: GlobeItem } | null) {
    if (sameItem(hovered?.item ?? null, next?.item ?? null)) return;
    hovered?.layer.setHovered?.(null);
    next?.layer.setHovered?.(next.item);
    hovered = next;
    engine.domElement.style.cursor = next ? "pointer" : "";
    engine.emit("hover", next?.item ?? null);
  }

  const flush = () => {
    raf = 0;
    if (!pending) return;
    const e = pending;
    pending = null;
    if (e.buttons === 0) setHover(pick(e));
  };

  const onMove = (e: PointerEvent) => {
    pending = e;
    if (!raf) raf = requestAnimationFrame(flush);
  };
  const onLeave = () => setHover(null);
  const onDown = (e: PointerEvent) => {
    downX = e.clientX;
    downY = e.clientY;
    dragged = false;
  };
  const onUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > CLICK_DRAG_THRESHOLD) dragged = true;
  };
  const onClick = (e: MouseEvent) => {
    if (dragged || Math.hypot(e.clientX - downX, e.clientY - downY) > CLICK_DRAG_THRESHOLD) {
      dragged = false;
      return;
    }
    const hit = pick(e);
    if (hit) engine.emit("select", hit.item);
  };

  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerleave", onLeave);
  container.addEventListener("pointerdown", onDown);
  container.addEventListener("pointerup", onUp);
  container.addEventListener("click", onClick);

  return () => {
    if (raf) cancelAnimationFrame(raf);
    container.removeEventListener("pointermove", onMove);
    container.removeEventListener("pointerleave", onLeave);
    container.removeEventListener("pointerdown", onDown);
    container.removeEventListener("pointerup", onUp);
    container.removeEventListener("click", onClick);
    hovered?.layer.setHovered?.(null);
    hovered = null;
    engine.domElement.style.cursor = "";
  };
}
