import { describe, expect, it } from "vitest";

import {
  type CollisionNode,
  collides,
  collisionRadius,
  resolveCollision,
} from "./pin-collision";

const node = (id: string, lat: number, lng: number, createdAt = 0, labelled = true): CollisionNode => ({
  id,
  lat,
  lng,
  labelled,
  createdAt,
});

describe("collisionRadius", () => {
  it("grows from 2 at the equator to 17 at the poles", () => {
    expect(collisionRadius(0)).toBe(2);
    expect(collisionRadius(-90)).toBe(17);
  });
});

describe("collides", () => {
  it("detects nearby and ignores far pins", () => {
    expect(collides(node("a", 0, 0), node("b", 0, 3))).toBe(true);
    expect(collides(node("a", 0, 0), node("b", 0, 5))).toBe(false);
  });
  it("wraps across the antimeridian", () => {
    expect(collides(node("a", 0, 179), node("b", 0, -179))).toBe(true);
  });
});

describe("resolveCollision", () => {
  it("does nothing for unlabelled pins or no overlap", () => {
    expect(resolveCollision(node("n", 0, 0, 0, false), [node("o", 0, 1)], 10000).action).toBe("none");
    expect(resolveCollision(node("n", 0, 0), [node("o", 50, 100)], 10000).action).toBe("none");
  });
  it("ignores unlabelled neighbours", () => {
    expect(resolveCollision(node("n", 0, 0), [node("o", 0, 1, 0, false)], 10000).action).toBe("none");
  });
  it("hides older pins when all colliders are older than 5s", () => {
    const old = node("o", 0, 1, 0);
    const out = resolveCollision(node("n", 0, 0, 9000), [old], 9000);
    expect(out).toEqual({ action: "hide-others", hide: [old] });
  });
  it("hides the new pin when any collider is younger than 5s", () => {
    const out = resolveCollision(node("n", 0, 0, 9000), [node("o1", 0, 1, 0), node("o2", 0, 1, 8000)], 9000);
    expect(out.action).toBe("hide-self");
  });
});
