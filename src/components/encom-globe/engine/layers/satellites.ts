import { Group, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import type { Object3D, Vector3 } from "three";

import type { Constellation, Satellite, SatelliteStyle } from "../../schema";
import type {
  FrameContext,
  GlobeItem,
  Label,
  EngineContext,
  Palette,
  SatellitesLayer,
} from "../types";
import { applyFrame, createSatelliteSprite, frameAt, releaseSatelliteSprite } from "./satellite-texture";
import type { SatelliteSprite } from "./satellite-texture";
import { GLOBE_RADIUS, isFacingCamera, latLngToVector3 } from "../utils/geo";

interface Entry {
  mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  sprite: SatelliteSprite;
  style: SatelliteStyle;
  lat: number;
  lng: number;
  position: Vector3;
  tiltMultiplier: number;
  tiltDirection: number;
  label: Label | null;
  /** Owning item, as returned by resolvePick. */
  owner: GlobeItem;
}

const HOVER_SCALE = 1.25;

export function createSatellitesLayer(ctx: EngineContext): SatellitesLayer {
  const object = new Group();
  object.name = "satellites";
  ctx.scene.add(object);

  let palette = ctx.palette;
  const satellites = new Map<string, Satellite>();
  const constellations = new Map<string, Constellation>();
  /** Standalone satellites keyed by id; constellation members keyed `${cid}#${i}`. */
  const entries = new Map<string, Entry>();
  const byOwner = new Map<string, string[]>();
  let hoveredId: string | null = null;

  const acquire = (style: SatelliteStyle) =>
    createSatelliteSprite({
      numWaves: style.numWaves,
      waveColor: style.waveColor ?? palette.satelliteWave,
      coreColor: style.coreColor ?? palette.satelliteCore,
      shieldColor: style.shieldColor ?? palette.satelliteShield,
    });

  const buildEntry = (
    pos: { lat: number; lng: number; altitude: number },
    style: SatelliteStyle,
    owner: GlobeItem,
    label?: string,
  ): Entry => {
    const sprite = acquire(style);
    const size = (style.size ?? 1) * 150;
    const material = new MeshBasicMaterial({
      map: sprite.texture,
      transparent: true,
      depthTest: false,
    });
    const mesh = new Mesh(new PlaneGeometry(size, size, 1, 1), material);
    const position = latLngToVector3(pos.lat, pos.lng, GLOBE_RADIUS * pos.altitude);
    mesh.position.copy(position);
    object.add(mesh);
    return {
      mesh,
      sprite,
      style,
      lat: pos.lat,
      lng: pos.lng,
      position,
      tiltMultiplier: (Math.PI / 2) * (1 - Math.abs(pos.lat / 90)),
      tiltDirection: pos.lat > 0 ? -1 : 1,
      label: label ? ctx.addLabel(object, label, position, "encom-globe__label--satellite") : null,
      owner,
    };
  };

  const freeEntry = (e: Entry) => {
    e.label?.dispose();
    e.mesh.removeFromParent();
    e.mesh.geometry.dispose();
    e.mesh.material.map = null; // texture is shared/ref-counted, don't let dispose() free it
    e.mesh.material.dispose();
    releaseSatelliteSprite(e.sprite);
  };

  const removeOwner = (ownerId: string) => {
    for (const key of byOwner.get(ownerId) ?? []) {
      const e = entries.get(key);
      if (e) freeEntry(e);
      entries.delete(key);
    }
    byOwner.delete(ownerId);
    if (hoveredId === ownerId) hoveredId = null;
  };

  const add = (item: Satellite) => {
    removeOwner(item.id);
    satellites.set(item.id, item);
    entries.set(
      item.id,
      buildEntry(item, item, { kind: "satellite", item }, item.label),
    );
    byOwner.set(item.id, [item.id]);
  };

  const addConstellation = (c: Constellation) => {
    removeOwner(c.id);
    constellations.set(c.id, c);
    const owner: GlobeItem = { kind: "constellation", item: c };
    const keys: string[] = [];
    c.satellites.forEach((pos, i) => {
      const key = `${c.id}#${i}`;
      entries.set(key, buildEntry(pos, c, owner, i === 0 ? c.label : undefined));
      keys.push(key);
    });
    byOwner.set(c.id, keys);
  };

  const rebuildSprites = () => {
    for (const e of entries.values()) {
      const next = acquire(e.style);
      if (next === e.sprite) {
        releaseSatelliteSprite(next);
        continue;
      }
      e.mesh.material.map = next.texture;
      e.mesh.material.needsUpdate = true;
      releaseSatelliteSprite(e.sprite);
      e.sprite = next;
    }
  };

  const layer: SatellitesLayer = {
    name: "satellites",
    object,

    add,
    remove(id) {
      removeOwner(id);
      satellites.delete(id);
      constellations.delete(id);
    },
    set(items) {
      for (const id of [...satellites.keys()]) layer.remove(id);
      items.forEach(add);
    },
    clear() {
      for (const id of [...byOwner.keys()]) removeOwner(id);
      satellites.clear();
      constellations.clear();
    },
    items: () => [...satellites.values()],
    addConstellation,
    setConstellations(list) {
      for (const id of [...constellations.keys()]) layer.remove(id);
      list.forEach(addConstellation);
    },

    update(frame: FrameContext) {
      const cam = frame.cameraPosition;
      const cameraAngle = Math.atan2(cam.z, cam.x);

      // One frame index per shared sheet, so all satellites using it stay in sync.
      const done = new Set<SatelliteSprite>();
      for (const e of entries.values()) {
        if (!done.has(e.sprite)) {
          done.add(e.sprite);
          applyFrame(
            e.sprite.texture,
            frame.reducedMotion
              ? e.sprite.repeatAt
              : frameAt(frame.time, {
                  frames: e.sprite.frames,
                  frameDuration: 80,
                  repeatAt: e.sprite.repeatAt,
                }),
          );
        }

        const { mesh } = e;
        mesh.lookAt(cam);
        mesh.rotateZ(e.tiltDirection * (Math.PI / 2));
        mesh.rotateZ(
          Math.sin(cameraAngle + (e.lng / 180) * Math.PI) *
            e.tiltMultiplier *
            e.tiltDirection *
            -1,
        );

        mesh.scale.setScalar(e.owner.item.id === hoveredId ? HOVER_SCALE : 1);
        e.label?.setVisible(isFacingCamera(e.position, cam));
      }
    },

    setPalette(next: Palette) {
      palette = next;
      rebuildSprites();
    },

    pickables: () => [...entries.values()].map((e) => e.mesh),
    resolvePick(obj: Object3D) {
      for (const e of entries.values()) if (e.mesh === obj) return e.owner;
      return null;
    },
    setHovered(item) {
      hoveredId =
        item && (item.kind === "satellite" || item.kind === "constellation")
          ? item.item.id
          : null;
    },

    dispose() {
      layer.clear();
      object.removeFromParent();
    },
  };

  return layer;
}
