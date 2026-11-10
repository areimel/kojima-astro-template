import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Line,
  type Object3D,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";

import type { Pin } from "../../schema";
import type {
  EngineContext,
  FrameContext,
  GlobeItem,
  Label,
  Palette,
  PinsLayer,
  SmokeLayer,
} from "../types";
import { createPinAssetCache, type PinAssets } from "./pin-assets";
import { type CollisionNode, resolveCollision } from "./pin-collision";
import { elasticOut, isSettled, progress, sampleTween, tween, type Tween } from "../utils/animate";
import { isFacingCamera, latLngToVector3 } from "../utils/geo";

const RISE_MS = 1500;
const FADE_DELAY = 1000;
const FADE_MS = 500;
const TOP_SIZE = 20;
const HIT_SIZE = 56;

interface PinEntry {
  pin: Pin;
  node: CollisionNode;
  base: Vector3;
  assets: PinAssets;
  line: Line;
  lineAttr: BufferAttribute;
  topMaterial: SpriteMaterial | null;
  top: Sprite | null;
  hit: Sprite | null;
  label: Label | null;
  smoke: number | null;
  alt: Tween;
  targetAlt: number;
  /** Collision state: false once thinned out. */
  shown: boolean;
  hovered: boolean;
  dirty: boolean;
}

const unlabelledAltitude = () => 1.1 + Math.random() * 0.05;

