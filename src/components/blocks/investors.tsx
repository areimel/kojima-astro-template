const layers = [
  {
    number: "01",
    title: "Signal record",
    cells: ["Source", "Observed at", "Reported at"],
    detail:
      "A proposed record separates provenance and timing so analysts can inspect what an observation actually supports.",
  },
  {
    number: "02",
    title: "Exposure model",
    cells: ["Supplier", "Route", "Business dependency"],
    detail:
      "Illustrative links connect an event to a supplier or corridor. Each link is a hypothesis to inspect, not proof of an impact.",
  },
  {
    number: "03",
    title: "Decision brief",
    cells: ["Assessment", "Open questions", "Next review"],
    detail:
      "A sample brief makes uncertainty and follow-up explicit, keeping the reasoning available alongside the recommendation.",
  },
];

export function Investors() {
  return (
    <section className="container max-w-5xl py-12 md:py-16">
      <p className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
        System construction / Concept model
      </p>
      <h2 className="text-3xl tracking-tight md:text-4xl">
        Make the reasoning inspectable.
      </h2>
      <div className="border-border mt-10 grid border-t border-l md:grid-cols-3">
        {layers.map((layer) => (
          <article
            key={layer.number}
            className="border-border bg-background border-r border-b p-6"
          >
            <div
              aria-hidden="true"
              className="border-border bg-muted/30 mb-8 flex h-36 items-center border p-3"
            >
              <div className="w-full space-y-2">
                {layer.cells.map((cell, index) => (
                  <div
                    key={cell}
                    className="border-border bg-background border px-2 py-1 font-mono text-[10px]"
                    style={{ marginLeft: index * 10 }}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-muted-foreground font-mono text-xs">
              {layer.number}
            </p>
            <h3 className="mt-3 text-xl">{layer.title}</h3>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {layer.detail}
            </p>
          </article>
        ))}
      </div>
      <p className="text-muted-foreground mt-6 max-w-3xl text-sm leading-relaxed">
        This demo is built with Astro, React, Tailwind CSS, and local shadcn/ui
        components. The diagrams describe a proposed information structure; they
        do not represent a connected analysis engine.
      </p>
    </section>
  );
}
