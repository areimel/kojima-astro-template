import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const categories = [
  {
    title: "01 / Product concept",
    questions: [
      {
        question: "Who is Kojima designed for?",
        answer:
          "The concept is for corporate intelligence and geopolitical risk teams exploring decision support and supply chain monitoring. Sample workflows connect regional signals to suppliers, logistics corridors, and business exposure.",
      },
      {
        question: "Is this a live intelligence service?",
        answer:
          "No. This is a SaaS interface demo with synthetic scenarios and illustrative records. It does not provide live monitoring, verified intelligence, automated assessments, or operational alerts.",
      },
      {
        question: "What does a briefing demonstrate?",
        answer:
          "The sample briefing approach separates observations, analyst interpretation, business relevance, and unanswered questions. It illustrates a review workflow; it does not produce verified recommendations or replace an analyst.",
      },
    ],
  },
  {
    title: "02 / Data & deployment",
    questions: [
      {
        question: "Can I connect internal or external sources?",
        answer:
          "Source connections are a production implementation task. This template does not include operational ingestion pipelines or licensed intelligence feeds. Any integration would need its own access controls, source permissions, and validation.",
      },
      {
        question:
          "Does private intelligence mean this demo is secure for sensitive data?",
        answer:
          "Private intelligence describes the corporate decision-support concept, not a security guarantee. This demo makes no claims about encryption, tenant isolation, certifications, or compliance. Do not submit confidential material to demonstration forms.",
      },
    ],
  },
  {
    title: "03 / Template customization",
    questions: [
      {
        question: "How can I change the theme and pages?",
        answer:
          "Edit semantic color variables in src/styles/global.css, including the light and dark theme values. Pages live in src/pages, reusable sections in src/components/blocks, and journal content in src/content/blog.",
      },
      {
        question: "How does the template use shadcn/ui?",
        answer:
          "UI components live locally in src/components/ui and can be edited directly. They combine Tailwind styling with Radix interaction primitives where applicable. Astro composes pages, and interactive React components need a client directive to hydrate.",
      },
    ],
  },
];

export const FAQ = ({
  headerTag = "h2",
  className,
  className2,
}: {
  headerTag?: "h1" | "h2";
  className?: string;
  className2?: string;
}) => {
  const Heading = headerTag;
  return (
    <section className={cn("py-24 lg:py-32", className)}>
      <div className="container max-w-5xl">
        <div
          className={cn(
            "mx-auto grid gap-12 lg:grid-cols-2 lg:gap-20",
            className2,
          )}
        >
          <div className="space-y-5">
            <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
              Kojima / Briefing notes
            </p>
            <Heading className="text-4xl tracking-tight md:text-5xl">
              Understand the working picture.
            </Heading>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              The product concept, the boundaries of this demo, and how to adapt
              the template.
            </p>
            <a
              href="/about"
              className="focus-visible:outline-ring inline-block font-mono text-xs underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              About Kojima
            </a>
          </div>
          <div className="grid gap-8 text-start">
            {categories.map((category, categoryIndex) => (
              <div key={category.title}>
                <h3 className="text-muted-foreground border-border border-b py-4 font-mono text-xs tracking-widest uppercase">
                  {category.title}
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, i) => (
                    <AccordionItem
                      key={item.question}
                      value={`${categoryIndex}-${i}`}
                      className="border-border rounded-none"
                    >
                      <AccordionTrigger className="rounded-none text-left leading-relaxed">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
