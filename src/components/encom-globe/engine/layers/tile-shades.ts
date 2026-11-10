import { Color } from "three";

/** Deterministic PRNG (mulberry32) returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (((i % 6) + 6) % 6) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    default: return [v, p, q];
  }
}

const STEPS = [1, 0.65, 0.3];

/**
 * Port of the original `pusher.color(base).hueSet()` followed by
 * `.shade(random / 3)`: the base hue at saturation x value in {100, 65, 30}%
 * (9 colours), each blended toward black by 0..1/3. Returns sRGB hex strings.
 */
export function tileShades(base: string, rng: () => number = mulberry32(1)): string[] {
  const { r, g, b } = new Color(base).getRGB(new Color(), "srgb");
  const [h] = rgbToHsv(r, g, b);
  const out: string[] = [];
  for (const s of STEPS) {
    for (const v of STEPS) {
      const k = 1 - rng() / 3;
      const [cr, cg, cb] = hsvToRgb(h, s, v).map((c) => c * k);
      out.push(new Color().setRGB(cr, cg, cb, "srgb").getHexString());
    }
  }
  return out.map((x) => `#${x}`);
}
