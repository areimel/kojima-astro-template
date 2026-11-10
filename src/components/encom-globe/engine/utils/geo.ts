import { Vector3 } from "three";

/** World radius of the globe surface, in scene units (matches the original encom-globe). */
export const GLOBE_RADIUS = 500;

const DEG = Math.PI / 180;

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Lat/lng → cartesian, using the original encom-globe `mapPoint` convention
 * (Y up, theta = 180 - lng) so ported math can stay literal.
 */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius = GLOBE_RADIUS,
  out = new Vector3(),
): Vector3 {
  const phi = (90 - lat) * DEG;
  const theta = (180 - lng) * DEG;
  return out.set(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** Inverse of {@link latLngToVector3}; accepts any radius. */
export function vector3ToLatLng(v: { x: number; y: number; z: number }): LatLng {
  const r = Math.hypot(v.x, v.y, v.z) || 1;
  const lat = 90 - Math.acos(Math.max(-1, Math.min(1, v.y / r))) / DEG;
  let lng = 180 - Math.atan2(v.z, v.x) / DEG;
  lng = ((((lng + 180) % 360) + 360) % 360) - 180;
  return { lat, lng };
}

/** Great-circle distance between two points, in degrees. */
export function angularDistance(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * DEG;
  const dLng = (b.lng - a.lng) * DEG;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.sin(dLng / 2) ** 2;
  return (2 * Math.asin(Math.min(1, Math.sqrt(h)))) / DEG;
}

/**
 * True when a point on (or above) the globe faces the camera, i.e. is not
 * hidden behind the sphere. Used to cull DOM labels on the far side.
 */
export function isFacingCamera(
  point: Vector3,
  cameraPosition: Vector3,
  threshold = 0,
): boolean {
  // dot(normalize(point), normalize(camera - point)) without allocating.
  const tx = cameraPosition.x - point.x;
  const ty = cameraPosition.y - point.y;
  const tz = cameraPosition.z - point.z;
  const pl = Math.hypot(point.x, point.y, point.z);
  const tl = Math.hypot(tx, ty, tz);
  if (pl === 0 || tl === 0) return false;
  return (point.x * tx + point.y * ty + point.z * tz) / (pl * tl) > threshold;
}

export interface ArcPathPoint extends LatLng {
  index: number;
}

/**
 * Literal port of encom-globe `Marker.js` arc path: lat/lng interpolated over
 * `segments`, latitude bent by a cosine so the arc bows. Returns the solid
 * path and the offset "dotted" companion path (lat + 1 except endpoints).
 */
export function markerArcPath(
  from: LatLng,
  to: LatLng,
  segments = 150,
): { solid: ArcPathPoint[]; dotted: ArcPathPoint[] } {
  const latDist = (to.lat - from.lat) / segments;
  const lngDist = (to.lng - from.lng) / segments;
  const solid: ArcPathPoint[] = [];
  const dotted: ArcPathPoint[] = [];
  for (let j = 0; j <= segments; j++) {
    const lat =
      (((90 + from.lat + j * latDist) % 180) - 90) *
        (0.5 + Math.cos((j * ((5 * Math.PI) / 2)) / segments) / 2) +
      (j * to.lat) / segments / 2;
    const lng = ((180 + from.lng + j * lngDist) % 360) - 180;
    solid.push({ lat, lng, index: j });
    const edge = j === 0 || j === segments;
    dotted.push({ lat: edge ? lat : lat + 1, lng, index: j });
  }
  return { solid, dotted };
}
