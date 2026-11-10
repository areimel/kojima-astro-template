import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
} from "three";

import { smokeFragmentShader, smokeVertexShader } from "../shaders/smoke.glsl";
import type { EngineContext, FrameContext, Palette, SmokeLayer } from "../types";
import { isSettled } from "../utils/animate";
import { disposeObject } from "../utils/dispose";

const MAX_SMOKE_COUNT = 15000;
const SMOKE_PER_PIN = 30;
const SMOKE_PER_SECOND = 20;
const START_DELAY = 1500;

const ATTRIBUTES = ["myStartTime", "myStartLat", "myStartLon", "altitude", "isActive"] as const;
type AttributeName = (typeof ATTRIBUTES)[number];

const devicePixelRatio = () =>
  Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);

/**
 * One `Points` sized from `maxPins`; each plume owns a slice of `SMOKE_PER_PIN`
 * particles until it is extinguished (slice free-list, no overwriting).
 */
export function createSmokeLayer(ctx: EngineContext): SmokeLayer {
  const plumes = Math.max(1, Math.floor(Math.min(MAX_SMOKE_COUNT, ctx.config.maxPins * SMOKE_PER_PIN) / SMOKE_PER_PIN));
  const count = plumes * SMOKE_PER_PIN;
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
  const attrs = {} as Record<AttributeName, BufferAttribute>;
  for (const name of ATTRIBUTES) {
    attrs[name] = new BufferAttribute(new Float32Array(count), 1);
    geometry.setAttribute(name, attrs[name]);
  }

  const uniforms = UniformsUtils.merge([
    UniformsLib.fog,
    {
      currentTime: { value: 0 },
      pixelRatio: { value: devicePixelRatio() },
      color: { value: new Color(ctx.palette.smoke) },
    },
  ]);
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: smokeVertexShader,
    fragmentShader: smokeFragmentShader,
    transparent: true,
    depthWrite: false,
    fog: true,
  });

  const points = new Points(geometry, material);
  points.name = "smoke";
  points.frustumCulled = false;
  points.visible = !ctx.reducedMotion;

  /** Free plume slots (slice index); handles are the slice's first particle. */
  const free: number[] = Array.from({ length: plumes }, (_, i) => plumes - 1 - i);
  const used = new Set<number>();

  return {
    name: "smoke",
    object: points,

    setFire(lat, lng, altitude) {
      const slot = free.pop();
      if (slot === undefined) return -1;
      const start = slot * SMOKE_PER_PIN;
      used.add(start);
      const now = ctx.now();
      for (let i = 0; i < SMOKE_PER_PIN; i++) {
        const k = start + i;
        attrs.myStartTime.setX(k, now + (1000 * i) / SMOKE_PER_SECOND + START_DELAY);
        attrs.myStartLat.setX(k, lat);
        attrs.myStartLon.setX(k, lng);
        attrs.altitude.setX(k, altitude);
        attrs.isActive.setX(k, 1);
      }
      for (const name of ATTRIBUTES) attrs[name].needsUpdate = true;
      return start;
    },

    extinguish(handle) {
      if (!used.delete(handle)) return;
      for (let i = 0; i < SMOKE_PER_PIN; i++) attrs.isActive.setX(handle + i, 0);
      attrs.isActive.needsUpdate = true;
      free.push(handle / SMOKE_PER_PIN);
    },

    update(frame: FrameContext) {
      points.visible = !isSettled(frame, ctx.config);
      uniforms.currentTime.value = frame.time;
      uniforms.pixelRatio.value = devicePixelRatio();
    },

    setPalette(palette: Palette) {
      (uniforms.color.value as Color).set(palette.smoke);
    },

    dispose() {
      disposeObject(points);
    },
  };
}
