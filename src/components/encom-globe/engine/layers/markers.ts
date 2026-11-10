import { Group, Sprite, SpriteMaterial } from "three";
import type { Object3D } from "three";

import type { Marker } from "../../schema";
import type { EngineContext, FrameContext, GlobeItem, Label, MarkersLayer, Palette } from "../types";
import {
  ARC_DRAW_TIME,
  createMarkerArc,
  disposeArc,
  resolveConnectTarget,
  setArcColor,
  updateMarkerArc,
} from "./marker-arc";
import type { MarkerArc } from "./marker-arc";
import { elasticOut, isSettled, progress } from "../utils/animate";
import { ringDotTexture } from "../utils/canvas";
import { GLOBE_RADIUS, isFacingCamera, latLngToVector3 } from "../utils/geo";
import { createRefCache } from "../utils/ref-cache";

const SPRITE_ALTITUDE = 1.2;
const SPRITE_SIZE = 50;
const HOVER_SCALE = 1.25;
const SCALE_TIME = 2000;
const LABEL_FADE = 500;

interface Entry {
  marker: Marker;
  sprite: Sprite;
  label: Label;
  color: string;
  bornAt: number;
  /** Delay before the sprite pops in (waits for the arc when connected). */
  popDelay: number;
}

export function createMarkersLayer(ctx: EngineContext): MarkersLayer {
  const group = new Group();
  group.name = "markers";
  let palette: Palette = ctx.palette;
  const entries = new Map<string, Entry>(); // insertion order = add order (FIFO)
  const arcs: MarkerArc[] = [];
  const textures = createRefCache(ringDotTexture, (t) => t.dispose());
  let hoveredId: string | null = null;
  let lastId: string | null = null;

  const colorOf = (m: Marker) => m.color ?? palette.marker;

  const dropEntry = (entry: Entry) => {
    entry.sprite.material.dispose(); // texture is shared; owned by the cache
    textures.release(entry.color);
    entry.sprite.removeFromParent();
    entry.label.dispose();
  };

  function removeOne(id: string) {
    const entry = entries.get(id);
    if (!entry) return;
    entries.delete(id);
    dropEntry(entry);
    if (hoveredId === id) hoveredId = null;
    if (lastId === id) lastId = [...entries.keys()].pop() ?? null;
    const now = ctx.now();
    for (let i = arcs.length - 1; i >= 0; i--) {
      const arc = arcs[i];
      if (arc.toId === id) {
        disposeArc(arc);
        arcs.splice(i, 1);
      } else if (arc.fromId === id && arc.retractAt === null) {
        arc.retractAt = now;
      }
    }
  }

  function add(marker: Marker) {
    if (entries.has(marker.id)) removeOne(marker.id);
    const now = ctx.now();
    const targetId = resolveConnectTarget(marker.connectTo, lastId, (id) => entries.has(id), marker.id);
    const color = colorOf(marker);

    const sprite = new Sprite(
      new SpriteMaterial({ map: textures.acquire(color), opacity: 0.7, depthTest: true, fog: true }),
    );
    sprite.scale.set(0, 0, 1);
    sprite.position.copy(latLngToVector3(marker.lat, marker.lng, GLOBE_RADIUS * SPRITE_ALTITUDE));
    sprite.userData.markerId = marker.id;
    group.add(sprite);

    const p = latLngToVector3(marker.lat, marker.lng);
    const alt = SPRITE_ALTITUDE;
    const labelPos = p.clone().set(
      p.x * alt * 1.1,
      p.y * alt * 1.05 + (p.y < 0 ? -15 : 30),
      p.z * alt * 1.1,
    );
    const label = ctx.addLabel(group, marker.label, labelPos, "encom-globe__label--marker");
    label.setOpacity(0);

    if (targetId) {
      const from = entries.get(targetId)!.marker;
      const arc = createMarkerArc(from, marker, color, marker.color === undefined, now);
      arcs.push(arc);
      group.add(arc.solid, arc.dotted);
    }
    entries.set(marker.id, {
      marker,
      sprite,
      label,
      color,
      bornAt: now,
      popDelay: targetId ? ARC_DRAW_TIME : 0,
    });
    lastId = marker.id;

    while (entries.size > ctx.config.maxMarkers) {
      removeOne(entries.keys().next().value as string);
    }
  }

  function clear() {
    for (const id of [...entries.keys()]) removeOne(id);
    for (const arc of arcs.splice(0)) disposeArc(arc);
    lastId = null;
  }

  return {
    name: "markers",
    object: group,

    add,
    remove: removeOne,
    clear,
    set(items) {
      clear();
      items.forEach(add);
    },
    items: () => [...entries.values()].map((e) => e.marker),

    update(frame: FrameContext) {
      const reduced = isSettled(frame, ctx.config);
      const t = frame.time;
      for (const entry of entries.values()) {
        const k = reduced ? 1 : elasticOut(progress(t, entry.bornAt + entry.popDelay, SCALE_TIME));
        const hover = entry.marker.id === hoveredId ? HOVER_SCALE : 1;
        entry.sprite.scale.set(SPRITE_SIZE * k * hover, SPRITE_SIZE * k * hover, 1);
        entry.label.setOpacity(reduced ? 1 : progress(t, entry.bornAt, LABEL_FADE));
        entry.label.setVisible(isFacingCamera(entry.label.object.position, frame.cameraPosition));
      }
      for (let i = arcs.length - 1; i >= 0; i--) {
        if (updateMarkerArc(arcs[i], t, reduced)) {
          disposeArc(arcs[i]);
          arcs.splice(i, 1);
        }
      }
    },

    setPalette(next) {
      palette = next;
      for (const entry of entries.values()) {
        if (entry.marker.color !== undefined) continue;
        const prev = entry.color;
        entry.color = next.marker;
        entry.sprite.material.map = textures.acquire(next.marker);
        textures.release(prev);
        entry.sprite.material.needsUpdate = true;
      }
      for (const arc of arcs) if (arc.usesDefaultColor) setArcColor(arc, next.marker);
    },

    pickables: () => [...entries.values()].map((e) => e.sprite as Object3D),
    resolvePick(object): GlobeItem | null {
      const entry = entries.get(object.userData.markerId as string);
      return entry ? { kind: "marker", item: entry.marker } : null;
    },
    setHovered(item) {
      const id = item?.kind === "marker" ? item.item.id : null;
      if (hoveredId && hoveredId !== id) {
        entries.get(hoveredId)?.label.element.classList.remove("is-hovered");
      }
      hoveredId = id;
      if (id) entries.get(id)?.label.element.classList.add("is-hovered");
    },

    dispose() {
      clear();
      textures.clear();
      group.removeFromParent();
    },
  };
}
