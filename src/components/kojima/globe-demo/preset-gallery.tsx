import type { ReactNode } from "react";

import { configs, DATASETS, FEED_URL, minimal, orbital } from "./globe-demo-data";

import { EncomGlobe } from "@/components/encom-globe";
import { meta, PanelHeading } from "@/components/kojima/panel-heading";

const cells: { id: string; title: string; props: string; globe: ReactNode }[] = [
  {
    id: "kojima",
    title: "Kojima, minimal",
    props: 'palette="kojima" config=minimal data=offices',
    globe: <EncomGlobe palette="kojima" config={minimal} data={DATASETS.offices} aria-label="Minimal globe with office pins" />,
  },
  {
    id: "boardroom",
    title: "Encom boardroom",
    props: 'palette="encom" preset="boardroom" routes satellites',
    globe: (
      <EncomGlobe
        palette="encom" preset="boardroom" data={{ ...DATASETS.routes, ...DATASETS.satellites }}
        aria-label="Original Encom look with routes and satellites"
      />
    ),
  },
  {
    id: "mono",
    title: "Mono hotspots",
    props: 'palette="mono" data=hotspots',
    globe: <EncomGlobe palette="mono" data={DATASETS.hotspots} aria-label="Monochrome globe with hotspot pins" />,
  },
  {
    id: "orbital",
    title: "Orbital",
    props: "config=orbital atmosphere data=satellites",
    globe: <EncomGlobe config={orbital} atmosphere data={DATASETS.satellites} aria-label="Orbital globe with satellites and atmosphere" />,
  },
  {
    id: "feed",
    title: "Signal feed",
    props: `dataUrl="${FEED_URL}" (300 pins)`,
    globe: <EncomGlobe dataUrl={FEED_URL} config={configs.minimal} aria-label="Globe with 300 pins loaded from a remote feed" />,
  },
];

export function PresetGallery() {
  return (
    <section aria-label="Preset gallery" className="overflow-hidden border border-border">
      <PanelHeading number="02" title="Preset gallery" detail="Five concurrent instances" />
      <ul className="-mr-px -mb-px grid md:grid-cols-2 lg:grid-cols-3">
        {cells.map((c) => (
          <li key={c.id} className="min-w-0 border-r border-b border-border bg-background">
            {c.globe}
            <div className="space-y-1 border-t border-border p-4">
              <h3 className="text-sm font-medium">{c.title}</h3>
              <p className={`${meta} break-words normal-case`}>{c.props}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
