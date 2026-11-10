import { CanvasTexture, SRGBColorSpace } from "three";

/** Port of encom-globe `utils.renderToCanvas`. */
export function renderToCanvas(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx);
  return canvas;
}

/** Canvas → sRGB CanvasTexture ready for sprite/basic materials. */
export function canvasTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Filled dot (the original pin "top" sprite: 20×20 canvas, r = 5). */
export function dotTexture(color: string, size = 20, radius = 5): CanvasTexture {
  return canvasTexture(
    renderToCanvas(size, size, (ctx) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
      ctx.fill();
    }),
  );
}

/** Ring + dot (the original marker sprite: 30×30, ring r = w/3, dot r = w/5). */
export function ringDotTexture(color: string, size = 30): CanvasTexture {
  return canvasTexture(
    renderToCanvas(size, size, (ctx) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 5, 0, Math.PI * 2);
      ctx.fill();
    }),
  );
}
