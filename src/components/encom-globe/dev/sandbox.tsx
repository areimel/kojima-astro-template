import { useRef } from "react";

import { EncomGlobe } from "../EncomGlobe";
import type { EncomGlobeHandle } from "../EncomGlobe";

import hotspots from "@/data/globe/hotspots.json";
import offices from "@/data/globe/offices.json";
import routes from "@/data/globe/routes.json";
import satellites from "@/data/globe/satellites.json";

const data = {
  pins: [...offices.pins, ...hotspots.pins],
  markers: routes.markers,
  satellites: satellites.satellites,
  constellations: satellites.constellations,
};

/** TEMPORARY dev harness; delete once EncomGlobe is wired into a page. */
export default function Sandbox() {
  const a = useRef<EncomGlobeHandle>(null);
  const toggleDark = () => document.documentElement.classList.toggle("dark");
  return (
    <div className="grid gap-4 p-4 md:grid-cols-2">
      <EncomGlobe ref={a} data={data} title="Kojima" subtitle="Live theme" legend preset="boardroom" />
      <EncomGlobe data={data} palette="encom" title="Encom" subtitle="Original" legend atmosphere />
      <div className="flex gap-2">
        <button onClick={() => a.current?.flyTo(51.5, -0.12)}>London</button>
        <button onClick={() => a.current?.flyTo(35.68, 139.69)}>Tokyo</button>
        <button onClick={toggleDark}>Toggle dark</button>
      </div>
    </div>
  );
}