export function createPinsLayer(ctx: EngineContext, smoke: SmokeLayer | null): PinsLayer {
  const group = new Group();
  group.name = "pins";
  const assets = createPinAssetCache();
  const hitMaterial = new SpriteMaterial({
    opacity: 0,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const entries = new Map<string, PinEntry>();
  const scratch = new Vector3();
  let defaultColor = ctx.palette.pin;
  let cameraPosition: Vector3 | null = null;
  let hoveredId: string | null = null;

  const altitudeOf = (e: PinEntry, time: number) => sampleTween(e.alt, time);

  /** Place line top, dot and label for the given altitude. */
  function layout(e: PinEntry, altitude: number) {
    const { x, y, z } = e.base;
    e.lineAttr.setXYZ(1, x * altitude, y * altitude, z * altitude);
    e.lineAttr.needsUpdate = true;
    e.top?.position.set(x * altitude, y * altitude, z * altitude);
    e.hit?.position.set(x * altitude, y * altitude, z * altitude);
    e.label?.object.position.set(
      x * altitude * 1.1,
      y * altitude + (y < 0 ? -15 : 30),
      z * altitude * 1.1,
    );
  }

  function setAltitude(e: PinEntry, target: number, time: number) {
    e.targetAlt = target;
    e.alt = tween(altitudeOf(e, time), target, time, RISE_MS, elasticOut);
    e.dirty = true;
  }

  function thin(e: PinEntry, time: number) {
    if (!e.shown) return;
    e.shown = false;
    if (e.smoke !== null) smoke?.extinguish(e.smoke);
    e.smoke = null;
    setAltitude(e, unlabelledAltitude(), time);
  }

  function destroy(e: PinEntry) {
    if (e.smoke !== null) smoke?.extinguish(e.smoke);
    e.label?.dispose();
    e.line.geometry.dispose();
    e.topMaterial?.dispose();
    e.line.removeFromParent();
    e.top?.removeFromParent();
    e.hit?.removeFromParent();
    assets.release(e.assets);
    entries.delete(e.pin.id);
    if (hoveredId === e.pin.id) hoveredId = null;
  }

  function remove(id: string) {
    const e = entries.get(id);
    if (e) destroy(e);
  }

  function add(pin: Pin) {
    remove(pin.id);
    const now = ctx.now();
    const labelled = !!pin.label && pin.label.length > 0;
    const target = pin.altitude ?? (labelled ? 1.2 : unlabelledAltitude());
    const pinAssets = assets.acquire(pin.color ?? defaultColor);
    const base = latLngToVector3(pin.lat, pin.lng);

    const geometry = new BufferGeometry();
    const lineAttr = new BufferAttribute(new Float32Array(6), 3);
    lineAttr.setXYZ(0, base.x, base.y, base.z);
    lineAttr.setXYZ(1, base.x, base.y, base.z);
    geometry.setAttribute("position", lineAttr);
    const line = new Line(geometry, pinAssets.line);
    line.frustumCulled = false;
    group.add(line);

    const e: PinEntry = {
      pin,
      node: { id: pin.id, lat: pin.lat, lng: pin.lng, labelled, createdAt: now },
      base,
      assets: pinAssets,
      line,
      lineAttr,
      topMaterial: null,
      top: null,
      hit: null,
      label: null,
      smoke: null,
      alt: tween(1, target, now, RISE_MS, elasticOut),
      targetAlt: target,
      shown: labelled,
      hovered: false,
      dirty: true,
    };

    if (labelled) {
      e.topMaterial = new SpriteMaterial({
        map: pinAssets.texture,
        depthTest: true,
        fog: true,
        opacity: 0,
      });
      e.top = new Sprite(e.topMaterial);
      e.top.scale.set(TOP_SIZE, TOP_SIZE, 1);
      e.hit = new Sprite(hitMaterial);
      e.hit.scale.set(HIT_SIZE, HIT_SIZE, 1);
      e.top.userData.pinId = e.hit.userData.pinId = pin.id;
      group.add(e.top, e.hit);
      e.label = ctx.addLabel(
        group,
        pin.label as string,
        scratch.set(base.x * target * 1.1, base.y * target + 30, base.z * target * 1.1),
        "encom-globe__label--pin",
      );
      if (pin.color) e.label.element.style.color = pin.color;
      e.label.setOpacity(0);
      if (smoke) e.smoke = smoke.setFire(pin.lat, pin.lng, target);
    }
    layout(e, isSettled(ctx, ctx.config) ? target : 1);
    entries.set(pin.id, e);

    const outcome = resolveCollision(e.node, nodes(), now);
    if (outcome.action === "hide-self") thin(e, now);
    else if (outcome.action === "hide-others") {
      for (const o of outcome.hide) {
        const other = entries.get(o.id);
        if (other) thin(other, now);
      }
    }

    // FIFO eviction beyond maxPins.
    while (entries.size > ctx.config.maxPins) {
      const oldest = entries.values().next().value;
      if (!oldest) break;
      destroy(oldest);
    }
  }

  function* nodes() {
    for (const e of entries.values()) yield e.node;
  }

  function update(frame: FrameContext) {
    cameraPosition = frame.cameraPosition;
    const skip = isSettled(frame, ctx.config);
    for (const e of entries.values()) {
      const t = frame.time;
      const alt = skip ? e.targetAlt : altitudeOf(e, t);
      const rising = skip ? e.dirty : t < e.alt.start + e.alt.duration || e.dirty;
      if (rising) {
        layout(e, alt);
        e.dirty = !skip && t < e.alt.start + e.alt.duration;
      }
      if (!e.label || !e.topMaterial) continue;
      const fade = skip ? 1 : progress(t, e.node.createdAt + FADE_DELAY, FADE_MS);
      const show = e.shown;
      e.topMaterial.opacity = show ? fade : 0;
      if (e.top) e.top.visible = show;
      const labelShown = show || e.hovered;
      e.label.setOpacity(show ? fade : e.hovered ? 1 : 0);
      const facing = isFacingCamera(
        scratch.copy(e.label.object.position),
        frame.cameraPosition,
      );
      e.label.setVisible(labelShown && facing && (show ? fade > 0 : true));
    }
  }

  function setHovered(item: GlobeItem | null) {
    const next = item?.kind === "pin" ? item.item.id : null;
    if (next === hoveredId) return;
    for (const id of [hoveredId, next]) {
      const e = id ? entries.get(id) : undefined;
      if (!e) continue;
      e.hovered = id === next;
      e.label?.element.classList.toggle("is-hovered", e.hovered);
    }
    hoveredId = next && entries.has(next) ? next : null;
  }

  return {
    name: "pins",
    object: group,
    add,
    remove,
    set(items) {
      this.clear();
      items.forEach(add);
    },
    clear() {
      for (const e of [...entries.values()]) destroy(e);
    },
    items: () => [...entries.values()].map((e) => e.pin),
    update,
    setPalette(palette: Palette) {
      if (palette.pin === defaultColor) return;
      defaultColor = palette.pin;
      for (const e of entries.values()) {
        if (e.pin.color) continue;
        const prev = e.assets;
        e.assets = assets.acquire(defaultColor);
        e.line.material = e.assets.line;
        if (e.topMaterial) e.topMaterial.map = e.assets.texture;
        assets.release(prev);
      }
    },
    pickables() {
      const out: Object3D[] = [];
      for (const e of entries.values()) {
        if (!e.shown || !e.top || !e.hit) continue;
        if (cameraPosition && !isFacingCamera(e.top.position, cameraPosition)) continue;
        out.push(e.top, e.hit);
      }
      return out;
    },
    resolvePick(object) {
      const e = entries.get(object.userData.pinId as string);
      return e ? { kind: "pin", item: e.pin } : null;
    },
    setHovered,
    dispose() {
      this.clear();
      assets.dispose();
      hitMaterial.dispose();
      group.removeFromParent();
    },
  };
}
