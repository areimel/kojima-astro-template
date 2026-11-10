import type { CanvasTexture, Texture } from "three";
import { RepeatWrapping } from "three";

import { canvasTexture, renderToCanvas } from "../utils/canvas";
import { createRefCache } from "../utils/ref-cache";

/** Sprite-sheet geometry, identical to the original Satellite.js. */
export const SAT_FRAMES = 50;
export const SAT_PIXELS = 100;
export const SAT_ROWS = 10;
export const SAT_COLS = SAT_FRAMES / SAT_ROWS;
export const SAT_FRAME_DURATION = 80;
const WAVE_START = Math.floor(SAT_FRAMES / 8);

export interface SatelliteSpriteOptions {
  numWaves?: number;
  waveColor: string;
  coreColor: string;
  shieldColor: string;
}

export interface SatelliteSprite {
  canvas: HTMLCanvasElement;
  texture: CanvasTexture;
  frames: number;
  /** Frame the animation loops back to after the last one. */
  repeatAt: number;
  /** Cache key (used by {@link releaseSatelliteSprite}). */
  key: string;
}

export interface FrameTiming {
  frames: number;
  frameDuration: number;
  repeatAt: number;
}

/** Original `repeatAt`, clamped so tiny `numWaves` can't produce a negative loop point. */
export function computeRepeatAt(numWaves: number, frames = SAT_FRAMES): number {
  const raw = Math.floor(frames - (2 * (frames - WAVE_START)) / numWaves) + 1;
  return Math.min(frames - 1, Math.max(WAVE_START + 2, raw));
}

/**
 * Pure equivalent of the original TextureAnimator: plays frames 0..frames-1
 * once, then loops over repeatAt..frames-1 forever.
 */
export function frameAt(timeMs: number, { frames, frameDuration, repeatAt }: FrameTiming): number {
  const n = Math.max(0, Math.floor(timeMs / frameDuration));
  if (n < frames) return n;
  const loop = frames - repeatAt;
  if (loop <= 0) return frames - 1;
  return repeatAt + ((n - frames) % loop);
}

/** Point the (shared) sprite-sheet texture at a given frame. */
export function applyFrame(texture: Texture, frame: number): void {
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(1 / SAT_COLS, 1 / SAT_ROWS);
  const col = frame % SAT_COLS;
  const row = Math.floor(frame / SAT_COLS);
  texture.offset.set(col / SAT_COLS, 1 - row / SAT_ROWS - 1 / SAT_ROWS);
}

function drawSheet(
  ctx: CanvasRenderingContext2D,
  numWaves: number,
  waveColor: string,
  coreColor: string,
  shieldColor: string,
): void {
  const numFrames = SAT_FRAMES;
  const pixels = SAT_PIXELS;
  const waveStart = WAVE_START;
  const waveInterval = Math.floor((numFrames - waveStart) / numWaves);
  const distPerFrame = (pixels - 25) / (numFrames - waveStart);
  const repeatAt = computeRepeatAt(numWaves);
  const swirlDone = Math.floor((repeatAt - waveStart) / 2) + waveStart;
  const buffer = Math.PI / 16;
  const start = -Math.PI + Math.PI / 4;
  const HP = Math.PI / 2;

  for (let i = 0; i < numFrames; i++) {
    const cx = (i % SAT_COLS) * pixels + 25;
    const cy = Math.floor(i / SAT_COLS) * pixels + Math.floor(pixels / 2);

    /* shield: fade in, swirl closed, then rotate PI/4 */
    ctx.lineWidth = 2;
    ctx.strokeStyle = shieldColor;
    let radius = 8;
    if (i < waveStart) radius = (radius * i) / waveStart;

    for (let n = 0; n < 4; n++) {
      ctx.beginPath();
      if (i < waveStart) {
        ctx.arc(cx, cy, radius, n * HP + start + buffer, n * HP + start + HP - 2 * buffer);
      } else if (i > waveStart && i < swirlDone) {
        const step = ((3 * Math.PI) / 2 / (swirlDone - waveStart)) * (i - waveStart);
        const a = -Math.PI + Math.PI / 4 + buffer + step;
        ctx.arc(
          cx,
          cy,
          radius,
          Math.max(n * HP + start, a),
          Math.max(n * HP + start + HP - 2 * buffer, a + HP - 2 * buffer),
        );
      } else if (i >= swirlDone && i < repeatAt) {
        const step = (((n * 2 * Math.PI) / 4) / (repeatAt - swirlDone)) * (i - swirlDone);
        const a = HP + Math.PI / 4 + buffer + step;
        ctx.arc(cx, cy, radius, a, a + HP - 2 * buffer);
      } else if (i >= repeatAt && i < (numFrames - repeatAt) / 2 + repeatAt) {
        const step = (HP / ((numFrames - repeatAt) / 2)) * (i - repeatAt);
        const a = n * HP + Math.PI / 4 + buffer + step;
        ctx.arc(cx, cy, radius, a, a + HP - 2 * buffer);
      } else {
        ctx.arc(cx, cy, radius, n * HP + start + buffer, n * HP + start + HP - 2 * buffer);
      }
      ctx.stroke();
    }

    /* radar waves going out, fading to the right */
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 2;
    for (let w = 0; w < numWaves; w++) {
      const frameOn = i - waveInterval * w - waveStart;
      if (frameOn > 0 && frameOn * distPerFrame < pixels - 25) {
        ctx.globalAlpha = Math.max(0, 0.9 - (frameOn * distPerFrame) / (pixels - 25));
        ctx.beginPath();
        ctx.arc(cx, cy, frameOn * distPerFrame, -Math.PI / 12, Math.PI / 12);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    /* core dot */
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, i < waveStart ? (3 * i) / waveStart : 3, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

const cache = createRefCache<string, SatelliteSprite>(
  (key) => {
    const [waves, waveColor, coreColor, shieldColor] = key.split("|");
    const numWaves = Number(waves);
    const canvas = renderToCanvas(
      (SAT_FRAMES * SAT_PIXELS) / SAT_ROWS,
      SAT_PIXELS * SAT_ROWS,
      (ctx) => drawSheet(ctx, numWaves, waveColor, coreColor, shieldColor),
    );
    const texture = canvasTexture(canvas);
    applyFrame(texture, 0);
    return { canvas, texture, frames: SAT_FRAMES, repeatAt: computeRepeatAt(numWaves), key };
  },
  (sprite) => sprite.texture.dispose(),
);

/**
 * Get (or build) the shared sprite sheet for these options. Every call must
 * be paired with {@link releaseSatelliteSprite}; the texture is disposed when
 * the last user releases it.
 */
export function createSatelliteSprite(opts: SatelliteSpriteOptions): SatelliteSprite {
  const numWaves = opts.numWaves ?? 8;
  return cache.acquire([numWaves, opts.waveColor, opts.coreColor, opts.shieldColor].join("|"));
}

export function releaseSatelliteSprite(sprite: SatelliteSprite): void {
  cache.release(sprite.key);
}
