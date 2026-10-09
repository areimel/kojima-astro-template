import { useEffect, useState } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const defaults = { title: 'Regional briefing', density: 'comfortable', annotations: true, scale: 48 };
const meta = 'font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground';

function PanelHeading({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border px-5 py-4 sm:px-7">
      <h2 className="text-sm font-medium"><span className="mr-4 font-mono text-primary">{number}</span>{title}</h2>
      <span className={meta}>{detail}</span>
    </div>
  );
}

export function ComponentShowcase() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [settings, setSettings] = useState(defaults);
  const [snapshot, setSnapshot] = useState(defaults);
  const [status, setStatus] = useState('Ready. Adjust the sample briefing preview.');
  const [open, setOpen] = useState(false);
  const dirty = JSON.stringify(settings) !== JSON.stringify(snapshot);
  const title = settings.title.trim() || 'Untitled briefing';
  const update = <K extends keyof typeof defaults>(key: K, value: (typeof defaults)[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-8 sm:pt-16">
        <header className="border-t border-border pb-12">
          <div className="flex flex-wrap justify-between gap-3 py-5">
            <p className={meta}>Kojima / Component index</p>
            <p className={meta}>11 primitives · 01 shared language</p>
          </div>
          <div className="grid gap-6 pt-8 md:grid-cols-[1.4fr_1fr] md:items-end">
            <h1 className="max-w-3xl text-5xl leading-[0.98] font-medium tracking-[-0.055em] sm:text-7xl lg:text-8xl">One visual language.<br /><span className="text-muted-foreground">Every instrument.</span></h1>
            <div className="max-w-md space-y-5 md:pb-1">
              <p className="text-base leading-relaxed text-muted-foreground">Familiar shadcn primitives. Kojima tokens. A shared visual language for briefings, regions, and sources in a private intelligence workspace.</p>
              <div className="flex flex-wrap gap-2"><Badge variant="outline">shadcn/ui</Badge><Badge variant="secondary">Semantic tokens</Badge><Badge variant="outline">Local demo</Badge></div>
            </div>
          </div>
        </header>

        <div className="grid border border-border lg:grid-cols-[0.85fr_1.15fr]">
          <section className="min-w-0 border-b border-border lg:border-r lg:border-b-0" aria-label="Preview controls">
            <PanelHeading number="01" title="Controls" detail="Shape the briefing" />
            <fieldset disabled={!ready} className="space-y-7 p-5 sm:p-7">
              <div className="space-y-2">
                <label htmlFor="specimen-title" className="text-sm font-medium">Briefing title</label>
                <Input id="specimen-title" value={settings.title} maxLength={60} onChange={(event) => update('title', event.target.value)} aria-describedby="title-hint" />
                <p id="title-hint" className="text-xs text-muted-foreground">Your working title, up to 60 characters.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="specimen-density" className="text-sm font-medium">Layout density</label>
                <Select value={settings.density} onValueChange={(value) => update('density', value)}>
                  <SelectTrigger id="specimen-density" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="comfortable">Comfortable</SelectItem><SelectItem value="compact">Compact</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4 border-y border-border py-5">
                <div><label htmlFor="specimen-annotations" className="text-sm font-medium">Show source notes</label><p id="annotations-hint" className="mt-1 text-xs text-muted-foreground">Include illustrative region and source context.</p></div>
                <Switch id="specimen-annotations" checked={settings.annotations} onCheckedChange={(value) => update('annotations', value)} aria-describedby="annotations-hint" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between"><span id="scale-label" className="text-sm font-medium">Mark scale</span><span className={meta}>{settings.scale}%</span></div>
                <Slider value={[settings.scale]} min={24} max={80} step={4} onValueChange={([value]) => update('scale', value)} aria-labelledby="scale-label" />
                <p className="text-xs text-muted-foreground">Resize the graphic inside the preview.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild><Button>Review settings <span aria-hidden="true">↗</span></Button></DialogTrigger>
                  <DialogContent className="text-foreground">
                    <DialogHeader><DialogTitle>Apply this briefing layout?</DialogTitle><DialogDescription>Keep a snapshot for comparison in this session. Reloading the page resets it.</DialogDescription></DialogHeader>
                    <dl className="divide-y divide-border border-y border-border text-sm">
                      {Object.entries({ Title: title, Density: settings.density, 'Source notes': settings.annotations ? 'Visible' : 'Hidden', 'Mark scale': `${settings.scale}%` }).map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[6rem_1fr] gap-4 py-3"><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{value}</dd></div>
                      ))}
                    </dl>
                    <DialogFooter><DialogClose asChild><Button variant="outline">Keep editing</Button></DialogClose><Button onClick={() => { setSnapshot({ ...settings }); setStatus(`Applied “${title}” to the local snapshot.`); setOpen(false); }}>Apply locally</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={() => { setSettings({ ...defaults }); setStatus('Preview controls reset to defaults.'); }}>Reset controls</Button>
                <Button variant="ghost" disabled={!dirty} onClick={() => { setSettings({ ...snapshot }); setStatus('Restored the last applied snapshot.'); }}>Restore snapshot</Button>
              </div>
              <p role="status" aria-live="polite" className="min-h-10 text-xs leading-relaxed text-muted-foreground">{status}</p>
            </fieldset>
          </section>

          <section className="min-w-0 bg-muted/20" aria-label="Sample briefing preview">
            <PanelHeading number="02" title="Briefing preview" detail="Card / tabs / badge" />
            <Tabs defaultValue="preview" className="gap-5 p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TabsList aria-label="Briefing preview view"><TabsTrigger value="preview">Preview</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>
                <Badge variant={dirty ? 'secondary' : 'outline'}>{dirty ? 'Modified' : 'In sync'}</Badge>
              </div>
              <TabsContent value="preview">
                <Card className={`overflow-hidden rounded-none shadow-none ${settings.density === 'compact' ? 'gap-3 py-4' : 'gap-6 py-6'}`}>
                  <CardHeader className={settings.density === 'compact' ? 'px-4' : 'px-6'}>
                    <div className="mb-3 flex items-center justify-between"><span className={meta}>K / 001</span><Badge>Sample briefing</Badge></div>
                    <CardTitle><h3 className="text-2xl tracking-tight break-words">{title}</h3></CardTitle>
                    <CardDescription>Situation room layout study. Illustrative content; no live data.</CardDescription>
                  </CardHeader>
                  <CardContent className={settings.density === 'compact' ? 'px-4' : 'px-6'}>
                    <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden border border-border bg-muted" role="img" aria-label={`Geometric specimen mark at ${settings.scale} percent scale`}>
                      <div className="absolute inset-x-0 top-1/2 border-t border-border" /><div className="absolute inset-y-0 left-1/2 border-l border-border" />
                      <div className="relative aspect-square border-[12px] border-primary sm:border-[18px]" style={{ width: `${settings.scale * 0.65}%`, transform: 'rotate(-12deg)' }}><div className="absolute inset-1/4 bg-primary" /></div>
                      <span className={`absolute bottom-3 left-3 ${meta}`}>Fig. 01 / Structure</span>
                      <span className={`absolute top-3 right-3 ${meta}`} aria-hidden="true">+</span>
                    </div>
                    {settings.annotations && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Region: North Atlantic (example). Sources: sample analyst notes and public reports. This layout demonstrates briefing context; no sources are connected.</p>}
                  </CardContent>
                  <CardFooter className="justify-between gap-3 border-t border-border"><span className={meta}>{settings.density}</span><Badge variant="outline">{settings.scale}% scale</Badge></CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="settings" className="border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-medium">Current settings</h3>
                <pre className="overflow-x-auto font-mono text-xs leading-7 text-muted-foreground">{JSON.stringify(settings, null, 2)}</pre>
                <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">Current local values from the controls. Apply a snapshot to mark this configuration as in sync.</p>
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <section className="mt-8 border border-border" aria-label="Component notes">
          <PanelHeading number="03" title="Under the surface" detail="Accordion / reference" />
          <div className="grid md:grid-cols-[0.85fr_1.15fr]">
            <div className="border-b border-border p-5 sm:p-7 md:border-r md:border-b-0"><h3 className="text-2xl tracking-tight">Same primitives.<br />A consistent expression.</h3><p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">Explore the controls with a mouse or keyboard. Focus, selection, and open states belong to the system too.</p></div>
            <Accordion type="single" collapsible defaultValue="tokens" className="px-5 sm:px-7">
              <AccordionItem value="tokens"><AccordionTrigger>01 / What gives these components their character?</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">Semantic colors connect each existing primitive to Kojima: background and card for surfaces, border for rules, primary for emphasis, and muted foreground for supporting text.</AccordionContent></AccordionItem>
              <AccordionItem value="behavior"><AccordionTrigger>02 / How do I navigate the demo?</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">Tab moves between controls. Arrow keys adjust the slider and move through tabs or select options. Enter or Space activates buttons and switches. Escape dismisses the dialog and returns focus to its trigger.</AccordionContent></AccordionItem>
              <AccordionItem value="local"><AccordionTrigger>03 / Where are my settings stored?</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">In this page’s memory only. Review settings opens a summary; Apply locally records a snapshot. Restore snapshot returns to it, while Reset controls returns to the starting values. Nothing is sent to a server.</AccordionContent></AccordionItem>
            </Accordion>
          </div>
        </section>
        <div className={`mt-6 flex flex-wrap justify-between gap-3 ${meta}`}><span>Kojima / Primitive compatibility</span><span>End of index — 003</span></div>
      </div>
    </div>
  );
}
