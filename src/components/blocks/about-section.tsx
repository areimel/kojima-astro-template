import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const AboutSection = () => (
  <section className="container mt-16 grid max-w-5xl gap-10 lg:mt-24 lg:grid-cols-2 lg:items-center">
    <figure className="border-border bg-background border p-6 md:p-8">
      <figcaption className="text-muted-foreground mb-8 font-mono text-xs tracking-widest uppercase">
        Fig. 01 / Synthetic dependency model
      </figcaption>
      <div className="grid grid-cols-2 gap-3">
        {["Port notice", "Supplier update"].map((label) => (
          <div
            key={label}
            className="border-border bg-muted/30 border p-4 text-center font-mono text-xs"
          >
            {label}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="bg-border mx-auto h-8 w-px" />
      <div className="border-border border p-5 text-center font-mono text-sm">
        Shared logistics corridor
      </div>
      <div aria-hidden="true" className="bg-border mx-auto h-8 w-px" />
      <div className="border-border bg-muted/30 border p-5 text-center font-mono text-sm">
        Delivery exposure / Analyst review
      </div>
      <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
        Illustrative relationships guide a question for review. A connection
        alone does not establish cause or confirm disruption.
      </p>
    </figure>
    <TextSection
      title="From signals to a working picture."
      paragraphs={[
        "A port advisory, a supplier update, and a regional development may arrive separately. The Kojima concept places them alongside the business dependencies that make them relevant.",
        "The intended workflow keeps observations, assessments, and open questions visible. Teams can explore how a briefing might explain what changed, where exposure sits, and what evidence would justify a response.",
        "All examples here are synthetic. Data connections, automated analysis, and operational workflows would require a separate production implementation.",
      ]}
      ctaButton={{ href: "/blog", text: "Explore the field notes" }}
    />
  </section>
);

interface ImageSectionProps {
  images: { src: string; alt: string }[];
  className?: string;
}

export function ImageSection({ images, className }: ImageSectionProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {images.map((image, index) => (
        <div
          key={index}
          className="border-border relative aspect-[4/3] overflow-hidden border"
        >
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            className="size-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

interface TextSectionProps {
  title?: string;
  paragraphs: string[];
  ctaButton?: { href: string; text: string };
}

export function TextSection({
  title,
  paragraphs,
  ctaButton,
}: TextSectionProps) {
  return (
    <div className="flex-1 space-y-6">
      {title && (
        <h2 className="text-foreground text-3xl tracking-tight md:text-4xl">
          {title}
        </h2>
      )}
      <div className="text-muted-foreground max-w-xl space-y-6 leading-relaxed">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {ctaButton && (
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-none font-mono text-xs"
        >
          <a href={ctaButton.href}>{ctaButton.text}</a>
        </Button>
      )}
    </div>
  );
}
