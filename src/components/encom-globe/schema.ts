import { z } from "zod";

/**
 * JSON contract for EncomGlobe. Every instance takes a `config` and a `data`
 * object (inline, an imported .json file, or fetched from `dataUrl`).
 * Option names and defaults follow the original encom-globe.
 */

const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);
const color = z.string().min(1);
const meta = z.record(z.string(), z.unknown());

export const PinSchema = z.object({
  id: z.string().optional(),
  lat,
  lng,
  label: z.string().optional(),
  color: color.optional(),
  /** Pin height as a multiple of the globe radius (original: 1.2 labelled, 1.1–1.15 unlabelled). */
  altitude: z.number().min(1).max(2).optional(),
  meta: meta.optional(),
});

export const MarkerSchema = z.object({
  id: z.string().optional(),
  lat,
  lng,
  label: z.string().default(""),
  color: color.optional(),
  /** Draw an arc from another marker: its `id`, or "previous" for the one listed before. */
  connectTo: z.string().optional(),
  meta: meta.optional(),
});

export const SatelliteStyleSchema = z.object({
  numWaves: z.number().int().min(1).max(16).optional(),
  waveColor: color.optional(),
  coreColor: color.optional(),
  shieldColor: color.optional(),
  size: z.number().positive().max(4).optional(),
});

const satellitePosition = z.object({
  lat,
  lng,
  altitude: z.number().min(1).max(3).default(1.3),
});

export const SatelliteSchema = satellitePosition.extend({
  id: z.string().optional(),
  label: z.string().optional(),
  meta: meta.optional(),
  ...SatelliteStyleSchema.shape,
});

export const ConstellationSchema = SatelliteStyleSchema.extend({
  id: z.string().optional(),
  label: z.string().optional(),
  satellites: z.array(satellitePosition).min(1),
});

export const GlobeDataSchema = z.object({
  pins: z.array(z.unknown()).default([]),
  markers: z.array(z.unknown()).default([]),
  satellites: z.array(z.unknown()).default([]),
  constellations: z.array(z.unknown()).default([]),
});

export const LayersSchema = z.object({
  grid: z.boolean().default(true),
  introLines: z.boolean().default(true),
  pins: z.boolean().default(true),
  markers: z.boolean().default(true),
  satellites: z.boolean().default(true),
  smoke: z.boolean().default(true),
  atmosphere: z.boolean().default(false),
});

export const GlobeConfigSchema = z.object({
  /** ms per full camera orbit (original default 28000). */
  dayLength: z.number().positive().default(28000),
  scale: z.number().positive().max(4).default(1),
  /** Camera elevation in radians (original default 0; boardroom uses 0.1). */
  viewAngle: z.number().min(-1.2).max(1.2).default(0),
  /** Initial camera longitude in degrees; omitted = original start angle. */
  startLng: z.number().min(-180).max(180).optional(),
  intro: z.boolean().default(true),
  introLinesDuration: z.number().min(0).default(2000),
  introLinesCount: z.number().int().min(0).max(200).default(60),
  introLinesAltitude: z.number().min(1).max(2).default(1.1),
  maxPins: z.number().int().min(1).default(500),
  maxMarkers: z.number().int().min(1).default(4),
  autoRotate: z.boolean().default(true),
  draggable: z.boolean().default(true),
  /** Grid JSON URL; defaults to the generated `/globe/hex-grid.json`. */
  gridUrl: z.string().optional(),
  layers: LayersSchema.default(LayersSchema.parse({})),
});

export type PinInput = z.input<typeof PinSchema>;
export type MarkerInput = z.input<typeof MarkerSchema>;
export type SatelliteInput = z.input<typeof SatelliteSchema>;
export type ConstellationInput = z.input<typeof ConstellationSchema>;
export type SatelliteStyle = z.infer<typeof SatelliteStyleSchema>;

export type Pin = z.infer<typeof PinSchema> & { id: string };
export type Marker = z.infer<typeof MarkerSchema> & { id: string };
export type Satellite = z.infer<typeof SatelliteSchema> & { id: string };
export type Constellation = z.infer<typeof ConstellationSchema> & { id: string };

export type GlobeLayers = z.infer<typeof LayersSchema>;
export type GlobeConfig = z.infer<typeof GlobeConfigSchema>;
export type GlobeConfigInput = Omit<z.input<typeof GlobeConfigSchema>, "layers"> & {
  layers?: Partial<GlobeLayers>;
};

export interface GlobeData {
  pins: Pin[];
  markers: Marker[];
  satellites: Satellite[];
  constellations: Constellation[];
}

export interface GlobeDataInput {
  pins?: PinInput[];
  markers?: MarkerInput[];
  satellites?: SatelliteInput[];
  constellations?: ConstellationInput[];
}

export interface ParseIssue {
  collection: keyof GlobeData;
  index: number;
  message: string;
}

function parseList<T extends { id?: string }>(
  items: unknown[],
  schema: z.ZodType<T>,
  collection: keyof GlobeData,
  issues: ParseIssue[],
): (T & { id: string })[] {
  const out: (T & { id: string })[] = [];
  items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (result.success) {
      // Index-based ids are deterministic, so server and client markup match.
      out.push({ ...result.data, id: result.data.id ?? `${collection}-${index}` });
    } else {
      issues.push({ collection, index, message: z.prettifyError(result.error) });
    }
  });
  return out;
}

/** Validate globe data item-by-item: invalid entries are dropped and reported, never thrown. */
export function parseGlobeData(input: unknown): { data: GlobeData; issues: ParseIssue[] } {
  const issues: ParseIssue[] = [];
  const root = GlobeDataSchema.safeParse(input ?? {});
  const raw = root.success ? root.data : GlobeDataSchema.parse({});
  return {
    data: {
      pins: parseList(raw.pins, PinSchema, "pins", issues),
      markers: parseList(raw.markers, MarkerSchema, "markers", issues),
      satellites: parseList(raw.satellites, SatelliteSchema, "satellites", issues),
      constellations: parseList(raw.constellations, ConstellationSchema, "constellations", issues),
    },
    issues,
  };
}

/** Merge partial configs left → right (later wins) and fill defaults. Falsy values are respected. */
export function resolveConfig(...parts: (GlobeConfigInput | undefined)[]): GlobeConfig {
  const merged: Record<string, unknown> = {};
  const layers: Record<string, unknown> = {};
  for (const part of parts) {
    if (!part) continue;
    for (const [key, value] of Object.entries(part)) {
      if (value === undefined) continue;
      if (key === "layers") Object.assign(layers, value);
      else merged[key] = value;
    }
  }
  return GlobeConfigSchema.parse({ ...merged, layers: LayersSchema.parse(layers) });
}

export const DEFAULT_CONFIG: GlobeConfig = resolveConfig();
