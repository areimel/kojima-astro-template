import { useEffect, useRef, useState } from "react";

import { GlobeController } from "../engine/globe-controller";
import { DEFAULT_PALETTE } from "../engine/types";
import { parseGlobeData, resolveConfig } from "../schema";

import hotspots from "@/data/globe/hotspots.json";
import offices from "@/data/globe/offices.json";
import routes from "@/data/globe/routes.json";
import satellites from "@/data/globe/satellites.json";


/** TEMPORARY dev harness for the engine; delete once EncomGlobe is wired. */
export default function Sandbox() {
  const ref = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GlobeController | null>(null);
  const [running, setRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ctl: GlobeController | null = null;
    let cancelled = false;
    const { data } = parseGlobeData({
      pins: [...offices.pins, ...hotspots.pins],
      markers: routes.markers,
      satellites: satellites.satellites,
      constellations: satellites.constellations,
    });
    const atmosphere = new URLSearchParams(location.search).has("atmo");
    GlobeController.create(el, {
      config: resolveConfig({ viewAngle: 0.1, layers: { atmosphere } }),
      palette: DEFAULT_PALETTE,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      data,
    })
      .then((c) => {
        if (cancelled) return c.dispose();
        ctl = c;
        engineRef.current = c;
        (window as unknown as { __globe: GlobeController }).__globe = c;
        c.on("select", (item) => console.log("select", item?.kind, item?.item.id));
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
      ctl?.dispose();
      engineRef.current = null;
    };
  }, []);

  const toggle = () => {
    const e = engineRef.current;
    if (!e) return;
    if (e.engine.isRunning) e.pause();
    else e.resume();
    setRunning(e.engine.isRunning);
  };

  return (
    <div style={{ padding: 16 }}>
      <div ref={ref} style={{ width: 600, height: 600, maxWidth: "100%" }} />
      {error && <p role="alert">{error}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => engineRef.current?.flyTo(51.5, -0.12)}>London</button>
        <button onClick={() => engineRef.current?.flyTo(35.68, 139.69)}>Tokyo</button>
        <button onClick={toggle}>{running ? "Pause" : "Resume"}</button>
      </div>
    </div>
  );
}
