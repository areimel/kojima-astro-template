import { Color, Fog, Scene, Vector3, WebGLRenderer, SRGBColorSpace } from "three";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

import "../encom-globe.css";
import type { GlobeConfig } from "../schema";
import { CameraRig } from "./camera-rig";
import { applyContainerPalette, prepareContainer } from "./container-style";
import { createLabel } from "./label";
import { createScheduler } from "./scheduler";
import type {
  EngineContext,
  FrameContext,
  GlobeEvent,
  GlobeEventHandler,
  GlobeItem,
  GlobeLayer,
  Label,
  Palette,
} from "./types";
import { disposeObject } from "./utils/dispose";

export class WebGLUnavailableError extends Error {
  constructor(message = "WebGL is not available") {
    super(message);
    this.name = "WebGLUnavailableError";
  }
}

export interface GlobeEngineOptions {
  config: GlobeConfig;
  palette: Palette;
  reducedMotion: boolean;
}

const MAX_DELTA_MS = 100;

export class GlobeEngine {
  readonly context: EngineContext;
  readonly scene = new Scene();
  readonly renderer: WebGLRenderer;
  readonly labelRenderer = new CSS2DRenderer();
  readonly rig: CameraRig;

  private readonly layers: GlobeLayer[] = [];
  private readonly handlers = new Map<GlobeEvent, Set<GlobeEventHandler>>();
  private readonly scheduler = createScheduler();
  private time = 0;
  private lastStamp: number | null = null;
  private running = false;
  private userPaused = false;
  private inView = true;
  private disposed = false;
  private width = 0;
  private height = 0;
  private cameraPosition = new Vector3();
  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver?: IntersectionObserver;
  private readonly restoreContainer: () => void;
  private state: { config: GlobeConfig; palette: Palette; reducedMotion: boolean };

  static create(container: HTMLElement, opts: GlobeEngineOptions): GlobeEngine {
    return new GlobeEngine(container, opts);
  }

