import { describe, expect, it } from "vitest";

import {
  angularDistance,
  GLOBE_RADIUS,
  isFacingCamera,
  latLngToVector3,
  markerArcPath,
  vector3ToLatLng,
} from "./geo";

describe("geo", () => {
  it("matches the original mapPoint convention", () => {
    const north = latLngToVector3(90, 0);
    expect(north.y).toBeCloseTo(GLOBE_RADIUS);
    const zero = latLngToVector3(0, 0);
    expect(zero.x).toBeCloseTo(-GLOBE_RADIUS);
    expect(zero.z).toBeCloseTo(0);
  });

  it("round-trips lat/lng", () => {
    for (const [lat, lng] of [
      [51.5, -0.12],
      [-33.9, 151.2],
      [35.7, 139.7],
      [0, 179.9],
      [-89, -179],
    ]) {
      const back = vector3ToLatLng(latLngToVector3(lat, lng, 731));
      expect(back.lat).toBeCloseTo(lat, 6);
      expect(back.lng).toBeCloseTo(lng, 6);
    }
  });

  it("computes great-circle distance in degrees", () => {
    expect(angularDistance({ lat: 0, lng: 0 }, { lat: 0, lng: 90 })).toBeCloseTo(90);
    expect(angularDistance({ lat: 90, lng: 0 }, { lat: -90, lng: 0 })).toBeCloseTo(180);
  });

  it("culls points behind the globe", () => {
    const camera = latLngToVector3(0, 0, 1700);
    expect(isFacingCamera(latLngToVector3(0, 0), camera)).toBe(true);
    expect(isFacingCamera(latLngToVector3(0, 180), camera)).toBe(false);
  });

  it("builds the marker arc path with matching endpoints", () => {
    const from = { lat: 49.25, lng: -123.1 };
    const to = { lat: 35.68, lng: 139.69 };
    const { solid, dotted } = markerArcPath(from, to, 150);
    expect(solid).toHaveLength(151);
    expect(solid[0].lat).toBeCloseTo(from.lat);
    expect(solid[0].lng).toBeCloseTo(from.lng);
    expect(solid[150].lng).toBeCloseTo(to.lng);
    expect(dotted[1].lat).toBeCloseTo(solid[1].lat + 1);
  });
});
