import { PerspectiveCamera, Vector3 } from "three";

import type { GlobeConfig } from "../schema";

const TWO_PI = Math.PI * 2;
const DEG = Math.PI / 180;
const MAX_ELEVATION = 1.2;
/** Radians of rotation per dragged pixel. */
const DRAG_SENSITIVITY = 0.004;
/** Inertia velocity decay per 60fps frame. */
const INERTIA_DECAY = 0.95;
const INERTIA_EPSILON = 0.00002; // rad/ms
const RESUME_DELAY_MS = 1500;
const FRAME_MS = 1000 / 60;

/** Camera angle (radians) that looks straight at a longitude; matches `latLngToVector3`. */
export function angleForLng(lng: number): number {
  return (180 - lng) * DEG;
}

export function clampElevation(v: number): number {
  return Math.max(-MAX_ELEVATION, Math.min(MAX_ELEVATION, v));
}

/** Elevation angle (radians) that looks straight at a latitude, clamped. */
export function elevationForLat(lat: number): number {
  return clampElevation(lat * DEG);
}

/** Signed shortest angular delta from `from` to `to`, in (-PI, PI]. */
export function shortestAngleDelta(from: number, to: number): number {
  let d = (to - from) % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  else if (d <= -Math.PI) d += TWO_PI;
  return d;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Original Globe.js camera orbit position. */
export function orbitPosition(
  angle: number,
  elevation: number,
  distance: number,
  out = new Vector3(),
): Vector3 {
  return out.set(
    distance * Math.cos(angle) * Math.cos(elevation),
    distance * Math.sin(elevation),
    distance * Math.sin(angle) * Math.cos(elevation),
  );
}

export function cameraDistanceFor(scale: number): number {
  return 1700 / scale;
}

interface Flight {
  startAngle: number;
  deltaAngle: number;
  startElev: number;
  endElev: number;
  duration: number;
  elapsed: number;
}

export class CameraRig {
  readonly camera: PerspectiveCamera;
  cameraDistance: number;

  private config: GlobeConfig;
  private angle: number;
  private elevation: number;
  private flight: Flight | null = null;
  private dragging = false;
  private pointerId = -1;
  private lastX = 0;
  private lastY = 0;
  private lastMoveTime = 0;
  private velA = 0; // rad/ms
  private velV = 0;
  private resumeAt = 0;
  private settled = true;
  private aspect = 1;
  private readonly prevTouchAction: string;
  private readonly prevCursor: string;

  constructor(
    private readonly container: HTMLElement,
    config: GlobeConfig,
  ) {
    this.config = config;
    this.cameraDistance = cameraDistanceFor(config.scale);
    this.angle = config.startLng === undefined ? Math.PI : angleForLng(config.startLng);
    this.elevation = clampElevation(config.viewAngle);
    this.camera = new PerspectiveCamera(50, 1, 1, this.cameraDistance + 300);
    this.applyPosition();
    this.prevTouchAction = container.style.touchAction;
    this.prevCursor = container.style.cursor;
    container.addEventListener("pointerdown", this.onDown);
    container.addEventListener("pointermove", this.onMove);
    container.addEventListener("pointerup", this.onUp);
    container.addEventListener("pointercancel", this.onUp);
    this.syncDraggable();
  }

  setConfig(config: GlobeConfig): void {
    const viewChanged = config.viewAngle !== this.config.viewAngle;
    this.config = config;
    this.cameraDistance = cameraDistanceFor(config.scale);
    this.camera.far = this.cameraDistance + 300;
    this.camera.updateProjectionMatrix();
    if (viewChanged) this.elevation = clampElevation(config.viewAngle);
    this.syncDraggable();
    this.applyPosition();
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.aspect = width / height;
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
  }

  /** Smoothly orient the camera to look at lat/lng (instant under reduced motion). */
  flyTo(lat: number, lng: number, duration: number, reducedMotion: boolean): void {
    const targetAngle = angleForLng(lng);
    const targetElev = elevationForLat(lat);
    this.cancelDrag();
    this.velA = this.velV = 0;
    if (reducedMotion || duration <= 0) {
      this.angle = targetAngle;
      this.elevation = targetElev;
      this.flight = null;
      this.applyPosition();
      return;
    }
    this.flight = {
      startAngle: this.angle,
      deltaAngle: shortestAngleDelta(this.angle, targetAngle),
      startElev: this.elevation,
      endElev: targetElev,
      duration,
      elapsed: 0,
    };
  }

  update(dt: number, time: number, reducedMotion: boolean): void {
    if (this.flight) {
      const f = this.flight;
      f.elapsed += dt;
      const t = Math.min(1, f.elapsed / f.duration);
      const e = easeInOutCubic(t);
      this.angle = f.startAngle + f.deltaAngle * e;
      this.elevation = f.startElev + (f.endElev - f.startElev) * e;
      if (t >= 1) {
        this.flight = null;
        this.resumeAt = time + RESUME_DELAY_MS;
      }
    } else if (this.dragging) {
      this.resumeAt = Infinity;
    } else if (!this.settled) {
      this.angle += this.velA * dt;
      this.elevation = clampElevation(this.elevation + this.velV * dt);
      const decay = INERTIA_DECAY ** (dt / FRAME_MS);
      this.velA *= decay;
      this.velV *= decay;
      if (Math.abs(this.velA) < INERTIA_EPSILON && Math.abs(this.velV) < INERTIA_EPSILON) {
        this.velA = this.velV = 0;
        this.settled = true;
        this.resumeAt = time + RESUME_DELAY_MS;
      }
    } else if (this.config.autoRotate && !reducedMotion && time >= this.resumeAt) {
      this.angle += (TWO_PI * dt) / this.config.dayLength;
    }
    this.applyPosition();
  }

  dispose(): void {
    const c = this.container;
    c.removeEventListener("pointerdown", this.onDown);
    c.removeEventListener("pointermove", this.onMove);
    c.removeEventListener("pointerup", this.onUp);
    c.removeEventListener("pointercancel", this.onUp);
    c.style.touchAction = this.prevTouchAction;
    c.style.cursor = this.prevCursor;
  }

  private applyPosition(): void {
    orbitPosition(this.angle, this.elevation, this.cameraDistance, this.camera.position);
    this.camera.lookAt(0, 0, 0);
  }

  private syncDraggable(): void {
    if (this.config.draggable) {
      this.container.style.touchAction = "pan-y";
      if (!this.dragging) this.container.style.cursor = "grab";
    } else {
      this.container.style.touchAction = this.prevTouchAction;
      this.container.style.cursor = this.prevCursor;
      this.cancelDrag();
    }
  }

  private cancelDrag(): void {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.container.hasPointerCapture?.(this.pointerId)) {
      this.container.releasePointerCapture(this.pointerId);
    }
  }

  private readonly onDown = (e: PointerEvent): void => {
    if (!this.config.draggable || this.dragging || e.button > 0) return;
    this.dragging = true;
    this.pointerId = e.pointerId;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.lastMoveTime = e.timeStamp;
    this.velA = this.velV = 0;
    this.settled = false;
    this.flight = null;
    this.resumeAt = Infinity;
    this.container.setPointerCapture?.(e.pointerId);
    this.container.style.cursor = "grabbing";
  };

  private readonly onMove = (e: PointerEvent): void => {
    if (!this.dragging || e.pointerId !== this.pointerId) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    const dtMs = Math.max(1, e.timeStamp - this.lastMoveTime);
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.lastMoveTime = e.timeStamp;
    const dA = dx * DRAG_SENSITIVITY;
    const dV = dy * DRAG_SENSITIVITY;
    this.angle += dA;
    this.elevation = clampElevation(this.elevation + dV);
    // Smoothed release velocity.
    this.velA = this.velA * 0.5 + (dA / dtMs) * 0.5;
    this.velV = this.velV * 0.5 + (dV / dtMs) * 0.5;
    this.applyPosition();
  };

  private readonly onUp = (e: PointerEvent): void => {
    if (!this.dragging || e.pointerId !== this.pointerId) return;
    this.cancelDrag();
    // A stationary hold before release carries no momentum.
    if (e.timeStamp - this.lastMoveTime > 100) this.velA = this.velV = 0;
    this.container.style.cursor = this.config.draggable ? "grab" : "";
  };
}
