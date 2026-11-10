import { allData, hero } from "./globe-demo-data";

import { EncomGlobe } from "@/components/encom-globe";
import { meta, PanelHeading } from "@/components/kojima/panel-heading";

export function HeroSection() {
  return (
    <section aria-label="Hero globe section" className="border border-border">
      <PanelHeading number="01" title="Hero globe" detail="Offices / hotspots / routes / satellites" />
      <div className="grid lg:grid-cols-[1fr_1.1fr]">
        <div className="min-w-0 space-y-5 border-b border-border p-5 sm:p-7 lg:border-r lg:border-b-0">
          <p className={meta}>EncomGlobe / v1</p>
          <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
            EncomGlobe renders a hex-tiled Earth, pins, arcs and orbiting satellites from plain JSON. It
            follows the site theme live, respects reduced motion, and runs many instances per page. A modern
            rebuild of Rob Scanlon&apos;s encom-globe (MIT), the Tron: Legacy boardroom tribute.
          </p>
          <ul className="grid gap-2 text-sm">
            {[
              ["Pins", "Offices and hotspots with labels"],
              ["Markers", "Routes drawn as arcs between cities"],
              ["Satellites", "Orbiting pulses and constellations"],
            ].map(([k, v]) => (
              <li key={k} className="flex gap-4 border-t border-border pt-2">
                <span className="w-24 shrink-0 font-mono text-primary">{k}</span>
                <span className="text-muted-foreground">{v}</span>
              </li>
            ))}
          </ul>
          <p className={meta}>Drag to rotate / click an item to select</p>
        </div>
        <EncomGlobe
          data={allData}
          config={hero}
          title="Global operations"
          subtitle="Live theme"
          legend
          className="border-0"
          aria-label="Hero globe showing offices, hotspots, routes and satellites"
        />
      </div>
    </section>
  );
}
