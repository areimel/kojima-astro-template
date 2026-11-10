import { DEFAULT_CONFIG } from "@/components/encom-globe/schema";
import { meta, PanelHeading } from "@/components/kojima/panel-heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Row = [name: string, type: string, note: string];
const json = (v: unknown) => JSON.stringify(v, null, 2);

const SECTIONS: { id: string; label: string; code: string; rows: Row[] }[] = [
  {
    id: "config", label: "Config", code: json(DEFAULT_CONFIG),
    rows: [
      ["dayLength", "number", "ms per camera orbit"],
      ["scale / viewAngle", "number", "zoom and camera elevation (rad)"],
      ["autoRotate / draggable / intro", "boolean", "motion behaviour"],
      ["introLines*", "number", "count, duration and altitude of intro arcs"],
      ["maxPins / maxMarkers", "number", "capacity limits"],
      ["layers", "object", "boolean toggle per layer"],
    ],
  },
  {
    id: "pins", label: "Pins",
    code: json({ pins: [{ id: "office-london", lat: 51.51, lng: -0.13, label: "LONDON", color: "#ff4d00", altitude: 1.2, meta: { region: "EMEA" } }] }),
    rows: [
      ["lat / lng", "number", "required, degrees"],
      ["label", "string", "optional text above the pin"],
      ["color", "string", "any CSS colour; default from palette"],
      ["altitude", "number", "1 to 2, multiple of radius"],
      ["id / meta", "string / object", "stable id and free-form data"],
    ],
  },
  {
    id: "markers", label: "Markers",
    code: json({ markers: [{ id: "tokyo", lat: 35.68, lng: 139.69, label: "TOKYO" }, { id: "london", lat: 51.51, lng: -0.13, label: "LONDON", connectTo: "previous" }] }),
    rows: [
      ["lat / lng", "number", "required, degrees"],
      ["label", "string", "marker caption"],
      ["connectTo", "string", 'marker id or "previous" to draw an arc'],
      ["color / meta", "string / object", "optional"],
    ],
  },
  {
    id: "satellites", label: "Satellites",
    code: json({
      satellites: [{ id: "kj-sat-01", label: "KJ-SAT 01", lat: 52.1, lng: -38.4, altitude: 1.34, numWaves: 4 }],
      constellations: [{ id: "ring", numWaves: 3, satellites: [{ lat: 0, lng: 0, altitude: 1.4 }, { lat: 20, lng: 60 }] }],
    }),
    rows: [
      ["lat / lng / altitude", "number", "altitude 1 to 3, default 1.3"],
      ["numWaves", "number", "1 to 16 pulse rings"],
      ["waveColor / coreColor / shieldColor", "string", "per-satellite overrides"],
      ["size", "number", "up to 4"],
      ["constellations[].satellites", "array", "group sharing one style"],
    ],
  },
];

const ASTRO = `---
import { EncomGlobe } from "@/components/encom-globe";
import offices from "@/data/globe/offices.json";
---
<EncomGlobe client:load data={offices} />`;
const TSX = `import offices from "@/data/globe/offices.json";
import hero from "@/data/globe/configs/hero.json";

<EncomGlobe data={offices} config={hero} palette="kojima" legend />`;

const Code = ({ children, label }: { children: string; label: string }) => (
  <pre tabIndex={0} aria-label={label} className="max-h-80 overflow-auto border border-border bg-muted/40 p-3 font-mono text-xs">{children}</pre>
);

export function DataReference() {
  return (
    <section aria-label="Data reference" className="border border-border">
      <PanelHeading number="04" title="Data reference" detail="JSON format" />
      <div className="space-y-8 p-5 sm:p-7">
        <Tabs defaultValue="config" className="gap-5">
          <TabsList aria-label="Data format" className="flex-wrap">
            {SECTIONS.map((t) => <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>)}
          </TabsList>
          {SECTIONS.map((t) => (
            <TabsContent key={t.id} value={t.id} className="grid min-w-0 gap-6 lg:grid-cols-2">
              <Code label={`${t.label} example`}>{t.code}</Code>
              <div className="min-w-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">{t.label} properties</caption>
                  <thead><tr className={`${meta} border-b border-border`}><th scope="col" className="py-2 pr-3 font-normal">Prop</th><th scope="col" className="py-2 pr-3 font-normal">Type</th><th scope="col" className="py-2 font-normal">Notes</th></tr></thead>
                  <tbody>
                    {t.rows.map(([n, ty, note]) => (
                      <tr key={n} className="border-b border-border align-top">
                        <td className="py-2 pr-3 font-mono text-xs break-words">{n}</td>
                        <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{ty}</td>
                        <td className="py-2 text-muted-foreground">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0 space-y-2"><h3 className={meta}>Astro</h3><Code label="Astro usage">{ASTRO}</Code></div>
          <div className="min-w-0 space-y-2"><h3 className={meta}>React</h3><Code label="React usage">{TSX}</Code></div>
        </div>
      </div>
    </section>
  );
}
