import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveConfig } from "../schema";
import type { GlobeData } from "../schema";
import { GlobeController } from "./globe-controller";
import { DEFAULT_PALETTE } from "./types";
import type { GlobeLayer } from "./types";

const h = vi.hoisted(() => ({
  gridDone: null as null | (() => void),
  engine: null as unknown,
  pinsAdd: vi.fn(),
}));

vi.mock("./picking", () => ({ createPicking: () => () => undefined }));
vi.mock("./layers/grid-loader", () => ({
  loadGrid: () => new Promise((resolve) => (h.gridDone = () => resolve({ version: 1, divisions: 1, tiles: [] }))),
}));
vi.mock("./layers/hex-grid", () => ({ createHexGridLayer: () => fakeLayer("grid") }));
vi.mock("./layers/atmosphere", () => ({ createAtmosphereLayer: () => fakeLayer("atmosphere") }));
vi.mock("./layers/intro-lines", () => ({ createIntroLinesLayer: () => fakeLayer("introLines") }));
vi.mock("./layers/smoke", () => ({ createSmokeLayer: () => fakeLayer("smoke") }));
vi.mock("./layers/pins", () => ({
  createPinsLayer: () => ({ ...fakeLayer("pins"), add: h.pinsAdd, set: vi.fn(), clear: vi.fn(), remove: vi.fn() }),
}));
vi.mock("./layers/markers", () => ({
  createMarkersLayer: () => ({ ...fakeLayer("markers"), add: vi.fn(), set: vi.fn(), clear: vi.fn(), remove: vi.fn() }),
}));
vi.mock("./layers/satellites", () => ({
  createSatellitesLayer: () => ({
    ...fakeLayer("satellites"),
    add: vi.fn(), set: vi.fn(), clear: vi.fn(), remove: vi.fn(),
    setConstellations: vi.fn(), addConstellation: vi.fn(), removeConstellation: vi.fn(),
  }),
}));
vi.mock("./globe-engine", () => ({
  GlobeEngine: {
    create: (_c: unknown, opts: { config: ReturnType<typeof resolveConfig>; palette: unknown; reducedMotion: boolean }) => {
      const layers: GlobeLayer[] = [];
      const queue: (() => void)[] = [];
      const engine = {
        layers,
        queue,
        context: { config: opts.config, palette: opts.palette, reducedMotion: opts.reducedMotion, schedule: (_d: number, fn: () => void) => queue.push(fn) },
        getLayer: (n: string) => layers.find((l) => l.name === n),
        addLayer: (l: GlobeLayer) => layers.push(l),
        removeLayer(n: string) {
          const i = layers.findIndex((l) => l.name === n);
          if (i >= 0) layers.splice(i, 1)[0].dispose();
        },
        setConfig(c: unknown) {
          engine.context.config = c as never;
        },
        dispose: vi.fn(),
      };
      h.engine = engine;
      return engine;
    },
  },
}));

function fakeLayer(name: string): GlobeLayer {
  return { name, object: {} as never, update: vi.fn(), setPalette: vi.fn(), dispose: vi.fn() };
}

const pin = (id: string) => ({ id, lat: 0, lng: 0 }) as GlobeData["pins"][number];
const data = (...ids: string[]): GlobeData => ({ pins: ids.map(pin), markers: [], satellites: [], constellations: [] });
const baseLayers = { atmosphere: false, grid: false, introLines: false, smoke: false, pins: true, markers: false, satellites: false };
const config = (layers: Partial<typeof baseLayers>) => resolveConfig({ layers: { ...baseLayers, ...layers } });

describe("GlobeController", () => {
  beforeEach(() => {
    h.gridDone = null;
    h.pinsAdd.mockClear();
  });

  it("ignores scheduled intro callbacks from an older setData", async () => {
    const c = await GlobeController.create({} as HTMLElement, {
      config: config({}), palette: DEFAULT_PALETTE, reducedMotion: false,
    });
    const { queue } = h.engine as { queue: (() => void)[] };
    c.setData(data("a1", "a2")); // first call: intro cascade, schedules per-pin adds
    const stale = queue.splice(0);
    expect(stale.length).toBeGreaterThan(0);
    c.setData(data("b1")); // supersedes it
    stale.forEach((fn) => fn());
    expect(h.pinsAdd).not.toHaveBeenCalled();
  });

  it("serialises layer syncs so a later toggle-off wins over an in-flight build", async () => {
    const c = await GlobeController.create({} as HTMLElement, {
      config: config({}), palette: DEFAULT_PALETTE, reducedMotion: false,
    });
    const engine = h.engine as { layers: GlobeLayer[] };
    const on = c.setConfig(config({ grid: true }));
    await vi.waitFor(() => expect(h.gridDone).not.toBeNull());
    const off = c.setConfig(config({ grid: false }));
    h.gridDone?.();
    await Promise.all([on, off]);
    expect(engine.layers.some((l) => l.name === "grid")).toBe(false);
  });

  it("caps data at maxPins when adding", async () => {
    const c = await GlobeController.create({} as HTMLElement, {
      config: resolveConfig({ maxPins: 2, layers: baseLayers }), palette: DEFAULT_PALETTE, reducedMotion: true,
    });
    for (const id of ["a", "b", "c"]) c.addPin(pin(id));
    c.addPin(pin("b"));
    expect(c.getData().pins.map((p) => p.id)).toEqual(["c", "b"]);
  });
});
