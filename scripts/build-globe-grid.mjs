#!/usr/bin/env node
/**
 * Builds public/globe/hex-grid.json: the hexasphere tiles that cover land.
 * Port of arscan/encom-globe `bin/buildgrid`, using Natural Earth land
 * (world-atlas) + d3-geo instead of a PNG mask. Deterministic output.
 *
 * Run: pnpm globe:grid
 */
import { geoContains } from "d3-geo";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const Hexasphere = require("hexasphere.js");

const RADIUS = 500;
const DIVISIONS = 35;
const TILE_RATIO = 0.45;
const DEG = Math.PI / 180;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "public/globe/hex-grid.json");

const topo = JSON.parse(
  readFileSync(resolve(root, "node_modules/world-atlas/land-110m.json"), "utf8"),
);
const land = feature(topo, topo.objects.land);

// Inline copy of geo.ts vector3ToLatLng (inverse of the original mapPoint).
function vector3ToLatLng(v) {
  const r = Math.hypot(v.x, v.y, v.z) || 1;
  const lat = 90 - Math.acos(Math.max(-1, Math.min(1, v.y / r))) / DEG;
  let lng = 180 - Math.atan2(v.z, v.x) / DEG;
  lng = ((((lng + 180) % 360) + 360) % 360) - 180;
  return { lat, lng };
}

const isLand = (p) => {
  const { lat, lng } = vector3ToLatLng(p);
  return geoContains(land, [lng, lat]) ? 1 : 0;
};

/**
 * Local tangent frame at a unit normal n: east = normalize(Y x n),
 * north = n x east. MUST match localFrame() in hex-grid.ts.
 */
function localFrame(n) {
  let ex = n.z;
  let ez = -n.x; // Y x n = (n.z, 0, -n.x)
  let len = Math.hypot(ex, ez);
  if (len < 1e-9) {
    ex = 1;
    ez = 0;
    len = 1;
  }
  const east = { x: ex / len, y: 0, z: ez / len };
  const north = {
    x: n.y * east.z - n.z * east.y,
    y: n.z * east.x - n.x * east.z,
    z: n.x * east.y - n.y * east.x,
  };
  return { east, north };
}

const norm = (v) => {
  const l = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const r2 = (n) => Math.round(n * 100) / 100;
const r3 = (n) => Math.round(n * 1000) / 1000;

const hexasphere = new Hexasphere(RADIUS, DIVISIONS, TILE_RATIO);
const kept = [];
let radiusSum = 0;

for (const tile of hexasphere.tiles) {
  const c = tile.centerPoint;
  let count = isLand(c);
  for (const b of tile.boundary) count += isLand(b);
  const coverage = count / (tile.boundary.length + 1);
  if (coverage <= 0.1) continue;

  const n = norm(c);
  const { east, north } = localFrame(n);
  const b0 = tile.boundary[0];
  const d = { x: b0.x - c.x, y: b0.y - c.y, z: b0.z - c.z };
  const angle = Math.atan2(dot(d, north), dot(d, east));
  const circumradius = Math.hypot(d.x, d.y, d.z);
  radiusSum += circumradius;
  const { lat, lng } = vector3ToLatLng(c);
  kept.push({ lat, lng, coverage, circumradius, angle, sides: tile.boundary.length });
}

const tileRadius = radiusSum / kept.length;
const tiles = kept.map((t) => [
  r2(t.lat),
  r2(t.lng),
  // coverage scaling (as the original) folded with per-tile radius variance
  r3((t.coverage * t.circumradius) / tileRadius),
  r3(t.angle),
  t.sides,
]);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify({ version: 1, divisions: DIVISIONS, tileRadius: r3(tileRadius), tiles }),
);
console.log(`tiles: ${tiles.length} / ${hexasphere.tiles.length}`);
console.log(`tileRadius: ${r3(tileRadius)}`);
console.log(`size: ${(statSync(out).size / 1024).toFixed(1)} KiB -> ${out}`);
