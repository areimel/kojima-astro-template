import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
} from "three";

import type { EngineContext, FrameContext, GlobeLayer, Palette } from "../types";
import { mulberry32 } from "./tile-shades";
import { isSettled } from "../utils/animate";
import { latLngToVector3 } from "../utils/geo";

/**
 * Port of the original `createIntroLines`: short arcs of latitude/longitude
 * lines hovering above the globe that spin once while fading in and out,
 * all merged into a single LineSegments draw call.
 */
export function createIntroLinesLayer(ctx: EngineContext): GlobeLayer {
  const { introLinesCount, introLinesAltitude, introLinesDuration } = ctx.config;
  const rng = mulberry32(0x1f3a5c7);
  const positions: number[] = [];

  for (let i = 0; i < introLinesCount; i++) {
    const lat = rng() * 180 + 90; // original range; mapPoint wraps it around the poles
    let lng = rng() * 5;
    let length = 4 + Math.floor(rng() * 5);
    if (rng() < 0.3) {
      lng = rng() * 30 - 50;
      length = 3 + Math.floor(rng() * 3);
    }
    let prev: number[] | null = null;
    for (let j = 0; j < length; j++) {
      const p = latLngToVector3(lat, lng - j * 5);
      p.multiplyScalar(introLinesAltitude);
      const cur = [p.x, p.y, p.z];
      if (prev) positions.push(...prev, ...cur);
      prev = cur;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  const material = new LineBasicMaterial({
    color: new Color(ctx.palette.introLines),
    transparent: true,
    opacity: 0,
    fog: true,
  });
  const lines = new LineSegments(geometry, material);
  lines.frustumCulled = false;
  const root = new Group();
  root.name = "intro-lines";
  root.add(lines);
  root.visible = false;

  return {
    name: "introLines",
    object: root,
    update(frame: FrameContext) {
      const t = introLinesDuration > 0 ? frame.time / introLinesDuration : 1;
      const active = !isSettled(frame, ctx.config) && introLinesCount > 0 && t < 1;
      root.visible = active;
      if (!active) return;
      // original: ramps in over the first 10%, fades out over the last 20%
      material.opacity = Math.min(1, Math.max(0, t * 10 - 0.2), Math.max(0, (1 - t) * 5));
      root.rotation.y = 2 * Math.PI * t;
    },
    setPalette(palette: Palette) {
      material.color.set(palette.introLines);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      root.removeFromParent();
    },
  };
}
