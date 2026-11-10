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

  private constructor(container: HTMLElement, opts: GlobeControllerOptions) {
    this.engine = GlobeEngine.create(container, opts);
    this.disposePicking = createPicking(this.engine, container);
  }

  /** Creates the engine (throws WebGLUnavailableError), then loads the grid and layers. */
  static async create(container: HTMLElement, opts: GlobeControllerOptions): Promise<GlobeController> {
    const controller = new GlobeController(container, opts);
    await controller.syncLayers(opts.config.layers);
    if (opts.data) controller.setData(opts.data);
    return controller;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  // ---- data ----

  /** Replace all data. The first call after creation follows the original intro cascade. */
  setData(data: GlobeData): void {
    if (this.disposed) return;
    this.data = data;
    const { config, reducedMotion } = this.engine.context;
    const cascade = this.firstData && config.intro && !reducedMotion;
    this.firstData = false;
    const pins = this.layer<PinsLayer>("pins");
    const markers = this.layer<MarkersLayer>("markers");
    const sats = this.layer<SatellitesLayer>("satellites");
    pins?.clear();
    markers?.clear();
    sats?.clear();
    sats?.setConstellations([]);
    if (!cascade) {
      this.populate();
      return;
    }
    const duration = config.introLinesDuration;
    for (const pin of data.pins) {
      this.engine.context.schedule(introDelayForLng(pin.lng, duration), () => this.layer<PinsLayer>("pins")?.add(pin));
    }
    this.engine.context.schedule(duration, () => this.layer<MarkersLayer>("markers")?.set(this.data.markers));
    this.engine.context.schedule(duration + 1500, () => this.populateSatellites());
  }

  getData(): GlobeData {
    return this.data;
  }

  addPin(pin: Pin): void {
    this.data = { ...this.data, pins: [...this.data.pins, pin] };
    this.layer<PinsLayer>("pins")?.add(pin);
  }

  removePin(id: string): void {
    this.data = { ...this.data, pins: this.data.pins.filter((p) => p.id !== id) };
    this.layer<PinsLayer>("pins")?.remove(id);
  }

  addMarker(marker: Marker): void {
    this.data = { ...this.data, markers: [...this.data.markers, marker] };
    this.layer<MarkersLayer>("markers")?.add(marker);
  }

  removeMarker(id: string): void {
    this.data = { ...this.data, markers: this.data.markers.filter((m) => m.id !== id) };
    this.layer<MarkersLayer>("markers")?.remove(id);
  }

  addSatellite(satellite: Satellite): void {
    this.data = { ...this.data, satellites: [...this.data.satellites, satellite] };
    this.layer<SatellitesLayer>("satellites")?.add(satellite);
  }

  addConstellation(constellation: Constellation): void {
    this.data = { ...this.data, constellations: [...this.data.constellations, constellation] };
    this.layer<SatellitesLayer>("satellites")?.addConstellation(constellation);
  }

  // ---- settings ----

  async setConfig(config: GlobeConfig): Promise<void> {
    if (this.disposed) return;
    this.engine.setConfig(config);
    await this.syncLayers(config.layers);
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

  /** Add/remove layers to match the toggles, re-feeding data into rebuilt layers. */
  private async syncLayers(wanted: GlobeLayers): Promise<void> {
    const ctx = this.engine.context;
    // Pins hold a reference to smoke, so toggling smoke rebuilds pins.
    const smokeChanged = !!this.engine.getLayer("smoke") !== (wanted.smoke && wanted.pins);
    for (const key of ORDER) {
      const has = !!this.engine.getLayer(key);
      const want = key === "smoke" ? wanted.smoke && wanted.pins : wanted[key];
      if (has && (!want || (key === "pins" && smokeChanged))) this.engine.removeLayer(key);
    }
    for (const key of ORDER) {
      const want = key === "smoke" ? wanted.smoke && wanted.pins : wanted[key];
      if (!want || this.engine.getLayer(key)) continue;
      const layer = await this.build(key);
      if (this.disposed) {
        layer?.dispose();
        return;
      }
      if (!layer || this.engine.getLayer(key)) {
        layer?.dispose();
        continue;
      }
      this.engine.addLayer(layer);
      layer.setPalette(ctx.palette);
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
