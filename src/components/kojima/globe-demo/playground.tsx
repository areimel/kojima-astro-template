import { useState } from "react";

import { PlaygroundControls } from "./playground-controls";
import { usePlaygroundState } from "./use-playground-state";

import { EncomGlobe } from "@/components/encom-globe";
import { meta, PanelHeading } from "@/components/kojima/panel-heading";
import { Button } from "@/components/ui/button";

export function Playground() {
  const s = usePlaygroundState();
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(s.config, null, 2);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-label="Playground" className="border border-border">
      <PanelHeading number="03" title="Playground" detail="Live config / events" />
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0 border-b border-border lg:border-r lg:border-b-0">
          <EncomGlobe
            ref={s.ref} data={s.data} config={s.config} palette={s.palette}
            title="Playground" subtitle={`${s.palette} / ${s.dataset}`} legend
            onSelect={s.onSelect} onHover={s.onHover}
            className="border-0"
            aria-label="Playground globe"
          />
          <div className="space-y-4 border-t border-border p-5 sm:p-7">
            <h3 className={meta}>Event log</h3>
            <div role="log" aria-live="polite" aria-label="Globe events" className="min-h-32 space-y-1 font-mono text-xs">
              {s.log.length === 0 && <p className="text-muted-foreground">Hover or click an item on the globe.</p>}
              {s.log.map((e) => <p key={e.id} className="break-words">{e.text}</p>)}
            </div>
          </div>
        </div>
        <div className="min-w-0 space-y-8 p-5 sm:p-7">
          <PlaygroundControls s={s} />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className={meta}>Config JSON</h3>
              <Button type="button" variant="outline" size="sm" onClick={copy}>{copied ? "Copied" : "Copy JSON"}</Button>
            </div>
            <pre tabIndex={0} aria-label="Current config as JSON" className="max-h-64 overflow-auto border border-border bg-muted/40 p-3 font-mono text-xs">{json}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}
