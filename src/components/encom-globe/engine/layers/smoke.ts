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
import { disposeObject } from "../utils/dispose";

const SMOKE_COUNT = 5000;
const SMOKE_PER_PIN = 30;
const SMOKE_PER_SECOND = 20;
const START_DELAY = 1500;

const ATTRIBUTES = ["myStartTime", "myStartLat", "myStartLon", "altitude", "isActive"] as const;
type AttributeName = (typeof ATTRIBUTES)[number];

const devicePixelRatio = () =>
  Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);

/** One `Points` of `SMOKE_COUNT` particles; each pin owns a ring-buffer slice of `SMOKE_PER_PIN`. */
export function createSmokeLayer(ctx: EngineContext): SmokeLayer {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(SMOKE_COUNT * 3), 3));
  const attrs = {} as Record<AttributeName, BufferAttribute>;
  for (const name of ATTRIBUTES) {
    attrs[name] = new BufferAttribute(new Float32Array(SMOKE_COUNT), 1);
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

  let next = 0;

  return {
    name: "smoke",
    object: points,

    setFire(lat, lng, altitude) {
      const start = next;
      const now = ctx.now();
      for (let i = 0; i < SMOKE_PER_PIN; i++) {
        attrs.myStartTime.setX(next, now + (1000 * i) / SMOKE_PER_SECOND + START_DELAY);
        attrs.myStartLat.setX(next, lat);
        attrs.myStartLon.setX(next, lng);
        attrs.altitude.setX(next, altitude);
        attrs.isActive.setX(next, 1);
        next = (next + 1) % SMOKE_COUNT;
      }
      for (const name of ATTRIBUTES) attrs[name].needsUpdate = true;
      return start;
    },

    extinguish(handle) {
      for (let i = 0; i < SMOKE_PER_PIN; i++) attrs.isActive.setX((handle + i) % SMOKE_COUNT, 0);
      attrs.isActive.needsUpdate = true;
    },

    update(frame: FrameContext) {
      points.visible = !(frame.reducedMotion || !ctx.config.intro);
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
