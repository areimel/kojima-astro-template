import { Vector3 } from "three";
import { describe, expect, it } from "vitest";

import { angleForLng, easeInOutCubic, elevationForLat, orbitPosition, shortestAngleDelta } from "./camera-rig";
import { latLngToVector3 } from "./utils/geo";

describe("camera-rig math", () => {
  it("angleForLng(0) is PI (original start angle)", () => {
    expect(angleForLng(0)).toBeCloseTo(Math.PI);
  });

  it("orbit direction matches latLngToVector3 for a lat/lng", () => {
    for (const [lat, lng] of [[51.5, -0.12], [35.7, 139.7], [-33.9, 151.2], [0, 0], [40, -74]]) {
      const cam = orbitPosition(angleForLng(lng), elevationForLat(lat), 100).normalize();
      const pt = latLngToVector3(lat, lng).normalize();
      expect(cam.distanceTo(pt)).toBeLessThan(1e-9);
    }
  });

  it("orbitPosition has the requested distance", () => {
    expect(orbitPosition(1.2, 0.4, 1700, new Vector3()).length()).toBeCloseTo(1700);
  });

  it("elevationForLat clamps to +-1.2", () => {
    expect(elevationForLat(90)).toBe(1.2);
    expect(elevationForLat(-90)).toBe(-1.2);
  });

  it("shortestAngleDelta takes the short way around", () => {
    expect(shortestAngleDelta(0.1, Math.PI * 2 - 0.1)).toBeCloseTo(-0.2);
    expect(shortestAngleDelta(Math.PI * 2 - 0.1, 0.1)).toBeCloseTo(0.2);
    expect(shortestAngleDelta(0, 7 * Math.PI)).toBeCloseTo(Math.PI);
    expect(shortestAngleDelta(1, 1)).toBeCloseTo(0);
  });

  it("easeInOutCubic hits endpoints and midpoint", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });
});
