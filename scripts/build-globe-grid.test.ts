import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { GridFile } from "@/components/encom-globe/engine/types";
import { angularDistance } from "@/components/encom-globe/engine/utils/geo";

const grid = JSON.parse(
  readFileSync(resolve(__dirname, "../public/globe/hex-grid.json"), "utf8"),
) as GridFile;

const nearest = (lat: number, lng: number) =>
  Math.min(...grid.tiles.map((t) => angularDistance({ lat, lng }, { lat: t[0], lng: t[1] })));

describe("hex-grid.json", () => {
  it("has the expected shape", () => {
    expect(grid.version).toBe(1);
    expect(grid.divisions).toBe(35);
    expect(grid.tiles.length).toBeGreaterThan(2000);
    for (const [lat, lng, size, angle, sides] of grid.tiles) {
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(lng)).toBeLessThanOrEqual(180);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(1.3);
      expect(Math.abs(angle)).toBeLessThanOrEqual(Math.PI + 1e-3);
      expect([5, 6]).toContain(sides);
    }
  });

  it.each([
    ["London", 51.5, -0.12],
    ["Tokyo", 35.68, 139.69],
    ["Sao Paulo", -23.55, -46.63],
    ["Nairobi", -1.29, 36.82],
  ])("has a tile near %s", (_name, lat, lng) => {
    expect(nearest(lat, lng)).toBeLessThan(2);
  });

  it.each([
    ["mid-Pacific", 0, -150],
    ["mid-Atlantic", 0, -30],
  ])("has no tile near %s", (_name, lat, lng) => {
    expect(nearest(lat, lng)).toBeGreaterThan(2);
  });
});
