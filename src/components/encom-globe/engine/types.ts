import type { Object3D, PerspectiveCamera, Scene, Vector3 } from "three";

import type {
  Constellation,
  GlobeConfig,
  Marker,
  Pin,
  Satellite,
} from "../schema";

/**
 * Shared engine contracts. Every visual element of the globe is a
 * {@link GlobeLayer}; the engine owns the scene, clock and render loop and
 * calls each layer's `update` once per frame.
 */

export interface Palette {
  /** Base tile colour; the hex-grid layer derives its shade set from it. */
  tile: string;
  pin: string;
  /** Pin/marker label text colour (CSS colour, used by DOM labels). */
  label: string;
  marker: string;
  introLines: string;
  satelliteWave: string;
  satelliteCore: string;
  satelliteShield: string;
  smoke: string;
  atmosphere: string;
  /** Colour the far side fades into (should match the page background). */
  fog: string;
  /** Canvas clear colour; `null` renders transparent over the page. */
  background: string | null;
}

/** Original encom-globe defaults (the `encom` preset). */
export const DEFAULT_PALETTE: Palette = {
  tile: "#ffcc00",
  pin: "#00eeee",
  label: "#ffffff",
  marker: "#ffcc00",
  introLines: "#8FD8D8",
  satelliteWave: "#ffffff",
  satelliteCore: "#ff0000",
  satelliteShield: "#ffffff",
  smoke: "#aaaaaa",
  atmosphere: "#8FD8D8",
  fog: "#000000",
  background: "#000000",
};

export interface FrameContext {
  /** ms since the engine started (the original's `currentTime`). */
  time: number;
  /** ms since the previous frame. */
  delta: number;
  camera: PerspectiveCamera;
  /** Camera world position (cached for back-side label culling). */
  cameraPosition: Vector3;
  reducedMotion: boolean;
}

/** Everything a layer needs from the engine; passed to layer factories. */
export interface EngineContext {
  scene: Scene;
  camera: PerspectiveCamera;
  config: GlobeConfig;
  palette: Palette;
  reducedMotion: boolean;
  /** Current engine time in ms (same clock as FrameContext.time). */
  now(): number;
  /** Run `fn` once engine time passes now() + delayMs (engine-clock, pauses with the loop). */
  schedule(delayMs: number, fn: () => void): void;
  /** Create a DOM label (CSS2D) at a world position, attached to `parent`. */
  addLabel(parent: Object3D, text: string, position: Vector3, className?: string): Label;
}

/** Thin handle around a CSS2DObject so layers don't import the renderer. */
export interface Label {
  readonly object: Object3D;
  readonly element: HTMLElement;
  setText(text: string): void;
  setOpacity(opacity: number): void;
  setVisible(visible: boolean): void;
  dispose(): void;
}

export type GlobeItem =
  | { kind: "pin"; item: Pin }
  | { kind: "marker"; item: Marker }
  | { kind: "satellite"; item: Satellite }
  | { kind: "constellation"; item: Constellation };

export interface GlobeLayer {
  readonly name: string;
  readonly object: Object3D;
  update(frame: FrameContext): void;
  setPalette(palette: Palette): void;
  dispose(): void;
  /** Objects the picking raycaster should test (optional). */
  pickables?(): Object3D[];
  /** Map a hit object back to its data item. */
  resolvePick?(object: Object3D, instanceId?: number): GlobeItem | null;
  /** Show/hover feedback for an item owned by this layer. */
  setHovered?(item: GlobeItem | null): void;
}

export type GlobeEvent = "select" | "hover";
export type GlobeEventHandler = (item: GlobeItem | null) => void;

/** One tile of the generated grid: [lat, lng, size, angle, sides]. */
export type GridTile = [number, number, number, number, number];

export interface GridFile {
  version: 1;
  divisions: number;
  /** Mean hexasphere tile radius in world units (scales instanced tiles). */
  tileRadius?: number;
  tiles: GridTile[];
}

/* ---- Layer APIs (factories live in ./layers/*, one file per layer) ----
 * createHexGridLayer(ctx, grid: GridFile): GlobeLayer
 * createIntroLinesLayer(ctx): GlobeLayer
 * createSmokeLayer(ctx): SmokeLayer
 * createPinsLayer(ctx, smoke: SmokeLayer | null): PinsLayer
 * createMarkersLayer(ctx): MarkersLayer
 * createSatellitesLayer(ctx): SatellitesLayer
 * createAtmosphereLayer(ctx): GlobeLayer
 */

export interface SmokeLayer extends GlobeLayer {
  /** Start a smoke plume at a pin; returns a handle for `extinguish`. */
  setFire(lat: number, lng: number, altitude: number): number;
  extinguish(handle: number): void;
}

export interface CollectionLayer<T extends { id: string }> extends GlobeLayer {
  add(item: T): void;
  remove(id: string): void;
  /** Replace the whole collection. */
  set(items: T[]): void;
  clear(): void;
  items(): T[];
}

export type PinsLayer = CollectionLayer<Pin>;
export type MarkersLayer = CollectionLayer<Marker>;

export interface SatellitesLayer extends CollectionLayer<Satellite> {
  addConstellation(constellation: Constellation): void;
  setConstellations(constellations: Constellation[]): void;
}
