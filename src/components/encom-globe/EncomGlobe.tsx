import { useEffect, useImperativeHandle, useMemo, useState } from "react";
import type { Ref } from "react";

import { EncomGlobeFrame } from "./EncomGlobeFrame";
import type { GlobeController } from "./engine/globe-controller";
import { DEFAULT_PALETTE } from "./engine/types";
import type { GlobeEventHandler, GlobeItem, Palette } from "./engine/types";
import { resolvePalette } from "./engine/utils/palette";
import { CONFIG_PRESETS } from "./presets";
import type { ConfigPresetName, PalettePreset } from "./presets";
import { parseGlobeData, resolveConfig } from "./schema";
import type {
  ConstellationInput,
  GlobeConfigInput,
  GlobeData,
  GlobeDataInput,
  GlobeLayers,
  MarkerInput,
  PinInput,
  SatelliteInput,
} from "./schema";
import { useGlobeController } from "./use-globe-controller";

import { useIsDark } from "@/hooks/use-is-dark";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface EncomGlobeHandle {
  flyTo(lat: number, lng: number, opts?: { duration?: number }): void;
  /** The add* methods validate input and return the assigned id (undefined if invalid or not ready). */
  addPin(pin: PinInput): string | undefined;
  addMarker(marker: MarkerInput): string | undefined;
  addSatellite(satellite: SatelliteInput): string | undefined;
  addConstellation(constellation: ConstellationInput): string | undefined;
  removePin(id: string): void;
  pause(): void;
  resume(): void;
  getController(): GlobeController | null;
}

export interface EncomGlobeProps {
  config?: GlobeConfigInput;
  preset?: ConfigPresetName;
  autoRotate?: boolean;
  atmosphere?: boolean;
  layers?: Partial<GlobeLayers>;
  data?: GlobeDataInput;
  /** JSON fetched at runtime and concatenated with `data`. */
  dataUrl?: string;
  palette?: PalettePreset | Partial<Palette>;
  title?: string;
  subtitle?: string;
  frame?: boolean;
  legend?: boolean;
  onSelect?: GlobeEventHandler;
  onHover?: GlobeEventHandler;
  className?: string;
  "aria-label"?: string;
  ref?: Ref<EncomGlobeHandle>;
}

const concat = <T,>(a?: T[], b?: T[]) => [...(a ?? []), ...(b ?? [])];
const pad = (n: number) => String(n).padStart(3, "0");
let addedId = 0;

function describe(item: GlobeItem): string {
  const pos = item.kind === "constellation" ? item.item.satellites[0] : item.item;
  const label = item.item.label || item.kind;
  return `${label} ${pos.lat.toFixed(2)}, ${pos.lng.toFixed(2)}`;
}

