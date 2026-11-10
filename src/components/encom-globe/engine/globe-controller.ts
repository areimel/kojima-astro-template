import type { Constellation, GlobeConfig, GlobeData, GlobeLayers, Marker, Pin, Satellite } from "../schema";
import { GlobeEngine } from "./globe-engine";
import { createAtmosphereLayer } from "./layers/atmosphere";
import { loadGrid } from "./layers/grid-loader";
import { createHexGridLayer } from "./layers/hex-grid";
import { createIntroLinesLayer } from "./layers/intro-lines";
import { createMarkersLayer } from "./layers/markers";
import { createPinsLayer } from "./layers/pins";
import { createSatellitesLayer } from "./layers/satellites";
import { createSmokeLayer } from "./layers/smoke";
import { createPicking } from "./picking";
import type {
  GlobeEvent,
  GlobeEventHandler,
  GlobeLayer,
  MarkersLayer,
  Palette,
  PinsLayer,
  SatellitesLayer,
  SmokeLayer,
} from "./types";

/**
 * Wires the layer-agnostic {@link GlobeEngine} to the concrete layers and the
 * globe data. This is the imperative API exposed to React via `ref`.
 */

export interface GlobeControllerOptions {
  config: GlobeConfig;
  palette: Palette;
  reducedMotion: boolean;
  data?: GlobeData;
}

type LayerKey = keyof GlobeLayers;

/** Render order: back to front. */
const ORDER: LayerKey[] = ["atmosphere", "grid", "introLines", "smoke", "pins", "markers", "satellites"];

/** Config keys captured when a layer is built; changing one rebuilds that layer. */
const INTRO_LINE_KEYS = ["introLinesCount", "introLinesAltitude", "introLinesDuration"] as const;

/** Replace-or-append by id (matching layer `add` semantics), then FIFO-cap to `max`. */
function upsert<T extends { id: string }>(list: T[], item: T, max = Infinity): T[] {
  const next = [...list.filter((x) => x.id !== item.id), item];
  return next.length > max ? next.slice(next.length - max) : next;
}

const without = <T extends { id: string }>(list: T[], id: string) => list.filter((x) => x.id !== id);

const wantsLayer = (key: LayerKey, layers: GlobeLayers) =>
  key === "smoke" ? layers.smoke && layers.pins : layers[key];

const EMPTY: GlobeData = { pins: [], markers: [], satellites: [], constellations: [] };

/** Original intro timing: pins drop in just behind the west→east tile sweep. */
export function introDelayForLng(lng: number, introDuration: number): number {
  return introDuration * ((180 + lng) / 360) + 500;
}

export class GlobeController {
  readonly engine: GlobeEngine;
  private data: GlobeData = EMPTY;
  private disposed = false;
  private disposePicking: () => void;
  private firstData = true;
  /** Bumped by every setData so stale scheduled callbacks from an older call do nothing. */
  private gen = 0;
  /** Latest requested config; syncLayers calls are serialised and always apply this. */
  private wantedConfig: GlobeConfig;
  private appliedConfig: GlobeConfig | null = null;
  private syncChain: Promise<void> = Promise.resolve();

  private constructor(container: HTMLElement, opts: GlobeControllerOptions) {
    this.wantedConfig = opts.config;
    this.engine = GlobeEngine.create(container, opts);
    try {
      this.disposePicking = createPicking(this.engine, container);
    } catch (err) {
      this.engine.dispose();
      throw err;
    }
  }

