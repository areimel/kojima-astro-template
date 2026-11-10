import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG, parseGlobeData, resolveConfig } from "./schema";

describe("schema", () => {
  it("uses the original encom-globe defaults", () => {
    expect(DEFAULT_CONFIG.dayLength).toBe(28000);
    expect(DEFAULT_CONFIG.maxPins).toBe(500);
    expect(DEFAULT_CONFIG.maxMarkers).toBe(4);
    expect(DEFAULT_CONFIG.layers.atmosphere).toBe(false);
  });

  it("respects falsy overrides (fixes original `if (opts[i])` bug)", () => {
    const config = resolveConfig({ viewAngle: 0.3 }, { viewAngle: 0, autoRotate: false });
    expect(config.viewAngle).toBe(0);
    expect(config.autoRotate).toBe(false);
  });

  it("merges layer toggles", () => {
    const config = resolveConfig({ layers: { smoke: false } }, { layers: { atmosphere: true } });
    expect(config.layers.smoke).toBe(false);
    expect(config.layers.atmosphere).toBe(true);
    expect(config.layers.grid).toBe(true);
  });

  it("drops invalid items and assigns ids", () => {
    const { data, issues } = parseGlobeData({
      pins: [{ lat: 10, lng: 20, label: "ok" }, { lat: 200, lng: 0 }, "nope"],
      markers: [{ id: "a", lat: 1, lng: 2 }],
    });
    expect(data.pins).toHaveLength(1);
    expect(data.pins[0].id).toMatch(/^pins-/);
    expect(data.markers[0]).toMatchObject({ id: "a", label: "" });
    expect(issues.map((i) => i.index)).toEqual([1, 2]);
  });

  it("tolerates missing or malformed roots", () => {
    expect(parseGlobeData(undefined).data.pins).toEqual([]);
    expect(parseGlobeData("bad").data.markers).toEqual([]);
  });
});
