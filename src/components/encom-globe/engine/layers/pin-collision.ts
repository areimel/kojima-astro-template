/**
 * Pure label-collision logic, ported from encom-globe's `Globe.addPin`
 * (quadtree over a flat lat/lng plane). With at most `maxPins` (500) pins a
 * linear scan over the labelled pins is cheap enough that no tree is needed.
 */

/** Pins younger than this (ms) are never hidden by a newer pin. */
export const COLLISION_MIN_AGE = 5000;

export interface CollisionNode {
  id: string;
  lat: number;
  lng: number;
  labelled: boolean;
  /** Engine time (ms) the pin was added. */
  createdAt: number;
}

/** Original `latLon2d` radius: grows toward the poles where longitudes bunch up. */
export function collisionRadius(lat: number): number {
  return 2 + (Math.abs(lat) / 90) * 15;
}

/** Circles in (lat, lng) space overlap when closer than the sum of radii. */
export function collides(a: CollisionNode, b: CollisionNode): boolean {
  const dLat = a.lat - b.lat;
  let dLng = Math.abs(a.lng - b.lng) % 360;
  if (dLng > 180) dLng = 360 - dLng;
  return Math.hypot(dLat, dLng) < collisionRadius(a.lat) + collisionRadius(b.lat);
}

export type CollisionOutcome =
  | { action: "none" }
  /** The new pin hides its own label/top/smoke. */
  | { action: "hide-self" }
  /** The new pin wins; these older pins hide theirs. */
  | { action: "hide-others"; hide: CollisionNode[] };

/**
 * Decide what happens when `added` joins `existing` (which must not include
 * `added`). Only labelled pins take part. If any colliding pin is younger than
 * `minAge` the newcomer yields; otherwise the older ones yield.
 */
export function resolveCollision(
  added: CollisionNode,
  existing: Iterable<CollisionNode>,
  now: number,
  minAge = COLLISION_MIN_AGE,
): CollisionOutcome {
  if (!added.labelled) return { action: "none" };
  const hide: CollisionNode[] = [];
  let count = 0;
  let tooYoung = 0;
  for (const other of existing) {
    if (other.id === added.id || !other.labelled || !collides(added, other)) continue;
    count++;
    if (now - other.createdAt > minAge) hide.push(other);
    else tooYoung++;
  }
  if (count === 0) return { action: "none" };
  return tooYoung === 0 ? { action: "hide-others", hide } : { action: "hide-self" };
}
