import { useEffect, useRef, useState } from "react";

import { GlobeEngine } from "../engine/globe-engine";
import { createAtmosphereLayer } from "../engine/layers/atmosphere";
import { DEFAULT_PALETTE } from "../engine/types";
import { resolveConfig } from "../schema";

/** TEMPORARY dev harness for the engine; delete once EncomGlobe is wired. */
export default function Sandbox() {
  const ref = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GlobeEngine | null>(null);
  const [running, setRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const config = resolveConfig({ layers: { atmosphere: true } });
      const engine = GlobeEngine.create(el, {
        config,
        palette: DEFAULT_PALETTE,
        reducedMotion: false,
      });
      engine.addLayer(createAtmosphereLayer(engine.context));
      engineRef.current = engine;
      (window as unknown as { __engine: GlobeEngine }).__engine = engine;
      return () => {
        engine.dispose();
        engineRef.current = null;
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const toggle = () => {
    const e = engineRef.current;
    if (!e) return;
    if (e.isRunning) e.pause();
    else e.resume();
    setRunning(e.isRunning);
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