  /** Creates the engine (throws WebGLUnavailableError), then loads the grid and layers. */
  static async create(container: HTMLElement, opts: GlobeControllerOptions): Promise<GlobeController> {
    const controller = new GlobeController(container, opts);
    try {
      await controller.syncLayers(opts.config);
      if (opts.data) controller.setData(opts.data);
    } catch (err) {
      controller.dispose();
      throw err;
    }
    return controller;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  // ---- data ----

  /** Replace all data. The first call after creation follows the original intro cascade. */
  setData(data: GlobeData): void {
    if (this.disposed) return;
    const gen = ++this.gen;
    const { config, reducedMotion } = this.engine.context;
    this.data = {
      ...data,
      pins: data.pins.slice(-config.maxPins),
      markers: data.markers.slice(-config.maxMarkers),
    };
    const cascade = this.firstData && config.intro && !reducedMotion;
    this.firstData = false;
    this.layer<PinsLayer>("pins")?.clear();
    this.layer<MarkersLayer>("markers")?.clear();
    const sats = this.layer<SatellitesLayer>("satellites");
    sats?.clear();
    sats?.setConstellations([]);
    if (!cascade) {
      this.populate();
      return;
    }
    const { schedule } = this.engine.context;
    const duration = config.introLinesDuration;
    const current = () => gen === this.gen && !this.disposed;
    for (const pin of this.data.pins) {
      schedule(introDelayForLng(pin.lng, duration), () => {
        // Skip if superseded, or removed/replaced before its turn came.
        if (current() && this.data.pins.includes(pin)) this.layer<PinsLayer>("pins")?.add(pin);
      });
    }
    schedule(duration, () => current() && this.layer<MarkersLayer>("markers")?.set(this.data.markers));
    schedule(duration + 1500, () => current() && this.populateSatellites());
  }

  getData(): GlobeData {
    return this.data;
  }

  addPin(pin: Pin): void {
    this.data = { ...this.data, pins: upsert(this.data.pins, pin, this.engine.context.config.maxPins) };
    this.layer<PinsLayer>("pins")?.add(pin);
  }

  removePin(id: string): void {
    this.data = { ...this.data, pins: without(this.data.pins, id) };
    this.layer<PinsLayer>("pins")?.remove(id);
  }

  addMarker(marker: Marker): void {
    this.data = { ...this.data, markers: upsert(this.data.markers, marker, this.engine.context.config.maxMarkers) };
    this.layer<MarkersLayer>("markers")?.add(marker);
  }

  removeMarker(id: string): void {
    this.data = { ...this.data, markers: without(this.data.markers, id) };
    this.layer<MarkersLayer>("markers")?.remove(id);
  }

  addSatellite(satellite: Satellite): void {
    this.data = { ...this.data, satellites: upsert(this.data.satellites, satellite) };
    this.layer<SatellitesLayer>("satellites")?.add(satellite);
  }

  removeSatellite(id: string): void {
    this.data = { ...this.data, satellites: without(this.data.satellites, id) };
    this.layer<SatellitesLayer>("satellites")?.remove(id);
  }

  addConstellation(constellation: Constellation): void {
    this.data = { ...this.data, constellations: upsert(this.data.constellations, constellation) };
    this.layer<SatellitesLayer>("satellites")?.addConstellation(constellation);
  }

  removeConstellation(id: string): void {
    this.data = { ...this.data, constellations: without(this.data.constellations, id) };
    this.layer<SatellitesLayer>("satellites")?.removeConstellation(id);
  }

  // ---- settings ----

  async setConfig(config: GlobeConfig): Promise<void> {
    if (this.disposed) return;
    this.engine.setConfig(config);
    await this.syncLayers(config);
  }

  setPalette(palette: Palette): void {
    this.engine.setPalette(palette);
  }

  setReducedMotion(reduced: boolean): void {
    this.engine.setReducedMotion(reduced);
  }

  flyTo(lat: number, lng: number, opts?: { duration?: number }): void {
    this.engine.flyTo(lat, lng, opts);
  }

  pause(): void {
    this.engine.pause();
  }

  resume(): void {
    this.engine.resume();
  }

  on(event: GlobeEvent, handler: GlobeEventHandler): () => void {
    return this.engine.on(event, handler);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.disposePicking();
    this.engine.dispose();
  }

  // ---- internals ----

  private layer<T extends GlobeLayer>(name: LayerKey): T | undefined {
    return this.disposed ? undefined : this.engine.getLayer<T>(name);
  }

  private populate(): void {
    this.layer<PinsLayer>("pins")?.set(this.data.pins);
    this.layer<MarkersLayer>("markers")?.set(this.data.markers);
    this.populateSatellites();
  }

  private populateSatellites(): void {
    const sats = this.layer<SatellitesLayer>("satellites");
    sats?.set(this.data.satellites);
    sats?.setConstellations(this.data.constellations);
  }

  /**
   * Serialised: calls are chained so awaits can't interleave, and every run
   * applies the latest requested config (so a stale call can't undo a newer one).
   */
  private syncLayers(config: GlobeConfig): Promise<void> {
    this.wantedConfig = config;
    const run = this.syncChain.then(() => this.runSync());
    this.syncChain = run.catch(() => undefined);
    return run;
  }

  /** Add/remove layers to match the toggles, re-feeding data into rebuilt layers. */
  private async runSync(): Promise<void> {
    if (this.disposed) return;
    const config = this.wantedConfig;
    const wanted = config.layers;
    const prev = this.appliedConfig;
    this.appliedConfig = config;
    // Build-time options: rebuild the owning layer when they change.
    if (prev) {
      if (INTRO_LINE_KEYS.some((k) => prev[k] !== config[k])) this.engine.removeLayer("introLines");
      if (prev.gridUrl !== config.gridUrl) this.engine.removeLayer("grid");
    }
    // Pins hold a reference to smoke, so toggling smoke rebuilds pins.
    const smokeChanged = !!this.engine.getLayer("smoke") !== wantsLayer("smoke", wanted);
    for (const key of ORDER) {
      if (this.engine.getLayer(key) && (!wantsLayer(key, wanted) || (key === "pins" && smokeChanged))) {
        this.engine.removeLayer(key);
      }
    }
    for (const key of ORDER) {
      if (!wantsLayer(key, wanted) || this.engine.getLayer(key)) continue;
      const layer = await this.build(key);
      // Re-check after the await: we may be disposed or the request may have changed.
      if (!layer) continue;
      if (this.disposed || !wantsLayer(key, this.wantedConfig.layers) || this.engine.getLayer(key)) {
        layer.dispose();
        if (this.disposed) return;
        continue;
      }
      this.engine.addLayer(layer);
      layer.setPalette(this.engine.context.palette);
      if (!this.firstData) this.refill(key);
    }
  }

  private refill(key: LayerKey): void {
    if (key === "pins") this.layer<PinsLayer>("pins")?.set(this.data.pins);
    else if (key === "markers") this.layer<MarkersLayer>("markers")?.set(this.data.markers);
    else if (key === "satellites") this.populateSatellites();
  }

  private async build(key: LayerKey): Promise<GlobeLayer | null> {
    const ctx = this.engine.context;
    switch (key) {
      case "atmosphere":
        return createAtmosphereLayer(ctx);
      case "grid": {
        const grid = await loadGrid(ctx.config.gridUrl).catch(() => null);
        return grid ? createHexGridLayer(ctx, grid) : null;
      }
      case "introLines":
        return createIntroLinesLayer(ctx);
      case "smoke":
        return createSmokeLayer(ctx);
      case "pins":
        return createPinsLayer(ctx, this.engine.getLayer<SmokeLayer>("smoke") ?? null);
      case "markers":
        return createMarkersLayer(ctx);
      case "satellites":
        return createSatellitesLayer(ctx);
    }
  }
}
