import { useId, useState } from "react";

import { CITIES } from "./globe-demo-data";
import { LAYER_KEYS, PIN_COLORS } from "./use-playground-state";
import type { usePlaygroundState } from "./use-playground-state";

import { meta } from "@/components/kojima/panel-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

type State = ReturnType<typeof usePlaygroundState>;
const lbl = "text-sm font-medium";

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2">
      <label htmlFor={id} className="font-mono text-xs">{label}</label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className="space-y-3">
      <div className="flex justify-between"><span id={id} className={lbl}>{label}</span><span className={meta}>{value}</span></div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} aria-labelledby={id} />
    </div>
  );
}

function SelectRow<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={lbl}>{label}</label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function AddPinForm({ s }: { s: State }) {
  const [label, setLabel] = useState("NEW PIN");
  const [lat, setLat] = useState("48.86");
  const [lng, setLng] = useState("2.35");
  const [color, setColor] = useState<keyof typeof PIN_COLORS>("primary");
  const ids = { label: useId(), lat: useId(), lng: useId() };
  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        s.addPin({ label, lat: Number(lat), lng: Number(lng), color: PIN_COLORS[color] });
      }}
    >
      <div className="col-span-2 space-y-2"><label htmlFor={ids.label} className={lbl}>Pin label</label><Input id={ids.label} value={label} onChange={(e) => setLabel(e.target.value)} /></div>
      <div className="space-y-2"><label htmlFor={ids.lat} className={lbl}>Latitude</label><Input id={ids.lat} type="number" step="any" min={-90} max={90} value={lat} onChange={(e) => setLat(e.target.value)} /></div>
      <div className="space-y-2"><label htmlFor={ids.lng} className={lbl}>Longitude</label><Input id={ids.lng} type="number" step="any" min={-180} max={180} value={lng} onChange={(e) => setLng(e.target.value)} /></div>
      <div className="col-span-2"><SelectRow label="Pin colour" value={color} options={Object.keys(PIN_COLORS) as (keyof typeof PIN_COLORS)[]} onChange={setColor} /></div>
      <div className="col-span-2 flex flex-wrap gap-2">
        <Button type="submit">Add pin</Button>
        <Button type="button" variant="outline" disabled={!s.added.length} onClick={s.clearAdded}>Remove added ({s.added.length})</Button>
      </div>
    </form>
  );
}

export function PlaygroundControls({ s }: { s: State }) {
  return (
    <div className="space-y-7">
      <div>
        <h3 className={`${meta} mb-2`}>Layers</h3>
        <SwitchRow label="autoRotate" checked={s.autoRotate} onChange={s.setAutoRotate} />
        {LAYER_KEYS.map((k) => <SwitchRow key={k} label={k} checked={s.layers[k]} onChange={(v) => s.setLayer(k, v)} />)}
      </div>
      <SliderRow label="dayLength (ms)" value={s.dayLength} min={8000} max={60000} step={1000} onChange={s.setDayLength} />
      <SliderRow label="viewAngle (rad)" value={s.viewAngle} min={-0.6} max={0.6} step={0.05} onChange={(v) => s.setViewAngle(Math.round(v * 100) / 100)} />
      <SliderRow label="scale" value={s.scale} min={0.6} max={1.6} step={0.05} onChange={(v) => s.setScale(Math.round(v * 100) / 100)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectRow label="Palette" value={s.palette} options={["kojima", "encom", "mono"] as const} onChange={s.setPalette} />
        <SelectRow label="Dataset" value={s.dataset} options={["offices", "hotspots", "routes", "satellites", "all"] as const} onChange={s.setDataset} />
      </div>
      <div>
        <h3 className={`${meta} mb-3`}>Fly to</h3>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => <Button key={c.label} type="button" variant="outline" size="sm" onClick={() => s.ref.current?.flyTo(c.lat, c.lng)}>{c.label}</Button>)}
        </div>
      </div>
      <div>
        <h3 className={`${meta} mb-3`}>Add pin</h3>
        <AddPinForm s={s} />
      </div>
    </div>
  );
}