export function EncomGlobe({
  config, preset = "default", autoRotate, atmosphere, layers, data, dataUrl, palette = "kojima",
  title, subtitle, frame = true, legend, onSelect, onHover, className, ref, ...rest
}: EncomGlobeProps) {
  const isDark = useIsDark();
  const reducedMotion = useReducedMotion();
  const [remote, setRemote] = useState<GlobeDataInput | null>(null);
  const [hovered, setHovered] = useState<GlobeItem | null>(null);
  const [live, setLive] = useState<{ palette: Palette; ready: boolean }>({ palette: DEFAULT_PALETTE, ready: false });

  useEffect(() => {
    if (!dataUrl) return setRemote(null);
    const abort = new AbortController();
    fetch(dataUrl, { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setRemote)
      .catch((e) => {
        if (!abort.signal.aborted) console.warn(`[EncomGlobe] failed to load ${dataUrl}:`, e);
      });
    return () => abort.abort();
  }, [dataUrl]);

  const paletteKey = JSON.stringify(palette);
  useEffect(() => {
    setLive({ palette: resolvePalette(JSON.parse(paletteKey) as typeof palette, isDark), ready: true });
  }, [paletteKey, isDark]);

  const dataKey = JSON.stringify({
    pins: concat(data?.pins, remote?.pins),
    markers: concat(data?.markers, remote?.markers),
    satellites: concat(data?.satellites, remote?.satellites),
    constellations: concat(data?.constellations, remote?.constellations),
  });
  const parsed = useMemo(() => parseGlobeData(JSON.parse(dataKey)), [dataKey]);
  useEffect(() => {
    if (import.meta.env.DEV && parsed.issues.length) console.warn("[EncomGlobe] invalid data dropped:", parsed.issues);
  }, [parsed]);

  const explicit: GlobeConfigInput = {
    ...(autoRotate !== undefined && { autoRotate }),
    layers: { ...layers, ...(atmosphere !== undefined && { atmosphere }) },
  };
  const resolved = resolveConfig(CONFIG_PRESETS[preset], config, explicit);

  const { containerRef, controller, status } = useGlobeController({
    config: resolved, data: parsed.data, palette: live.palette, reducedMotion,
    enabled: live.ready, onSelect, onHover: (item) => { setHovered(item); onHover?.(item); },
  });

  useImperativeHandle(ref, () => {
    const add = <K extends keyof GlobeData>(key: K, input: unknown, apply: (c: GlobeController, v: GlobeData[K][number]) => void) => {
      const item = parseGlobeData({ [key]: [input] }).data[key][0];
      // Runtime additions without an id get a unique one (data ids are index-based).
      if (item && !(input as { id?: string }).id) item.id = `${key}-added-${++addedId}`;
      if (!controller || !item) return undefined;
      apply(controller, item);
      return item.id;
    };
    return {
      flyTo: (lat, lng, opts) => controller?.flyTo(lat, lng, opts),
      addPin: (p) => add("pins", p, (c, v) => c.addPin(v)),
      addMarker: (m) => add("markers", m, (c, v) => c.addMarker(v)),
      addSatellite: (s) => add("satellites", s, (c, v) => c.addSatellite(v)),
      addConstellation: (k) => add("constellations", k, (c, v) => c.addConstellation(v)),
      removePin: (id) => controller?.removePin(id),
      pause: () => controller?.pause(),
      resume: () => controller?.resume(),
      getController: () => controller,
    };
  }, [controller]);

  const { pins, markers, satellites } = parsed.data;
  const total = pins.length + markers.length + satellites.length;
  const items = [
    ...pins.map((p) => ["Pin", p.label, p] as const),
    ...markers.map((m) => ["Marker", m.label, m] as const),
    ...satellites.map((s) => ["Satellite", s.label, s] as const),
  ];
  const name = rest["aria-label"] ?? title ?? "Interactive globe";
  const showOverlay = status !== "ready";

  return (
    <figure
      aria-label={name}
      // An opaque palette background (encom/mono) needs the dark tokens for HUD text contrast.
      className={cn("relative m-0 aspect-square w-full overflow-hidden border border-border bg-background", live.palette.background && "dark", className)}
      style={live.palette.background ? { backgroundColor: live.palette.background } : undefined}
    >
      <div ref={containerRef} className="size-full" />
      {frame && (
        <EncomGlobeFrame
          title={title} subtitle={subtitle} legend={legend} palette={live.palette}
          counts={{ pins: pins.length, markers: markers.length, satellites: satellites.length }}
          status={hovered ? describe(hovered) : `SYS | ${pad(total)}`}
        />
      )}
      <figcaption className="sr-only">
        {name}
        <ul>
          {items.map(([kind, label, it]) => (
            <li key={it.id}>{`${kind}: ${label || it.id}, latitude ${it.lat}, longitude ${it.lng}`}</li>
          ))}
        </ul>
      </figcaption>
      <div role="status" aria-live="polite" className={cn("pointer-events-none absolute inset-0 z-20 grid place-items-center px-8 text-center", !showOverlay && "hidden")}>
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          {status === "unsupported"
            ? "3D view unavailable — WebGL is disabled in this browser."
            : status === "error"
              ? "Globe failed to load."
              : "Initialising globe…"}
        </p>
      </div>
    </figure>
  );
}
