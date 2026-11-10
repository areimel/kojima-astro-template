import { useState } from 'react';

import { LAB_FAMILIES, type LabPreset } from './animation-lab-data';

import { PanelHeading } from '@/components/kojima/panel-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { anim } from '@/lib/animations/attributes';
import { registry } from '@/lib/animations/registry';
import type { AnimationTrigger } from '@/lib/animations/types';


function mobileLabel(name: LabPreset['name']) {
  const fallback = registry[name].mobileFallback;
  if (!fallback) return 'Same animation on mobile';
  if (fallback === 'none') return 'Static on mobile';
  return `Mobile: ${fallback}`;
}

function Sample({ preset, replayed }: { preset: LabPreset; replayed: boolean }) {
  const { name, sampleKind } = preset;
  const defaultTrigger = registry[name].defaultTrigger;
  const trigger: AnimationTrigger = defaultTrigger === 'hover' || defaultTrigger === 'loop' ? defaultTrigger : replayed ? 'load' : 'scroll';
  const props = anim({ animation: name, trigger, ...(sampleKind === 'list' && { children: 'li' }) });

  if (trigger === 'hover') {
    return <Button variant="outline" {...props}>Hover or focus</Button>;
  }
  switch (sampleKind) {
    case 'list':
      return (
        <ul className="space-y-1 font-mono text-xs" {...props}>
          {['Link established', 'Keys verified', 'Feed online'].map((item) => <li key={item}>&gt; {item}</li>)}
        </ul>
      );
    case 'number':
      return <span className="font-mono text-3xl tabular-nums" {...props}>1,284</span>;
    case 'dot':
      return <span className="inline-block size-3 rounded-full bg-primary" aria-hidden="true" {...props} />;
    case 'block':
      return <div className="h-12 w-full border border-border bg-muted px-3 py-3 font-mono text-foreground text-xs" {...props}>SECTOR 7 / CLEARED</div>;
    default:
      return <p className="text-lg font-medium tracking-tight" {...props}>Agent Kojima online</p>;
  }
}

function PresetCard({ preset }: { preset: LabPreset }) {
  const [run, setRun] = useState(0);
  const looping = ['loop', 'hover'].includes(registry[preset.name].defaultTrigger);
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardTitle><h4 className="font-mono text-sm">{preset.name}</h4></CardTitle>
        <CardDescription>{preset.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-20 items-center border-y border-border bg-muted/20 py-4">
        <div key={run} className="min-w-0 max-w-full break-words">
          <Sample preset={preset} replayed={run > 0} />
        </div>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Desktop: {preset.name}</Badge>
          <Badge variant="secondary">{mobileLabel(preset.name)}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setRun((n) => n + 1)} aria-label={`Replay ${preset.name}`}>
          Replay{looping ? ' (restart)' : ''}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function AnimationLab() {
  return (
    <section className="mt-8 border border-border" aria-label="Animation lab">
      <PanelHeading number="04" title="Animation lab" detail="Anime.js / data attributes" />
      <div className="space-y-8 p-5 sm:p-7">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every preset, live. Elements opt in with <code className="font-mono text-foreground">data-animation</code>, and can override per
          breakpoint with <code className="font-mono text-foreground">data-desktop-animation</code> / <code className="font-mono text-foreground">data-mobile-animation</code>.
          Samples play as they scroll into view; Replay remounts one immediately.
        </p>
        {LAB_FAMILIES.map(({ family, presets }) => (
          <div key={family} className="space-y-4">
            <h3 className="text-2xl tracking-tight">{family}</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {presets.map((preset) => <PresetCard key={preset.name} preset={preset} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
