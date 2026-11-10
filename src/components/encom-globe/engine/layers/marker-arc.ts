import {
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineSegments,
} from "three";

import { progress } from "../utils/animate";
import { disposeObject } from "../utils/dispose";
import { GLOBE_RADIUS, latLngToVector3, markerArcPath } from "../utils/geo";
import type { ArcPathPoint, LatLng } from "../utils/geo";

export const ARC_DRAW_TIME = 2000;
export const ARC_SEGMENTS = 150;
const SOLID_ALTITUDE = 1.2;
const DOTTED_ALTITUDE = 1.19;

export interface DrawRange {
  start: number;
  count: number;
}

/**
 * Visible vertex range of an arc. Drawing reveals vertices 0..n over
 * `duration`; retracting (from `retractAt`) advances the start towards the end.
 * `align` rounds the start down so LineSegments keep their vertex pairing.
 */
export function arcDrawRange(
  time: number,
  drawStart: number,
  retractAt: number | null,
  total: number,
  duration = ARC_DRAW_TIME,
  align = 1,
): DrawRange {
  const drawn = Math.min(total, Math.ceil(progress(time, drawStart, duration) * total));
  if (retractAt === null) return { start: 0, count: drawn };
  const raw = Math.floor(progress(time, retractAt, duration) * total);
  const start = Math.min(drawn, Math.floor(raw / align) * align);
  return { start, count: Math.max(0, drawn - start) };
}

/** True once a retracting arc has fully disappeared. */
export function retractDone(time: number, retractAt: number | null, duration = ARC_DRAW_TIME) {
  return retractAt !== null && time >= retractAt + duration;
}

/** Resolve a marker's `connectTo` to a target id; unknown targets give null (no arc). */
export function resolveConnectTarget(
  connectTo: string | undefined,
  previousId: string | null,
  exists: (id: string) => boolean,
  selfId?: string,
): string | null {
  if (!connectTo) return null;
  const target = connectTo === "previous" ? previousId : connectTo;
  if (!target || target === selfId || !exists(target)) return null;
  return target;
}

/** Consecutive vertex pairs (p0,p1),(p2,p3)... as flat positions: the original LinePieces look. */
function toPositions(path: ArcPathPoint[], altitude: number): number[] {
  const out: number[] = [];
  for (const p of path) {
    const v = latLngToVector3(p.lat, p.lng, GLOBE_RADIUS * altitude);
    out.push(v.x, v.y, v.z);
  }
  return out;
}

export interface MarkerArc {
  fromId: string;
  toId: string;
  /** True when the marker has no explicit colour (follows the palette). */
  usesDefaultColor: boolean;
  solid: Line;
  dotted: LineSegments;
  bornAt: number;
  retractAt: number | null;
}

function lineMaterial(color: string) {
  return new LineBasicMaterial({ color, transparent: true, opacity: 0.5, fog: true });
}

export function createMarkerArc(
  from: LatLng & { id: string },
  to: LatLng & { id: string },
  color: string,
  usesDefaultColor: boolean,
  bornAt: number,
): MarkerArc {
  const { solid, dotted } = markerArcPath(from, to, ARC_SEGMENTS);
  const solidGeo = new BufferGeometry();
  solidGeo.setAttribute("position", new Float32BufferAttribute(toPositions(solid, SOLID_ALTITUDE), 3));
  const dottedGeo = new BufferGeometry();
  dottedGeo.setAttribute("position", new Float32BufferAttribute(toPositions(dotted, DOTTED_ALTITUDE), 3));
  const solidLine = new Line(solidGeo, lineMaterial(color));
  const dottedLine = new LineSegments(dottedGeo, lineMaterial(color));
  solidLine.frustumCulled = false;
  dottedLine.frustumCulled = false;
  solidGeo.setDrawRange(0, 0);
  dottedGeo.setDrawRange(0, 0);
  return {
    fromId: from.id,
    toId: to.id,
    usesDefaultColor,
    solid: solidLine,
    dotted: dottedLine,
    bornAt,
    retractAt: null,
  };
}

/** Apply the draw range for `time`. Returns true when the arc is finished retracting. */
export function updateMarkerArc(arc: MarkerArc, time: number, reduced: boolean): boolean {
  if (arc.retractAt !== null && (reduced || retractDone(time, arc.retractAt))) return true;
  const duration = reduced ? 0 : ARC_DRAW_TIME;
  const total = arc.solid.geometry.getAttribute("position").count;
  const s = arcDrawRange(time, arc.bornAt, arc.retractAt, total, duration);
  const d = arcDrawRange(time, arc.bornAt, arc.retractAt, total, duration, 2);
  arc.solid.geometry.setDrawRange(s.start, s.count);
  arc.dotted.geometry.setDrawRange(d.start, d.count);
  return false;
}

export function setArcColor(arc: MarkerArc, color: string) {
  (arc.solid.material as LineBasicMaterial).color.set(color);
  (arc.dotted.material as LineBasicMaterial).color.set(color);
}

export function disposeArc(arc: MarkerArc) {
  disposeObject(arc.solid);
  disposeObject(arc.dotted);
}
