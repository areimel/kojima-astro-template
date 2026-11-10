import {
  CircleGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector3,
} from "three";

import { hexGridFragment, hexGridVertex } from "../shaders/hex-grid.glsl";
import type { EngineContext, FrameContext, GlobeLayer, GridFile, Palette } from "../types";
import { mulberry32, tileShades } from "./tile-shades";
import { GLOBE_RADIUS, latLngToVector3 } from "../utils/geo";

/** hexasphere(500, 35, 0.45) circumradius, used when the grid lacks `tileRadius`. */
const FALLBACK_TILE_RADIUS = 4.465;
const INTRO_ALTITUDE = 1.1;
const SETTLED_TIME = 1e9;
const SEED = 0x9e3779b9;

const NORTH_POLE = new Vector3(0, 1, 0);

/**
 * Local tangent frame at a surface normal: east = normalize(Y x normal),
 * north = normal x east. MUST match localFrame() in scripts/build-globe-grid.mjs,
 * which measured each tile's `angle` in this frame (from east toward north).
 */
export function localFrame(normal: Vector3, east = new Vector3(), north = new Vector3()) {
  east.crossVectors(NORTH_POLE, normal);
  if (east.lengthSq() < 1e-12) east.set(1, 0, 0);
  east.normalize();
  north.crossVectors(normal, east);
  return { east, north };
}

interface Group6 {
  mesh: InstancedMesh;
  /** Indices into grid.tiles for each instance. */
  shade: Uint8Array;
  colors: Float32Array;
}

export function createHexGridLayer(ctx: EngineContext, grid: GridFile): GlobeLayer {
  const config = ctx.config;
  const tileRadius = grid.tileRadius ?? FALLBACK_TILE_RADIUS;

  const material = new ShaderMaterial({
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        currentTime: { value: 0 },
        introDuration: { value: config.introLinesDuration + 0.00001 },
        introAltitude: { value: INTRO_ALTITUDE },
        opacity: { value: 1 },
      },
    ]),
    vertexShader: hexGridVertex,
    fragmentShader: hexGridFragment,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
  material.side = DoubleSide;

  const root = new Group();
  root.name = "hex-grid";
  const rng = mulberry32(SEED);
  const groups: Group6[] = [];

  const m = new Matrix4();
  const rot = new Matrix4();
  const pos = new Vector3();
  const east = new Vector3();
  const north = new Vector3();

  for (const sides of [6, 5]) {
    const tiles = grid.tiles.filter((t) => t[4] === sides);
    if (tiles.length === 0) continue;

    const geometry = new CircleGeometry(tileRadius, sides);
    const mesh = new InstancedMesh(geometry, material, tiles.length);
    const lngs = new Float32Array(tiles.length);
    const colors = new Float32Array(tiles.length * 3);
    const shade = new Uint8Array(tiles.length);

    tiles.forEach(([lat, lng, size, angle], i) => {
      latLngToVector3(lat, lng, GLOBE_RADIUS, pos);
      const normal = pos.clone().normalize();
      localFrame(normal, east, north);
      m.makeBasis(east, north, normal);
      m.multiply(rot.makeRotationZ(angle));
      m.scale(pos.set(size, size, size));
      m.setPosition(latLngToVector3(lat, lng));
      mesh.setMatrixAt(i, m);
      lngs[i] = lng;
      shade[i] = Math.floor(rng() * 9);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false; // vertex shader displaces tiles during the intro
    geometry.setAttribute("lng", new InstancedBufferAttribute(lngs, 1));
    geometry.setAttribute("tileColor", new InstancedBufferAttribute(colors, 3));
    root.add(mesh);
    groups.push({ mesh, shade, colors });
  }

  const tmp = new Color();
  function applyPalette(palette: Palette) {
    const shades = tileShades(palette.tile, mulberry32(SEED ^ 0x5bd1e995));
    const linear = shades.map((s) => tmp.set(s).toArray());
    for (const { mesh, shade, colors } of groups) {
      shade.forEach((k, i) => colors.set(linear[k], i * 3));
      (mesh.geometry.getAttribute("tileColor") as InstancedBufferAttribute).needsUpdate = true;
    }
  }
  applyPalette(ctx.palette);

  return {
    name: "grid",
    object: root,
    update(frame: FrameContext) {
      const settled = frame.reducedMotion || !ctx.config.intro;
      material.uniforms.currentTime.value = settled ? SETTLED_TIME : frame.time;
    },
    setPalette: applyPalette,
    dispose() {
      for (const { mesh } of groups) {
        mesh.geometry.dispose();
        mesh.dispose();
      }
      material.dispose();
      root.removeFromParent();
    },
  };
}
