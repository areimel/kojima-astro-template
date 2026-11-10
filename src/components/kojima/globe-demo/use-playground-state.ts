import { useCallback, useMemo, useRef, useState } from "react";

import { datasetFor } from "./globe-demo-data";
import type { DatasetName } from "./globe-demo-data";

import type { EncomGlobeHandle, GlobeConfigInput, GlobeItem, PalettePreset } from "@/components/encom-globe";

export const LAYER_KEYS = ["grid", "introLines", "pins", "markers", "satellites", "smoke", "atmosphere"] as const;
export type LayerKey = (typeof LAYER_KEYS)[number];
export type LogEntry = { id: number; text: string };

export const PIN_COLORS = {
  primary: "var(--primary)",
  orange: "#ff4d00",
  cyan: "#00e5ff",
  white: "#ffffff",
} as const;

const describe = (type: string, item: GlobeItem | null) =>
  `${type.toUpperCase()} ${item ? `${item.kind}: ${item.item.label || item.item.id}` : "none"}`;

export function usePlaygroundState() {
  const ref = useRef<EncomGlobeHandle>(null);
  const logId = useRef(0);
  const lastHover = useRef("");
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    grid: true, introLines: true, pins: true, markers: true, satellites: true, smoke: true, atmosphere: false,
  });
  const [autoRotate, setAutoRotate] = useState(true);
  const [dayLength, setDayLength] = useState(28000);
  const [viewAngle, setViewAngle] = useState(0);
  const [scale, setScale] = useState(1);
  const [palette, setPalette] = useState<PalettePreset>("kojima");
  const [dataset, setDataset] = useState<DatasetName>("all");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [added, setAdded] = useState<string[]>([]);

  const push = useCallback((text: string) => {
    setLog((l) => [{ id: ++logId.current, text }, ...l].slice(0, 6));
  }, []);
  const onSelect = useCallback((item: GlobeItem | null) => push(describe("select", item)), [push]);
  const onHover = useCallback((item: GlobeItem | null) => {
    const text = describe("hover", item);
    if (text === lastHover.current) return;
    lastHover.current = text;
    if (item) push(text);
  }, [push]);

  const config = useMemo<GlobeConfigInput>(
    () => ({ dayLength, viewAngle, scale, autoRotate, layers }),
    [dayLength, viewAngle, scale, autoRotate, layers],
  );
  const data = useMemo(() => datasetFor(dataset), [dataset]);

  const addPin = (pin: { label: string; lat: number; lng: number; color: string }) => {
    const id = ref.current?.addPin(pin);
    push(id ? `ADD pin: ${pin.label || id}` : "ADD pin: rejected (check lat/lng or wait for ready)");
    if (id) setAdded((a) => [...a, id]);
    return Boolean(id);
  };
  const clearAdded = () => {
    added.forEach((id) => ref.current?.removePin(id));
    setAdded([]);
  };

  return {
    ref, layers, setLayer: (k: LayerKey, v: boolean) => setLayers((l) => ({ ...l, [k]: v })),
    autoRotate, setAutoRotate, dayLength, setDayLength, viewAngle, setViewAngle, scale, setScale,
    palette, setPalette, dataset, setDataset, log, onSelect, onHover, config, data, addPin, clearAdded, added,
  };
}