  private constructor(
    private readonly container: HTMLElement,
    opts: GlobeEngineOptions,
  ) {
    this.state = { ...opts };
    try {
      this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      throw new WebGLUnavailableError(err instanceof Error ? err.message : undefined);
    }
    const r = this.renderer;
    r.outputColorSpace = SRGBColorSpace;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.domElement.setAttribute("aria-hidden", "true");
    Object.assign(r.domElement.style, { position: "absolute", inset: "0", display: "block" });

    const ld = this.labelRenderer.domElement;
    ld.setAttribute("aria-hidden", "true");
    Object.assign(ld.style, { position: "absolute", inset: "0", pointerEvents: "none", overflow: "hidden" });

    this.restoreContainer = prepareContainer(container);
    container.append(r.domElement, ld);

    this.rig = new CameraRig(container, opts.config);
    this.applyPaletteBasics(opts.palette);
    this.scene.fog = new Fog(opts.palette.fog, this.rig.cameraDistance, this.rig.cameraDistance + 300);

    const self = this;
    this.context = {
      scene: this.scene,
      camera: this.rig.camera,
      get config() {
        return self.state.config;
      },
      get palette() {
        return self.state.palette;
      },
      get reducedMotion() {
        return self.state.reducedMotion;
      },
      now: () => this.time,
      schedule: (delayMs, fn) => this.scheduler.schedule(this.time, delayMs, fn),
      addLabel: createLabel,
    };

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    if (typeof IntersectionObserver !== "undefined") {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        const last = entries[entries.length - 1];
        if (last) {
          this.inView = last.isIntersecting;
          this.sync();
        }
      });
      this.intersectionObserver.observe(container);
    }
    document.addEventListener("visibilitychange", this.sync);
    this.resize();
    this.sync();
  }

  get isRunning(): boolean {
    return this.running;
  }

  get camera() {
    return this.rig.camera;
  }

  get domElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /** Snapshot of the current layers (for picking). */
  getLayers(): readonly GlobeLayer[] {
    return this.layers;
  }

  addLayer(layer: GlobeLayer): void {
    if (this.disposed) return;
    if (this.layers.some((l) => l.name === layer.name)) this.removeLayer(layer.name);
    this.layers.push(layer);
    this.scene.add(layer.object);
  }

  getLayer<T extends GlobeLayer = GlobeLayer>(name: string): T | undefined {
    return this.layers.find((l) => l.name === name) as T | undefined;
  }

  removeLayer(name: string): void {
    const i = this.layers.findIndex((l) => l.name === name);
    if (i < 0) return;
    const [layer] = this.layers.splice(i, 1);
    layer.dispose();
    layer.object.removeFromParent();
  }

  pause(): void {
    this.userPaused = true;
    this.sync();
  }

  resume(): void {
    this.userPaused = false;
    this.sync();
  }

  setPalette(palette: Palette): void {
    this.state.palette = palette;
    this.applyPaletteBasics(palette);
    (this.scene.fog as Fog).color.set(palette.fog);
    for (const l of this.layers) l.setPalette(palette);
    this.renderOnceIfIdle();
  }

  setConfig(config: GlobeConfig): void {
    this.state.config = config;
    this.rig.setConfig(config);
    const fog = this.scene.fog as Fog;
    fog.near = this.rig.cameraDistance;
    fog.far = this.rig.cameraDistance + 300;
    this.renderOnceIfIdle();
  }

  setReducedMotion(reduced: boolean): void {
    this.state.reducedMotion = reduced;
  }

  on(event: GlobeEvent, handler: GlobeEventHandler): () => void {
    let set = this.handlers.get(event);
    if (!set) this.handlers.set(event, (set = new Set()));
    set.add(handler);
    return () => set.delete(handler);
  }

  emit(event: GlobeEvent, item: GlobeItem | null): void {
    this.handlers.get(event)?.forEach((h) => h(item));
  }

  flyTo(lat: number, lng: number, { duration = 1500 }: { duration?: number } = {}): void {
    this.rig.flyTo(lat, lng, duration, this.state.reducedMotion);
    this.renderOnceIfIdle();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.running = false;
    this.resizeObserver.disconnect();
    this.intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", this.sync);
    this.rig.dispose();
    for (const l of this.layers.splice(0)) l.dispose();
    disposeObject(this.scene);
    this.handlers.clear();
    this.scheduler.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
    this.restoreContainer();
  }

  // ---- internals ----

  private applyPaletteBasics(p: Palette): void {
    if (p.background === null) this.renderer.setClearColor(new Color(0x000000), 0);
    else this.renderer.setClearColor(new Color(p.background), 1);
    applyContainerPalette(this.container, p);
  }

  private readonly sync = (): void => {
    if (this.disposed) return;
    const want = !this.userPaused && this.inView && !document.hidden;
    if (want === this.running) return;
    this.running = want;
    if (want) {
      this.lastStamp = null;
      this.renderer.setAnimationLoop(this.tick);
    } else {
      this.renderer.setAnimationLoop(null);
    }
  };

  private readonly tick = (stamp: number): void => {
    const delta = this.lastStamp === null ? 0 : Math.min(MAX_DELTA_MS, Math.max(0, stamp - this.lastStamp));
    this.lastStamp = stamp;
    this.time += delta;
    this.step(delta);
  };

  private step(delta: number): void {
    this.scheduler.flush(this.time);
    this.rig.update(delta, this.time, this.state.reducedMotion);
    this.cameraPosition.copy(this.rig.camera.position);
    const frame: FrameContext = {
      time: this.time,
      delta,
      camera: this.rig.camera,
      cameraPosition: this.cameraPosition,
      reducedMotion: this.state.reducedMotion,
    };
    for (const l of this.layers.slice()) l.update(frame);
    this.renderer.render(this.scene, this.rig.camera);
    this.labelRenderer.render(this.scene, this.rig.camera);
  }

  private renderOnceIfIdle(): void {
    if (this.running || this.disposed) return;
    this.step(0);
  }

  private resize(): void {
    if (this.disposed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w <= 0 || h <= 0 || (w === this.width && h === this.height)) return;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
    this.labelRenderer.setSize(w, h);
    this.rig.resize(w, h);
    this.renderOnceIfIdle();
  }
}
