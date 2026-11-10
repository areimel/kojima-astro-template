import { useEffect, useRef, useState } from "react";

import type { GlobeController } from "./engine/globe-controller";
import type { GlobeEventHandler, Palette } from "./engine/types";
import type { GlobeConfig, GlobeData } from "./schema";

export type GlobeStatus = "idle" | "loading" | "ready" | "unsupported" | "error";

export interface UseGlobeControllerOptions {
  config: GlobeConfig;
  data: GlobeData;
  palette: Palette;
  reducedMotion: boolean;
  /** Stable change-detection keys (e.g. JSON strings) computed once by the caller. */
  configKey: string;
  dataKey: string;
  paletteKey: string;
  /** Hold off creating the controller until inputs (e.g. the live palette) are resolved. */
  enabled?: boolean;
  onSelect?: GlobeEventHandler;
  onHover?: GlobeEventHandler;
}

const LAZY_MARGIN = "200px";

/** Owns the controller lifecycle: lazy start, strict-mode safety, live updates and events. */
export function useGlobeController(options: UseGlobeControllerOptions) {
  const { enabled = true } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [controller, setController] = useState<GlobeController | null>(null);
  const [status, setStatus] = useState<GlobeStatus>("idle");

  const latest = useRef(options);
  latest.current = options;

  const { configKey, dataKey, paletteKey } = options;
  const applied = useRef({ configKey, dataKey, paletteKey, reduced: options.reducedMotion });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;
    let cancelled = false;
    let created: GlobeController | null = null;

    const start = async () => {
      setStatus("loading");
      try {
        const { GlobeController: Controller } = await import("./engine/globe-controller");
        if (cancelled) return;
        const o = latest.current;
        applied.current = {
          configKey: o.configKey,
          dataKey: o.dataKey,
          paletteKey: o.paletteKey,
          reduced: o.reducedMotion,
        };
        const c = await Controller.create(el, {
          config: o.config,
          palette: o.palette,
          reducedMotion: o.reducedMotion,
          data: o.data,
        });
        if (cancelled) {
          c.dispose();
          return;
        }
        created = c;
        setController(c);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        const unsupported = err instanceof Error && err.name === "WebGLUnavailableError";
        if (!unsupported) console.error("[EncomGlobe]", err);
        setStatus(unsupported ? "unsupported" : "error");
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        void start();
      },
      { rootMargin: LAZY_MARGIN },
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      created?.dispose();
      setController(null);
      setStatus("idle");
    };
  }, [enabled]);

  // Live updates, compared by stable JSON key so identical values never churn.
  useEffect(() => {
    if (!controller || controller.isDisposed) return;
    const a = applied.current;
    const o = latest.current;
    if (a.configKey !== configKey) void controller.setConfig(o.config);
    if (a.dataKey !== dataKey) controller.setData(o.data);
    if (a.paletteKey !== paletteKey) controller.setPalette(o.palette);
    if (a.reduced !== o.reducedMotion) controller.setReducedMotion(o.reducedMotion);
    applied.current = { configKey, dataKey, paletteKey, reduced: o.reducedMotion };
  }, [controller, configKey, dataKey, paletteKey, options.reducedMotion]);

  // Events go through refs so callback identity never re-subscribes.
  useEffect(() => {
    if (!controller) return;
    const offSelect = controller.on("select", (item) => latest.current.onSelect?.(item));
    const offHover = controller.on("hover", (item) => latest.current.onHover?.(item));
    return () => {
      offSelect();
      offHover();
    };
  }, [controller]);

  return { containerRef, controller, status };
}
