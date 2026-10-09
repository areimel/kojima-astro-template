const stages = [
  ["01", "Observe", "Signals in context"],
  ["02", "Correlate", "Dependencies & exposure"],
  ["03", "Assess", "Evidence & uncertainty"],
  ["04", "Brief", "Decisions & next steps"],
];

export function AboutHero() {
  return (
    <section className="container max-w-5xl">
      <p className="text-muted-foreground mb-6 font-mono text-xs tracking-widest uppercase">
        Kojima / Mission
      </p>
      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-20">
        <div>
          <h1 className="text-4xl tracking-tight sm:text-5xl lg:text-6xl">
            Context for consequential decisions.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-xl text-xl leading-relaxed">
            Kojima explores a shared intelligence workspace for corporate
            intelligence and geopolitical risk teams. Connect emerging signals
            to the operations, suppliers, and decisions they could affect.
          </p>
          <p className="text-muted-foreground mt-6 max-w-xl leading-relaxed">
            Our product concept brings situational awareness, signal
            correlation, and concise briefings into one working picture. This
            site is an interface demonstration using synthetic scenarios, not a
            live intelligence service.
          </p>
        </div>
        <dl className="border-border border-t">
          {stages.map(([number, name, purpose]) => (
            <div
              key={name}
              className="border-border grid grid-cols-[2rem_1fr] gap-x-3 gap-y-1 border-b py-5"
            >
              <span
                aria-hidden="true"
                className="text-muted-foreground row-span-2 font-mono text-xs"
              >
                {number}
              </span>
              <dt className="text-lg">{name}</dt>
              <dd className="text-muted-foreground font-mono text-xs">
                {purpose}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
