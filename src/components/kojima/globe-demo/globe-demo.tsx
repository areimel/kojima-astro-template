import { DataReference } from "./data-reference";
import { HeroSection } from "./hero-section";
import { Playground } from "./playground";
import { PresetGallery } from "./preset-gallery";

import { meta } from "@/components/kojima/panel-heading";
import { Badge } from "@/components/ui/badge";

export function GlobeDemo() {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-8 sm:pt-16">
        <header className="border-t border-border pb-12">
          <div className="flex flex-wrap justify-between gap-3 py-5">
            <p className={meta}>Kojima / Globe</p>
            <p className={meta}>04 sections · JSON driven</p>
          </div>
          <div className="grid gap-6 pt-8 md:grid-cols-[1.4fr_1fr] md:items-end">
            <h1 className="max-w-3xl text-5xl leading-[0.98] font-medium tracking-[-0.055em] sm:text-7xl lg:text-8xl">One globe.<br /><span className="text-muted-foreground">Any dataset.</span></h1>
            <div className="max-w-md space-y-5 md:pb-1">
              <p className="text-base leading-relaxed text-muted-foreground">A themeable three.js globe configured entirely by JSON: hero, preset gallery, live playground and data reference.</p>
              <div className="flex flex-wrap gap-2"><Badge variant="outline">three.js</Badge><Badge variant="secondary">Theme aware</Badge><Badge variant="outline">Reduced motion safe</Badge></div>
            </div>
          </div>
        </header>
        <div className="space-y-12">
          <HeroSection />
          <PresetGallery />
          <Playground />
          <DataReference />
        </div>
      </div>
    </div>
  );
}
